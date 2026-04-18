// Rate limiter de login - defesa em profundidade (localStorage + backend)
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "navalhapp_login_attempts";
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;   // 15 min
const BLOCK_MS = 30 * 60 * 1000;    // 30 min

interface LocalAttempt {
  email: string;
  count: number;
  firstAt: number;
  blockedUntil?: number;
}

function loadLocal(): Record<string, LocalAttempt> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLocal(map: Record<string, LocalAttempt>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* quota */ }
}

function key(email: string) {
  return email.trim().toLowerCase();
}

/** Verifica localStorage (rápido) e backend (autoritativo). */
export async function checkLoginAllowed(email: string): Promise<{ allowed: boolean; minutesRemaining?: number }> {
  const k = key(email);
  if (!k) return { allowed: true };

  // 1) Camada local (UX rápida)
  const map = loadLocal();
  const local = map[k];
  if (local?.blockedUntil && local.blockedUntil > Date.now()) {
    return {
      allowed: false,
      minutesRemaining: Math.ceil((local.blockedUntil - Date.now()) / 60000),
    };
  }

  // 2) Camada backend (autoritativa)
  try {
    const { data, error } = await supabase.functions.invoke("check-login-attempts", {
      body: { action: "check", email: k },
    });
    if (!error && data?.blocked) {
      return { allowed: false, minutesRemaining: Number(data.minutes_remaining) || 30 };
    }
  } catch {
    // Se backend falhar, confia na camada local
  }

  return { allowed: true };
}

/** Registra tentativa falha em ambas as camadas. */
export async function registerFailedLogin(email: string): Promise<{ blocked: boolean; minutesRemaining?: number; remaining?: number }> {
  const k = key(email);
  if (!k) return { blocked: false };

  // Local
  const map = loadLocal();
  const now = Date.now();
  const cur = map[k];
  let local: LocalAttempt;
  if (!cur || now - cur.firstAt > WINDOW_MS) {
    local = { email: k, count: 1, firstAt: now };
  } else {
    local = { ...cur, count: cur.count + 1 };
    if (local.count >= MAX_ATTEMPTS) {
      local.blockedUntil = now + BLOCK_MS;
    }
  }
  map[k] = local;
  saveLocal(map);

  // Backend (autoritativo)
  try {
    const { data } = await supabase.functions.invoke("check-login-attempts", {
      body: { action: "fail", email: k },
    });
    if (data?.blocked) {
      return { blocked: true, minutesRemaining: Number(data.minutes_remaining) || 30 };
    }
    return { blocked: false, remaining: Number(data?.remaining) ?? 0 };
  } catch {
    // Fallback: usa estado local
    if (local.blockedUntil) {
      return { blocked: true, minutesRemaining: Math.ceil((local.blockedUntil - now) / 60000) };
    }
    return { blocked: false, remaining: MAX_ATTEMPTS - local.count };
  }
}

/** Limpa tentativas após login bem-sucedido. */
export async function resetLoginAttempts(email: string): Promise<void> {
  const k = key(email);
  if (!k) return;
  const map = loadLocal();
  delete map[k];
  saveLocal(map);
  try {
    await supabase.functions.invoke("check-login-attempts", {
      body: { action: "reset", email: k },
    });
  } catch { /* best-effort */ }
}
