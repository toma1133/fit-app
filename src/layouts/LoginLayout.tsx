import React from 'react';
import { Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getThemeStyles } from '../utils/theme';

export const LoginLayout: React.FC = () => {
	const { isDarkMode, toggleTheme } = useStore();
	const theme = getThemeStyles(isDarkMode);

	return (
		<div
			className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-200 ${theme.bg}`}
		>
			<div className="absolute top-4 right-4">
				<button
					type="button"
					onClick={toggleTheme}
					className={`p-2.5 rounded-xl transition-colors ${theme.secondaryBtn}`}
				>
					{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
				</button>
			</div>
			<Outlet />
		</div>
	);
};
