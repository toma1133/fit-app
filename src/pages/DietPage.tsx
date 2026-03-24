import React, { useState, useMemo } from 'react';
import { Utensils, Check, ClipboardList, BookOpen, Trash2, X, ListPlus, Edit2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useFirestore } from '../hooks/useFirestore';
import { getThemeStyles } from '../utils/theme';
import { getTodayString, generateId } from '../utils/helpers';
import { SectionHeader } from '../components/shared/SectionHeader';
import { Modal } from '../components/shared/Modal';
import type { MealData, MealPlanData, RecipeData, FoodData, InventoryItem, RecipeItem, InventoryLog } from '../types';

interface MacroCardProps {
	label: string;
	value: number | string;
	unit: string;
	isHighlight?: boolean;
}

export const DietPage: React.FC = () => {
	const { isDarkMode } = useStore();
	const theme = getThemeStyles(isDarkMode);

	const [viewDate, setViewDate] = useState(getTodayString());

	const { data: meals, addOrUpdateDoc: addMeal, removeDoc: removeMeal } = useFirestore<MealData>('meals');
	const { data: mealPlans, addOrUpdateDoc: addPlan, removeDoc: removePlan } = useFirestore<MealPlanData>('meal_plans');
	const { data: recipes, addOrUpdateDoc: addRecipe, removeDoc: removeRecipe } = useFirestore<RecipeData>('recipes');
	const { data: foodLibrary, addOrUpdateDoc: addFood, removeDoc: removeFood } = useFirestore<FoodData>('food_library');
	const { data: inventory, addOrUpdateDoc: updateInventory } = useFirestore<InventoryItem>('inventory');
	const { addOrUpdateDoc: addLog } = useFirestore<InventoryLog>('inventory_logs');

	const [modals, setModals] = useState({ dietRecord: false, dietPlan: false, recipeBuilder: false, foodLib: false });
	const toggleModal = (k: string, v: boolean) => setModals((p) => ({ ...p, [k]: v }));

	// --- 飲食紀錄狀態 ---
	const [recordType, setRecordType] = useState('');
	const [recordId, setRecordId] = useState('');
	const [recordServings, setRecordServings] = useState<number | string>(1);
	const [manualMeal, setManualMeal] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
	const [deductInventory, setDeductInventory] = useState(false);

	// --- 食譜管理狀態 ---
	const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
	const [recipeName, setRecipeName] = useState('');
	const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

	// --- 食材庫管理狀態 ---
	const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
	const [libName, setLibName] = useState('');
	const [libCals, setLibCals] = useState('');
	const [libProtein, setLibProtein] = useState('');
	const [libCarbs, setLibCarbs] = useState('');
	const [libFat, setLibFat] = useState('');

	const viewDateMeals = useMemo(() => meals.filter((m) => m.date === viewDate), [meals, viewDate]);
	const viewDateMealPlans = useMemo(() => mealPlans.filter((m) => m.date === viewDate), [mealPlans, viewDate]);

	const dietSummary = useMemo(() => {
		return viewDateMeals.reduce(
			(acc, curr) => ({
				calories: acc.calories + (curr.calories || 0),
				protein: acc.protein + (curr.protein || 0),
				carbs: acc.carbs + (curr.carbs || 0),
				fat: acc.fat + (curr.fat || 0),
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 },
		);
	}, [viewDateMeals]);

	const logInventoryChange = async (itemName: string, delta: number, reason: string) => {
		const invItem = inventory.find((i) => i.name === itemName);
		if (invItem) {
			const newQty = Math.max(0, invItem.quantity + delta);
			await updateInventory(invItem.id, { ...invItem, quantity: newQty });
			await addLog(generateId(), {
				date: getTodayString(),
				itemName,
				delta,
				reason,
				timestamp: Date.now(),
			});
		}
	};

	const handleRecordMeal = async (e: React.SubmitEvent, isPlan = false) => {
		e.preventDefault();
		let payload = null;
		let inventoryDeductions: { name: string; qty: number }[] = [];
		const servings = parseFloat(recordServings as string) || 1;

		if (recordType === 'food' && recordId) {
			const food = foodLibrary.find((f) => f.id === recordId);
			if (food) {
				payload = {
					name: food.name,
					calories: food.calories * servings,
					protein: food.protein * servings,
					carbs: food.carbs * servings,
					fat: food.fat * servings,
				};
				inventoryDeductions.push({ name: food.name, qty: servings });
			}
		} else if (recordType === 'recipe' && recordId) {
			const recipe = recipes.find((r) => r.id === recordId);
			if (recipe) {
				payload = {
					name: recipe.name,
					calories: recipe.calories * servings,
					protein: recipe.protein * servings,
					carbs: recipe.carbs * servings,
					fat: recipe.fat * servings,
				};
				recipe.items.forEach((item) => inventoryDeductions.push({ name: item.name, qty: item.qty * servings }));
			}
		} else if (recordType === 'manual' && manualMeal.name && manualMeal.calories) {
			payload = {
				name: manualMeal.name,
				calories: parseFloat(manualMeal.calories),
				protein: parseFloat(manualMeal.protein) || 0,
				carbs: parseFloat(manualMeal.carbs) || 0,
				fat: parseFloat(manualMeal.fat) || 0,
			};
		}

		if (payload) {
			if (isPlan) {
				await addPlan(generateId(), { ...payload, date: viewDate, isEaten: false, timestamp: Date.now() });
			} else {
				await addMeal(generateId(), { ...payload, date: viewDate, timestamp: Date.now() });
				if (deductInventory) {
					for (const item of inventoryDeductions) {
						await logInventoryChange(item.name, -item.qty, `食用紀錄: ${payload.name}`);
					}
				}
			}
			setRecordType('');
			setRecordId('');
			setRecordServings(1);
			setManualMeal({ name: '', calories: '', protein: '', carbs: '', fat: '' });
			setDeductInventory(false);
			toggleModal(isPlan ? 'dietPlan' : 'dietRecord', false);
		}
	};

	const handleEatPlan = async (plan: MealPlanData) => {
		await addMeal(generateId(), {
			date: viewDate,
			name: plan.name,
			calories: plan.calories,
			protein: plan.protein || 0,
			carbs: plan.carbs || 0,
			fat: plan.fat || 0,
			timestamp: Date.now(),
		});
		await addPlan(plan.id, { ...plan, isEaten: true });
	};

	// --- 食材庫管理方法 ---
	const resetFoodForm = () => {
		setEditingFoodId(null);
		setLibName('');
		setLibCals('');
		setLibProtein('');
		setLibCarbs('');
		setLibFat('');
	};

	const handleAddOrUpdateFood = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (!libName || !libCals) return;
		const id = editingFoodId || generateId();
		await addFood(id, {
			name: libName,
			calories: parseFloat(libCals),
			protein: libProtein ? parseFloat(libProtein) : 0,
			carbs: libCarbs ? parseFloat(libCarbs) : 0,
			fat: libFat ? parseFloat(libFat) : 0,
			timestamp: Date.now(),
		});
		resetFoodForm();
	};

	const handleEditFood = (food: FoodData) => {
		setEditingFoodId(food.id);
		setLibName(food.name);
		setLibCals(food.calories.toString());
		setLibProtein(food.protein ? food.protein.toString() : '');
		setLibCarbs(food.carbs ? food.carbs.toString() : '');
		setLibFat(food.fat ? food.fat.toString() : '');
	};

	// --- 食譜庫管理方法 ---
	const resetRecipeForm = () => {
		setEditingRecipeId(null);
		setRecipeName('');
		setRecipeItems([]);
	};

	const handleAddOrUpdateRecipe = async (e: React.SubmitEvent) => {
		e.preventDefault();
		if (recipeItems.length === 0 || !recipeName) return;

		const summary = recipeItems.reduce(
			(acc, item) => ({
				calories: acc.calories + item.calories * item.qty,
				protein: acc.protein + item.protein * item.qty,
				carbs: acc.carbs + item.carbs * item.qty,
				fat: acc.fat + item.fat * item.qty,
			}),
			{ calories: 0, protein: 0, carbs: 0, fat: 0 },
		);

		const id = editingRecipeId || generateId();
		await addRecipe(id, {
			name: recipeName.trim(),
			items: recipeItems.map((i) => ({ name: i.name, qty: i.qty, foodId: i.foodId })),
			calories: Math.round(summary.calories),
			protein: Math.round(summary.protein * 10) / 10,
			carbs: Math.round(summary.carbs * 10) / 10,
			fat: Math.round(summary.fat * 10) / 10,
			timestamp: Date.now(),
		});
		resetRecipeForm();
	};

	const handleEditRecipe = (recipe: RecipeData) => {
		setEditingRecipeId(recipe.id);
		setRecipeName(recipe.name);

		// 將關聯的食材重新拉取計算
		const reconstructedItems = recipe.items.map((item) => {
			const foodItem = foodLibrary.find((f) => f.id === item.foodId);
			return {
				localId: generateId(),
				foodId: item.foodId,
				name: item.name,
				qty: item.qty,
				calories: foodItem ? foodItem.calories : 0,
				protein: foodItem ? foodItem.protein : 0,
				carbs: foodItem ? foodItem.carbs : 0,
				fat: foodItem ? foodItem.fat : 0,
			};
		});
		setRecipeItems(reconstructedItems);
	};

	const MacroCard: React.FC<MacroCardProps> = ({ label, value, unit, isHighlight }) => (
		<div
			className={`p-4 rounded-xl border ${isHighlight ? `bg-blue-600 border-blue-600 text-white shadow-md` : `${theme.card}`}`}
		>
			<div
				className={`text-[11px] uppercase tracking-wider font-semibold mb-1 ${isHighlight ? 'text-blue-100' : theme.textLabel}`}
			>
				{label}
			</div>
			<div className="flex items-baseline gap-1">
				<span className={`text-2xl font-bold tracking-tight ${isHighlight ? 'text-white' : theme.textMain}`}>
					{value}
				</span>
				<span className={`text-xs font-medium ${isHighlight ? 'text-blue-200' : theme.textMuted}`}>{unit}</span>
			</div>
		</div>
	);

	return (
		<div className="flex flex-col gap-6 animate-in fade-in duration-500">
			<SectionHeader title="飲食日誌" viewDate={viewDate} setViewDate={setViewDate} />

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<MacroCard label="Total Calories" value={Math.round(dietSummary.calories)} unit="kcal" isHighlight={true} />
				<MacroCard label="Protein" value={Math.round(dietSummary.protein * 10) / 10} unit="g" />
				<MacroCard label="Carbs" value={Math.round(dietSummary.carbs * 10) / 10} unit="g" />
				<MacroCard label="Fat" value={Math.round(dietSummary.fat * 10) / 10} unit="g" />
			</div>

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					title="record"
					onClick={() => {
						setDeductInventory(false);
						toggleModal('dietRecord', true);
					}}
					className={`${theme.primaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
				>
					<Utensils size={16} className="mr-2" /> 記錄飲食
				</button>
				<button
					type="button"
					title="schedule"
					onClick={() => {
						setDeductInventory(false);
						toggleModal('dietPlan', true);
					}}
					className={`${theme.secondaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700`}
				>
					<ClipboardList size={16} className="mr-2 opacity-70" /> 預排計畫
				</button>
				<button
					type="button"
					title="manageRecipe"
					onClick={() => toggleModal('recipeBuilder', true)}
					className={`${theme.secondaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700`}
				>
					<ListPlus size={16} className="mr-2 opacity-70" /> 管理食譜庫
				</button>
				<button
					type="button"
					title="manageFood"
					onClick={() => toggleModal('foodLib', true)}
					className={`${theme.secondaryBtn} flex-1 min-w-[120px] p-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center border border-slate-200 dark:border-slate-700`}
				>
					<BookOpen size={16} className="mr-2 opacity-70" /> 管理食材庫
				</button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Actual Meals */}
				<div className={`${theme.card} p-0 rounded-2xl shadow-sm border overflow-hidden flex flex-col`}>
					<div
						className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}
					>
						<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
							<Check size={16} className={`mr-2 ${theme.accentEmerald}`} /> 實際攝取明細
						</h2>
					</div>
					<div className="p-4 flex flex-col gap-2 flex-1">
						{viewDateMeals.length > 0 ? (
							viewDateMeals.map((meal) => (
								<div
									key={meal.id}
									className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border ${theme.listItem} transition-colors ${theme.cardHover}`}
								>
									<div className="flex-1 min-w-0 pr-4 mb-2 sm:mb-0">
										<div className={`text-sm font-bold truncate ${theme.textMain}`}>{meal.name}</div>
										<div className={`text-[12px] ${theme.textMuted} mt-1 font-mono flex flex-wrap gap-2`}>
											<span className={`font-semibold ${theme.accentBlue}`}>{meal.calories} kcal</span>
											<span className="opacity-50">|</span>
											<span>
												P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
											</span>
										</div>
									</div>
									<button
										type="button"
										title="removeMeal"
										onClick={() => removeMeal(meal.id)}
										className={`self-end sm:self-auto p-2 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors ${theme.textMuted}`}
									>
										<Trash2 size={16} />
									</button>
								</div>
							))
						) : (
							<div
								className={`text-center ${theme.textMuted} py-12 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl`}
							>
								此日尚無飲食紀錄
							</div>
						)}
					</div>
				</div>

				{/* Meal Plans */}
				<div className={`${theme.card} p-0 rounded-2xl shadow-sm border overflow-hidden flex flex-col`}>
					<div
						className={`p-4 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}
					>
						<h2 className={`text-sm font-semibold uppercase tracking-wide ${theme.textMain} flex items-center`}>
							<ClipboardList size={16} className={`mr-2 ${theme.textMuted}`} /> 預排計畫
						</h2>
					</div>
					<div className="p-4 flex flex-col gap-2 flex-1">
						{viewDateMealPlans.length > 0 ? (
							viewDateMealPlans.map((plan) => (
								<div
									key={plan.id}
									className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${plan.isEaten ? (isDarkMode ? 'bg-slate-950/50 border-slate-800 opacity-40' : 'bg-slate-50 border-slate-200 opacity-50') : `${theme.listItem} ${theme.cardHover}`}`}
								>
									<div className="flex-1 min-w-0 pr-2">
										<div className={`text-sm font-medium truncate ${plan.isEaten ? 'line-through' : theme.textMain}`}>
											{plan.name}
										</div>
										<div
											className={`text-[11px] mt-1 font-mono flex gap-2 ${plan.isEaten ? theme.textMuted : theme.accentBlue}`}
										>
											<span>{plan.calories} kcal</span>
											{(plan.protein > 0 || plan.carbs > 0 || plan.fat > 0) && (
												<>
													<span className="opacity-50">|</span>
													<span>
														P:{plan.protein} C:{plan.carbs} F:{plan.fat}
													</span>
												</>
											)}
										</div>
									</div>
									<div className="flex items-center gap-1 shrink-0">
										{!plan.isEaten && (
											<button
												type="button"
												title="confirmEat"
												onClick={() => handleEatPlan(plan)}
												className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition-colors ${theme.primaryBtn}`}
											>
												確認
											</button>
										)}
										<button
											type="button"
											title="removePlan"
											onClick={() => removePlan(plan.id)}
											className={`p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors ${theme.textMuted}`}
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>
							))
						) : (
							<div
								className={`text-center ${theme.textMuted} py-10 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl`}
							>
								此日尚無計畫
							</div>
						)}
					</div>
				</div>
			</div>

			{/* --- Modals for Diet Page --- */}
			<Modal
				isOpen={modals.dietRecord}
				onClose={() => toggleModal('dietRecord', false)}
				title="記錄飲食"
				icon={Utensils}
			>
				<form onSubmit={(e) => handleRecordMeal(e, false)} className="flex flex-col gap-5">
					<div
						className={`p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[13px] rounded-xl font-medium leading-relaxed`}
					>
						💡 選擇食譜或食材庫項目，系統將為您自動扣除庫存。
					</div>
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							選擇項目
						</label>
						<select
							title="selectRecord"
							value={`${recordType}-${recordId}`}
							onChange={(e) => {
								const val = e.target.value;
								if (val === 'manual-') {
									setRecordType('manual');
									setRecordId('');
								} else if (val) {
									const [t, id] = val.split('-');
									setRecordType(t);
									setRecordId(id);
								} else {
									setRecordType('');
									setRecordId('');
								}
							}}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						>
							<option value="">請選擇...</option>
							<optgroup label="=== 建立的食譜 ===">
								{recipes.map((r) => (
									<option key={r.id} value={`recipe-${r.id}`}>
										{r.name} ({r.calories} kcal)
									</option>
								))}
							</optgroup>
							<optgroup label="=== 單一食材 ===">
								{foodLibrary.map((f) => (
									<option key={f.id} value={`food-${f.id}`}>
										{f.name} ({f.calories} kcal)
									</option>
								))}
							</optgroup>
							<option value="manual-">✏️ 臨時手動輸入 (不扣庫存)</option>
						</select>
					</div>

					{(recordType === 'food' || recordType === 'recipe') && (
						<div>
							<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
								食用份數 (倍數)
							</label>
							<input
								type="number"
								title="foodNum"
								step="0.1"
								min="0.1"
								value={recordServings}
								onChange={(e) => setRecordServings(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								required
							/>
						</div>
					)}

					{recordType === 'manual' && (
						<div className="flex flex-col gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
							<div>
								<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
									餐點名稱
								</label>
								<input
									type="text"
									title="foodName"
									value={manualMeal.name}
									onChange={(e) => setManualMeal({ ...manualMeal, name: e.target.value })}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
									熱量 (kcal)
								</label>
								<input
									type="number"
									title="calories"
									value={manualMeal.calories}
									onChange={(e) => setManualMeal({ ...manualMeal, calories: e.target.value })}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
									required
								/>
							</div>
							{/* Optional Macros... */}
						</div>
					)}

					{(recordType === 'food' || recordType === 'recipe') && (
						<label className="flex items-center gap-2 mt-4 cursor-pointer bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
							<input
								type="checkbox"
								checked={deductInventory}
								onChange={(e) => setDeductInventory(e.target.checked)}
								className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900"
							/>
							<span className={`text-sm font-semibold ${theme.textMain}`}>自動扣除對應庫存</span>
						</label>
					)}

					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-4 ${theme.primaryBtn}`}>
						確認並寫入紀錄
					</button>
				</form>
			</Modal>

			<Modal
				isOpen={modals.dietPlan}
				onClose={() => toggleModal('dietPlan', false)}
				title="建立預排計畫"
				icon={ClipboardList}
			>
				<form onSubmit={(e) => handleRecordMeal(e, true)} className="flex flex-col gap-5">
					{/* Form logic identical to dietRecord, but without deductInventory checkbox */}
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							選擇項目
						</label>
						<select
							title="selectRecord"
							value={`${recordType}-${recordId}`}
							onChange={(e) => {
								const val = e.target.value;
								if (val === 'manual-') {
									setRecordType('manual');
									setRecordId('');
								} else if (val) {
									const [t, id] = val.split('-');
									setRecordType(t);
									setRecordId(id);
								} else {
									setRecordType('');
									setRecordId('');
								}
							}}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
							required
						>
							<option value="">請選擇...</option>
							<optgroup label="=== 建立的食譜 ===">
								{recipes.map((r) => (
									<option key={r.id} value={`recipe-${r.id}`}>
										{r.name}
									</option>
								))}
							</optgroup>
							<optgroup label="=== 單一食材 ===">
								{foodLibrary.map((f) => (
									<option key={f.id} value={`food-${f.id}`}>
										{f.name}
									</option>
								))}
							</optgroup>
							<option value="manual-">✏️ 臨時手動輸入</option>
						</select>
					</div>
					{recordType === 'manual' && (
						<div className="flex flex-col gap-4 pt-4">
							<div>
								<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
									餐點名稱
								</label>
								<input
									type="text"
									title="foodName"
									value={manualMeal.name}
									onChange={(e) => setManualMeal({ ...manualMeal, name: e.target.value })}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
									required
								/>
							</div>
							<div>
								<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
									熱量 (kcal)
								</label>
								<input
									type="number"
									title="calories"
									value={manualMeal.calories}
									onChange={(e) => setManualMeal({ ...manualMeal, calories: e.target.value })}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
									required
								/>
							</div>
						</div>
					)}
					<button type="submit" className={`w-full p-2.5 rounded-lg text-sm font-medium mt-4 ${theme.primaryBtn}`}>
						儲存計畫
					</button>
				</form>
			</Modal>

			<Modal
				isOpen={modals.recipeBuilder}
				onClose={() => toggleModal('recipeBuilder', false)}
				title="管理食譜庫"
				icon={ListPlus}
			>
				<div className="flex flex-col gap-4 h-full max-h-[70vh]">
					<div>
						<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel} mb-1.5`}>
							選擇食材加入{editingRecipeId ? '食譜' : '新食譜'}
						</label>
						<select
							title="selectFood"
							onChange={(e) => {
								const food = foodLibrary.find((f) => f.id === e.target.value);
								if (food) {
									setRecipeItems([
										...recipeItems,
										{
											localId: generateId(),
											foodId: food.id,
											name: food.name,
											qty: 1,
											calories: food.calories,
											protein: food.protein,
											carbs: food.carbs,
											fat: food.fat,
										},
									]);
								}
								e.target.value = '';
							}}
							className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
						>
							<option value="">-- 點選加入食材 --</option>
							{foodLibrary.map((f) => (
								<option key={f.id} value={f.id}>
									{f.name}
								</option>
							))}
						</select>
					</div>

					<div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar min-h-[120px] p-2 border rounded-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
						{recipeItems.map((item, idx) => (
							<div
								key={item.localId}
								className={`flex items-center justify-between p-2 rounded-lg border ${theme.listItem}`}
							>
								<span className={`text-sm font-medium ${theme.textMain} flex-1 truncate pr-2`}>
									{idx + 1}. {item.name}
								</span>
								<div className="flex items-center gap-2 shrink-0">
									<input
										type="number"
										title="itemQty"
										step="0.1"
										value={item.qty}
										onChange={(e) => {
											setRecipeItems(
												recipeItems.map((i) =>
													i.localId === item.localId ? { ...i, qty: parseFloat(e.target.value) || 0 } : i,
												),
											);
										}}
										className={`w-14 p-1 text-center text-sm border rounded-md outline-none ${theme.input}`}
									/>
									<button
										type="button"
										title="close"
										onClick={() => setRecipeItems(recipeItems.filter((i) => i.localId !== item.localId))}
										className="text-slate-400 hover:text-red-500 p-1"
									>
										<X size={14} />
									</button>
								</div>
							</div>
						))}
					</div>

					<form
						onSubmit={handleAddOrUpdateRecipe}
						className="flex flex-col gap-3 pb-4 border-b border-slate-200 dark:border-slate-800"
					>
						<div className="flex items-center justify-between mb-1.5">
							<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel}`}>
								食譜名稱
							</label>
							{editingRecipeId && (
								<button type="button" onClick={resetRecipeForm} className="text-[11px] text-blue-500 hover:underline">
									取消編輯
								</button>
							)}
						</div>
						<div>
							<input
								type="text"
								placeholder="食譜名稱"
								value={recipeName}
								onChange={(e) => setRecipeName(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								required
							/>
						</div>
						<button
							type="submit"
							disabled={recipeItems.length === 0}
							className={`w-full p-2.5 rounded-lg text-sm font-medium ${editingRecipeId ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' : theme.primaryBtn} disabled:opacity-50`}
						>
							{editingRecipeId ? '儲存食譜修改' : '儲存新食譜'}
						</button>
					</form>

					<div className="mt-4">
						<h4 className={`text-[11px] uppercase tracking-wider font-semibold ${theme.textLabel} mb-3`}>
							現有食譜清單
						</h4>
						<div className="max-h-40 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
							{recipes.map((r) => (
								<div
									key={r.id}
									className={`flex justify-between items-center p-3 rounded-lg border transition-all ${theme.listItem} ${editingRecipeId === r.id ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-slate-800' : ''}`}
								>
									<div className="flex-1 min-w-0">
										<div className={`font-medium text-sm truncate ${theme.accentBlue}`}>{r.name}</div>
										<div className={`text-[11px] font-mono ${theme.textMuted} mt-0.5`}>{r.calories} kcal</div>
									</div>
									<div className="flex gap-1">
										<button
											type="button"
											title="editRecipe"
											onClick={() => handleEditRecipe(r)}
											className={`text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
										>
											<Edit2 size={16} />
										</button>
										<button
											type="button"
											title="removeRecipe"
											onClick={() => {
												removeRecipe(r.id);
												if (editingRecipeId === r.id) resetRecipeForm();
											}}
											className={`text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
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

			<Modal isOpen={modals.foodLib} onClose={() => toggleModal('foodLib', false)} title="管理基本食材" icon={BookOpen}>
				<div className="mb-6 border-b pb-6 dark:border-slate-800">
					<form onSubmit={handleAddOrUpdateFood} className="flex flex-col gap-3">
						<div className="flex items-center justify-between mb-1.5">
							<label className={`block text-[11px] font-semibold uppercase tracking-wider ${theme.textLabel}`}>
								{editingFoodId ? '修改食材' : '新增食材'}
							</label>
							{editingFoodId && (
								<button type="button" onClick={resetFoodForm} className="text-[11px] text-blue-500 hover:underline">
									取消編輯
								</button>
							)}
						</div>
						<div>
							<input
								type="text"
								placeholder="例: 雞胸肉 100g (必填)"
								value={libName}
								onChange={(e) => setLibName(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								required
							/>
						</div>
						<div>
							<input
								type="number"
								placeholder="熱量 kcal (必填)"
								value={libCals}
								onChange={(e) => setLibCals(e.target.value)}
								className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								required
							/>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div>
								<input
									type="number"
									placeholder="蛋白(g)"
									value={libProtein}
									onChange={(e) => setLibProtein(e.target.value)}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								/>
							</div>
							<div>
								<input
									type="number"
									placeholder="碳水(g)"
									value={libCarbs}
									onChange={(e) => setLibCarbs(e.target.value)}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								/>
							</div>
							<div>
								<input
									type="number"
									placeholder="脂肪(g)"
									value={libFat}
									onChange={(e) => setLibFat(e.target.value)}
									className={`w-full p-2.5 border rounded-lg outline-none text-sm ${theme.input}`}
								/>
							</div>
						</div>
						<button
							type="submit"
							className={`w-full p-2.5 rounded-lg text-sm font-medium ${editingFoodId ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm' : theme.primaryBtn}`}
						>
							{editingFoodId ? '儲存修改' : '新增食材'}
						</button>
					</form>
				</div>
				<div>
					<h4 className={`text-[11px] uppercase tracking-wider font-semibold ${theme.textLabel} mb-3`}>現有食材清單</h4>
					<div className="max-h-48 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
						{foodLibrary.map((f) => (
							<div
								key={f.id}
								className={`flex justify-between items-center p-3 rounded-lg border transition-all ${theme.listItem} ${editingFoodId === f.id ? 'border-blue-500 ring-1 ring-blue-500 dark:bg-slate-800' : ''}`}
							>
								<div className="flex-1 min-w-0">
									<div className={`font-medium text-sm truncate ${theme.textMain}`}>{f.name}</div>
									<div className={`text-[11px] font-mono ${theme.textMuted} mt-0.5`}>{f.calories} kcal</div>
								</div>
								<div className="flex gap-1">
									<button
										type="button"
										title="handleEditFood"
										onClick={() => handleEditFood(f)}
										className={`text-slate-400 hover:text-blue-500 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}
									>
										<Edit2 size={16} />
									</button>
									<button
										type="button"
										title="removeFood"
										onClick={() => {
											removeFood(f.id);
											if (editingFoodId === f.id) resetFoodForm();
										}}
										className={`text-slate-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors`}
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</Modal>
		</div>
	);
};
