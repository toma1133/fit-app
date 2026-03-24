import React, { useState, useMemo } from 'react';
import { ShoppingCart, BookOpen, Trash2, Check, Plus, Minus, History } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useFirestore } from '../hooks/useFirestore';
import { getThemeStyles } from '../utils/theme';
import { getTodayString, formatTime, generateId } from '../utils/helpers';
import { SectionHeader } from '../components/shared/SectionHeader';
import { Modal } from '../components/shared/Modal';
import type { InventoryItem, InventoryLog, ShoppingItem } from '../types';

export const InventoryPage: React.FC = () => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	const [viewDate, setViewDate] = useState(getTodayString());

	const {
		data: inventory,
		addOrUpdateDoc: updateInventory,
		removeDoc: removeInventory,
	} = useFirestore<InventoryItem>('inventory');
	const { data: inventoryLogs, addOrUpdateDoc: addLog } = useFirestore<InventoryLog>('inventory_logs');
	const {
		data: shoppingList,
		addOrUpdateDoc: updateShopping,
		removeDoc: removeShopping,
	} = useFirestore<ShoppingItem>('shopping_list');

	const [modals, setModals] = useState({ inventory: false, shopping: false });
	const toggleModal = (k: string, v: boolean) => setModals((p) => ({ ...p, [k]: v }));

	const [invName, setInvName] = useState('');
	const [invQty, setInvQty] = useState('');
	const [invUnit, setInvUnit] = useState('');
	const [shopName, setShopName] = useState('');

	const viewDateShoppingList = useMemo(() => shoppingList.filter((s) => s.date === viewDate), [shoppingList, viewDate]);
	const sortedLogs = useMemo(() => [...inventoryLogs].sort((a, b) => b.timestamp - a.timestamp), [inventoryLogs]);

	const handleAddInventory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!invName) return;
		await updateInventory(generateId(), {
			name: invName,
			quantity: parseFloat(invQty) || 0,
			unit: invUnit || '個',
			timestamp: Date.now(),
		});
		await addLog(generateId(), {
			date: getTodayString(),
			itemName: invName,
			delta: parseFloat(invQty) || 0,
			reason: '手動新增',
			timestamp: Date.now(),
		});
		setInvName('');
		setInvQty('');
		setInvUnit('');
		toggleModal('inventory', false);
	};

	const handleManualInvUpdate = async (item: InventoryItem, delta: number) => {
		const newQty = Math.max(0, item.quantity + delta);
		await updateInventory(item.id, { ...item, quantity: newQty });
		await addLog(generateId(), {
			date: getTodayString(),
			itemName: item.name,
			delta,
			reason: '手動調整',
			timestamp: Date.now(),
		});
	};

	const handleAddShopping = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!shopName) return;
		await updateShopping(generateId(), { name: shopName, isBought: false, date: viewDate, timestamp: Date.now() });
		setShopName('');
		toggleModal('shopping', false);
	};

	return (
		<div className="flex flex-col gap-6 animate-in fade-in duration-500">
			<SectionHeader title="庫存與採購" viewDate={viewDate} setViewDate={setViewDate} />

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className={`${theme.card} p-0 rounded-2xl shadow-sm border flex flex-col min-h-[450px] overflow-hidden`}>
					<div
						className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'} flex justify-between items-center`}
					>
						<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
							<BookOpen size={16} className={`mr-2 ${theme.textMuted}`} /> 現有庫存
						</h2>
						<button
							type="button"
							title="addInv"
							onClick={() => toggleModal('inventory', true)}
							className={`text-xs ${theme.accentBlue} font-medium hover:underline flex items-center`}
						>
							<Plus size={14} className="mr-1" /> 新增庫存
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
						{inventory.map((item) => (
							<div
								key={item.id}
								className={`flex items-center justify-between p-3 rounded-lg border ${theme.listItem} transition-colors ${theme.cardHover}`}
							>
								<span className={`text-sm font-medium ${theme.textMain}`}>{item.name}</span>
								<div className="flex items-center gap-2">
									<div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
										<button
											type="button"
											title="manualInvDec"
											onClick={() => handleManualInvUpdate(item, -1)}
											className={`p-1 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors`}
										>
											<Minus size={14} />
										</button>
										<span className="text-xs font-mono px-3 text-slate-900 dark:text-slate-100">
											{item.quantity} <span className="text-slate-500 dark:text-slate-400">{item.unit}</span>
										</span>
										<button
											type="button"
											title="togmanualInvInc"
											onClick={() => handleManualInvUpdate(item, 1)}
											className={`p-1 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-colors`}
										>
											<Plus size={14} />
										</button>
									</div>
									<button
										type="button"
										title="removeInventory"
										onClick={() => removeInventory(item.id)}
										className={`ml-2 text-slate-400 hover:text-red-500`}
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-6">
					<div
						className={`${theme.card} p-0 rounded-2xl shadow-sm border flex flex-col flex-1 min-h-[250px] overflow-hidden`}
					>
						<div
							className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'} flex justify-between items-center`}
						>
							<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
								<ShoppingCart size={16} className={`mr-2 ${theme.textMuted}`} />{' '}
								{viewDate === getTodayString() ? '今日' : viewDate} 採買清單
							</h2>
							<button
								type="button"
								title="addShoppingItem"
								onClick={() => toggleModal('shopping', true)}
								className={`text-xs ${theme.accentBlue} font-medium hover:underline flex items-center`}
							>
								<Plus size={14} className="mr-1" /> 加入項目
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
							{viewDateShoppingList
								.sort((a, b) => (a.isBought === b.isBought ? 0 : a.isBought ? -1 : 1))
								.map((item) => (
									<div
										key={item.id}
										className={`flex items-center justify-between p-3 rounded-lg border transition-all ${item.isBought ? (isDarkMode ? 'bg-slate-950/50 border-slate-800 opacity-40' : 'bg-slate-50 border-slate-200 opacity-50') : `${theme.listItem} ${theme.cardHover}`}`}
									>
										<div
											className="flex items-center gap-3 cursor-pointer flex-1"
											onClick={() => updateShopping(item.id, { ...item, isBought: !item.isBought })}
										>
											<div
												className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${item.isBought ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}
											>
												{item.isBought && <Check size={12} strokeWidth={3} />}
											</div>
											<span
												className={`text-sm font-medium transition-all ${item.isBought ? 'line-through' : theme.textMain}`}
											>
												{item.name}
											</span>
										</div>
										<button
											type="button"
											title="removeShoppingItem"
											onClick={() => removeShopping(item.id)}
											className={`text-slate-400 hover:text-red-500`}
										>
											<Trash2 size={16} />
										</button>
									</div>
								))}
						</div>
					</div>

					<div
						className={`${theme.card} p-0 rounded-2xl shadow-sm border flex flex-col flex-1 min-h-[250px] overflow-hidden`}
					>
						<div
							className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}
						>
							<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
								<History size={16} className={`mr-2 ${theme.textMuted}`} /> 庫存異動紀錄
							</h2>
						</div>
						<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
							{sortedLogs.slice(0, 20).map((log) => (
								<div
									key={log.id}
									className={`flex flex-col p-3 rounded-lg border ${theme.listItem} bg-slate-50/50 dark:bg-slate-900/30`}
								>
									<div className="flex justify-between items-start mb-1">
										<span className={`text-sm font-semibold ${theme.textMain}`}>{log.itemName}</span>
										<span
											className={`text-sm font-bold font-mono ${log.delta > 0 ? 'text-emerald-500' : 'text-orange-500'}`}
										>
											{log.delta > 0 ? '+' : ''}
											{log.delta}
										</span>
									</div>
									<div className={`flex justify-between items-center text-[11px] ${theme.textMuted}`}>
										<span>{log.reason}</span>
										<span>
											{log.date} {formatTime(log.timestamp)}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<Modal isOpen={modals.inventory} onClose={() => toggleModal('inventory', false)} title="新增庫存" icon={BookOpen}>
				<form onSubmit={handleAddInventory} className="flex flex-col gap-4">
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							名稱
						</label>
						<input
							type="text"
							title="invName"
							value={invName}
							onChange={(e) => setInvName(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						/>
					</div>
					<div className="flex gap-4">
						<div className="flex-1">
							<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
								數量
							</label>
							<input
								type="number"
								title="invQty"
								value={invQty}
								onChange={(e) => setInvQty(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							/>
						</div>
						<div className="flex-1">
							<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
								單位
							</label>
							<input
								type="text"
								title="invUnit"
								value={invUnit}
								onChange={(e) => setInvUnit(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							/>
						</div>
					</div>
					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-6 ${theme.primaryBtn}`}>
						加入庫存
					</button>
				</form>
			</Modal>

			<Modal
				isOpen={modals.shopping}
				onClose={() => toggleModal('shopping', false)}
				title="新增採買"
				icon={ShoppingCart}
			>
				<form onSubmit={handleAddShopping} className="flex flex-col gap-4">
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							物品名稱
						</label>
						<input
							type="text"
							title="shopName"
							value={shopName}
							onChange={(e) => setShopName(e.target.value)}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						/>
					</div>
					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-2 ${theme.primaryBtn}`}>
						確定加入
					</button>
				</form>
			</Modal>
		</div>
	);
};
