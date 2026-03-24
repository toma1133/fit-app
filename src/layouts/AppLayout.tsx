import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Activity, Utensils, ShoppingCart, Dumbbell, Moon, Sun, LogOut } from 'lucide-react';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';
import { getThemeStyles } from '../utils/theme';

export const AppLayout: React.FC = () => {
	const { isDarkMode, toggleTheme } = useStore();
	const theme = getThemeStyles(isDarkMode);
	const location = useLocation();
	const navigate = useNavigate();

	const handleLogout = async () => {
		await signOut(auth);
		navigate('/login');
	};

	const navItems = [
		{ id: 'metrics', path: '/metrics', icon: Activity, label: '概覽' },
		{ id: 'diet', path: '/diet', icon: Utensils, label: '營養' },
		{ id: 'inventory', path: '/inventory', icon: ShoppingCart, label: '管理' },
		{ id: 'exercise', path: '/exercise', icon: Dumbbell, label: '活動' },
	];

	return (
		<div className={`min-h-screen font-sans transition-colors duration-200 pb-24 md:pb-8 ${theme.bg}`}>
			<header className={`sticky top-0 z-30 backdrop-blur-xl border-b ${theme.header} transition-colors duration-200`}>
				<div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className={`text-lg font-bold tracking-tight ${theme.textMain} flex items-center gap-4`}>
							<div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center mr-2.5 text-white shadow-sm">
								<Activity size={16} strokeWidth={3} />
							</div>
							FitPro Tracking
						</div>

						<div className="flex items-center gap-3">
							<nav className="hidden md:flex space-x-1 mr-4">
								{navItems.map((item) => {
									const isActive = location.pathname.includes(item.path);
									return (
										<Link
											key={item.id}
											to={item.path}
											className={`flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : `${theme.textMuted} hover:bg-slate-100 dark:hover:bg-slate-800 hover:${theme.textMain}`}`}
										>
											{item.label}
										</Link>
									);
								})}
							</nav>

							<div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
								<button
									onClick={toggleTheme}
									className={`p-2 rounded-lg transition-colors ${theme.secondaryBtn}`}
									title="切換主題"
								>
									{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
								</button>
								<button
									onClick={handleLogout}
									className={`p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}
									title="登出"
								>
									<LogOut size={18} />
								</button>
							</div>
						</div>
					</div>
				</div>
			</header>

			<main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
				<Outlet />
			</main>

			<div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
				<nav
					className={`flex justify-around items-center p-1.5 rounded-2xl backdrop-blur-xl border shadow-lg ${theme.nav}`}
				>
					{navItems.map((item) => {
						const isActive = location.pathname.includes(item.path);
						return (
							<Link
								key={item.id}
								to={item.path}
								className={`flex flex-col items-center justify-center w-full py-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-transparent'}`}
							>
								<div
									className={`transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : theme.textMuted}`}
								>
									<item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
								</div>
								<span
									className={`text-[10px] font-semibold mt-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : theme.textMuted}`}
								>
									{item.label}
								</span>
							</Link>
						);
					})}
				</nav>
			</div>
		</div>
	);
};
