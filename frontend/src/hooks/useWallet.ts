import { useState, useCallback } from 'react';
import { generateWallet, pairFromMnemonic } from '../lib/crypto';
import type { DropSigner } from '../lib/crypto';
import { storage } from '../lib/storage';
import type { LocalProfile, SharedFields } from '../types';

interface WalletState {
  profile: LocalProfile | null;
  signer: DropSigner | null;
  pendingMnemonic: string | null;
}

function signerFromProfile(profile: LocalProfile): DropSigner {
  if (profile.walletType === 'extension') {
    return { type: 'extension', address: profile.address };
  }
  return { type: 'local', pair: pairFromMnemonic(profile.mnemonic!) };
}

export function useWallet() {
  const [state, setState] = useState<WalletState>(() => {
    const stored = storage.getProfile();
    if (stored) {
      // backwards compat: profiles saved before walletType was added
      if (!stored.walletType) stored.walletType = 'local';
      return { profile: stored, signer: signerFromProfile(stored), pendingMnemonic: null };
    }
    return { profile: null, signer: null, pendingMnemonic: null };
  });

  const createWallet = useCallback((sharedFields: SharedFields, displayName?: string) => {
    const { address, publicKey, mnemonic } = generateWallet();
    const profile: LocalProfile = { address, publicKey, mnemonic, walletType: 'local', displayName, sharedFields };
    storage.setProfile(profile);
    const signer: DropSigner = { type: 'local', pair: pairFromMnemonic(mnemonic) };
    setState({ profile, signer, pendingMnemonic: mnemonic });
  }, []);

  const connectExtension = useCallback((address: string, publicKey: string, displayName: string | undefined, sharedFields: SharedFields) => {
    const profile: LocalProfile = { address, publicKey, walletType: 'extension', displayName, sharedFields };
    storage.setProfile(profile);
    const signer: DropSigner = { type: 'extension', address };
    setState({ profile, signer, pendingMnemonic: null });
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
    signer: state.signer,
    pendingMnemonic: state.pendingMnemonic,
    createWallet,
    connectExtension,
    updateSharedFields,
    acknowledgeMnemonic,
  };
}
