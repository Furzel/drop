import { useState, useCallback } from 'react';
import { generateWallet, pairFromMnemonic } from '../lib/crypto';
import { storage } from '../lib/storage';
import type { LocalProfile, SharedFields } from '../types';
import type { KeyringPair } from '@polkadot/keyring/types';

interface WalletState {
  profile: LocalProfile | null;
  pair: KeyringPair | null;
  pendingMnemonic: string | null; // set during setup, cleared after user acknowledges
}

export function useWallet() {
  const storedProfile = storage.getProfile();
  const [state, setState] = useState<WalletState>(() => {
    if (storedProfile) {
      return {
        profile: storedProfile,
        pair: pairFromMnemonic(storedProfile.mnemonic),
        pendingMnemonic: null,
      };
    }
    return { profile: null, pair: null, pendingMnemonic: null };
  });

  const createWallet = useCallback((sharedFields: SharedFields, displayName?: string) => {
    const { address, publicKey, mnemonic } = generateWallet();
    const profile: LocalProfile = { address, publicKey, mnemonic, displayName, sharedFields };
    storage.setProfile(profile);
    const pair = pairFromMnemonic(mnemonic);
    setState({ profile, pair, pendingMnemonic: mnemonic });
  }, []);

  const updateSharedFields = useCallback((sharedFields: SharedFields) => {
    setState(prev => {
      if (!prev.profile) return prev;
      const updated = { ...prev.profile, sharedFields };
      storage.setProfile(updated);
      return { ...prev, profile: updated };
    });
  }, []);

  const acknowledgeMnemonic = useCallback(() => {
    setState(prev => ({ ...prev, pendingMnemonic: null }));
  }, []);

  return {
    profile: state.profile,
    pair: state.pair,
    pendingMnemonic: state.pendingMnemonic,
    createWallet,
    updateSharedFields,
    acknowledgeMnemonic,
  };
}
