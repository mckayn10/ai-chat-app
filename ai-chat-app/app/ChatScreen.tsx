import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
	View,
	StyleSheet,
	Alert,
	SafeAreaView,
	Platform,
	Text,
	TextInput,
	TouchableOpacity,
	ScrollView,
	KeyboardAvoidingView,
	ActivityIndicator,
	Keyboard,
	Animated,
	Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ContactManagementAgent } from '@/tools/langChainHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuickAction = ({
	title,
	onPress,
}: {
	title: string;
	onPress: () => void;
}) => (
	<TouchableOpacity
		style={styles.quickAction}
		onPress={onPress}
	>
		<Text style={styles.quickActionText}>{title}</Text>
	</TouchableOpacity>
);

const SendButton = ({ onPress }: { onPress: () => void }) => {
	return (
		<TouchableOpacity
			style={styles.sendButton}
			onPress={onPress}
		>
			<Ionicons
				name="send"
				size={24}
				color="#00A0B4"
			/>
		</TouchableOpacity>
	);
};

const TypingIndicator = () => {
	const [dots] = useState([
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
	]);

	useEffect(() => {
		const animations = dots.map((dot, index) =>
			Animated.sequence([
				Animated.delay(index * 200),
				Animated.loop(
					Animated.sequence([
						Animated.timing(dot, {
							toValue: 1,
							duration: 500,
							easing: Easing.ease,
							useNativeDriver: true,
						}),
						Animated.timing(dot, {
							toValue: 0,
							duration: 500,
							easing: Easing.ease,
							useNativeDriver: true,
						}),
					])
				),
			])
		);

		Animated.parallel(animations).start();

		return () => {
			animations.forEach((anim) => anim.stop());
		};
	}, []);

	return (
		<View style={styles.typingIndicatorContainer}>
			<View style={styles.typingBubble}>
				<View style={styles.dotsContainer}>
					{dots.map((dot, index) => (
						<Animated.View
							key={index}
							style={[
								styles.dot,
								{
									opacity: dot,
								},
							]}
						/>
					))}
				</View>
			</View>
		</View>
	);
};

interface ChatScreenProps {
	onClose?: () => void;
}

export default function ChatScreen({ onClose }: ChatScreenProps) {
	const [messages, setMessages] = useState<
		Array<{ text: string; isUser: boolean }>
	>([]);
	const [inputText, setInputText] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);
	const scrollViewRef = useRef<ScrollView>(null);
	const agent = useRef<ContactManagementAgent | null>(null);
	const inputRef = useRef<TextInput>(null);

	useEffect(() => {
		const initAgent = async () => {
			const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
			if (apiKey) {
				agent.current = new ContactManagementAgent(apiKey);
				setMessages([
					{
						text: 'Hi, Kairos here. I can help you manage your contacts. Try saying "Show all contacts" or "Add a new contact named [name]".',
						isUser: false,
					},
				]);
			} else {
				setMessages([
					{
						text: 'Error: API key not configured.',
						isUser: false,
					},
				]);
			}
		};

		initAgent();
	}, []);

	const sendMessage = useCallback(
		async (text: string) => {
			setMessages((prev) => [...prev, { text, isUser: true }]);

			if (!text.trim() || isProcessing) return;
			if (!agent.current) {
				Alert.alert('Error', 'AI service is not initialized');
				return;
			}

			setIsProcessing(true);
			setInputText('');

			try {
				const response = await agent.current.processCommand(
					text.trim()
				);
				setMessages((prev) => [
					...prev,
					{
						text: response.message || 'No response received',
						isUser: false,
					},
				]);
			} catch (error) {
				console.error('Error processing message:', error);
				setMessages((prev) => [
					...prev,
					{
						text: 'Sorry, I encountered an error processing your request. Please try again.',
						isUser: false,
					},
				]);
			} finally {
				setIsProcessing(false);
			}
		},
		[isProcessing]
	);

	const handleQuickAction = (command: string) => {
		const text = command.trim();
		if (text) {
			sendMessage(text);
		}
	};

	const handleSubmit = () => {
		console.log(inputText);
		Keyboard.dismiss();
		const text = inputText.trim();
		if (text) {
			sendMessage(text);
		}
	};

	const handlePressOutside = () => {
		inputRef.current?.blur();
	};

	const renderInput = () => (
		<View style={styles.inputContainer}>
			<View style={styles.bottomBarInput}>
				<TextInput
					ref={inputRef}
					style={styles.bottomBarInputText}
					placeholder="Message Kairos..."
					placeholderTextColor="#666"
					value={inputText}
					onChangeText={setInputText}
					onSubmitEditing={handleSubmit}
					returnKeyType="send"
					multiline={false}
					editable={!isProcessing}
					autoFocus={false}
				/>
				<SendButton onPress={handleSubmit} />
			</View>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				{onClose && (
					<TouchableOpacity
						onPress={() => {
							handlePressOutside();
							setInputText('');
							inputRef.current?.blur();
							onClose();
						}}
						style={styles.headerButton}
					>
						<Ionicons
							name="chevron-down"
							size={28}
							color="black"
						/>
					</TouchableOpacity>
				)}
				<View style={styles.headerLogo}>
					<Text style={styles.headerTitle}>kairos</Text>
				</View>
				<TouchableOpacity style={styles.headerButton}>
					<Ionicons
						name="ellipsis-horizontal"
						size={24}
						color="black"
					/>
				</TouchableOpacity>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				style={styles.keyboardAvoidingView}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
			>
				<View style={styles.messagesContainer}>
					<ScrollView
						ref={scrollViewRef}
						contentContainerStyle={styles.messagesContent}
						onContentSizeChange={() =>
							scrollViewRef.current?.scrollToEnd({
								animated: true,
							})
						}
					>
						{messages.map((message, index) => (
							<View
								key={index}
								style={[
									styles.messageBubbleContainer,
									message.isUser
										? styles.userMessageContainer
										: null,
								]}
							>
								{!message.isUser && (
									<LinearGradient
										colors={['#00A0B4', '#0078FF']}
										style={styles.messageBubble}
										start={{ x: 0, y: 0 }}
										end={{ x: 1, y: 0 }}
									>
										<Text style={styles.messageText}>
											{message.text}
										</Text>
									</LinearGradient>
								)}
								{message.isUser && (
									<View
										style={[
											styles.messageBubble,
											styles.userMessage,
										]}
									>
										<Text
											style={[
												styles.messageText,
												styles.userMessageText,
											]}
										>
											{message.text}
										</Text>
									</View>
								)}
							</View>
						))}
						{isProcessing && <TypingIndicator />}
					</ScrollView>
				</View>

				<View style={styles.quickActionsContainer}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
					>
						<QuickAction
							title="Show contacts"
							onPress={() =>
								handleQuickAction('Show all my contacts')
							}
						/>
						<QuickAction
							title="Add contact"
							onPress={() =>
								handleQuickAction('Add a new contact ')
							}
						/>
						<QuickAction
							title="Update contact"
							onPress={() => handleQuickAction('Update contact')}
						/>
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
			{renderInput()}
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
		paddingVertical: 8,
		borderBottomWidth: 1,
		borderBottomColor: '#eee',
	},
	headerButton: {
		padding: 8,
		width: 44,
		alignItems: 'center',
	},
	headerLogo: {
		flex: 1,
		alignItems: 'center',
	},
	headerTitle: {
		fontSize: 20,
		color: '#00A0B4',
		fontWeight: '500',
	},
	keyboardAvoidingView: {
		flex: 1,
	},
	messagesContainer: {
		flex: 1,
	},
	messagesContent: {
		padding: 16,
		flexGrow: 1,
	},
	bottomSection: {
		borderTopWidth: 1,
		borderTopColor: '#eee',
		backgroundColor: '#fff',
	},
	messageBubbleContainer: {
		marginBottom: 16,
		maxWidth: '80%',
	},
	userMessageContainer: {
		alignSelf: 'flex-end',
	},
	messageBubble: {
		padding: 12,
		borderRadius: 20,
		borderBottomLeftRadius: 4,
	},
	userMessage: {
		backgroundColor: '#f0f0f0',
		borderBottomLeftRadius: 20,
		borderBottomRightRadius: 4,
	},
	messageText: {
		color: '#fff',
		fontSize: 16,
	},
	userMessageText: {
		color: '#000',
	},
	typingIndicatorContainer: {
		marginBottom: 16,
		alignSelf: 'flex-start',
	},
	typingBubble: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 6,
		backgroundColor: '#f0f0f0',
		borderRadius: 12,
	},
	dotsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		height: 16,
		gap: 3,
	},
	dot: {
		width: 6,
		height: 6,
		borderRadius: 3,
		backgroundColor: '#666',
	},
	quickActionsContainer: {
		paddingHorizontal: 16,
		paddingVertical: 24,
	},
	quickAction: {
		backgroundColor: '#f8f8f8',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 20,
		marginRight: 8,
	},
	quickActionText: {
		color: '#000',
		fontSize: 16,
	},
	inputContainer: {
		paddingHorizontal: 8,
		paddingVertical: 12,
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	bottomBarInput: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#f8f8f8',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderRadius: 20,
		width: '100%',
	},
	bottomBarInputText: {
		flex: 1,
		color: '#333',
		fontSize: 16,
		minHeight: 24,
	},
	sendButton: {
		width: 30,
		height: 30,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 8,
	},
	chatModal: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalTranslateY: {
		translateY: 0,
	},
	modalOpacity: {
		opacity: 1,
	},
	modalHeight: {
		height: '100%',
	},
});
