import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect } from "react";

import { EmergencyContact } from "@/types";

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
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading emergency contacts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContacts = async (newContacts: EmergencyContact[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newContacts));
      setContacts(newContacts);
    } catch (error) {
      console.error("Error saving emergency contacts:", error);
      throw error;
    }
  };

  const addContact = async (contact: Omit<EmergencyContact, "id" | "createdAt">) => {
    const newContact: EmergencyContact = {
      ...contact,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    await saveContacts([...contacts, newContact]);
  };

  const updateContact = async (id: string, updates: Partial<EmergencyContact>) => {
    const updatedContacts = contacts.map((contact) =>
      contact.id === id ? { ...contact, ...updates } : contact
    );
    await saveContacts(updatedContacts);
  };

  const deleteContact = async (id: string) => {
    const filteredContacts = contacts.filter((contact) => contact.id !== id);
    await saveContacts(filteredContacts);
  };

  return {
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
  };
});
