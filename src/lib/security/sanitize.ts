/**
 * Sanitização de inputs de texto livre para prevenir XSS.
 *
 * Usamos DOMPurify em modo "texto puro" (sem HTML permitido) porque os
 * campos sanitizados aqui (notas, observações, preferências) são exibidos
 * como texto plano no app — nunca como HTML renderizado. Isso garante
 * defesa em profundidade contra payloads como `<script>`, `<img onerror>`,
 * `javascript:` URLs etc., mesmo que algum componente futuro tente
 * renderizar o conteúdo como HTML.
 */
import DOMPurify from 'dompurify';

/** Sanitiza string removendo TODO HTML/atributos. Retorna texto puro. */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  // ALLOWED_TAGS/ATTR vazios = strip completo de HTML, mantendo apenas texto.
  const cleaned = DOMPurify.sanitize(String(input), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  return cleaned.trim();
}

/** Sanitiza recursivamente todos os valores string de um objeto plano. */
export function sanitizeObjectStrings<T extends Record<string, any>>(obj: T): T {
  const out: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = sanitizeText(v);
    else if (v && typeof v === 'object') out[k] = sanitizeObjectStrings(v);
    else out[k] = v;
  }
  return out;
}
