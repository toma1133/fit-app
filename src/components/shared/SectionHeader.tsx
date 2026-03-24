import React from 'react';
import { CalendarDays, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getThemeStyles } from '../../utils/theme';

interface SectionHeaderProps {
	title: string;
	viewDate?: string;
	setViewDate?: (date: string) => void;
	actionBtn?: { label: string; icon?: LucideIcon; onClick: () => void };
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, viewDate, setViewDate, actionBtn }) => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	return (
		<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
			<h2 className={`text-xl font-bold tracking-tight ${theme.textMain}`}>{title}</h2>
			<div className="flex items-center gap-3 w-full sm:w-auto">
				{viewDate && setViewDate && (
					<div className={`flex items-center px-3 py-2 rounded-lg border ${theme.card} shadow-sm w-full sm:w-auto`}>
						<CalendarDays size={16} className={`mr-2 ${theme.textMuted}`} />
						<input
							type="date"
							title="Date"
							value={viewDate}
							onChange={(e) => setViewDate(e.target.value)}
							className={`bg-transparent outline-none text-sm font-medium ${theme.textMain} [color-scheme:light] dark:[color-scheme:dark] flex-1`}
						/>
					</div>
				)}
				{actionBtn && (
					<button
						type="button"
						onClick={actionBtn.onClick}
						className={`${theme.primaryBtn} px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center whitespace-nowrap w-full sm:w-auto transition-colors`}
					>
						{actionBtn.icon && <actionBtn.icon size={16} className="mr-2" />} {actionBtn.label}
					</button>
				)}
			</div>
		</div>
	);
};
