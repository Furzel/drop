import { useState, useEffect } from 'react';
import { fetchOnChainIdentity } from '../lib/identity';
import type { OnChainIdentity } from '../types';

export function useIdentity(address: string | undefined) {
  const [identity, setIdentity] = useState<OnChainIdentity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);

    fetchOnChainIdentity(address)
      .then(result => { if (!cancelled) setIdentity(result); })
      .catch(() => { if (!cancelled) setIdentity(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [address]);

  return { identity, loading };
}
