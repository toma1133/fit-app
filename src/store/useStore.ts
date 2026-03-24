import { create } from 'zustand';
import type { User } from 'firebase/auth';

const getInitialTheme = (): boolean => {
	if (typeof window !== 'undefined') {
		const savedTheme = localStorage.getItem('theme-preference');
		if (savedTheme !== null) {
			return savedTheme === 'dark';
		}
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}
	return false;
};

export interface AppState {
	user: User | null;
	isLoading: boolean;
	isDarkMode: boolean;
	setUser: (user: User | null) => void;
	setLoading: (isLoading: boolean) => void;
	toggleTheme: () => void;
	setTheme: (isDark: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
	user: null,
	isLoading: true,
	isDarkMode: getInitialTheme(),
	setUser: (user: User | null) => set({ user }),
	setLoading: (isLoading: boolean) => set({ isLoading }),
	toggleTheme: () => set((state) => {
		const newTheme = !state.isDarkMode;
		localStorage.setItem('theme-preference', newTheme ? 'dark' : 'light');
		return { isDarkMode: newTheme };
	}),

	setTheme: (isDark) => set(() => {
		return { isDarkMode: isDark };
	}),
}));
