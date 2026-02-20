import { useState } from 'react';
import type { SharedFields } from '../types';

interface Props {
  onCreate: (sharedFields: SharedFields, displayName: string) => void;
  pendingMnemonic: string | null;
  onAcknowledgeMnemonic: () => void;
}

export function Setup({ onCreate, pendingMnemonic, onAcknowledgeMnemonic }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (pendingMnemonic) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-bold mb-2 text-pink-400">Save your recovery phrase</h2>
          <p className="text-sm text-gray-400 mb-4">
            This is shown <strong>once</strong>. Write it down somewhere safe. It's the only way to recover your wallet.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm break-all text-green-300 mb-6 leading-relaxed">
            {pendingMnemonic}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="w-4 h-4"
            />
            I've saved my recovery phrase
          </label>
          <button
            onClick={onAcknowledgeMnemonic}
            disabled={!confirmed}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continue to my Drop card
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ telegram, email, note }, displayName);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-pink-400">Drop</h1>
          <p className="text-gray-400 mt-1 text-sm">Privacy-first contact exchange on Polkadot</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Your name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Alice"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Telegram (optional)</label>
            <input
              type="text"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder="@handle"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Met at Polkadot Summit 2025"
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <button
            type="submit"
            className="w-full mt-2 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Create my Drop card
          </button>
        </form>
      </div>
    </div>
  );
}
