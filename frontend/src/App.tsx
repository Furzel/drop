import { useState } from 'react';
import { Setup } from './components/Setup';
import { MyQR } from './components/MyQR';
import { Scanner } from './components/Scanner';
import { ContactList } from './components/ContactList';
import { useWallet } from './hooks/useWallet';
import { useContacts } from './hooks/useContacts';
import type { Contact } from './types';

type Tab = 'card' | 'scan' | 'contacts';

export default function App() {
  const { profile, pair, pendingMnemonic, createWallet, acknowledgeMnemonic } = useWallet();
  const { contacts, addContact, exportContacts } = useContacts();
  const [tab, setTab] = useState<Tab>('card');

  if (!profile || !pair || pendingMnemonic) {
    return (
      <Setup
        onCreate={createWallet}
        pendingMnemonic={pendingMnemonic}
        onAcknowledgeMnemonic={acknowledgeMnemonic}
      />
    );
  }

  const handleSaveContact = (contact: Contact) => {
    addContact(contact);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col max-w-md mx-auto">
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === 'card' && <MyQR profile={profile} pair={pair} />}
        {tab === 'scan' && <Scanner onSave={handleSaveContact} />}
        {tab === 'contacts' && (
          <ContactList contacts={contacts} onExport={exportContacts} />
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-gray-900 border-t border-gray-800 flex">
        {(['card', 'scan', 'contacts'] as Tab[]).map(t => {
          const labels: Record<Tab, string> = { card: 'My Card', scan: 'Scan', contacts: 'Contacts' };
          const icons: Record<Tab, string> = { card: '◻', scan: '⊙', contacts: '☰' };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 flex flex-col items-center text-xs gap-0.5 transition-colors ${
                tab === t ? 'text-pink-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-lg leading-none">{icons[t]}</span>
              {labels[t]}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
