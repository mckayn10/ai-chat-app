import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

interface Theme {
	colors: {
		primary: string;
		background: string;
		card: string;
		text: string;
		textSecondary: string;
	};
}

const lightTheme: Theme = {
	colors: {
		primary: '#007AFF',
		background: '#FFFFFF',
		card: '#F8F8F8',
		text: '#000000',
		textSecondary: '#666666',
	},
};

const darkTheme: Theme = {
	colors: {
		primary: '#0A84FF',
		background: '#000000',
		card: '#1C1C1E',
		text: '#FFFFFF',
		textSecondary: '#8E8E93',
	},
};

const ThemeContext = createContext<{ theme: Theme }>({ theme: lightTheme });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const colorScheme = useColorScheme();
	const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

	return (
		<ThemeContext.Provider value={{ theme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	return useContext(ThemeContext);
}
