import { ContactCard } from './ContactCard';
import type { Contact } from '../types';

interface Props {
  contacts: Contact[];
  onExport: () => void;
}

export function ContactList({ contacts, onExport }: Props) {
  return (
    <div className="flex flex-col pt-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Contacts</h2>
        {contacts.length > 0 && (
          <button
            onClick={onExport}
            className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
          >
            Export JSON
          </button>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center mt-16">
          <p className="text-gray-500">No contacts yet.</p>
          <p className="text-gray-600 text-sm mt-1">Scan someone's Drop card to add them.</p>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {contacts.map(c => (
            <ContactCard key={c.id} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
