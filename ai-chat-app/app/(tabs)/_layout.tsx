import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
	name: React.ComponentProps<typeof Ionicons>['name'];
	color: string;
}) {
	return (
		<Ionicons
			size={24}
			style={{ marginBottom: -3 }}
			{...props}
		/>
	);
}

export default function TabLayout() {
	const colorScheme = useColorScheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
				headerShown: false,
				tabBarButton: HapticTab,
				tabBarBackground: TabBarBackground,
				tabBarStyle: {
					height: 80,
					paddingBottom: 20,
					backgroundColor: '#fff',
					borderTopWidth: 1,
					borderTopColor: '#e0e0e0',
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color }) => (
						<TabBarIcon
							name="home-outline"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="explore"
				options={{
					title: 'Explore',
					tabBarIcon: ({ color }) => (
						<TabBarIcon
							name="compass-outline"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="notifications"
				options={{
					title: 'Notifications',
					tabBarIcon: ({ color }) => (
						<TabBarIcon
							name="notifications-outline"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color }) => (
						<TabBarIcon
							name="settings-outline"
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
