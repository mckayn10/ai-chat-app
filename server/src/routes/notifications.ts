import { Router, Response } from 'express';
import { NotificationModel } from '../models/Notification';
import { auth, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all notifications for the current user
router.get('/', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await NotificationModel.findByUserId(req.user!.id);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', auth, async (req: AuthRequest, res: Response) => {
  try {
    const count = await NotificationModel.getUnreadCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const success = await NotificationModel.markAsRead(req.user!.id, notificationId);
    if (success) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req: AuthRequest, res: Response) => {
  try {
    await NotificationModel.markAllAsRead(req.user!.id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = parseInt(req.params.id);
    if (isNaN(notificationId)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const success = await NotificationModel.delete(req.user!.id, notificationId);
    if (success) {
      res.json({ message: 'Notification deleted successfully' });
    } else {
      res.status(404).json({ error: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router; 