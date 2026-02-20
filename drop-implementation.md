# Drop — Implementation Document
> Privacy-first conference contact exchange, built on Polkadot
> Stack: React + TypeScript + Vite (frontend) · Node/Express (minimal backend, optional) · PAPI + Smoldot

---

## 1. Project Overview

Drop lets two people at a conference exchange contact info without exposing personal data to a third party. Each user has a local Polkadot wallet. They share a QR code containing their public address + a signed payload. The other person scans it, the app fetches their on-chain identity, and both save each other as a local contact.

**No server required for the core flow.** The optional Node backend is only for QR relay (if camera scanning is painful in a hackathon demo — see Section 6).

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet / Crypto | `@polkadot/keyring`, `@polkadot/util-crypto` |
| Chain interaction | `polkadot-api` (PAPI) + Smoldot light client |
| QR generation | `qrcode.react` |
| QR scanning | `@zxing/browser` |
| Local storage | `localStorage` (JSON) |
| Backend (optional) | Node + Express — single `/relay` endpoint |

---

## 3. Folder Structure

```
drop/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Setup.tsx          # First-time wallet creation + profile setup
│   │   │   ├── MyQR.tsx           # Show your QR code to share
│   │   │   ├── Scanner.tsx        # Scan someone else's QR
│   │   │   ├── ContactCard.tsx    # Display a resolved contact
│   │   │   ├── ContactList.tsx    # All saved contacts
│   │   │   └── ExportButton.tsx   # Export contacts as JSON
│   │   ├── hooks/
│   │   │   ├── useWallet.ts       # Wallet generation + persistence
│   │   │   ├── useIdentity.ts     # PAPI call to fetch on-chain identity
│   │   │   └── useContacts.ts     # CRUD for local contact list
│   │   ├── lib/
│   │   │   ├── crypto.ts          # Sign + verify payloads
│   │   │   ├── qr.ts              # Encode/decode QR payload
│   │   │   └── storage.ts         # localStorage wrappers
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── backend/                       # Optional
    ├── index.ts
    └── package.json
```

---

## 4. Data Types

```typescript
// types.ts

export interface LocalProfile {
  address: string;           // SS58 Polkadot address
  publicKey: string;         // hex
  secretKey: string;         // hex — stored locally only, never transmitted
  displayName?: string;      // user-chosen local name
  sharedFields: SharedFields;
}

export interface SharedFields {
  telegram?: string;
  email?: string;
  note?: string;             // e.g. "Met at Polkadot Summit 2025"
}

export interface QRPayload {
  address: string;           // SS58
  sharedFields: SharedFields;
  signature: string;         // sign(address + JSON.stringify(sharedFields))
  timestamp: number;         // unix ms — for replay protection
}

export interface Contact {
  id: string;                // address
  address: string;
  sharedFields: SharedFields;
  onChainIdentity?: OnChainIdentity;
  savedAt: number;
}

export interface OnChainIdentity {
  display?: string;
  verified: boolean;
  twitter?: string;
  web?: string;
}
```

---

## 5. Core Modules

### 5.1 Wallet Generation (`lib/crypto.ts`)

```typescript
import { Keyring } from '@polkadot/keyring';
import { mnemonicGenerate } from '@polkadot/util-crypto';

export function generateWallet() {
  const mnemonic = mnemonicGenerate();
  const keyring = new Keyring({ type: 'sr25519', ss58Format: 0 });
  const pair = keyring.addFromMnemonic(mnemonic);
  return {
    address: pair.address,
    publicKey: Buffer.from(pair.publicKey).toString('hex'),
    secretKey: Buffer.from((pair as any).secretKey).toString('hex'),
    mnemonic, // shown once to user, then discarded
  };
}

export function signPayload(pair: KeyringPair, payload: object): string {
  const message = JSON.stringify(payload);
  const signature = pair.sign(message);
  return Buffer.from(signature).toString('hex');
}

export function verifyPayload(
  address: string,
  payload: object,
  signature: string
): boolean {
  // use signatureVerify from @polkadot/util-crypto
}
```

### 5.2 QR Payload (`lib/qr.ts`)

```typescript
// Encode: called when generating your QR
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

// Decode + verify: called when scanning someone's QR
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
```

### 5.3 On-Chain Identity (`hooks/useIdentity.ts`)

Use PAPI with Smoldot to query the Identity pallet on Polkadot.

```typescript
import { createClient } from 'polkadot-api';
import { getSmProvider } from 'polkadot-api/sm-provider';
import { smoldot } from 'polkadot-api/smoldot';
import { dot } from '@polkadot-api/descriptors';

// Initialize once at app startup
const sm = smoldot.start();
const chain = await sm.addChain({ chainSpec: polkadotChainSpec });
const provider = getSmProvider(chain);
const client = createClient(provider);
const api = client.getTypedApi(dot);

export async function fetchOnChainIdentity(address: string): Promise<OnChainIdentity | null> {
  try {
    const identity = await api.query.Identity.IdentityOf.getValue(address);
    if (!identity) return null;
    return {
      display: identity.info.display?.value?.asText(),
      verified: identity.judgements.some(([, j]) => j.type === 'KnownGood' || j.type === 'Reasonable'),
      twitter: identity.info.twitter?.value?.asText(),
      web: identity.info.web?.value?.asText(),
    };
  } catch {
    return null;
  }
}
```

> **Note:** Chain spec JSON for Polkadot can be fetched from `https://paritytech.github.io/chainspecs/polkadot.json` or bundled. For hackathon speed, you can fall back to a public RPC (`wss://rpc.polkadot.io`) if Smoldot setup takes too long.

### 5.4 Local Storage (`lib/storage.ts`)

```typescript
const PROFILE_KEY = 'drop:profile';
const CONTACTS_KEY = 'drop:contacts';

export const storage = {
  getProfile: (): LocalProfile | null => JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'),
  setProfile: (p: LocalProfile) => localStorage.setItem(PROFILE_KEY, JSON.stringify(p)),
  getContacts: (): Contact[] => JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'),
  addContact: (c: Contact) => {
    const contacts = storage.getContacts();
    const existing = contacts.findIndex(x => x.address === c.address);
    if (existing >= 0) contacts[existing] = c;
    else contacts.push(c);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  },
  exportContacts: () => {
    const data = storage.getContacts();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'drop-contacts.json'; a.click();
  }
};
```

---

## 6. UI Flow & Screens

### Screen 1 — Setup (first launch)
- "Welcome to Drop" 
- Generate wallet → show address + mnemonic (warn: save this, shown once)
- Form: enter Telegram / email / note (what you want to share)
- CTA: "Create my Drop card"

### Screen 2 — Home / My Card
- Shows your QR code (regenerated each session with fresh timestamp + signature)
- Shows your address (truncated) + on-chain identity if set
- Bottom nav: My Card | Scan | Contacts

### Screen 3 — Scanner
- Camera view using `@zxing/browser`
- On successful scan: decode + verify payload
- Show preview: "You're about to save [address / on-chain name]"
- Show what they shared (Telegram, etc.)
- CTA: "Save contact" — also triggers showing your QR for them to scan back

### Screen 4 — Contacts
- List of saved contacts
- Each card: on-chain name (if any) + verified badge + shared fields
- Export button → downloads JSON

---

## 7. Optional Backend (QR Relay)

If camera scanning is unreliable during the demo, implement a simple relay:

```
POST /relay        { payload: QRPayload }  → returns { code: string } (6-char code)
GET  /relay/:code  → returns QRPayload
```

- In-memory store, TTL 5 minutes
- User can share a 6-char code verbally instead of scanning QR
- Still end-to-end: server only sees the already-signed public payload

```typescript
// backend/index.ts
import express from 'express';
const app = express();
app.use(express.json());

const store = new Map<string, { payload: object; expires: number }>();

app.post('/relay', (req, res) => {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  store.set(code, { payload: req.body.payload, expires: Date.now() + 5 * 60 * 1000 });
  res.json({ code });
});

app.get('/relay/:code', (req, res) => {
  const entry = store.get(req.params.code);
  if (!entry || entry.expires < Date.now()) return res.status(404).json({ error: 'expired' });
  res.json(entry.payload);
});

app.listen(3001);
```

---

## 8. Build Order (2 hours)

| Time | Task |
|---|---|
| 0:00–0:15 | Scaffold Vite app, install deps, Tailwind setup |
| 0:15–0:35 | `lib/crypto.ts` + `lib/storage.ts` + `useWallet.ts` |
| 0:35–0:55 | Setup screen + QR generation (MyQR.tsx) |
| 0:55–1:20 | Scanner screen + decode/verify + save contact |
| 1:20–1:40 | PAPI identity lookup + ContactCard.tsx |
| 1:40–1:55 | ContactList + export + polish |
| 1:55–2:00 | Demo flow test end-to-end |

---

## 9. Key Dependencies

```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "@polkadot/keyring": "^13",
    "@polkadot/util": "^13",
    "@polkadot/util-crypto": "^13",
    "polkadot-api": "latest",
    "@polkadot-api/descriptors": "latest",
    "qrcode.react": "^3",
    "@zxing/browser": "^0.1",
    "tailwindcss": "^3"
  }
}
```

---

## 10. Polkadot Integration Summary (for judges)

| Feature | How it's used |
|---|---|
| Wallet / keypair | SR25519 keypair generated locally, never leaves device |
| Signed payload | Every QR is cryptographically signed — proves address ownership |
| On-chain identity | PAPI + Smoldot queries Identity pallet — verified human-readable names |
| Smoldot light client | Connects directly to Polkadot chain from browser — no centralized RPC |
| Privacy by design | All contact data local, Polkadot used only for verification |

---

## 11. Prompt to Start Claude Code

Feed this entire document to Claude Code with the following opener:

> "Build the Drop app as described in this implementation document. Start with the Vite + React + TypeScript scaffold, install all dependencies, then implement in the order specified in Section 8. Ask me before making any architectural decisions not covered in the doc."
