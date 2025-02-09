import FontAwesome from '@expo/vector-icons/FontAwesome';
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider as NavigationThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthGuard } from '@/components/AuthGuard';

export {
	// Catch any errors thrown by the Layout component.
	ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AuthenticatedLayout() {
	const colorScheme = useColorScheme();

	return (
		<ThemeProvider>
			<NavigationThemeProvider
				value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
			>
				<NotificationProvider>
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
					<StatusBar
						style={colorScheme === 'dark' ? 'light' : 'dark'}
					/>
				</NotificationProvider>
			</NavigationThemeProvider>
		</ThemeProvider>
	);
}

export default function RootLayout() {
	const [loaded, error] = useFonts({
		SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
		...FontAwesome.font,
	});

	// Expo Router uses Error Boundaries to catch errors in the navigation tree.
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
		<UserProvider>
			<AuthGuard>
				<AuthenticatedLayout />
			</AuthGuard>
		</UserProvider>
	);
}
