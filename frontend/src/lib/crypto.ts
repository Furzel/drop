import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate, signatureVerify } from '@polkadot/util-crypto';
import { u8aToHex, stringToHex } from '@polkadot/util';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { KeyringPair } from '@polkadot/keyring/types';

export type DropSigner =
  | { type: 'local'; pair: KeyringPair }
  | { type: 'extension'; address: string };

export function generateWallet() {
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  const pair = keyring.addFromMnemonic(mnemonic);
  return {
    address: pair.address,
    publicKey: u8aToHex(pair.publicKey),
    mnemonic,
  };
}

export function pairFromMnemonic(mnemonic: string): KeyringPair {
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  return keyring.addFromMnemonic(mnemonic);
}

export async function signPayloadAsync(signer: DropSigner, payload: object): Promise<string> {
  const message = JSON.stringify(payload);
  if (signer.type === 'local') {
    return u8aToHex(signer.pair.sign(message));
  } else {
    const injector = await web3FromAddress(signer.address);
    const { signature } = await injector.signer.signRaw!({
      address: signer.address,
      data: stringToHex(message),
      type: 'bytes',
    });
    return signature; // already '0x...' prefixed
  }
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
