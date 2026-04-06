import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import type { Expense, Category } from '../types';
import * as api from '../services/api';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [filterMonth, setFilterMonth] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [expData, catData] = await Promise.all([
            api.fetchExpenses(),
            api.fetchCategories()
        ]);
        setExpenses(expData);
        setCategories(catData);
        setIsLoading(false);
    };

    const handleAddExpense = async (data: any) => {
        setIsLoading(true);
        const result = await api.createExpense(data);
        if (result) {
            setExpenses([result, ...expenses]);
            setIsFormOpen(false);
        } else {
            alert('Error guardando gasto');
        }
        setIsLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
        const success = await api.deleteExpense(id);
        if (success) {
            setExpenses(expenses.filter(e => e.id !== id));
        } else {
            alert('Error eliminando gasto');
        }
    };

    // Apply filters locally for now
    const filteredExpenses = expenses.filter(exp => {
        if (filterCategory && exp.category !== filterCategory) return false;
        if (filterMonth && !exp.date.startsWith(filterMonth)) return false;
        return true;
    });

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Registro de Gastos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Control agrícola y operativo</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
                        <Download size={20} />
                        <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } } as any}>Exportar</span>
                    </button>
                    <button 
                        className="btn" 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        <span>Nuevo Gasto</span>
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Registrar Nuevo Gasto</h3>
                    <ExpenseForm 
                        onAddExpense={handleAddExpense} 
                        isLoading={isLoading} 
                        categories={categories}
                        onCancel={() => setIsFormOpen(false)}
                    />
                </div>
            )}

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                        <Filter size={20} />
                        <span>Filtros:</span>
                    </div>
                    <select 
                        className="glass-input" 
                        style={{ width: 'auto', minWidth: '200px', padding: '0.5rem 1rem' }}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="">Todas las Categorías</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                    <input 
                        type="month" 
                        className="glass-input" 
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                    />
                </div>

                {isLoading && expenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando gastos...</div>
                ) : (
                    <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} categories={categories} />
                )}
            </div>
        </div>
    );
}
