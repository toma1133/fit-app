import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getThemeStyles } from '../../utils/theme';

interface GuardProps {
	children: React.ReactNode;
}

export const AuthGuard: React.FC<GuardProps> = ({ children }) => {
	const { user, isLoading, isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	if (isLoading) {
		return (
			<div className={`min-h-screen flex items-center justify-center ${theme.bg} ${theme.textMuted} font-medium`}>
				驗證身分中...
			</div>
		);
	}
	if (!user) {
		return <Navigate to="/login" replace />;
	}
	return <>{children}</>;
};

export const AuthRedirectGuard: React.FC<GuardProps> = ({ children }) => {
	const { user, isLoading } = useStore();
	if (isLoading) return null;
	if (user) return <Navigate to="/" replace />;
	return <>{children}</>;
};
