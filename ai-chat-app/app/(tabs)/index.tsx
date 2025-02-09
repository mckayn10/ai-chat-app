import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	SafeAreaView,
	Animated,
	Dimensions,
	Modal,
	TextInput,
	Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ChatScreen from '@/app/ChatScreen';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationScreen from '@/screens/NotificationScreen';

interface FavoriteItemProps {
	title: string;
	icon: React.ReactNode;
	subtitle?: string;
}

const FavoriteItem = ({ title, icon, subtitle }: FavoriteItemProps) => (
	<TouchableOpacity style={styles.favoriteItem}>
		<View style={styles.favoriteContent}>
			<View style={styles.favoriteIconContainer}>{icon}</View>
			<View style={styles.favoriteTextContainer}>
				<Text style={styles.favoriteTitle}>{title}</Text>
				{subtitle && (
					<Text style={styles.favoriteSubtitle}>{subtitle}</Text>
				)}
			</View>
		</View>
		<TouchableOpacity style={styles.closeButton}>
			<Ionicons
				name="close"
				size={16}
				color="#999"
			/>
		</TouchableOpacity>
	</TouchableOpacity>
);

export default function HomeScreen() {
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [inputText, setInputText] = useState('');
	const { unreadCount } = useNotifications();
	// Separate animations for native and JS drivers
	const inputWidth = useRef(new Animated.Value(0)).current;
	const iconsTranslateX = useRef(new Animated.Value(0)).current;
	const iconsOpacity = useRef(new Animated.Value(1)).current;
	const modalTranslateY = useRef(
		new Animated.Value(Dimensions.get('window').height)
	).current;
	const modalOpacity = useRef(new Animated.Value(0)).current;
	const modalHeight = Dimensions.get('window').height - 90;

	const floatingButtonScale = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.timing(floatingButtonScale, {
			toValue: isChatOpen ? 0 : 1,
			duration: 200,
			useNativeDriver: true,
		}).start();
	}, [isChatOpen]);

	useEffect(() => {
		if (isChatOpen) {
			Keyboard.dismiss();
		}
	}, [isChatOpen]);

	const openChat = useCallback(() => {
		setIsChatOpen(true);
		Animated.parallel([
			Animated.timing(modalTranslateY, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(modalOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start();
	}, [modalTranslateY, modalOpacity]);

	const closeChat = useCallback(() => {
		Animated.parallel([
			Animated.timing(modalTranslateY, {
				toValue: modalHeight,
				duration: 300,
				useNativeDriver: true,
			}),
			Animated.timing(modalOpacity, {
				toValue: 0,
				duration: 300,
				useNativeDriver: true,
			}),
		]).start(() => {
			setIsChatOpen(false);
		});
	}, [modalHeight, modalTranslateY, modalOpacity]);

	const interpolatedInputWidth = inputWidth.interpolate({
		inputRange: [0, 1],
		outputRange: ['80%', '100%'],
	});

	const handleInputFocus = () => {
		openChat();
		Keyboard.dismiss(); // Dismiss keyboard as we're transitioning to chat
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.headerTitle}>Home</Text>
				<View style={styles.headerRight}>
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => router.push('/settings')}
					>
						<Ionicons
							name="person-outline"
							size={24}
							color="black"
						/>
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.headerButton}
						onPress={() => router.push('/(tabs)/notifications')}
					>
						{unreadCount > 0 && (
							<View style={styles.notificationBadge}>
								<Text style={styles.notificationText}>
									{unreadCount > 99 ? '99+' : unreadCount}
								</Text>
							</View>
						)}
						<Ionicons
							name="notifications-outline"
							size={24}
							color="black"
						/>
					</TouchableOpacity>
					<TouchableOpacity style={styles.headerButton}>
						<Ionicons
							name="add"
							size={28}
							color="black"
						/>
					</TouchableOpacity>
				</View>
			</View>

			<ScrollView
				style={styles.content}
				pointerEvents={isChatOpen ? 'none' : 'auto'}
			>
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Activity</Text>
					<TouchableOpacity style={styles.activityItem}>
						<Ionicons
							name="game-controller-outline"
							size={24}
							color="#2196F3"
						/>
						<View style={styles.activityContent}>
							<Text style={styles.activityTitle}>
								Finish setting up your Xbox
							</Text>
							<Text style={styles.activitySubtitle}>
								Connect your Xbox to Alexa for hands-free
								control
							</Text>
						</View>
					</TouchableOpacity>
				</View>

				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Text style={styles.sectionTitle}>Favorites</Text>
						<TouchableOpacity>
							<Text style={styles.editButton}>Edit</Text>
						</TouchableOpacity>
					</View>
					<View style={styles.favoritesGrid}>
						<View style={styles.favoriteRow}>
							<View style={styles.favoriteColumn}>
								<FavoriteItem
									title="Continue Listening"
									subtitle="Suggested Favorite"
									icon={
										<Ionicons
											name="play"
											size={24}
											color="#666"
										/>
									}
								/>
							</View>
							<View style={styles.favoriteColumn}>
								<FavoriteItem
									title="McKay's Echo Show"
									subtitle="Suggested Favorite"
									icon={
										<Ionicons
											name="tv-outline"
											size={24}
											color="#666"
										/>
									}
								/>
							</View>
						</View>
						<View style={styles.favoriteRow}>
							<View style={styles.favoriteColumn}>
								<FavoriteItem
									title="Alarms"
									subtitle="Suggested Favorite"
									icon={
										<Ionicons
											name="alarm-outline"
											size={24}
											color="#666"
										/>
									}
								/>
							</View>
							<View style={styles.favoriteColumn}>
								<FavoriteItem
									title="Music and More"
									subtitle="Suggested Favorite"
									icon={
										<Ionicons
											name="musical-notes-outline"
											size={24}
											color="#666"
										/>
									}
								/>
							</View>
						</View>
						<View style={styles.favoriteRow}>
							<View style={styles.favoriteColumn}>
								<FavoriteItem
									title="All Echo & Alexa"
									subtitle="Suggested Favorite"
									icon={
										<Ionicons
											name="options-outline"
											size={24}
											color="#666"
										/>
									}
								/>
							</View>
							<View style={styles.favoriteColumn}>
								{/* Empty column for alignment */}
							</View>
						</View>
					</View>
				</View>
			</ScrollView>

			<Animated.View
				style={[
					styles.floatingButton,
					{
						transform: [{ scale: floatingButtonScale }],
						opacity: floatingButtonScale,
					},
				]}
			>
				<TouchableOpacity
					onPress={openChat}
					activeOpacity={0.9}
					style={styles.floatingButtonTouchable}
				>
					<LinearGradient
						colors={['#00A0B4', '#0078FF']}
						style={styles.floatingButtonGradient}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
					>
						<Ionicons
							name="mic"
							size={28}
							color="#fff"
						/>
					</LinearGradient>
				</TouchableOpacity>
			</Animated.View>

			<Animated.View
				style={[
					styles.chatModal,
					{
						transform: [{ translateY: modalTranslateY }],
						opacity: modalOpacity,
						height: modalHeight,
					},
				]}
				pointerEvents={isChatOpen ? 'auto' : 'none'}
			>
				<ChatScreen onClose={closeChat} />
			</Animated.View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: '600',
	},
	headerRight: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
	},
	headerButton: {
		position: 'relative',
	},
	notificationBadge: {
		position: 'absolute',
		top: -5,
		right: -5,
		backgroundColor: '#ff4444',
		borderRadius: 10,
		width: 20,
		height: 20,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 1,
	},
	notificationText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	content: {
		flex: 1,
	},
	section: {
		padding: 16,
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 12,
	},
	editButton: {
		color: '#2196F3',
		fontSize: 16,
	},
	activityItem: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f8f8f8',
		padding: 16,
		borderRadius: 12,
		gap: 16,
	},
	activityContent: {
		flex: 1,
	},
	activityTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	activitySubtitle: {
		fontSize: 14,
		color: '#666',
	},
	favoritesGrid: {
		width: '100%',
	},
	favoriteRow: {
		flexDirection: 'row',
		marginBottom: 12,
	},
	favoriteColumn: {
		flex: 1,
		marginHorizontal: 6,
	},
	favoriteItem: {
		backgroundColor: '#f8f8f8',
		borderRadius: 12,
		height: 100,
		padding: 12,
	},
	favoriteContent: {
		flex: 1,
		flexDirection: 'column',
	},
	favoriteIconContainer: {
		marginBottom: 8,
	},
	favoriteTextContainer: {
		flex: 1,
		justifyContent: 'space-between',
	},
	favoriteTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	favoriteSubtitle: {
		fontSize: 12,
		color: '#2196F3',
	},
	closeButton: {
		position: 'absolute',
		top: 8,
		right: 8,
		padding: 4,
	},
	bottomBar: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		borderTopColor: '#eee',
		backgroundColor: '#fff',
		overflow: 'hidden',
		zIndex: 1,
	},
	bottomBarIcons: {
		flexDirection: 'row',
		alignItems: 'center',
		position: 'absolute',
		left: 16,
	},
	bottomBarItem: {
		marginRight: 24,
	},
	bottomBarInputContainer: {
		flex: 1,
		alignItems: 'flex-end',
	},
	bottomBarInput: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#f8f8f8',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
	},
	bottomBarInputText: {
		flex: 1,
		color: '#333',
		fontSize: 16,
	},
	floatingButton: {
		position: 'absolute',
		bottom: 24,
		right: 24,
		width: 64,
		height: 64,
		borderRadius: 32,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
		zIndex: 1,
	},
	floatingButtonGradient: {
		width: '100%',
		height: '100%',
		borderRadius: 32,
		justifyContent: 'center',
		alignItems: 'center',
	},
	floatingButtonTouchable: {
		width: '100%',
		height: '100%',
		borderRadius: 32,
		overflow: 'hidden',
	},
	chatModal: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: 'hidden',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: -2,
		},
		shadowOpacity: 0.1,
		shadowRadius: 4,
	},
});
