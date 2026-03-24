import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthListener } from './hooks/useAuth';

import { useStore } from './store/useStore';

// Layouts & Guards
import { AppLayout } from './layouts/AppLayout';
import { LoginLayout } from './layouts/LoginLayout';
import { AuthGuard, AuthRedirectGuard } from './components/auth/AuthGuard';

// Pages
import { LoginPage } from './pages/LoginPage';
import { MetricsPage } from './pages/MetricsPage';
import { DietPage } from './pages/DietPage';
import { InventoryPage } from './pages/InventoryPage';
import { ExercisePage } from './pages/ExercisePage';

import './App.css';

export default function App() {
	const { setTheme } = useStore();
	const basename = import.meta.env.PROD ? '/fit-app' : undefined;

	useAuthListener();

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const handleChange = (e: MediaQueryListEvent) => {
			if (localStorage.getItem('theme-preference') === null) {
				setTheme(e.matches);
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, [setTheme]);

	return (
		<BrowserRouter basename={basename}>
			<Routes>
				<Route element={<LoginLayout />}>
					<Route
						path="/login"
						element={
							<AuthRedirectGuard>
								<LoginPage />
							</AuthRedirectGuard>
						}
					/>
				</Route>
				<Route
					element={
						<AuthGuard>
							<AppLayout />
						</AuthGuard>
					}
				>
					<Route path="/" element={<Navigate to="/metrics" replace />} />
					<Route path="/metrics" element={<MetricsPage />} />
					<Route path="/diet" element={<DietPage />} />
					<Route path="/inventory" element={<InventoryPage />} />
					<Route path="/exercise" element={<ExercisePage />} />
				</Route>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}
