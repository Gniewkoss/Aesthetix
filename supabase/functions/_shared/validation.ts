// Input validation helpers for Edge Functions.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function clampScore(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const v = Math.round(n);
  if (v < 0 || v > 100) return null;
  return v;
}

export function sanitizeString(value: unknown, maxLen: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) return null;
  return trimmed;
}

export function sanitizeStringArray(value: unknown, maxItems: number, maxItemLen: number): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.length > maxItems) return null;
  const out: string[] = [];
  for (const item of value) {
    const s = sanitizeString(item, maxItemLen);
    if (!s) return null;
    out.push(s);
  }
  return out;
}

// Base64 payload size (bytes after decode). Matches client MAX_IMAGE_SIZE_MB = 12.
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_TOTAL_IMAGE_BYTES = 36 * 1024 * 1024;

const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;

export function base64DecodedBytes(b64: string): number {
  const padding = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

export function validateImageBase64s(imageBase64s: unknown): string[] | { error: string } {
  if (!Array.isArray(imageBase64s) || imageBase64s.length === 0) {
    return { error: 'imageBase64s array is required' };
  }
  if (imageBase64s.length > 3) {
    return { error: 'Maximum 3 images allowed' };
  }

  let total = 0;
  const cleaned: string[] = [];

  for (const raw of imageBase64s) {
    if (typeof raw !== 'string' || !raw) {
      return { error: 'Invalid image payload' };
    }
    const b64 = raw.includes(',') ? raw.split(',').pop()! : raw;
    if (!BASE64_RE.test(b64)) {
      return { error: 'Invalid image encoding' };
    }
    const bytes = base64DecodedBytes(b64);
    if (bytes <= 0 || bytes > MAX_IMAGE_BYTES) {
      return { error: `Each image must be ≤ ${MAX_IMAGE_BYTES / (1024 * 1024)} MB` };
    }
    total += bytes;
    if (total > MAX_TOTAL_IMAGE_BYTES) {
      return { error: 'Total image payload too large' };
    }
    cleaned.push(b64);
  }

  return cleaned;
}

export function internalError(): Response {
  return new Response(JSON.stringify({ error: 'Internal error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  });
}
