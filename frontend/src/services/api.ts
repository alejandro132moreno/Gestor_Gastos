import type { Expense, ExpenseInput } from '../types';

const API_URL = 'http://localhost:8000'; // Assuming standard FastAPI port

export const fetchExpenses = async (): Promise<Expense[]> => {
    try {
        const response = await fetch(`${API_URL}/gastos`);
        if (!response.ok) throw new Error('Failed to fetch expenses');
        return await response.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const createExpense = async (expense: ExpenseInput): Promise<Expense | null> => {
    try {
        const response = await fetch(`${API_URL}/gastos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(expense),
        });
        if (!response.ok) throw new Error('Failed to create expense');
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const deleteExpense = async (id: string): Promise<boolean> => {
    try {
        const response = await fetch(`${API_URL}/gastos/${id}`, {
            method: 'DELETE',
        });
        return response.ok;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export const uploadReceipt = async (file: File): Promise<string | null> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error('Failed to upload receipt');
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error(error);
        return null;
    }
};
