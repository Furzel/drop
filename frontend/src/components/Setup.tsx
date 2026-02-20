import { useState, useEffect } from 'react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import type { SharedFields } from '../types';

interface Props {
  onCreate: (sharedFields: SharedFields, displayName: string) => void;
  onConnectExtension: (address: string, publicKey: string, displayName: string | undefined, sharedFields: SharedFields) => void;
  pendingMnemonic: string | null;
  onAcknowledgeMnemonic: () => void;
}

export function Setup({ onCreate, onConnectExtension, pendingMnemonic, onAcknowledgeMnemonic }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);

  const [extensionAccounts, setExtensionAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [extensionChecked, setExtensionChecked] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [mode, setMode] = useState<'choose' | 'extension' | 'new'>('choose');

  useEffect(() => {
    web3Enable('Drop').then(extensions => {
      if (extensions.length > 0) return web3Accounts();
      return [];
    }).then(accounts => {
      setExtensionAccounts(accounts);
      setExtensionChecked(true);
    });
  }, []);

  // Mnemonic acknowledgement screen
  if (pendingMnemonic) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-2 text-pink-400">Save your recovery phrase</h2>
          <p className="text-sm text-gray-400 mb-4">
            Shown <strong>once</strong>. Write it down — it's the only way to recover your wallet.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm break-all text-green-300 mb-6 leading-relaxed">
            {pendingMnemonic}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-6 cursor-pointer">
            <input type="checkbox" checked={mnemonicConfirmed} onChange={e => setMnemonicConfirmed(e.target.checked)} className="w-4 h-4" />
            I've saved my recovery phrase
          </label>
          <button
            onClick={onAcknowledgeMnemonic}
            disabled={!mnemonicConfirmed}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continue to my Drop card
          </button>
        </div>
      </div>
    );
  }

  const sharedFields: SharedFields = { telegram, email, note };

  // Contact info form (shared between both flows)
  const contactForm = (onSubmit: () => void, submitLabel: string) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Your name (optional)</label>
        <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Alice"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Telegram (optional)</label>
        <input type="text" value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@handle"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">Note (optional)</label>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Met at Polkadot Summit 2025"
          className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500" />
      </div>
      <button onClick={onSubmit} className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-colors">
        {submitLabel}
      </button>
      <button onClick={() => setMode('choose')} className="w-full bg-transparent text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors">
        ← Back
      </button>
    </div>
  );

  // Extension account selection + contact form
  if (mode === 'extension' && selectedAccount) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-pink-400">Drop</h1>
            <p className="text-gray-400 mt-1 text-sm">Using account from extension</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 mb-6">
            <p className="text-white font-medium text-sm">{selectedAccount.meta.name}</p>
            <p className="text-gray-500 font-mono text-xs truncate">{selectedAccount.address}</p>
          </div>
          {contactForm(() => {
            onConnectExtension(
              selectedAccount.address,
              selectedAccount.address, // publicKey not exposed by extension-dapp, use address as proxy
              selectedAccount.meta.name || displayName || undefined,
              sharedFields
            );
          }, 'Create my Drop card')}
        </div>
      </div>
    );
  }

  // Extension account list
  if (mode === 'extension') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-pink-400">Drop</h1>
            <p className="text-gray-400 mt-1 text-sm">Select an account</p>
          </div>
          <div className="space-y-2 mb-6">
            {extensionAccounts.map(acc => (
              <button key={acc.address} onClick={() => setSelectedAccount(acc)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-xl p-3 text-left transition-colors">
                <p className="text-white font-medium text-sm">{acc.meta.name || 'Unnamed account'}</p>
                <p className="text-gray-500 font-mono text-xs truncate">{acc.address}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setMode('choose')} className="w-full bg-transparent text-gray-500 hover:text-gray-300 py-2 text-sm transition-colors">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // New wallet flow
  if (mode === 'new') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-pink-400">Drop</h1>
            <p className="text-gray-400 mt-1 text-sm">New wallet</p>
          </div>
          {contactForm(() => onCreate(sharedFields, displayName), 'Create my Drop card')}
        </div>
      </div>
    );
  }

  // Initial choice screen
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pink-400">Drop</h1>
          <p className="text-gray-400 mt-1 text-sm">Privacy-first contact exchange on Polkadot</p>
        </div>

        <div className="space-y-3">
          {extensionChecked && extensionAccounts.length > 0 && (
            <button
              onClick={() => setMode('extension')}
              className="w-full bg-gray-800 hover:bg-gray-700 border border-pink-500/30 text-white font-semibold py-4 rounded-xl transition-colors flex flex-col items-center gap-1"
            >
              <span>Connect Polkadot.js Extension</span>
              <span className="text-xs text-gray-400 font-normal">{extensionAccounts.length} account{extensionAccounts.length !== 1 ? 's' : ''} found</span>
            </button>
          )}

          {extensionChecked && extensionAccounts.length === 0 && (
            <div className="text-center text-xs text-gray-600 py-2">
              No extension detected
            </div>
          )}

          <button
            onClick={() => setMode('new')}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-4 rounded-xl transition-colors"
          >
            Generate new wallet
          </button>
        </div>
      </div>
    </div>
  );
}
