import React, { useCallback, useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	ListRenderItem,
	SafeAreaView,
	Animated,
} from 'react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Notification } from '@/tools/notificationService';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationScreen() {
	const {
		notifications,
		unreadCount,
		loadNotifications,
		markAsRead,
		deleteNotification,
		isLoading,
	} = useNotifications();
	const { theme } = useTheme();

	// Create a map to store fade animations for each notification
	const fadeAnims = React.useRef(new Map<number, Animated.Value>()).current;

	// Initialize fade animations for new notifications
	useEffect(() => {
		notifications.forEach((notification) => {
			if (!fadeAnims.has(notification.id)) {
				fadeAnims.set(
					notification.id,
					new Animated.Value(notification.isRead ? 0 : 1)
				);
			}
		});
	}, [notifications]);

	// Mark notifications as read when they are displayed
	useEffect(() => {
		const unreadNotifications = notifications.filter(
			(notification) => !notification.isRead
		);
		if (unreadNotifications.length > 0) {
			unreadNotifications.forEach((notification) => {
				const fadeAnim = fadeAnims.get(notification.id);
				if (fadeAnim) {
					Animated.timing(fadeAnim, {
						toValue: 0,
						duration: 1000,
						useNativeDriver: false,
					}).start(() => {
						markAsRead(notification.id);
					});
				}
			});
		}
	}, [notifications]);

	const handleDeleteNotification = (notificationId: number) => {
		fadeAnims.delete(notificationId);
		deleteNotification(notificationId);
	};

	const onRefresh = useCallback(() => {
		loadNotifications();
	}, [loadNotifications]);

	const renderNotification: ListRenderItem<Notification> = ({
		item: notification,
	}) => {
		const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
			addSuffix: true,
		});

		const fadeAnim =
			fadeAnims.get(notification.id) ||
			new Animated.Value(notification.isRead ? 0 : 1);

		return (
			<Animated.View
				style={[
					styles.notificationItem,
					{
						backgroundColor: fadeAnim.interpolate({
							inputRange: [0, 1],
							outputRange: [theme.colors.card, '#E6F3FF'],
						}),
					},
				]}
			>
				<View style={styles.notificationContent}>
					<View style={styles.notificationHeader}>
						<Text
							style={[
								styles.notificationTitle,
								{ color: theme.colors.text },
								!notification.isRead && styles.unreadText,
							]}
						>
							{notification.title}
						</Text>
						<TouchableOpacity
							onPress={() =>
								handleDeleteNotification(notification.id)
							}
							style={styles.deleteButton}
						>
							<Ionicons
								name="close-circle-outline"
								size={20}
								color={theme.colors.text}
							/>
						</TouchableOpacity>
					</View>
					<Text
						style={[
							styles.notificationMessage,
							{ color: theme.colors.text },
						]}
					>
						{notification.message}
					</Text>
					<Text
						style={[
							styles.timeAgo,
							{ color: theme.colors.textSecondary },
						]}
					>
						{timeAgo}
					</Text>
				</View>
			</Animated.View>
		);
	};

	if (isLoading && notifications.length === 0) {
		return (
			<SafeAreaView
				style={[
					styles.container,
					{ backgroundColor: theme.colors.background },
				]}
			>
				<ActivityIndicator
					size="large"
					color={theme.colors.primary}
				/>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView
			style={[
				styles.container,
				{ backgroundColor: theme.colors.background },
			]}
		>
			<View style={styles.header}>
				<Text
					style={[styles.headerTitle, { color: theme.colors.text }]}
				>
					Notifications
				</Text>
			</View>

			<FlatList<Notification>
				data={notifications}
				renderItem={renderNotification}
				keyExtractor={(item) => item.id.toString()}
				refreshControl={
					<RefreshControl
						refreshing={isLoading}
						onRefresh={onRefresh}
					/>
				}
				contentContainerStyle={styles.listContainer}
				ListEmptyComponent={
					<View style={styles.emptyContainer}>
						<Text
							style={[
								styles.emptyText,
								{ color: theme.colors.textSecondary },
							]}
						>
							No notifications
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: '600',
	},
	listContainer: {
		padding: 16,
	},
	notificationItem: {
		borderRadius: 12,
		marginBottom: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 3.84,
		elevation: 5,
	},
	notificationContent: {
		flex: 1,
	},
	notificationHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	notificationTitle: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
	},
	unreadText: {
		fontWeight: '700',
	},
	notificationMessage: {
		fontSize: 14,
		marginBottom: 8,
	},
	timeAgo: {
		fontSize: 12,
	},
	deleteButton: {
		marginLeft: 8,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 32,
	},
	emptyText: {
		fontSize: 16,
	},
});
