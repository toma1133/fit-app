import React from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getThemeStyles } from '../../utils/theme';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	icon?: LucideIcon;
	children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon: Icon, children }) => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	if (!isOpen) return null;
	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
		>
			<div
				className={`w-full max-w-md ${theme.card} border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col`}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					className={`flex items-center justify-between p-5 border-b shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}
				>
					<h3 className={`text-[17px] font-semibold flex items-center tracking-tight ${theme.textMain}`}>
						{Icon && <Icon className={`mr-2 ${theme.textMuted}`} size={18} strokeWidth={2} />}
						{title}
					</h3>
					<button
						type="button"
						title="Close"
						onClick={onClose}
						className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${theme.textMuted}`}
					>
						<X size={20} />
					</button>
				</div>
				<div className="p-5 overflow-y-auto custom-scrollbar">{children}</div>
			</div>
		</div>
	);
};
