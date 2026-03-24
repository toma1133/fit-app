export interface ThemeStyles {
	bg: string; card: string; cardHover: string;
	textMain: string; textMuted: string; textLabel: string;
	input: string; listItem: string;
	header: string; nav: string; chartGrid: string; chartText: string;
	primaryBtn: string; secondaryBtn: string;
	accentBlue: string; accentEmerald: string;
}

export const getThemeStyles = (isDarkMode: boolean): ThemeStyles => ({
	bg: isDarkMode ? 'bg-slate-950' : 'bg-slate-50',
	card: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200',
	cardHover: isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50',
	textMain: isDarkMode ? 'text-slate-100' : 'text-slate-900',
	textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
	textLabel: isDarkMode ? 'text-slate-500' : 'text-slate-400',
	input: isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600',
	listItem: isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-slate-100 shadow-sm',
	header: isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/90 border-slate-200',
	nav: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm',
	chartGrid: isDarkMode ? '#1e293b' : '#f1f5f9',
	chartText: isDarkMode ? '#64748b' : '#94a3b8',
	primaryBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
	secondaryBtn: isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
	accentBlue: isDarkMode ? 'text-blue-400' : 'text-blue-600',
	accentEmerald: isDarkMode ? 'text-emerald-400' : 'text-emerald-600',
});
