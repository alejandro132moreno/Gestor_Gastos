import axios from 'axios';
import type { Expense, ExpenseInput, Category, CategoryInput, Budget, BudgetInput, InventoryItem, InventoryItemInput } from '../types';
import { useAuthStore } from '../store/useAuthStore';

const API_URL = 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: API_URL
});

apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- AUTH ---
export const loginUser = async (credentials: any) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    const { data } = await apiClient.post('/api/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return data;
};

export const registerUser = async (user: any) => {
    const { data } = await apiClient.post('/api/auth/register', user);
    return data;
};

export const fetchCurrentUser = async () => {
    try {
        const { data } = await apiClient.get('/api/auth/me');
        return data;
    } catch {
        return null;
    }
};

// --- EXPENSES ---
export const fetchExpenses = async (): Promise<Expense[]> => {
    try {
        const { data } = await apiClient.get('/api/expenses');
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createExpense = async (expense: ExpenseInput): Promise<Expense | null> => {
    try {
        const { data } = await apiClient.post('/api/expenses', expense);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const deleteExpense = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/api/expenses/${id}`);
        return true;
    } catch (e) {
        console.error(e); return false;
    }
};

// --- CATEGORIES ---
export const fetchCategories = async (): Promise<Category[]> => {
    try {
        const { data } = await apiClient.get('/api/categories');
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createCategory = async (category: CategoryInput): Promise<Category | null> => {
    try {
        const { data } = await apiClient.post('/api/categories', category);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/api/categories/${id}`);
        return true;
    } catch (e) {
        console.error(e); return false;
    }
};

// --- BUDGETS ---
export const fetchBudgets = async (month?: string): Promise<Budget[]> => {
    try {
        const url = month ? `/api/budgets?month=${month}` : `/api/budgets`;
        const { data } = await apiClient.get(url);
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createBudget = async (budget: BudgetInput): Promise<Budget | null> => {
    try {
        const { data } = await apiClient.post('/api/budgets', budget);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const deleteBudget = async (id: string, month: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/api/budgets/${id}?month=${month}`);
        return true;
    } catch (e) {
        console.error(e); return false;
    }
};

// --- STORAGE ---
export const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await apiClient.post('/upload', formData);
        return data.url;
    } catch (e) {
        console.error(e); return null;
    }
};

// --- DASHBOARD ---
export const fetchDashboardSummary = async (): Promise<any> => {
    try {
        const { data } = await apiClient.get('/api/dashboard/summary');
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

// --- CROP CYCLES ---
export const fetchCropCycles = async (): Promise<any[]> => {
    try {
        const { data } = await apiClient.get('/api/crop-cycles');
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createCropCycle = async (cycle: any): Promise<any> => {
    try {
        const { data } = await apiClient.post('/api/crop-cycles', cycle);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const deleteCropCycle = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/api/crop-cycles/${id}`);
        return true;
    } catch (e) {
        console.error(e); return false;
    }
};

export const updateCropCycle = async (id: string, updates: any): Promise<any> => {
    try {
        const { data } = await apiClient.put(`/api/crop-cycles/${id}`, updates);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

// --- PLOTS ---
export const fetchPlots = async (): Promise<any[]> => {
    try {
        const { data } = await apiClient.get('/api/plots');
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createPlot = async (plot: any): Promise<any> => {
    try {
        const { data } = await apiClient.post('/api/plots', plot);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const deletePlot = async (id: string): Promise<boolean> => {
    try {
        await apiClient.delete(`/api/plots/${id}`);
        return true;
    } catch (e) {
        console.error(e); return false;
    }
};

// --- INVENTORY ---
export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
    try {
        const { data } = await apiClient.get('/api/inventory');
        return data;
    } catch (e) {
        console.error(e); return [];
    }
};

export const createInventoryItem = async (item: InventoryItemInput): Promise<InventoryItem | null> => {
    try {
        const { data } = await apiClient.post('/api/inventory', item);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};

export const consumeInventoryItem = async (id: string, consumeParams: any): Promise<InventoryItem | null> => {
    try {
        const { data } = await apiClient.post(`/api/inventory/${id}/consume`, consumeParams);
        return data;
    } catch (e) {
        console.error(e); return null;
    }
};
