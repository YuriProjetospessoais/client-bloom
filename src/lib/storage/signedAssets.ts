/**
 * Resolve a `company_assets` storage URL into a short-lived signed URL by
 * calling the public `get-company-asset` edge function. Falls back to the
 * original input when the path can't be resolved (e.g. non-storage URLs).
 *
 * - Caches results in memory for ~50 minutes (URLs expire in 1h)
 * - Safe to call repeatedly with the same input
 */
import { useEffect, useState } from "react";

const FUNCTION_NAME = "get-company-asset";
const CACHE_TTL_MS = 50 * 60 * 1000;
const cache = new Map<string, { url: string; expiresAt: number }>();
const inflight = new Map<string, Promise<string | null>>();

function functionsBaseUrl(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1`;
}

function isCompanyAssetUrl(input: string): boolean {
  return /\/storage\/v1\/object\/(?:public|sign|authenticated)\/company_assets\//.test(
    input
  ) || !/^https?:\/\//i.test(input); // also treat raw paths as candidates
}

export async function resolveAssetUrl(input: string | null | undefined): Promise<string | null> {
  if (!input) return null;
  if (!isCompanyAssetUrl(input)) return input;

  const key = input;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.url;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = new URL(`${functionsBaseUrl()}/${FUNCTION_NAME}`);
      // Use 'url' param if it's a full URL, 'path' if it's a relative path
      url.searchParams.set(/^https?:\/\//i.test(input) ? "url" : "path", input);

      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.signedUrl) return null;
      cache.set(key, { url: data.signedUrl, expiresAt: now + CACHE_TTL_MS });
      return data.signedUrl as string;
    } catch (err) {
      console.warn("resolveAssetUrl failed", err);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

/**
 * React hook variant: returns `{ url, loading }` and re-resolves whenever the
 * input changes. Use empty string while loading to avoid broken-image flash.
 */
export function useSignedAssetUrl(input: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(() => {
    if (!input) return null;
    if (!isCompanyAssetUrl(input)) return input;
    const cached = cache.get(input);
    return cached && cached.expiresAt > Date.now() ? cached.url : null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!input) return false;
    if (!isCompanyAssetUrl(input)) return false;
    const cached = cache.get(input);
    return !(cached && cached.expiresAt > Date.now());
  });

  useEffect(() => {
    let cancelled = false;
    if (!input) {
      setUrl(null);
      setLoading(false);
      return;
    }
    if (!isCompanyAssetUrl(input)) {
      setUrl(input);
      setLoading(false);
      return;
    }
    const cached = cache.get(input);
    if (cached && cached.expiresAt > Date.now()) {
      setUrl(cached.url);
      setLoading(false);
      return;
    }
    setLoading(true);
    resolveAssetUrl(input).then((resolved) => {
      if (cancelled) return;
      setUrl(resolved);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [input]);

  return { url, loading };
}
