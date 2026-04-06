import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Budget, Expense, Category } from '../types';
import * as api from '../services/api';
import BudgetProgressBar from '../components/BudgetProgressBar';

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form State
    const [newCategoryId, setNewCategoryId] = useState('');
    const [newAmount, setNewAmount] = useState('');

    useEffect(() => {
        loadData();
    }, [selectedMonth]);

    const loadData = async () => {
        setIsLoading(true);
        const [budData, expData, catData] = await Promise.all([
            api.fetchBudgets(selectedMonth),
            api.fetchExpenses(), // Fetch all or pass month if backend supported it
            api.fetchCategories()
        ]);
        
        setBudgets(budData);
        setExpenses(expData);
        setCategories(catData);
        setIsLoading(false);
    };

    const handleAddBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryId || !newAmount) return;

        setIsLoading(true);
        const result = await api.createBudget({
            category_id: newCategoryId,
            month: selectedMonth,
            amount: parseFloat(newAmount)
        });
        
        if (result) {
            setBudgets([...budgets, result]);
            setIsFormOpen(false);
            setNewCategoryId('');
            setNewAmount('');
        }
        setIsLoading(false);
    };

    const handleDeleteBudget = async (id: string, month: string) => {
        if (!confirm('¿Eliminar este presupuesto?')) return;
        const success = await api.deleteBudget(id, month);
        if (success) {
            setBudgets(budgets.filter(b => b.id !== id));
        }
    };

    // Calculate aggregated spent amounts
    const budgetsWithSpent = budgets.map(budget => {
        const cat = categories.find(c => c.id === budget.category_id || c.name === budget.category_id);
        const catName = cat ? cat.name : budget.category_id;
        
        // Find expenses for this category in the selected month
        const spent = expenses.filter(e => 
            e.category === catName && 
            e.date.startsWith(budget.month)
        ).reduce((acc, curr) => acc + curr.amount, 0);

        return { ...budget, spent, categoryObj: cat };
    });

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Presupuestos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Control visual de límites mensuales</p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input 
                        type="month" 
                        className="glass-input" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        style={{ width: 'auto' }}
                    />
                    <button 
                        className="btn" 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } } as any}>Nuevo Presupuesto</span>
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Definir Presupuesto - {selectedMonth}</h3>
                    <form onSubmit={handleAddBudget} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Categoría</label>
                            <select 
                                className="glass-input" 
                                value={newCategoryId} 
                                onChange={(e) => setNewCategoryId(e.target.value)}
                                required
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Límite Mensual ($)</label>
                            <input 
                                type="number" 
                                className="glass-input" 
                                step="0.01" 
                                value={newAmount} 
                                onChange={(e) => setNewAmount(e.target.value)} 
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="glass-input" style={{ background: 'transparent' }} onClick={() => setIsFormOpen(false)}>Cancelar</button>
                            <button type="submit" className="btn" disabled={isLoading}>Guardar</button>
                        </div>
                    </form>
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando presupuestos...</div>
            ) : budgetsWithSpent.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>No hay presupuestos definidos para este mes.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {budgetsWithSpent.map(b => (
                        <div key={b.id} style={{ position: 'relative' }}>
                            <button 
                                onClick={() => handleDeleteBudget(b.id, b.month)}
                                style={{ 
                                    position: 'absolute', top: '1rem', right: '1rem', 
                                    background: 'transparent', border: 'none', color: 'var(--text-muted)',
                                    cursor: 'pointer', zIndex: 10
                                }}
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                            <BudgetProgressBar 
                                categoryName={b.categoryObj?.name || b.category_id}
                                limit={b.amount}
                                spent={b.spent}
                                color={b.categoryObj?.color || 'var(--primary)'}
                                icon={b.categoryObj?.icon || '📈'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
