import { useState, useCallback } from 'react';
import { storage } from '../lib/storage';
import type { Contact } from '../types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(() => storage.getContacts());

  const addContact = useCallback((contact: Contact) => {
    storage.addContact(contact);
    setContacts(storage.getContacts());
  }, []);

  return { contacts, addContact, exportContacts: storage.exportContacts };
}
