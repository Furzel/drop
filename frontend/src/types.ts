export interface LocalProfile {
  address: string;           // SS58 Polkadot address
  publicKey: string;         // hex
  walletType: 'local' | 'extension';
  mnemonic?: string;         // local wallets only; used to re-derive keypair
  displayName?: string;
  sharedFields: SharedFields;
}

export interface SharedFields {
  telegram?: string;
  email?: string;
  note?: string;
}

export interface QRPayload {
  address: string;        // SS58
  sharedFields: SharedFields;
  signature: string;      // sign(JSON.stringify({ address, sharedFields, timestamp }))
  timestamp: number;      // unix ms — replay protection
}

export interface Contact {
  id: string;             // address
  address: string;
  sharedFields: SharedFields;
  onChainIdentity?: OnChainIdentity;
  savedAt: number;
}

export interface OnChainIdentity {
  display?: string;
  verified: boolean;
  email?: string;
  twitter?: string;
  web?: string;
}
