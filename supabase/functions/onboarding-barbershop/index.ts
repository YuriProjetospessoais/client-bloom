import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESERVED_SLUGS = new Set([
  "admin", "login", "signup", "api", "app", "dashboard", "onboarding", "global",
  "staff", "tenant", "user", "client", "portal", "select-tenant", "billing",
  "referral", "settings", "help", "support", "terms", "privacy", "pricing",
]);

const Schema = z.object({
  company: z.object({
    name: z.string().trim().min(3).max(100),
    slug: z.string().trim().min(3).max(50)
      .regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hífens"),
    phone: z.string().trim().max(30).optional(),
  }),
  admin: z.object({
    full_name: z.string().trim().min(3).max(100),
    email: z.string().trim().toLowerCase().email().max(255),
    password: z.string().min(8).max(72),
  }),
  referral_code: z.string().trim().max(64).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return json({ error: "Método não permitido" }, 405);
  }

  let payload: unknown;
  try { payload = await req.json(); } catch {
    return json({ error: "JSON inválido" }, 400);
  }

  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return json({ error: "Dados inválidos", details: parsed.error.flatten().fieldErrors }, 400);
  }

  const { company, admin, referral_code } = parsed.data;

  if (RESERVED_SLUGS.has(company.slug)) {
    return json({ error: "Este link é reservado, escolha outro." }, 400);
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // 1) Slug uniqueness
  const { data: existingSlug } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("slug", company.slug)
    .maybeSingle();
  if (existingSlug) {
    return json({ error: "Este link já está em uso." }, 409);
  }

  // 2) Optional referral lookup (does not block registration if invalid)
  let referrerCompanyId: string | null = null;
  if (referral_code) {
    const { data: ref } = await supabaseAdmin
      .from("referrals")
      .select("referrer_company_id")
      .eq("referral_code", referral_code)
      .maybeSingle();
    if (ref) referrerCompanyId = ref.referrer_company_id as string;
  }

  // 3) Create company (PRO trial for 14 days)
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const companyInsert: Record<string, unknown> = {
    name: company.name,
    slug: company.slug,
    phone: company.phone ?? null,
    status: "active",
    plan: "pro",
    plan_active: true,
    trial_ends_at: trialEndsAt,
  };
  // referred_by_* columns may not exist yet (Phase 2). Only add if known to exist.
  // We attempt a soft attach later if columns exist.

  const { data: createdCompany, error: companyErr } = await supabaseAdmin
    .from("companies")
    .insert(companyInsert)
    .select("id")
    .single();

  if (companyErr || !createdCompany) {
    return json({ error: companyErr?.message ?? "Falha ao criar barbearia" }, 500);
  }
  const companyId = createdCompany.id as string;

  // 4) Create auth user
  const { data: createdUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: false,
    user_metadata: { full_name: admin.full_name },
  });

  if (userErr || !createdUser?.user) {
    // rollback company
    await supabaseAdmin.from("companies").delete().eq("id", companyId);
    const msg = userErr?.message ?? "Falha ao criar usuário";
    const status = msg.toLowerCase().includes("registered") ? 409 : 500;
    return json({ error: msg }, status);
  }

  const userId = createdUser.user.id;

  // 5) Create user_role: company_admin
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .insert({ user_id: userId, role: "company_admin", company_id: companyId });

  if (roleErr) {
    // rollback user + company
    await supabaseAdmin.auth.admin.deleteUser(userId);
    await supabaseAdmin.from("companies").delete().eq("id", companyId);
    return json({ error: roleErr.message }, 500);
  }

  // 6) Soft-attach referral if Phase 2 columns/tables exist (ignore errors)
  if (referral_code && referrerCompanyId) {
    try {
      await supabaseAdmin
        .from("companies")
        .update({ referred_by_code: referral_code, referred_by_company_id: referrerCompanyId })
        .eq("id", companyId);

      await supabaseAdmin
        .from("referrals")
        .update({ referred_company_id: companyId, status: "registered", updated_at: new Date().toISOString() })
        .eq("referral_code", referral_code);
    } catch {
      // Phase 2 not deployed yet — safe to ignore.
    }
  }

  return json({
    success: true,
    company_id: companyId,
    user_id: userId,
    slug: company.slug,
    trial_ends_at: trialEndsAt,
  }, 200);
});