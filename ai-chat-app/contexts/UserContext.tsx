import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '@/tools/authService';

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	createdAt: string;
	updatedAt: string;
}

interface UserContextType {
	user: User | null;
	setUser: (user: User | null) => void;
	loadUser: () => Promise<void>;
	signOut: () => Promise<void>;
	isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const loadUser = async () => {
		try {
			console.log('Loading user...');
			const token = await AsyncStorage.getItem('token');
			console.log('Token from storage:', token);

			if (!token) {
				console.log('No token found, setting user to null');
				setUser(null);
				return;
			}

			const currentUser = await authService.getCurrentUser(token);
			console.log('Loaded user from API:', currentUser);
			setUser(currentUser);
		} catch (error) {
			console.error('Error loading user:', error);
			await AsyncStorage.multiRemove(['token', 'user']);
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	const signOut = async () => {
		console.log('Signing out...');
		await AsyncStorage.multiRemove(['token', 'user']);
		setUser(null);
	};

	useEffect(() => {
		loadUser();
	}, []);

	useEffect(() => {
		console.log('User state changed:', user);
	}, [user]);

	return (
		<UserContext.Provider
			value={{ user, setUser, loadUser, signOut, isLoading }}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
}
