export interface MetricData {
	id: string;
	date: string;
	weight: number;
	bodyFat: number | null;
	timestamp: number;
}

export interface MealData {
	id: string;
	date: string;
	name: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	timestamp: number;
}

export interface MealPlanData extends MealData {
	isEaten: boolean;
}

export interface RecipeItem {
	localId: string;
	foodId: string;
	name: string;
	qty: number;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
}

export interface RecipeData {
	id: string;
	name: string;
	items: { name: string; qty: number; foodId: string }[];
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	timestamp: number;
}

export interface FoodData {
	id: string;
	name: string;
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	timestamp: number;
}

export interface InventoryItem {
	id: string;
	name: string;
	quantity: number;
	unit: string;
	timestamp: number;
}

export interface InventoryLog {
	id: string;
	date: string;
	itemName: string;
	delta: number;
	reason: string;
	timestamp: number;
}

export interface ShoppingItem {
	id: string;
	name: string;
	isBought: boolean;
	date: string;
	timestamp: number;
}

export interface ExerciseLog {
	id: string;
	date: string;
	name: string;
	duration: number;
	caloriesBurned: number;
	timestamp: number;
}

export interface CustomExercise {
	id: string;
	name: string;
	caloriesPerMinute: number;
	timestamp: number;
}
