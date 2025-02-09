import pool from '../db/config';

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class NotificationModel {
  static async findByUserId(userId: number): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT id, user_id as "userId", title, message, type, 
              is_read as "isRead", created_at as "createdAt", updated_at as "updatedAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async create(notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notification> {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id as "userId", title, message, type, 
                 is_read as "isRead", created_at as "createdAt", updated_at as "updatedAt"`,
      [notification.userId, notification.title, notification.message, notification.type, notification.isRead]
    );
    return result.rows[0];
  }

  static async markAsRead(userId: number, notificationId: number): Promise<boolean> {
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1 AND id = $2
       RETURNING id`,
      [userId, notificationId]
    );
    return (result.rowCount ?? 0) > 0;
  }

  static async markAllAsRead(userId: number): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE user_id = $1`,
      [userId]
    );
  }

  static async getUnreadCount(userId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  static async delete(userId: number, notificationId: number): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND id = $2 RETURNING id',
      [userId, notificationId]
    );
    return (result.rowCount ?? 0) > 0;
  }
} 