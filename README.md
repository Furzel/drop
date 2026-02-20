# Drop

Privacy-first conference contact exchange, built on Polkadot.

## What it does

Drop lets two people at a conference exchange contact info without exposing personal data to a third party. Each user has a local Polkadot wallet. They share a QR code containing their public address and a signed payload. The other person scans it, the app fetches their on-chain identity from the People chain, and both save each other as a local contact.

**No server required for the core flow.** An optional relay backend exists for demos where camera scanning is unreliable (see below).

## How it works

1. **Setup** — Generate a new SR25519 wallet or connect via the Polkadot.js browser extension. If you have an on-chain identity set on the Westend People chain, your display name, email, and Twitter handle are prefilled automatically.
2. **My Card** — Your QR code is generated fresh each session. It encodes your address, your shared contact fields, and a cryptographic signature — proving you own the address without revealing anything else.
3. **Scan** — Point your camera at someone's Drop card. The app verifies the signature, resolves their on-chain identity in real time, and lets you save them as a contact.
4. **Contacts** — All contacts are stored locally in your browser. Export them as JSON at any time.

## Polkadot integration

| Feature | How it's used |
|---|---|
| Wallet / keypair | SR25519 keypair generated locally or injected via Polkadot.js extension — private key never leaves the device |
| Signed QR payload | Every QR is cryptographically signed — proves address ownership without a server |
| On-chain identity | PAPI queries the Westend People chain in real time to resolve verified display names, email, and Twitter |
| Privacy by design | All contact data is local; Polkadot is used only for identity verification |

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Wallet / crypto | `@polkadot/keyring`, `@polkadot/util-crypto` |
| Extension support | `@polkadot/extension-dapp` |
| Chain interaction | `polkadot-api` (PAPI) + WebSocket provider |
| QR generation | `qrcode.react` |
| QR scanning | `@zxing/browser` |
| Storage | `localStorage` |
| Backend (optional) | Node + Express — single `/relay` endpoint |

## Running locally

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `https://localhost:5173`. Camera access on mobile requires HTTPS — the dev server uses a self-signed cert via `@vitejs/plugin-basic-ssl`. Accept the browser warning to proceed.

To expose on your local network (for phone testing):

```bash
# The server already binds to 0.0.0.0 — just use your machine's LAN IP
# e.g. https://192.168.1.x:5173
```

### Optional relay backend

If camera scanning is unreliable during a demo, the relay lets users share a 6-character code instead of scanning a QR. The server only ever sees the already-signed public payload.

```bash
cd backend
npm install
npm run dev   # runs on http://localhost:3001
```

```
POST /relay        { payload }  →  { code }   (6-char, TTL 5 min)
GET  /relay/:code              →  payload
```

## On-chain identity setup

The identity lookup queries the **Westend People chain** (`wss://westend-people-rpc.polkadot.io`). To have your identity resolved when someone scans your card, set an identity on Westend via [Polkadot.js Apps](https://polkadot.js.org/apps/?rpc=wss://westend-people-rpc.polkadot.io) → Accounts → My accounts → Set on-chain identity.
