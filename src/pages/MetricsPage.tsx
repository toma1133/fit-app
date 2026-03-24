import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Edit2, Plus, Trash2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useFirestore } from '../hooks/useFirestore';
import { SectionHeader } from '../components/shared/SectionHeader';
import { Modal } from '../components/shared/Modal';
import { getThemeStyles } from '../utils/theme';
import { getTodayString } from '../utils/helpers';
import type { MetricData } from '../types';

export const MetricsPage: React.FC = () => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	const { data: metricsData, addOrUpdateDoc, removeDoc } = useFirestore<MetricData>('metrics');
	const metrics = [...metricsData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [metricDate, setMetricDate] = useState(getTodayString());
	const [weightInput, setWeightInput] = useState('');
	const [bodyFatInput, setBodyFatInput] = useState('');

	const handleSave = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!weightInput) return;
		await addOrUpdateDoc(metricDate, {
			date: metricDate,
			weight: parseFloat(weightInput),
			bodyFat: bodyFatInput ? parseFloat(bodyFatInput) : null,
			timestamp: Date.now(),
		});
		setWeightInput('');
		setBodyFatInput('');
		setIsModalOpen(false);
	};

	const openAddModal = () => {
		setMetricDate(getTodayString());
		setWeightInput('');
		setBodyFatInput('');
		setIsModalOpen(true);
	};

	const openEditModal = (metric: MetricData) => {
		setMetricDate(metric.date);
		setWeightInput(metric.weight.toString());
		setBodyFatInput(metric.bodyFat !== null ? metric.bodyFat.toString() : '');
		setIsModalOpen(true);
	};

	return (
		<div className="flex flex-col gap-6 animate-in fade-in duration-500">
			<SectionHeader title="體態概覽" actionBtn={{ label: '記錄體態', icon: Plus, onClick: openAddModal }} />

			{/* 圖表區塊 */}
			<div className={`${theme.card} p-6 rounded-2xl shadow-sm border`}>
				<div className="flex items-center justify-between mb-6">
					<h3 className={`text-base font-semibold ${theme.textMain} flex items-center`}>
						<Activity size={18} className={`mr-2 ${theme.textMuted}`} /> 體態趨勢分析
					</h3>
				</div>
				{metrics.length > 0 ? (
					<div className="h-80 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={metrics} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.chartGrid} />
								<XAxis
									dataKey="date"
									tick={{ fontSize: 11, fill: theme.chartText }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									yAxisId="left"
									domain={['auto', 'auto']}
									tick={{ fontSize: 11, fill: theme.chartText }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									domain={['auto', 'auto']}
									tick={{ fontSize: 11, fill: theme.chartText }}
									axisLine={false}
									tickLine={false}
								/>
								<Tooltip
									contentStyle={{
										borderRadius: '8px',
										border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
										backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
										color: isDarkMode ? '#f8fafc' : '#0f172a',
										fontSize: '13px',
									}}
									itemStyle={{ fontWeight: '600' }}
								/>
								<Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="weight"
									name="體重 (kg)"
									stroke="#2563eb"
									strokeWidth={3}
									dot={{ r: 4, strokeWidth: 2 }}
									activeDot={{ r: 6, strokeWidth: 0 }}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="bodyFat"
									name="體脂 (%)"
									stroke="#64748b"
									strokeWidth={3}
									strokeDasharray="5 5"
									dot={{ r: 4, strokeWidth: 2 }}
									activeDot={{ r: 6, strokeWidth: 0 }}
									connectNulls
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				) : (
					<div
						className={`text-center ${theme.textMuted} py-16 flex flex-col items-center justify-center border-2 border-dashed ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} rounded-xl`}
					>
						<TrendingUp size={32} className="mb-3 opacity-20" />
						<p className="text-sm">尚無資料可供分析，請先新增記錄。</p>
					</div>
				)}
			</div>

			{/* 歷史記錄明細區塊 (新增修改與刪除功能) */}
			<div className={`${theme.card} p-0 rounded-2xl shadow-sm border overflow-hidden flex flex-col`}>
				<div
					className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}
				>
					<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
						<Activity size={16} className={`mr-2 ${theme.textMuted}`} /> 歷史記錄明細
					</h2>
				</div>
				<div className="p-4 flex flex-col gap-2">
					{metrics
						.slice()
						.reverse()
						.map((metric) => (
							<div
								key={metric.id}
								className={`flex items-center justify-between p-3 rounded-lg border ${theme.listItem} transition-colors ${theme.cardHover}`}
							>
								<div>
									<div className={`text-sm font-medium ${theme.textMain}`}>{metric.date}</div>
									<div className={`text-[12px] ${theme.textMuted} mt-1 font-mono flex flex-wrap gap-2`}>
										<span className={`font-semibold ${theme.accentBlue}`}>{metric.weight} kg</span>
										{metric.bodyFat !== null && (
											<>
												<span className="opacity-50">|</span>
												<span>體脂: {metric.bodyFat}%</span>
											</>
										)}
									</div>
								</div>
								<div className="flex items-center gap-1">
									<button
										type="button"
										title="edit"
										onClick={() => openEditModal(metric)}
										className={`text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
									>
										<Edit2 size={16} />
									</button>
									<button
										type="button"
										title="delete"
										onClick={() => removeDoc(metric.id)}
										className={`text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						))}
					{metrics.length === 0 && <div className={`text-center ${theme.textMuted} py-10 text-sm`}>尚無歷史記錄</div>}
				</div>
			</div>

			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="記錄體態指標" icon={Activity}>
				<form onSubmit={handleSave} className="flex flex-col gap-4">
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							日期
						</label>
						<input
							type="date"
							title="date"
							value={metricDate}
							onChange={(e) => setMetricDate(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						/>
					</div>
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							體重 (kg)
						</label>
						<input
							type="number"
							title="weight"
							step="0.1"
							value={weightInput}
							onChange={(e) => setWeightInput(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						/>
					</div>
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							體脂 (%)
						</label>
						<input
							type="number"
							title="bodyFat"
							step="0.1"
							value={bodyFatInput}
							onChange={(e) => setBodyFatInput(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
						/>
					</div>
					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-6 ${theme.primaryBtn}`}>
						儲存記錄
					</button>
				</form>
			</Modal>
		</div>
	);
};
