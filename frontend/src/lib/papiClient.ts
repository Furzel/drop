import { createClient } from 'polkadot-api';
import { getSmProvider } from 'polkadot-api/sm-provider';
import { start } from 'polkadot-api/smoldot';
import { dot } from '@polkadot-api/descriptors';
import type { TypedApi } from 'polkadot-api';

// Lazy singleton — initialized on first call, reused thereafter
let apiPromise: Promise<TypedApi<typeof dot>> | null = null;

async function initApi(): Promise<TypedApi<typeof dot>> {
  const smoldot = start();

  // Fetch chain spec from Parity's hosted file
  const chainSpecRes = await fetch(
    'https://paritytech.github.io/chainspecs/polkadot.json'
  );
  const chainSpec = await chainSpecRes.text();

  const chain = await smoldot.addChain({ chainSpec });
  const provider = getSmProvider(chain);
  const client = createClient(provider);
  return client.getTypedApi(dot);
}

export function getApi(): Promise<TypedApi<typeof dot>> {
  if (!apiPromise) {
    apiPromise = initApi();
  }
  return apiPromise;
}
