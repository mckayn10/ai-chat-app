import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const contactService = {
  async getContacts(): Promise<Contact[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts');
    }

    return response.json();
  },

  async createContact(contact: Omit<Contact, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create contact');
    }

    return response.json();
  },

  async updateContact(id: number, updates: Partial<Contact>): Promise<Contact> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update contact');
    }

    return response.json();
  },

  async deleteContact(id: number): Promise<void> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete contact');
    }
  },
}; 