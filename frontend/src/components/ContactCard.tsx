import { useIdentity } from '../hooks/useIdentity';
import type { Contact } from '../types';

interface Props {
  contact: Contact;
}

export function ContactCard({ contact }: Props) {
  const { identity, loading } = useIdentity(contact.address);
  const short = `${contact.address.slice(0, 8)}…${contact.address.slice(-6)}`;

  const displayName = identity?.display ?? contact.sharedFields.note ?? short;

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-white font-semibold">{displayName}</p>
          <p className="text-xs text-gray-500 font-mono">{short}</p>
        </div>
        {identity?.verified && (
          <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full font-medium">
            ✓ Verified
          </span>
        )}
        {loading && (
          <span className="text-xs text-gray-600">…</span>
        )}
      </div>

      <div className="space-y-1 text-sm mt-3">
        {contact.sharedFields.telegram && (
          <div className="flex justify-between">
            <span className="text-gray-400">Telegram</span>
            <span className="text-white">{contact.sharedFields.telegram}</span>
          </div>
        )}
        {contact.sharedFields.email && (
          <div className="flex justify-between">
            <span className="text-gray-400">Email</span>
            <span className="text-white">{contact.sharedFields.email}</span>
          </div>
        )}
        {identity?.twitter && (
          <div className="flex justify-between">
            <span className="text-gray-400">Twitter</span>
            <span className="text-white">{identity.twitter}</span>
          </div>
        )}
        {identity?.web && (
          <div className="flex justify-between">
            <span className="text-gray-400">Web</span>
            <a
              href={identity.web}
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-400 truncate max-w-[160px]"
            >
              {identity.web}
            </a>
          </div>
        )}
        {contact.sharedFields.note && contact.sharedFields.note !== displayName && (
          <div className="flex justify-between">
            <span className="text-gray-400">Note</span>
            <span className="text-white">{contact.sharedFields.note}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-3">
        Saved {new Date(contact.savedAt).toLocaleDateString()}
      </p>
    </div>
  );
}
