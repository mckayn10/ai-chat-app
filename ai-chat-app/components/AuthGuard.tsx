import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useUser } from '@/contexts/UserContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
	const segments = useSegments();
	const router = useRouter();
	const { user, isLoading } = useUser();

	useEffect(() => {
		if (isLoading) return;

		const inAuthGroup = segments[0] === '(auth)';

		if (!user && !inAuthGroup) {
			// Redirect to the login page if there's no user
			router.replace('/login');
		} else if (user && inAuthGroup) {
			// Redirect to the home page if there's a user and we're in the auth group
			router.replace('/(tabs)');
		}
	}, [user, segments, isLoading]);

	return <>{children}</>;
}
