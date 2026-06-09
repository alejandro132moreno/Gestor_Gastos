import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Copy, Percent, AlertTriangle } from 'lucide-react';
import type { Budget, Expense, Category, CropCycle } from '../types';
import * as api from '../services/api';
import BudgetProgressBar from '../components/BudgetProgressBar';

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [budgetType, setBudgetType] = useState<'month' | 'cycle'>('month');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [selectedCycleId, setSelectedCycleId] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    // Form State
    const [newCategoryId, setNewCategoryId] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [calcHectares, setCalcHectares] = useState('');
    const [costPerHectare, setCostPerHectare] = useState('');

    useEffect(() => {
        loadStaticData();
    }, []);

    useEffect(() => {
        loadBudgetsAndExpenses();
    }, [budgetType, selectedMonth, selectedCycleId]);

    const loadStaticData = async () => {
        const [catData, cycleData] = await Promise.all([
            api.fetchCategories(),
            api.fetchCropCycles()
        ]);
        setCategories(catData);
        setCropCycles(cycleData);
        if (cycleData.length > 0) {
            setSelectedCycleId(cycleData[0].id);
        }
    };

    const loadBudgetsAndExpenses = async () => {
        setIsLoading(true);
        const [budData, expData, alertData] = await Promise.all([
            budgetType === 'month' 
                ? api.fetchBudgets(selectedMonth, undefined) 
                : api.fetchBudgets(undefined, selectedCycleId),
            api.fetchExpenses(),
            api.fetchBudgetAlerts()
        ]);
        
        setBudgets(budData);
        setExpenses(expData);
        setAlerts(alertData);
        setIsLoading(false);
    };

    const handleAddBudget = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryId || !newAmount) return;

        setIsLoading(true);
        const payload: any = {
            category_id: newCategoryId,
            amount: parseFloat(newAmount)
        };

        if (budgetType === 'month') {
            payload.month = selectedMonth;
        } else {
            payload.crop_cycle_id = selectedCycleId;
        }

        const result = await api.createBudget(payload);
        
        if (result) {
            setBudgets([...budgets, result]);
            setIsFormOpen(false);
            setNewCategoryId('');
            setNewAmount('');
            setCalcHectares('');
            setCostPerHectare('');
            // Reload alerts
            const updatedAlerts = await api.fetchBudgetAlerts();
            setAlerts(updatedAlerts);
        } else {
            alert('Error guardando presupuesto');
        }
        setIsLoading(false);
    };

    const handleDeleteBudget = async (id: string) => {
        if (!confirm('¿Eliminar este presupuesto?')) return;
        const timeKey = budgetType === 'month' ? selectedMonth : selectedCycleId;
        const success = await api.deleteBudget(id, timeKey);
        if (success) {
            setBudgets(budgets.filter(b => b.id !== id));
            // Reload alerts
            const updatedAlerts = await api.fetchBudgetAlerts();
            setAlerts(updatedAlerts);
        } else {
            alert('Error al eliminar presupuesto. Solo Administradores y Gerentes tienen permiso.');
        }
    };

    const getPrevMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-').map(Number);
        const prevDate = new Date(year, month - 2, 1);
        return prevDate.toISOString().slice(0, 7);
    };

    const handleCopyPreviousMonth = async () => {
        if (budgetType !== 'month') {
            alert('La copia de presupuesto solo es válida en presupuestos mensuales.');
            return;
        }
        const prevMonth = getPrevMonth(selectedMonth);
        setIsLoading(true);
        const prevBudgets = await api.fetchBudgets(prevMonth);
        if (prevBudgets.length === 0) {
            alert(`No hay presupuestos registrados en el mes anterior (${prevMonth}).`);
            setIsLoading(false);
            return;
        }
        
        let copiedCount = 0;
        for (const pb of prevBudgets) {
            if (budgets.some(b => b.category_id === pb.category_id)) continue;
            
            await api.createBudget({
                category_id: pb.category_id,
                month: selectedMonth,
                amount: pb.amount
            });
            copiedCount++;
        }
        
        alert(`Se copiaron ${copiedCount} presupuestos de ${prevMonth} al mes actual ${selectedMonth}.`);
        await loadBudgetsAndExpenses();
    };

    const handleHectareCalc = () => {
        const cost = parseFloat(costPerHectare);
        const hectares = parseFloat(calcHectares);
        if (!isNaN(cost) && !isNaN(hectares) && cost > 0 && hectares > 0) {
            setNewAmount((cost * hectares).toString());
        }
    };

    // Calculate budget spent on the fly
    const budgetsWithSpent = budgets.map(budget => {
        const cat = categories.find(c => c.id === budget.category_id || c.name === budget.category_id);
        const catName = cat ? cat.name : budget.category_id;
        
        // Find matching expenses
        let spent = 0;
        if (budgetType === 'month') {
            spent = expenses.filter(e => 
                e.category === catName && 
                e.date.startsWith(selectedMonth)
            ).reduce((acc, curr) => acc + curr.amount, 0);
        } else {
            spent = expenses.filter(e => 
                e.category === catName && 
                e.crop_cycle === selectedCycleId
            ).reduce((acc, curr) => acc + curr.amount, 0);
        }

        return { ...budget, spent, categoryObj: cat };
    });

    const activeCycleAlerts = alerts.filter(a => {
        if (budgetType === 'month') {
            return a.month === selectedMonth;
        } else {
            return a.budget_id && budgets.some(b => b.id === a.budget_id);
        }
    });

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Presupuestos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Control visual de límites mensuales y por ciclo</p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="glass-panel" style={{ display: 'flex', padding: '0.25rem', borderRadius: '12px' }}>
                        <button 
                            onClick={() => setBudgetType('month')}
                            style={{
                                background: budgetType === 'month' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Mensual
                        </button>
                        <button 
                            onClick={() => setBudgetType('cycle')}
                            style={{
                                background: budgetType === 'cycle' ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: 'none', color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Por Ciclo
                        </button>
                    </div>

                    {budgetType === 'month' ? (
                        <input 
                            type="month" 
                            className="glass-input" 
                            value={selectedMonth} 
                            onChange={(e) => setSelectedMonth(e.target.value)} 
                            style={{ width: 'auto' }}
                        />
                    ) : (
                        <select 
                            className="glass-input" 
                            value={selectedCycleId}
                            onChange={(e) => setSelectedCycleId(e.target.value)}
                            style={{ width: 'auto', minWidth: '180px' }}
                        >
                            {cropCycles.map(cycle => (
                                <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.variety})</option>
                            ))}
                        </select>
                    )}

                    {budgetType === 'month' && (
                        <button 
                            className="btn" 
                            onClick={handleCopyPreviousMonth} 
                            title="Copiar presupuestos del mes anterior"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                        >
                            <Copy size={16} />
                            <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } } as any}>Copiar Mes Ant.</span>
                        </button>
                    )}

                    <button 
                        className="btn" 
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        <span>Definir Presupuesto</span>
                    </button>
                </div>
            </div>

            {/* ALERTS SECTION */}
            {activeCycleAlerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeCycleAlerts.map(alertItem => (
                        <div key={alertItem.gasto_id} className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                            <div style={{ color: 'var(--danger)' }}><AlertTriangle size={24} /></div>
                            <div>
                                <h4 style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>Límite Superado ({alertItem.category_name})</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                                    {alertItem.message} Gasto real: <strong>${alertItem.spent.toLocaleString()}</strong> de un límite de <strong>${alertItem.limit.toLocaleString()}</strong>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                        Definir Presupuesto - {budgetType === 'month' ? selectedMonth : cropCycles.find(c => c.id === selectedCycleId)?.name}
                    </h3>
                    
                    {/* Hectare budget scaling widget */}
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px dashed var(--card-border)', marginBottom: '1.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Percent size={16} color="var(--primary)" /> Calculadora de Presupuesto por Hectárea (Opcional)
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Hectáreas</label>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    className="glass-input" 
                                    placeholder="Ej: 5.5" 
                                    value={calcHectares} 
                                    onChange={e => setCalcHectares(e.target.value)} 
                                />
                            </div>
                            <div style={{ flex: 1, minWidth: '150px' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Monto por Hectárea ($)</label>
                                <input 
                                    type="number" 
                                    className="glass-input" 
                                    placeholder="Ej: 120" 
                                    value={costPerHectare} 
                                    onChange={e => setCostPerHectare(e.target.value)} 
                                />
                            </div>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.25rem' }} onClick={handleHectareCalc}>
                                Calcular Límite
                            </button>
                        </div>
                    </div>

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
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Límite Presupuestado ($)</label>
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
                    <p style={{ color: 'var(--text-muted)' }}>No hay presupuestos definidos para este período.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {budgetsWithSpent.map(b => (
                        <div key={b.id} style={{ position: 'relative' }}>
                            <button 
                                onClick={() => handleDeleteBudget(b.id)}
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
