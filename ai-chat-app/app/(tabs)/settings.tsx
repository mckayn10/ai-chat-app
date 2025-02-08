import React from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '@/contexts/UserContext';

export default function SettingsScreen() {
	const { user, signOut } = useUser();

	const handleSignOut = () => {
		Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
			{
				text: 'Cancel',
				style: 'cancel',
			},
			{
				text: 'Sign Out',
				style: 'destructive',
				onPress: async () => {
					await signOut();
					router.replace('/login');
				},
			},
		]);
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					style={styles.backButton}
					onPress={() => router.back()}
				>
					<Ionicons
						name="chevron-back"
						size={28}
						color="black"
					/>
				</TouchableOpacity>
				<Text style={styles.headerTitle}>Settings</Text>
				<View style={styles.headerRight} />
			</View>

			<View style={styles.content}>
				<View style={styles.profileSection}>
					<LinearGradient
						colors={['#00A0B4', '#0078FF']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.avatarContainer}
					>
						<Text style={styles.avatarText}>
							{user?.firstName?.charAt(0).toUpperCase()}
						</Text>
					</LinearGradient>
					<Text style={styles.userName}>
						{user?.firstName} {user?.lastName}
					</Text>
					<Text style={styles.userEmail}>{user?.email}</Text>
					<Text style={styles.userJoined}>
						Joined{' '}
						{user?.createdAt
							? new Date(user.createdAt).toLocaleDateString()
							: ''}
					</Text>
				</View>

				<View style={styles.settingsSection}>
					<TouchableOpacity
						style={styles.settingsItem}
						onPress={() =>
							Alert.alert(
								'Coming Soon',
								'This feature is not yet available.'
							)
						}
					>
						<Ionicons
							name="notifications-outline"
							size={24}
							color="#666"
						/>
						<Text style={styles.settingsItemText}>
							Notifications
						</Text>
						<Ionicons
							name="chevron-forward"
							size={24}
							color="#666"
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.settingsItem}
						onPress={() =>
							Alert.alert(
								'Coming Soon',
								'This feature is not yet available.'
							)
						}
					>
						<Ionicons
							name="lock-closed-outline"
							size={24}
							color="#666"
						/>
						<Text style={styles.settingsItemText}>Privacy</Text>
						<Ionicons
							name="chevron-forward"
							size={24}
							color="#666"
						/>
					</TouchableOpacity>

					<TouchableOpacity
						style={[styles.settingsItem, styles.signOutButton]}
						onPress={handleSignOut}
					>
						<Ionicons
							name="log-out-outline"
							size={24}
							color="#ff4444"
						/>
						<Text
							style={[
								styles.settingsItemText,
								styles.signOutText,
							]}
						>
							Sign Out
						</Text>
					</TouchableOpacity>
				</View>
			</View>
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
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	backButton: {
		padding: 4,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: '600',
	},
	headerRight: {
		width: 40,
	},
	content: {
		flex: 1,
		padding: 20,
	},
	profileSection: {
		alignItems: 'center',
		marginBottom: 32,
	},
	avatarContainer: {
		width: 100,
		height: 100,
		borderRadius: 50,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	avatarText: {
		fontSize: 40,
		fontWeight: 'bold',
		color: '#fff',
	},
	userName: {
		fontSize: 24,
		fontWeight: '600',
		marginBottom: 8,
	},
	userEmail: {
		fontSize: 16,
		color: '#666',
		marginBottom: 8,
	},
	userJoined: {
		fontSize: 16,
		color: '#666',
	},
	settingsSection: {
		backgroundColor: '#f8f8f8',
		borderRadius: 12,
		overflow: 'hidden',
	},
	settingsItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#fff',
		borderBottomWidth: 1,
		borderBottomColor: '#f0f0f0',
	},
	settingsItemText: {
		flex: 1,
		fontSize: 16,
		marginLeft: 12,
		color: '#333',
	},
	signOutButton: {
		borderBottomWidth: 0,
	},
	signOutText: {
		color: '#ff4444',
	},
});
