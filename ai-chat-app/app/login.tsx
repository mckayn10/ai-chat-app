import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	SafeAreaView,
	KeyboardAvoidingView,
	Platform,
	Alert,
	ScrollView,
	Keyboard,
	TouchableWithoutFeedback,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { authService } from '@/tools/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@/contexts/UserContext';

export default function LoginScreen() {
	const { setUser } = useUser();
	const [isLogin, setIsLogin] = useState(true);
	const [email, setEmail] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleAuth = async () => {
		if (isLogin) {
			if (!email.trim() || !password.trim()) {
				Alert.alert('Error', 'Please fill in all fields');
				return;
			}
		} else {
			if (
				!email.trim() ||
				!firstName.trim() ||
				!lastName.trim() ||
				!password.trim()
			) {
				Alert.alert('Error', 'Please fill in all fields');
				return;
			}

			if (password !== confirmPassword) {
				Alert.alert('Error', 'Passwords do not match');
				return;
			}
		}

		setLoading(true);
		try {
			let response;
			if (isLogin) {
				console.log('Attempting login with:', { email, password });
				response = await authService.login(email, password);
			} else {
				console.log('Attempting registration with:', {
					email,
					firstName,
					lastName,
				});
				response = await authService.register(
					email,
					firstName,
					lastName,
					password
				);
			}

			console.log('Auth response:', response);
			await AsyncStorage.setItem('token', response.token);
			console.log('Token saved, setting user:', response.user);
			setUser(response.user);
			router.replace('/(tabs)');
		} catch (error) {
			console.error('Auth error:', error);
			Alert.alert(
				'Error',
				error instanceof Error ? error.message : 'Authentication failed'
			);
		} finally {
			setLoading(false);
		}
	};

	const toggleForm = () => {
		setIsLogin(!isLogin);
		setEmail('');
		setFirstName('');
		setLastName('');
		setPassword('');
		setConfirmPassword('');
		setShowPassword(false);
	};

	return (
		<SafeAreaView style={styles.container}>
			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.content}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
			>
				<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
					<ScrollView
						contentContainerStyle={styles.scrollContent}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
						bounces={false}
					>
						<View style={styles.header}>
							<LinearGradient
								colors={['#00A0B4', '#0078FF']}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={styles.logoContainer}
							>
								<Text style={styles.logo}>K</Text>
							</LinearGradient>
							<Text style={styles.title}>kairos</Text>
							<Text style={styles.subtitle}>
								Your AI Assistant
							</Text>
						</View>

						<View style={styles.form}>
							<View style={styles.inputContainer}>
								<Ionicons
									name="mail-outline"
									size={20}
									color="#666"
									style={styles.inputIcon}
								/>
								<TextInput
									style={styles.input}
									placeholder="Email address"
									value={email}
									onChangeText={setEmail}
									autoCapitalize="none"
									autoCorrect={false}
									keyboardType="email-address"
								/>
							</View>

							{!isLogin && (
								<>
									<View style={styles.inputContainer}>
										<Ionicons
											name="person-outline"
											size={20}
											color="#666"
											style={styles.inputIcon}
										/>
										<TextInput
											style={styles.input}
											placeholder="First name"
											value={firstName}
											onChangeText={setFirstName}
											autoCapitalize="words"
											autoCorrect={false}
										/>
									</View>

									<View style={styles.inputContainer}>
										<Ionicons
											name="person-outline"
											size={20}
											color="#666"
											style={styles.inputIcon}
										/>
										<TextInput
											style={styles.input}
											placeholder="Last name"
											value={lastName}
											onChangeText={setLastName}
											autoCapitalize="words"
											autoCorrect={false}
										/>
									</View>
								</>
							)}

							<View style={styles.inputContainer}>
								<Ionicons
									name="lock-closed-outline"
									size={20}
									color="#666"
									style={styles.inputIcon}
								/>
								<TextInput
									style={styles.input}
									placeholder="Password"
									value={password}
									onChangeText={setPassword}
									secureTextEntry={!showPassword}
									autoCapitalize="none"
									autoCorrect={false}
								/>
								<TouchableOpacity
									onPress={() =>
										setShowPassword(!showPassword)
									}
									style={styles.showPasswordButton}
								>
									<Ionicons
										name={
											showPassword
												? 'eye-off-outline'
												: 'eye-outline'
										}
										size={20}
										color="#666"
									/>
								</TouchableOpacity>
							</View>

							{!isLogin && (
								<View style={styles.inputContainer}>
									<Ionicons
										name="lock-closed-outline"
										size={20}
										color="#666"
										style={styles.inputIcon}
									/>
									<TextInput
										style={styles.input}
										placeholder="Confirm password"
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry={!showPassword}
										autoCapitalize="none"
										autoCorrect={false}
									/>
								</View>
							)}

							<TouchableOpacity
								style={styles.button}
								onPress={handleAuth}
								disabled={loading}
							>
								<LinearGradient
									colors={['#00A0B4', '#0078FF']}
									start={{ x: 0, y: 0 }}
									end={{ x: 1, y: 0 }}
									style={styles.gradient}
								>
									<Text style={styles.buttonText}>
										{loading
											? 'Please wait...'
											: isLogin
											? 'Login'
											: 'Sign Up'}
									</Text>
								</LinearGradient>
							</TouchableOpacity>

							<TouchableOpacity
								style={styles.switchButton}
								onPress={toggleForm}
							>
								<Text style={styles.switchText}>
									{isLogin
										? "Don't have an account? Sign Up"
										: 'Already have an account? Login'}
								</Text>
							</TouchableOpacity>
						</View>
					</ScrollView>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	content: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		justifyContent: 'center',
		padding: 20,
		paddingBottom: Platform.OS === 'ios' ? 40 : 20,
	},
	header: {
		alignItems: 'center',
		marginBottom: 48,
	},
	logoContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 16,
	},
	logo: {
		fontSize: 40,
		fontWeight: 'bold',
		color: '#fff',
	},
	title: {
		fontSize: 32,
		fontWeight: '600',
		color: '#00A0B4',
		marginBottom: 8,
	},
	subtitle: {
		fontSize: 18,
		color: '#666',
	},
	form: {
		width: '100%',
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#f8f8f8',
		borderRadius: 12,
		marginBottom: 16,
		paddingHorizontal: 16,
	},
	inputIcon: {
		marginRight: 12,
	},
	input: {
		flex: 1,
		height: 50,
		fontSize: 16,
	},
	showPasswordButton: {
		padding: 8,
	},
	button: {
		height: 50,
		borderRadius: 25,
		overflow: 'hidden',
		marginBottom: 16,
	},
	gradient: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		fontSize: 18,
		fontWeight: '600',
	},
	switchButton: {
		alignItems: 'center',
	},
	switchText: {
		color: '#00A0B4',
		fontSize: 16,
	},
});
