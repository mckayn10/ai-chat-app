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
    if (!token) {
      console.error('getContacts: No authentication token found');
      throw new Error('Not authenticated');
    }

    try {
      console.log('getContacts: Fetching contacts from API...');
      console.log('API URL:', `${API_URL}/contacts`);
      const response = await fetch(`${API_URL}/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('getContacts: API error:', response.status, errorText);
        throw new Error('Failed to fetch contacts');
      }

      const contacts = await response.json();
      console.log(`getContacts: Successfully retrieved ${contacts.length} contacts:`, contacts);
      return contacts;
    } catch (error) {
      console.error('getContacts: Error:', error);
      throw error;
    }
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

  async findByName(firstName: string, lastName?: string): Promise<Contact[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const params = new URLSearchParams({ firstName });
    if (lastName) {
      params.append('lastName', lastName);
    }

    const response = await fetch(`${API_URL}/contacts/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to find contacts');
    }

    return response.json();
  },
}; 