import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";

import { EmergencyContact } from "@/types";
import { 
  resolveFileUri, 
  convertToRelativePath, 
  saveToLibrary, 
  deleteFromLibrary 
} from '@/lib/file-storage';

const STORAGE_KEY = "emergency_contacts";

export const [EmergencyContactsContext, useEmergencyContacts] = createContextHook(() => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: EmergencyContact[] = JSON.parse(stored);
        const resolved = parsed.map(c => ({
          ...c,
          photoUri: c.photoUri ? resolveFileUri(c.photoUri) : undefined
        }));
        setContacts(resolved);
      }
    } catch (error) {
      console.error("Error loading emergency contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContactsToStorage = async (newContacts: EmergencyContact[]) => {
    try {
      const contactsToSave = newContacts.map(c => ({
        ...c,
        photoUri: c.photoUri ? convertToRelativePath(c.photoUri) : undefined
      }));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(contactsToSave));
    } catch (error) {
      console.error("Error saving emergency contacts:", error);
      throw error;
    }
  };

  const addContact = async (contact: Omit<EmergencyContact, "id" | "createdAt">) => {
    let photoUri = contact.photoUri;
    if (photoUri) {
      const relative = await saveToLibrary(photoUri);
      photoUri = resolveFileUri(relative);
    }

    const newContact: EmergencyContact = {
      ...contact,
      photoUri,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await saveContactsToStorage(updated);
  };

  const updateContact = async (id: string, updates: Partial<EmergencyContact>) => {
    let processedUpdates = { ...updates };
    if (updates.photoUri) {
       const relative = await saveToLibrary(updates.photoUri);
       processedUpdates.photoUri = resolveFileUri(relative);
    }

    const updatedContacts = contacts.map((contact) =>
      contact.id === id ? { ...contact, ...processedUpdates } : contact
    );
    setContacts(updatedContacts);
    await saveContactsToStorage(updatedContacts);
  };

  const deleteContact = async (id: string) => {
    const contactToDelete = contacts.find(c => c.id === id);
    if (contactToDelete?.photoUri) {
      await deleteFromLibrary(contactToDelete.photoUri);
    }

    const filteredContacts = contacts.filter((contact) => contact.id !== id);
    setContacts(filteredContacts);
    await saveContactsToStorage(filteredContacts);
  };

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
  };
});
