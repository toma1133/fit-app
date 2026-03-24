import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Activity, Mail, Lock } from 'lucide-react';
import { auth } from '../config/firebase';
import { useStore } from '../store/useStore';
import { getThemeStyles } from '../utils/theme';

export const LoginPage: React.FC = () => {
	const [isLogin, setIsLogin] = useState<boolean>(true);
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [error, setError] = useState<string>('');
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError('');
		try {
			if (isLogin) {
				await signInWithEmailAndPassword(auth, email, password);
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
			}
		} catch (err: any) {
			setError(err.message.replace('Firebase: ', ''));
		}
	};

	return (
		<div
			className={`w-full max-w-md ${theme.card} p-8 rounded-3xl shadow-xl border animate-in zoom-in-95 duration-300`}
		>
			<div className="flex flex-col items-center mb-8">
				<div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4 text-white shadow-lg">
					<Activity size={24} strokeWidth={3} />
				</div>
				<h2 className={`text-2xl font-bold tracking-tight ${theme.textMain}`}>
					{isLogin ? '登入您的帳號' : '建立新帳號'}
				</h2>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-4">
				{error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium">{error}</div>}

				<div className="space-y-1.5">
					<label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>Email 信箱</label>
					<div className="relative">
						<Mail className="absolute left-3 top-3 text-slate-400" size={18} />
						<input
							type="email"
							title="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${theme.input}`}
							required
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<label className={`text-xs font-bold uppercase tracking-wider ${theme.textMuted}`}>密碼</label>
					<div className="relative">
						<Lock className="absolute left-3 top-3 text-slate-400" size={18} />
						<input
							type="password"
							title="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${theme.input}`}
							required
							minLength={6}
						/>
					</div>
				</div>

				<button type="submit" className={`w-full py-3 rounded-xl font-bold transition-all ${theme.primaryBtn} mt-2`}>
					{isLogin ? '登入' : '註冊'}
				</button>
			</form>

			<div className="mt-8 text-center">
				<button
					type="button"
					onClick={() => setIsLogin(!isLogin)}
					className={`text-sm font-medium hover:underline ${theme.textMuted} hover:text-blue-500 transition-colors`}
				>
					{isLogin ? '還沒有帳號嗎？點此註冊' : '已經有帳號了？點此登入'}
				</button>
			</div>
		</div>
	);
};
