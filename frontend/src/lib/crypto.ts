import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import type { KeyringPair } from '@polkadot/keyring/types';

export function generateWallet() {
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  const pair = keyring.addFromMnemonic(mnemonic);
  return {
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
    mnemonic, // shown once to user during setup, then stored in localStorage
  };
}

export function pairFromMnemonic(mnemonic: string): KeyringPair {
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  return keyring.addFromMnemonic(mnemonic);
}

export function signPayload(pair: KeyringPair, payload: object): string {
  const message = JSON.stringify(payload);
  const signature = pair.sign(message);
  return u8aToHex(signature); // '0x...' prefixed
}

export function verifyPayload(
  address: string,
  payload: object,
  signature: string // '0x...' prefixed
): boolean {
  try {
    const message = JSON.stringify(payload);
    const { isValid } = signatureVerify(message, signature, address);
    return isValid;
  } catch {
    return false;
  }
}
