import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  },

  async getUnreadCount(): Promise<number> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.count;
  },

  async markAsRead(notificationId: number): Promise<void> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  },

  async markAllAsRead(): Promise<void> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }
  },

  async deleteNotification(notificationId: number): Promise<void> {
    const token = await AsyncStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  },
}; 