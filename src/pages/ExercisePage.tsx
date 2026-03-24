import React, { useState, useMemo } from 'react';
import { Dumbbell, Plus, Trash2, Check, Settings, Edit2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from '../store/useStore';
import { useFirestore } from '../hooks/useFirestore';
import { getThemeStyles } from '../utils/theme';
import { getTodayString, generateId } from '../utils/helpers';
import { SectionHeader } from '../components/shared/SectionHeader';
import { Modal } from '../components/shared/Modal';
import type { ExerciseLog, CustomExercise } from '../types';

export const ExercisePage: React.FC = () => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	const [viewDate, setViewDate] = useState(getTodayString());

	const {
		data: exercises,
		addOrUpdateDoc: addExercise,
		removeDoc: removeExercise,
	} = useFirestore<ExerciseLog>('exercises');
	const {
		data: customExercises,
		addOrUpdateDoc: updateCustomEx,
		removeDoc: removeCustomEx,
	} = useFirestore<CustomExercise>('custom_exercises');

	const [modals, setModals] = useState({ exerciseLog: false, customEx: false });
	const toggleModal = (k: string, v: boolean) => setModals((p) => ({ ...p, [k]: v }));

	const [selectedExId, setSelectedExId] = useState('');
	const [exDuration, setExDuration] = useState('');
	const [editingExId, setEditingExId] = useState<string | null>(null);
	const [customExName, setCustomExName] = useState('');
	const [customExCal, setCustomExCal] = useState(0);

	const viewDateExercises = useMemo(() => exercises.filter((e) => e.date === viewDate), [exercises, viewDate]);
	const totalBurned = useMemo(
		() => viewDateExercises.reduce((acc, curr) => acc + (curr.caloriesBurned || 0), 0),
		[viewDateExercises],
	);

	const exerciseChartData = useMemo(() => {
		const grouped: Record<string, number> = {};
		exercises.forEach((ex) => {
			if (!grouped[ex.date]) grouped[ex.date] = 0;
			grouped[ex.date] += ex.caloriesBurned;
		});
		return Object.keys(grouped)
			.sort()
			.map((date) => ({ date, calories: grouped[date] }));
	}, [exercises]);

	const handleAddExerciseLog = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!selectedExId || !exDuration) return;
		const exRef = customExercises.find((ex) => ex.id === selectedExId);
		if (!exRef) return;
		await addExercise(generateId(), {
			date: viewDate,
			name: exRef.name,
			duration: parseFloat(exDuration),
			caloriesBurned: Math.round(exRef.caloriesPerMinute * parseFloat(exDuration)),
			timestamp: Date.now(),
		});
		setSelectedExId('');
		setExDuration('');
		toggleModal('exerciseLog', false);
	};

	const handleAddOrUpdateCustomExercise = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!customExName || !customExCal) return;
		const id = editingExId || `custom_${generateId()}`;
		await updateCustomEx(id, {
			name: customExName,
			caloriesPerMinute: customExCal,
			timestamp: Date.now(),
		});
		setCustomExName('');
		setCustomExCal(0);
		setEditingExId(null);
	};

	return (
		<div className="flex flex-col gap-6 animate-in fade-in duration-500">
			<SectionHeader title="活動分析" viewDate={viewDate} setViewDate={setViewDate} />

			<div className="flex flex-wrap gap-3 mb-6">
				<button
					type="button"
					onClick={() => toggleModal('exerciseLog', true)}
					className={`${theme.secondaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700`}
				>
					<Plus size={16} className="mr-2 opacity-70" /> 記錄今日運動
				</button>
				<button
					type="button"
					onClick={() => toggleModal('customEx', true)}
					className={`${theme.secondaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700`}
				>
					<Settings size={16} className="mr-2 opacity-70" /> 管理運動項目
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div
					className={`lg:col-span-1 p-6 rounded-2xl shadow-sm border flex flex-col justify-center ${isDarkMode ? 'bg-blue-900/20 border-blue-900/50' : 'bg-blue-50 border-blue-100'}`}
				>
					<h2
						className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
					>
						今日消耗指標
					</h2>
					<div className="flex items-baseline gap-2 mt-2">
						<span className={`text-5xl font-black tracking-tighter ${theme.textMain}`}>{totalBurned}</span>
						<span className={`text-sm font-medium ${theme.textMuted}`}>kcal</span>
					</div>
				</div>

				<div className={`lg:col-span-2 ${theme.card} p-6 rounded-2xl shadow-sm border`}>
					<h2 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${theme.textLabel}`}>歷史消耗趨勢</h2>
					{exerciseChartData.length > 0 ? (
						<div className="h-32 w-full">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={exerciseChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
									<XAxis
										dataKey="date"
										tick={{ fontSize: 10, fill: theme.chartText }}
										axisLine={false}
										tickLine={false}
									/>
									<YAxis tick={{ fontSize: 10, fill: theme.chartText }} axisLine={false} tickLine={false} />
									<Tooltip
										cursor={{ fill: theme.chartGrid, opacity: 0.5 }}
										contentStyle={{
											borderRadius: '8px',
											border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
											backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
											color: isDarkMode ? '#f8fafc' : '#0f172a',
											fontSize: '12px',
										}}
									/>
									<Bar dataKey="calories" name="燃燒熱量 (kcal)" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={32} />
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div
							className={`text-center ${theme.textMuted} text-sm py-10 border-2 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} rounded-xl`}
						>
							無足夠資料
						</div>
					)}
				</div>
			</div>

			<div className={`${theme.card} p-0 rounded-2xl shadow-sm border overflow-hidden flex flex-col`}>
				<div
					className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}
				>
					<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
						<Dumbbell size={16} className={`mr-2 ${theme.textMuted}`} /> 運動日誌明細
					</h2>
				</div>
				<div className="p-4 flex flex-col gap-2">
					{viewDateExercises.map((ex) => (
						<div
							key={ex.id}
							className={`flex items-center justify-between p-3 rounded-lg border ${theme.listItem} transition-colors ${theme.cardHover}`}
						>
							<div>
								<div className={`text-sm font-medium ${theme.textMain}`}>{ex.name}</div>
								<div className={`text-[11px] ${theme.textMuted} mt-0.5`}>持續 {ex.duration} 分鐘</div>
							</div>
							<div className="flex items-center gap-4">
								<span className={`font-mono font-semibold ${theme.textMain}`}>
									{ex.caloriesBurned} <span className={`text-[10px] font-normal ${theme.textMuted}`}>kcal</span>
								</span>
								<button
									type="button"
									title="removeExercise"
									onClick={() => removeExercise(ex.id)}
									className={`p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors ${theme.textMuted}`}
								>
									<Trash2 size={16} />
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			<Modal
				isOpen={modals.exerciseLog}
				onClose={() => toggleModal('exerciseLog', false)}
				title="活動紀錄"
				icon={Dumbbell}
			>
				<form onSubmit={handleAddExerciseLog} className="flex flex-col gap-5">
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							運動類型
						</label>
						<select
							title="selectedExId"
							value={selectedExId}
							onChange={(e) => setSelectedExId(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						>
							<option value="" disabled>
								請選擇...
							</option>
							{customExercises.map((ex) => (
								<option key={ex.id} value={ex.id}>
									{ex.name} (~{ex.caloriesPerMinute} kcal/分)
								</option>
							))}
						</select>
					</div>
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							持續時間 (分鐘)
						</label>
						<input
							type="number"
							placeholder="例: 45"
							value={exDuration}
							onChange={(e) => setExDuration(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						/>
					</div>
					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-4 ${theme.primaryBtn}`}>
						送出紀錄
					</button>
				</form>
			</Modal>

			<Modal
				isOpen={modals.customEx}
				onClose={() => toggleModal('customEx', false)}
				title="管理活動項目"
				icon={Settings}
			>
				<div className="flex flex-col gap-6">
					<form onSubmit={handleAddOrUpdateCustomExercise} className="flex gap-2">
						<input
							type="text"
							placeholder="項目名稱"
							value={customExName}
							onChange={(e) => setCustomExName(e.target.value)}
							className={`w-full p-2.5 border rounded-lg text-sm outline-none ${theme.input}`}
							required
						/>
						<input
							type="number"
							step="0.1"
							placeholder="kcal/分"
							value={customExCal}
							onChange={(e) => setCustomExCal(parseFloat(e.target.value))}
							className={`w-24 p-2.5 border rounded-lg text-sm outline-none ${theme.input}`}
							required
						/>
						<button
							type="submit"
							className={`${editingExId ? 'bg-amber-600 hover:bg-amber-700' : theme.primaryBtn} text-white p-2.5 rounded-lg flex items-center justify-center shrink-0`}
						>
							{editingExId ? <Check size={18} /> : <Plus size={18} />}
						</button>
					</form>

					<div>
						<div className="max-h-60 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
							{customExercises.map((ex) => (
								<div
									key={ex.id}
									className={`flex justify-between items-center p-3 rounded-lg border transition-all ${theme.listItem} ${editingExId === ex.id ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-slate-800' : ''}`}
								>
									<div>
										<span className={`font-medium text-sm ${theme.textMain}`}>{ex.name}</span>
										<div className={`text-xs font-mono ${theme.textMuted} mt-0.5`}>{ex.caloriesPerMinute} kcal/分</div>
									</div>
									<div className="flex gap-1">
										<button
											type="button"
											title="editExercise"
											onClick={() => {
												setCustomExName(ex.name);
												setCustomExCal(ex.caloriesPerMinute);
												setEditingExId(ex.id);
											}}
											className={`text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800`}
										>
											<Edit2 size={16} />
										</button>
										<button
											type="button"
											title="removeExercise"
											onClick={() => {
												removeCustomEx(ex.id);
												if (editingExId === ex.id) {
													setEditingExId(null);
													setCustomExName('');
													setCustomExCal(0);
												}
											}}
											className={`text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20`}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</Modal>
		</div>
	);
};
