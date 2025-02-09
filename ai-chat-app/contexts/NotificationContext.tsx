import React, { createContext, useState, useContext, useEffect } from 'react';
import { notificationService, Notification } from '@/tools/notificationService';
import { useUser } from './UserContext';

interface NotificationContextType {
	notifications: Notification[];
	unreadCount: number;
	loadNotifications: () => Promise<void>;
	markAsRead: (notificationId: number) => Promise<void>;
	markAllAsRead: () => Promise<void>;
	deleteNotification: (notificationId: number) => Promise<void>;
	isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
	undefined
);

export function NotificationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const { user } = useUser();

	const loadNotifications = async () => {
		if (!user) return;

		try {
			setIsLoading(true);
			const [fetchedNotifications, count] = await Promise.all([
				notificationService.getNotifications(),
				notificationService.getUnreadCount(),
			]);
			setNotifications(fetchedNotifications);
			setUnreadCount(count);
		} catch (error) {
			console.error('Error loading notifications:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const markAsRead = async (notificationId: number) => {
		try {
			await notificationService.markAsRead(notificationId);
			setNotifications((prev) =>
				prev.map((notification) =>
					notification.id === notificationId
						? { ...notification, isRead: true }
						: notification
				)
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} catch (error) {
			console.error('Error marking notification as read:', error);
		}
	};

	const markAllAsRead = async () => {
		try {
			await notificationService.markAllAsRead();
			setNotifications((prev) =>
				prev.map((notification) => ({ ...notification, isRead: true }))
			);
			setUnreadCount(0);
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
		}
	};

	const deleteNotification = async (notificationId: number) => {
		try {
			await notificationService.deleteNotification(notificationId);
			setNotifications((prev) =>
				prev.filter(
					(notification) => notification.id !== notificationId
				)
			);
			// Update unread count if the deleted notification was unread
			const wasUnread =
				notifications.find((n) => n.id === notificationId)?.isRead ===
				false;
			if (wasUnread) {
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		} catch (error) {
			console.error('Error deleting notification:', error);
		}
	};

	// Load notifications when user changes
	useEffect(() => {
		if (user) {
			loadNotifications();
		} else {
			setNotifications([]);
			setUnreadCount(0);
		}
	}, [user]);

	return (
		<NotificationContext.Provider
			value={{
				notifications,
				unreadCount,
				loadNotifications,
				markAsRead,
				markAllAsRead,
				deleteNotification,
				isLoading,
			}}
		>
			{children}
		</NotificationContext.Provider>
	);
}

export function useNotifications() {
	const context = useContext(NotificationContext);
	if (context === undefined) {
		throw new Error(
			'useNotifications must be used within a NotificationProvider'
		);
	}
	return context;
}
