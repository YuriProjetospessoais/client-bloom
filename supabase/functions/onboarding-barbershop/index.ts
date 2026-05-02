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
    console.error("[onboarding] error:", { stage: "reserved_slug", slug: company.slug, email: admin.email });
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
    console.error("[onboarding] error:", { stage: "slug_taken", slug: company.slug, email: admin.email });
    return json({ error: "Este link já está em uso." }, 409);
  }

  // 2) Pre-check email so we don't create an orphan company if it already exists.
  // listUsers paginates; for typical sizes the first page suffices, but we scan all pages defensively.
  try {
    const emailLower = admin.email.toLowerCase();
    let page = 1;
    let emailTaken = false;
    while (page <= 10 && !emailTaken) {
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (listErr) break;
      const users = list?.users ?? [];
      emailTaken = users.some((u) => u.email?.toLowerCase() === emailLower);
      if (users.length < 1000) break;
      page++;
    }
    if (emailTaken) {
      console.error("[onboarding] error:", { stage: "email_taken", email: admin.email });
      return json({ error: "Esse email já está cadastrado. Use outro ou faça login." }, 409);
    }
  } catch (e) {
    // If the lookup itself fails, fall through — createUser will still error if email is taken.
    console.error("[onboarding] warn:", { stage: "email_precheck_failed", message: (e as Error).message });
  }

  // 3) Create company (PRO trial for 14 days). Referral is applied after creation via RPC.
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
  const { data: createdCompany, error: companyErr } = await supabaseAdmin
    .from("companies")
    .insert(companyInsert)
    .select("id")
    .single();

  if (companyErr || !createdCompany) {
    console.error("[onboarding] error:", { stage: "create_company", message: companyErr?.message, email: admin.email });
    return json({ error: companyErr?.message ?? "Falha ao criar barbearia" }, 500);
  }
  const companyId = createdCompany.id as string;

  // 4) Create auth user
  const { data: createdUser, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
    user_metadata: { full_name: admin.full_name },
  });

  if (userErr || !createdUser?.user) {
    // rollback company
    await supabaseAdmin.from("companies").delete().eq("id", companyId);
    const msg = userErr?.message ?? "Falha ao criar usuário";
    const status = msg.toLowerCase().includes("registered") ? 409 : 500;
    console.error("[onboarding] error:", { stage: "create_user", message: msg, email: admin.email });
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
    console.error("[onboarding] error:", { stage: "assign_role", message: roleErr.message, email: admin.email });
    return json({ error: roleErr.message }, 500);
  }

  // 6) Apply referral code if provided (creates pending credit for referrer)
  let referralApplied = false;
  if (referral_code) {
    const { data: refResult } = await supabaseAdmin.rpc("apply_referral_on_signup", {
      _code: referral_code.toUpperCase(),
      _new_company_id: companyId,
    });
    referralApplied = (refResult as { applied?: boolean } | null)?.applied === true;
  }

  return json({
    success: true,
    company_id: companyId,
    user_id: userId,
    slug: company.slug,
    trial_ends_at: trialEndsAt,
    referral_applied: referralApplied,
  }, 200);
});