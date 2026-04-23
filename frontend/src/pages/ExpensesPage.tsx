import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download } from 'lucide-react';
import type { Expense, Category, CropCycle } from '../types';
import * as api from '../services/api';
import ExpenseForm from '../components/ExpenseForm';
import ExpenseList from '../components/ExpenseList';

function getWeekString(dateStr: string) {
    const date = new Date(dateStr);
    const target = new Date(date.valueOf());
    const dayNr = (date.getUTCDay() + 6) % 7;
    target.setUTCDate(target.getUTCDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setUTCMonth(0, 1);
    if (target.getUTCDay() !== 4) {
        target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    const year = target.getUTCFullYear();
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [filterCategory, setFilterCategory] = useState('');
    const [dateFilterType, setDateFilterType] = useState<'month' | 'week' | 'date'>('month');
    const [filterMonth, setFilterMonth] = useState('');
    const [filterWeek, setFilterWeek] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        const [expData, catData, cycleData] = await Promise.all([
            api.fetchExpenses(),
            api.fetchCategories(),
            api.fetchCropCycles()
        ]);
        setExpenses(expData);
        setCategories(catData);
        setCropCycles(cycleData);
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
                '',
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

    // Apply filters locally for now
    const filteredExpenses = expenses.filter(exp => {
        if (filterCategory && exp.category !== filterCategory) return false;

        switch (dateFilterType) {
            case 'month':
                if (filterMonth && !exp.date.startsWith(filterMonth)) return false;
                break;
            case 'week':
                if (filterWeek && getWeekString(exp.date) !== filterWeek) return false;
                break;
            case 'date':
                if (filterDateStart && exp.date < filterDateStart) return false;
                if (filterDateEnd && exp.date > filterDateEnd) return false;
                break;
        }

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
                    <ExpenseList expenses={filteredExpenses} onDeleteExpense={handleDeleteExpense} categories={categories} cropCycles={cropCycles} />
                )}
            </div>
        </div>
    );
}
