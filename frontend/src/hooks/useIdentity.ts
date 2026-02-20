import { useState, useEffect } from 'react';
import { getApi } from '../lib/papiClient';
import type { OnChainIdentity } from '../types';

export function useIdentity(address: string | undefined) {
  const [identity, setIdentity] = useState<OnChainIdentity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);

    getApi()
      .then(api => api.query.Identity.IdentityOf.getValue(address))
      .then(result => {
        if (cancelled) return;
        if (!result) {
          setIdentity(null);
          return;
        }
        const info = result[0].info;
        setIdentity({
          display: info.display.value?.asText?.() ?? undefined,
          verified: result[0].judgements.some(
            ([, j]) => j.type === 'KnownGood' || j.type === 'Reasonable'
          ),
          twitter: info.twitter?.value?.asText?.() ?? undefined,
          web: info.web?.value?.asText?.() ?? undefined,
        });
      })
      .catch(() => {
        if (!cancelled) setIdentity(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [address]);

  return { identity, loading };
}
