import { signPayload, verifyPayload } from './crypto';
import type { KeyringPair } from '@polkadot/keyring/types';
import type { LocalProfile, QRPayload } from '../types';

export function encodeQRPayload(profile: LocalProfile, pair: KeyringPair): string {
  const base = {
    address: profile.address,
    sharedFields: profile.sharedFields,
    timestamp: Date.now(),
  };
  const signature = signPayload(pair, base);
  const payload: QRPayload = { ...base, signature };
  return JSON.stringify(payload);
}

export function decodeQRPayload(raw: string): QRPayload | null {
  try {
    const payload = JSON.parse(raw) as QRPayload;
    const { signature, ...base } = payload;
    const valid = verifyPayload(payload.address, base, signature);
    if (!valid) return null;
    // Replay protection: reject if timestamp > 5 minutes old
    if (Date.now() - payload.timestamp > 5 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
