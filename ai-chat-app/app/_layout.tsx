import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { UserProvider, useUser } from '@/contexts/UserContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
	const segments = useSegments();
	const router = useRouter();
	const { user, isLoading } = useUser();

	useEffect(() => {
		if (isLoading) return;

		if (!user && segments[0] !== 'login') {
			// Redirect to the login page if there's no user
			router.replace('/login');
		} else if (user && segments[0] === 'login') {
			// Redirect to the home page if there's a user and we're on the login page
			router.replace('/(tabs)');
		}
	}, [user, segments, isLoading]);

	return (
		<Stack>
			<Stack.Screen
				name="(tabs)"
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="login"
				options={{ headerShown: false }}
			/>
			<Stack.Screen
				name="settings"
				options={{
					headerShown: false,
					presentation: 'modal',
				}}
			/>
			<Stack.Screen name="+not-found" />
		</Stack>
	);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
	});
	const colorScheme = useColorScheme();

	useEffect(() => {
		if (error) throw error;
	}, [error]);

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
		<ThemeProvider
			value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
		>
			<UserProvider>
				<RootLayoutNav />
			</UserProvider>
			<StatusBar style="auto" />
		</ThemeProvider>
	);
}
