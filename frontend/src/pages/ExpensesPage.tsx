import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import type { Expense, Category, CropCycle } from '../types';
import * as api from '../services/api';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    
    // UI State
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [dateFilterType, setDateFilterType] = useState<'month' | 'week' | 'date'>('month');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterWeek, setFilterWeek] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    // Pagination
    const limit = 15;
    const [offset, setOffset] = useState(0);

    // Fetch initial static lists
    useEffect(() => {
        Promise.all([
            api.fetchCategories(),
            api.fetchCropCycles()
        ]).then(([catData, cycleData]) => {
            setCategories(catData);
            setCropCycles(cycleData);
        });
    }, []);

    // Reload expenses when filters or pagination changes
    useEffect(() => {
        loadExpenses();
    }, [filterCategory, dateFilterType, filterMonth, filterWeek, filterDateStart, filterDateEnd, limit, offset]);

    const loadExpenses = async () => {
        setIsLoading(true);
        const params: any = {
            limit,
            offset
        };

        if (filterCategory) params.category = filterCategory;

        if (dateFilterType === 'month' && filterMonth) {
            params.date_start = `${filterMonth}-01`;
            params.date_end = `${filterMonth}-31`;
        } else if (dateFilterType === 'week' && filterWeek) {
            const parts = filterWeek.split('-W');
            if (parts.length === 2) {
                const year = parseInt(parts[0]);
                const week = parseInt(parts[1]);
                const d = new Date(year, 0, 1 + (week - 1) * 7);
                const day = d.getDay();
                const start = new Date(d.setDate(d.getDate() - day + 1));
                const end = new Date(d.setDate(d.getDate() + 6));
                params.date_start = start.toISOString().split('T')[0];
                params.date_end = end.toISOString().split('T')[0];
            }
        } else if (dateFilterType === 'date') {
            if (filterDateStart) params.date_start = filterDateStart;
            if (filterDateEnd) params.date_end = filterDateEnd;
        }

        const data = await api.fetchExpenses(params);
        setExpenses(data);
        setIsLoading(false);
    };

    const handleSubmitExpense = async (data: any) => {
        setIsLoading(true);
        if (editingExpense) {
            const result = await api.updateExpense(editingExpense.id, data);
            if (result) {
                setExpenses(expenses.map(e => e.id === editingExpense.id ? result : e));
                setIsFormOpen(false);
                setEditingExpense(null);
            } else {
                alert('Error al actualizar gasto');
            }
        } else {
            const result = await api.createExpense(data);
            if (result) {
                setExpenses([result, ...expenses]);
                setIsFormOpen(false);
            } else {
                alert('Error al guardar gasto');
            }
        }
        setIsLoading(false);
    };

    const handleDeleteExpense = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este gasto?')) return;
        const success = await api.deleteExpense(id);
        if (success) {
            setExpenses(expenses.filter(e => e.id !== id));
        } else {
            alert('Error eliminando gasto. Solo Administradores, Gerentes y Supervisores tienen permiso.');
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setIsFormOpen(true);
    };

    const handleCancelForm = () => {
        setIsFormOpen(false);
        setEditingExpense(null);
    };

    const handleExportCSV = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!expenses || expenses.length === 0) {
            alert('No hay datos para exportar.');
            return;
        }
        try {
            const headers = ['Fecha', 'Categoría', 'Descripción', 'Monto', 'Lote', 'Ciclo'];
            const rows = expenses.map(exp => [
                exp.date || '',
                exp.category || '',
                `"${(exp.description || '').replace(/"/g, '""')}"`,
                exp.amount || 0,
                exp.plot_id || '',
                exp.crop_cycle || ''
            ]);
            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'gastos_exportados.csv';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar CSV:', error);
            alert('Error al generar el archivo para descargar.');
        }
    };

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Registro de Gastos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Control agrícola y operativo</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn"
                        onClick={handleExportCSV}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
                    >
                        <Download size={20} />
                        <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } } as any}>Exportar</span>
                    </button>
                    <button
                        className="btn"
                        onClick={() => { setEditingExpense(null); setIsFormOpen(!isFormOpen); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} />
                        <span>Nuevo Gasto</span>
                    </button>
                </div>
            </div>

            {isFormOpen && (
                <div className="glass-panel animate-slide-up" style={{ padding: '2rem', marginBottom: '1rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>
                        {editingExpense ? 'Editar Gasto Seleccionado' : 'Registrar Nuevo Gasto'}
                    </h3>
                    <ExpenseForm
                        onSubmitExpense={handleSubmitExpense}
                        isLoading={isLoading}
                        categories={categories}
                        onCancel={handleCancelForm}
                        initialData={editingExpense}
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

                    <span style={{ color: 'var(--text-muted)' }}>|</span>

                    <select
                        className="glass-input"
                        style={{ width: 'auto', padding: '0.5rem 1rem' }}
                        value={dateFilterType}
                        onChange={(e) => setDateFilterType(e.target.value as any)}
                    >
                        <option value="month">Por Mes</option>
                        <option value="week">Por Semana</option>
                        <option value="date">Por Fechas</option>
                    </select>

                    {dateFilterType === 'month' && (
                        <input
                            type="month"
                            className="glass-input"
                            style={{ width: 'auto', padding: '0.5rem 1rem' }}
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value)}
                        />
                    )}

                    {dateFilterType === 'week' && (
                        <input
                            type="week"
                            className="glass-input"
                            style={{ width: 'auto', padding: '0.5rem 1rem' }}
                            value={filterWeek}
                            onChange={(e) => setFilterWeek(e.target.value)}
                        />
                    )}

                    {dateFilterType === 'date' && (
                        <>
                            <input
                                type="date"
                                className="glass-input"
                                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                                value={filterDateStart}
                                onChange={(e) => setFilterDateStart(e.target.value)}
                                title="Fecha inicio"
                            />
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                            <input
                                type="date"
                                className="glass-input"
                                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                                value={filterDateEnd}
                                onChange={(e) => setFilterDateEnd(e.target.value)}
                                title="Fecha fin"
                            />
                        </>
                    )}
                </div>

                {isLoading && expenses.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando gastos...</div>
                ) : (
                    <ExpenseList 
                        expenses={expenses} 
                        onDeleteExpense={handleDeleteExpense} 
                        onEditExpense={handleEditExpense}
                        categories={categories} 
                        cropCycles={cropCycles} 
                    />
                )}
                
                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Mostrando hasta {limit} gastos
                    </span>
                    <button 
                        className="glass-input" 
                        style={{ width: 'auto', padding: '0.4rem 1rem', cursor: offset === 0 ? 'default' : 'pointer', opacity: offset === 0 ? 0.5 : 1 }}
                        disabled={offset === 0} 
                        onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                        Anterior
                    </button>
                    <button 
                        className="glass-input" 
                        style={{ width: 'auto', padding: '0.4rem 1rem', cursor: expenses.length < limit ? 'default' : 'pointer', opacity: expenses.length < limit ? 0.5 : 1 }}
                        disabled={expenses.length < limit}
                        onClick={() => setOffset(offset + limit)}
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </div>
    );
}
