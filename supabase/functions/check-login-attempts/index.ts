// Edge Function: rate limiting de login (anti brute-force)
// Endpoints:
//   POST { action: "check", email }   -> verifica se email está bloqueado
//   POST { action: "fail",  email }   -> registra tentativa falha
//   POST { action: "reset", email }   -> limpa tentativas após sucesso
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BodySchema = z.object({
  action: z.enum(["check", "fail", "reset"]),
  email: z.string().trim().email().max(255),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const raw = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", issues: parsed.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, email } = parsed.data;
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result;
    if (action === "check") {
      const { data, error } = await admin.rpc("check_login_blocked", { _email: email });
      if (error) throw error;
      result = data;
    } else if (action === "fail") {
      const { data, error } = await admin.rpc("record_failed_login", { _email: email });
      if (error) throw error;
      result = data;
    } else {
      const { error } = await admin.rpc("reset_login_attempts", { _email: email });
      if (error) throw error;
      result = { success: true };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("check-login-attempts error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
