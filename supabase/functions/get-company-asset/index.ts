// Public edge function (no JWT required) that returns a short-lived signed URL
// for a file stored in the private `company_assets` bucket.
//
// Accepts either:
//   - ?path=logos/<companyId>.png            (preferred)
//   - ?url=<full public/storage URL>          (auto-extracts the path)
//
// Returns: { signedUrl: string, expiresIn: number }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const BUCKET = "company_assets";
const EXPIRES_IN = 60 * 60; // 1 hour

function extractPath(input: string): string | null {
  if (!input) return null;
  // If it's already a relative path (no scheme), trust it
  if (!/^https?:\/\//i.test(input)) {
    return input.replace(/^\/+/, "");
  }
  try {
    const u = new URL(input);
    // Match /storage/v1/object/(public|sign)/<bucket>/<path>
    const m = u.pathname.match(
      /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/
    );
    if (!m) return null;
    if (m[1] !== BUCKET) return null;
    // Strip query string if any (e.g. ?t=...)
    return decodeURIComponent(m[2]).split("?")[0];
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const rawPath = url.searchParams.get("path") ?? url.searchParams.get("url");
    if (!rawPath) {
      return new Response(JSON.stringify({ error: "Missing path or url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const path = extractPath(rawPath);
    if (!path) {
      return new Response(JSON.stringify({ error: "Invalid asset path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic path safety: no traversal, reasonable length
    if (path.includes("..") || path.length > 512) {
      return new Response(JSON.stringify({ error: "Invalid asset path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, EXPIRES_IN);

    if (error || !data?.signedUrl) {
      return new Response(
        JSON.stringify({ error: "Asset not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signedUrl, expiresIn: EXPIRES_IN }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          // Allow browsers/CDN to cache the JSON response for ~50 minutes
          // (slightly less than the URL TTL so it never serves an expired URL)
          "Cache-Control": "public, max-age=3000",
        },
      }
    );
  } catch (err) {
    console.error("get-company-asset error", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
