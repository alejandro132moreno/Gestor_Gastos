export interface Expense {
    id: string;
    amount: number;
    description: string;
    category: string;
    subcategory?: string;
    crop_cycle?: string;
    date: string;
    receipt_url?: string;
}
export type ExpenseInput = Omit<Expense, 'id'>;

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories: string[];
    priority: string;
}
export type CategoryInput = Omit<Category, 'id'>;

export interface Budget {
    id: string;
    category_id: string;
    month: string;
    amount: number;
    spent: number;
}
export type BudgetInput = Omit<Budget, 'id' | 'spent'>;

export interface Plot {
    id: string;
    name: string;
    type: string;
    hectareas: number;
    capacidad_plantas?: number;
}
export type PlotInput = Omit<Plot, 'id'>;

export interface CropCycle {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    hectareas: number;
    variety: string;
    plot_id: string;
    total_harvest_kg?: number;
    status: string;
    total_expenses?: number;
}
export type CropCycleInput = Omit<CropCycle, 'id' | 'total_expenses'>;

export interface DashboardSummary {
    total_spent: number;
    spending_by_category: Record<string, number>;
    monthly_trend: Record<string, number>;
    recent_expenses: Expense[];
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    unit: string;
    current_stock: number;
    average_cost: number;
}
export type InventoryItemInput = Omit<InventoryItem, 'id' | 'current_stock'>;

export interface InventoryConsume {
    quantity: number;
    date: string;
    crop_cycle_id?: string;
    notes?: string;
}
