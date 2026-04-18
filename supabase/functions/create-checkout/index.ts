import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BodySchema = z.object({
  paymentMethod: z.enum(["pix", "card"]),
  appointmentId: z.string().uuid(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const rawBody = await req.json().catch(() => null);
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", issues: parsed.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const { paymentMethod, appointmentId } = parsed.data;

    // Server-side lookup: fetch appointment + service price from DB
    const { data: appointment, error: aptError } = await supabaseAdmin
      .from("appointments")
      .select("service_id, client_id, clients(user_id)")
      .eq("id", appointmentId)
      .single();

    if (aptError || !appointment) {
      throw new Error("Appointment not found");
    }

    // Verify ownership: the authenticated user must own the client record
    const clientData = appointment.clients as { user_id: string } | null;
    if (!clientData || clientData.user_id !== user.id) {
      throw new Error("Unauthorized: you do not own this appointment");
    }

    if (!appointment.service_id) {
      throw new Error("Appointment has no service assigned");
    }

    const { data: service, error: svcError } = await supabaseAdmin
      .from("services")
      .select("name, price")
      .eq("id", appointment.service_id)
      .single();

    if (svcError || !service) {
      throw new Error("Service not found");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const paymentMethodTypes: string[] =
      paymentMethod === "pix" ? ["pix"] : ["card"];

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: service.name },
            unit_amount: Math.round(Number(service.price) * 100),
          },
          quantity: 1,
        },
      ],
      payment_method_types: paymentMethodTypes,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/portal/agendamentos?payment=success`,
      cancel_url: `${req.headers.get("origin")}/portal/agendamentos?payment=cancelled`,
      metadata: { appointment_id: appointmentId },
    });

    await supabaseAdmin
      .from("appointments")
      .update({ stripe_session_id: session.id, payment_status: "awaiting" })
      .eq("id", appointmentId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
