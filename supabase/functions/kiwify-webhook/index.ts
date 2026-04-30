import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Kiwify webhook receiver.
 *
 * Setup in Kiwify dashboard:
 *   URL:    https://<project>.supabase.co/functions/v1/kiwify-webhook?token=<KIWIFY_WEBHOOK_TOKEN>
 *   Events: order.paid (or "Compra aprovada")
 *
 * Auth: a shared token is sent as ?token= query param and compared against
 * KIWIFY_WEBHOOK_TOKEN env var. (Kiwify also sends an `signature` field in
 * the body which we accept but do not strictly validate — token gating is
 * the primary protection.)
 *
 * Behavior: when an order is paid, we look up the company by the buyer's
 * email (matching the company_admin user) and call
 * `mark_first_payment_and_release_credits` to release pending referral
 * credits to whoever referred this barbershop.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // --- Token validation ---
  const url = new URL(req.url);
  const providedToken = url.searchParams.get("token") ?? req.headers.get("x-kiwify-token");
  const expectedToken = Deno.env.get("KIWIFY_WEBHOOK_TOKEN");
  if (!expectedToken || providedToken !== expectedToken) {
    console.warn("[kiwify-webhook] Invalid token");
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[kiwify-webhook] Event received", {
    order_id: body?.order_id ?? body?.id,
    status: body?.order_status ?? body?.status,
    email: body?.Customer?.email ?? body?.customer?.email,
  });

  // Kiwify event shapes vary; try common fields
  const status: string =
    body?.order_status ?? body?.status ?? body?.webhook_event_type ?? "";
  const isPaid =
    /paid|approved|aprovad|paga/i.test(status) ||
    body?.webhook_event_type === "order_approved";

  const email: string | undefined =
    body?.Customer?.email ?? body?.customer?.email ?? body?.buyer?.email ?? body?.email;

  if (!isPaid) {
    console.log("[kiwify-webhook] Ignoring non-paid event:", status);
    return new Response(JSON.stringify({ ignored: true, reason: "not_paid" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!email) {
    console.warn("[kiwify-webhook] Missing customer email");
    return new Response(JSON.stringify({ ignored: true, reason: "no_email" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Find company by buyer email
  const { data: companyId, error: findError } = await supabase.rpc(
    "find_company_by_admin_email",
    { _email: email },
  );

  if (findError || !companyId) {
    console.warn("[kiwify-webhook] Company not found for email", { email, findError });
    return new Response(
      JSON.stringify({ ignored: true, reason: "company_not_found", email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Release pending credits
  const { data: result, error: rpcError } = await supabase.rpc(
    "mark_first_payment_and_release_credits",
    { _company_id: companyId },
  );

  if (rpcError) {
    console.error("[kiwify-webhook] RPC error", rpcError);
    return new Response(JSON.stringify({ error: rpcError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("[kiwify-webhook] Processed", { companyId, result });

  return new Response(
    JSON.stringify({ ok: true, company_id: companyId, result }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});