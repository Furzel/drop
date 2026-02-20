import { getApi } from './papiClient';
import type { OnChainIdentity } from '../types';

export async function fetchOnChainIdentity(address: string): Promise<OnChainIdentity | null> {
  try {
    const api = await getApi();
    const result = await api.query.Identity.IdentityOf.getValue(address);
    if (!result) return null;
    const info = result[0].info;
    return {
      display: info.display.value?.asText?.() ?? undefined,
      verified: result[0].judgements.some(
        ([, j]) => j.type === 'KnownGood' || j.type === 'Reasonable'
      ),
      email: info.email?.value?.asText?.() ?? undefined,
      twitter: info.twitter?.value?.asText?.() ?? undefined,
      web: info.web?.value?.asText?.() ?? undefined,
    };
  } catch {
    return null;
  }
}
