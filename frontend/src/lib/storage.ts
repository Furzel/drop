import type { LocalProfile, Contact } from '../types';

const PROFILE_KEY = 'drop:profile';
const CONTACTS_KEY = 'drop:contacts';

export const storage = {
  getProfile: (): LocalProfile | null =>
    JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'),

  setProfile: (p: LocalProfile) =>
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p)),

  getContacts: (): Contact[] =>
    JSON.parse(localStorage.getItem(CONTACTS_KEY) || '[]'),

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
    a.href = url;
    a.download = 'drop-contacts.json';
    a.click();
    URL.revokeObjectURL(url);
  },
};
