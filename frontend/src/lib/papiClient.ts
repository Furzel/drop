import { createClient } from 'polkadot-api';
import { getWsProvider } from 'polkadot-api/ws-provider/web';
import { westend_people } from '@polkadot-api/descriptors';
import type { TypedApi } from 'polkadot-api';

// Lazy singleton — initialized on first call, reused thereafter
let apiPromise: Promise<TypedApi<typeof westend_people>> | null = null;

function initApi(): Promise<TypedApi<typeof westend_people>> {
  const provider = getWsProvider('wss://westend-people-rpc.polkadot.io');
  const client = createClient(provider);
  return Promise.resolve(client.getTypedApi(westend_people));
}

export function getApi(): Promise<TypedApi<typeof westend_people>> {
  if (!apiPromise) {
    apiPromise = Promise.resolve(initApi());
  }
  return apiPromise;
}
