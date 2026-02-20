import { signPayloadAsync, verifyPayload } from './crypto';
import type { DropSigner } from './crypto';
import type { LocalProfile, QRPayload } from '../types';

export async function encodeQRPayload(profile: LocalProfile, signer: DropSigner): Promise<string> {
  const base = {
    address: profile.address,
    sharedFields: profile.sharedFields,
    timestamp: Date.now(),
  };
  const signature = await signPayloadAsync(signer, base);
  const payload: QRPayload = { ...base, signature };
  return JSON.stringify(payload);
}

export function decodeQRPayload(raw: string): QRPayload | null {
  try {
    const payload = JSON.parse(raw) as QRPayload;
    const { signature, ...base } = payload;
    const valid = verifyPayload(payload.address, base, signature);
    if (!valid) return null;
    if (Date.now() - payload.timestamp > 5 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}
