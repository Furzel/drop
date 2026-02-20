import { getApi } from './papiClient';
import type { OnChainIdentity } from '../types';

// PAPI represents Data as a discriminated union: { type: 'None' } | { type: 'Raw0..32', value: FixedSizeBinary }
// FixedSizeBinary has .asText(), falling back to TextDecoder for safety.
function dataAsText(data: unknown): string | undefined {
  if (!data) return undefined;
  const d = data as any;
  if (d.type === 'None' || d.value === undefined || d.value === null) return undefined;
  if (typeof d.value?.asText === 'function') {
    try { return d.value.asText(); } catch { /* fall through */ }
  }
  if (d.value instanceof Uint8Array) {
    try { return new TextDecoder().decode(d.value); } catch { /* fall through */ }
  }
  if (typeof d.value === 'string') return d.value;
  return undefined;
}

export async function fetchOnChainIdentity(address: string): Promise<OnChainIdentity | null> {
  try {
    const api = await getApi();
    const raw = await api.query.Identity.IdentityOf.getValue(address);
    console.log('[identity] raw:', raw);
    if (!raw) return null;

    // People chain returns a tuple [Registration, Option<username>]; handle both shapes
    const registration = (Array.isArray(raw) ? raw[0] : raw) as any;
    const info = registration.info;
    console.log('[identity] info:', info);

    return {
      display: dataAsText(info.display),
      verified: registration.judgements?.some(
        ([, j]: any) => j.type === 'KnownGood' || j.type === 'Reasonable'
      ) ?? false,
      email: dataAsText(info.email),
      twitter: dataAsText(info.twitter),
      web: dataAsText(info.web),
    };
  } catch (e) {
    console.error('[identity] error:', e);
    return null;
  }
}
