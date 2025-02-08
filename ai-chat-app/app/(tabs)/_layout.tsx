import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
						<IconSymbol
							size={28}
							name="house.fill"
							color={color}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="chat"
				options={{
					title: 'Chat',
					tabBarIcon: ({ color }) => (
						<IconSymbol
							size={28}
							name="message.fill"
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
						<IconSymbol
							size={28}
							name="paperplane.fill"
							color={color}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
