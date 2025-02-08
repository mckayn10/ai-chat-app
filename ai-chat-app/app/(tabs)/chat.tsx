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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const QuickAction = ({ title }: { title: string }) => (
	<TouchableOpacity style={styles.quickAction}>
		<Text style={styles.quickActionText}>{title}</Text>
	</TouchableOpacity>
);

interface ChatScreenProps {
	onClose?: () => void;
}

export default function ChatScreen({ onClose }: ChatScreenProps) {
	const [messages, setMessages] = useState<
		Array<{ text: string; isUser: boolean }>
	>([]);
	const [inputText, setInputText] = useState('');
	const scrollViewRef = useRef<ScrollView>(null);

	useEffect(() => {
		// Initial welcome message
		setMessages([
			{
				text: 'Hi, Kairos here. Happy to help!',
				isUser: false,
			},
		]);
	}, []);

	const sendMessage = useCallback(() => {
		if (!inputText.trim()) return;

		const newMessages = [...messages, { text: inputText, isUser: true }];
		setMessages(newMessages);
		setInputText('');

		// Simulate AI response
		setTimeout(() => {
			setMessages((prev) => [
				...prev,
				{
					text: "I received your message and I'm processing it.",
					isUser: false,
				},
			]);
		}, 1000);
	}, [inputText, messages]);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={onClose}
					style={styles.headerButton}
				>
					<Ionicons
						name="chevron-down"
						size={28}
						color="black"
					/>
				</TouchableOpacity>
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
				style={styles.content}
				keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
			>
				<ScrollView
					ref={scrollViewRef}
					style={styles.messagesContainer}
					contentContainerStyle={styles.messagesContent}
					onContentSizeChange={() =>
						scrollViewRef.current?.scrollToEnd({ animated: true })
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
				</ScrollView>

				<View style={styles.quickActionsContainer}>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
					>
						<QuickAction title="How are you?" />
						<QuickAction title="Tell me a joke" />
						<QuickAction title="Start my day" />
					</ScrollView>
				</View>

				<View style={styles.inputContainer}>
					<TextInput
						style={styles.input}
						placeholder="Ask me something"
						placeholderTextColor="#999"
						value={inputText}
						onChangeText={setInputText}
						onSubmitEditing={sendMessage}
						returnKeyType="send"
						multiline={false}
					/>
					<TouchableOpacity style={styles.micButton}>
						<Ionicons
							name="mic"
							size={24}
							color="#666"
						/>
					</TouchableOpacity>
				</View>
			</KeyboardAvoidingView>
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
	content: {
		flex: 1,
	},
	messagesContainer: {
		flex: 1,
	},
	messagesContent: {
		padding: 16,
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
	quickActionsContainer: {
		paddingHorizontal: 16,
		paddingVertical: 12,
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
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderTopWidth: 1,
		borderTopColor: '#eee',
	},
	input: {
		flex: 1,
		backgroundColor: '#f8f8f8',
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 8,
		fontSize: 16,
		marginRight: 8,
	},
	micButton: {
		padding: 8,
	},
});
