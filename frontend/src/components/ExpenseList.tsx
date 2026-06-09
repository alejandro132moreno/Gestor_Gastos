import React from 'react';
import type { Expense, Category, CropCycle } from '../types';
import { Trash2, Link as LinkIcon, Sprout, Tag, Edit2, Network } from 'lucide-react';
import * as api from '../services/api';

interface ExpenseListProps {
    expenses: Expense[];
    categories?: Category[];
    cropCycles?: CropCycle[];
    onDeleteExpense: (id: string) => void;
    onEditExpense: (expense: Expense) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, categories = [], cropCycles = [], onDeleteExpense, onEditExpense }) => {
    const [plots, setPlots] = React.useState<any[]>([]);

    React.useEffect(() => {
        api.fetchPlots().then(data => setPlots(data));
    }, []);

    if (expenses.length === 0) {
        return (
            <div className="glass-panel animate-slide-up" style={{ padding: '3rem', textAlign: 'center', marginTop: '1rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>No se encontraron gastos que coincidan con los filtros.</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 100px',
                gap: '1rem',
                padding: '0.75rem 1.5rem',
                borderBottom: '1px solid var(--card-border)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                <div>Descripción</div>
                <div>Categoría</div>
                <div>Fecha</div>
                <div style={{ textAlign: 'right' }}>Monto</div>
                <div style={{ textAlign: 'center' }}>Acción</div>
            </div>

            {expenses.map((expense) => {
                const catObj = categories.find(c => c.name === expense.category || expense.category.endsWith(c.name));
                const color = catObj?.color || 'var(--primary)';
                const icon = catObj?.icon || '🏷️';
                const plotObj = plots.find(p => p.id === expense.plot_id);
                
                return (
                    <div key={expense.id} className="glass-panel" style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 100px',
                        gap: '1rem',
                        padding: '1rem 1.5rem', 
                        alignItems: 'center', 
                        background: 'rgba(255, 255, 255, 0.02)',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {expense.description}
                                {expense.receipt_url && (
                                    <a href={expense.receipt_url} target="_blank" rel="noreferrer" title="Ver comprobante"
                                        style={{ display: 'inline-flex', color: 'var(--secondary)', textDecoration: 'none' }}>
                                        <LinkIcon size={14} />
                                    </a>
                                )}
                            </div>
                            {(expense.subcategory || expense.crop_cycle || expense.plot_id || expense.provider_name) && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {expense.subcategory && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={12} /> {expense.subcategory}</span>
                                    )}
                                    {expense.plot_id && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6366f1' }}>
                                            <Network size={12} /> 
                                            {plotObj ? plotObj.name : 'Lote'}
                                        </span>
                                    )}
                                    {expense.crop_cycle && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}>
                                            <Sprout size={12} /> 
                                            {cropCycles?.find(c => c.id === expense.crop_cycle)?.name || 'Ciclo'} 
                                        </span>
                                    )}
                                    {expense.provider_name && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary)' }}>
                                            🚚 {expense.provider_name}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ 
                                border: `1px solid ${color}40`, 
                                background: `${color}15`,
                                borderRadius: '12px', 
                                padding: '0.2rem 0.6rem', 
                                color: color,
                                fontSize: '0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem'
                            }}>
                                <span>{icon}</span> {catObj?.name || expense.category}
                            </span>
                        </div>

                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {new Date(expense.date).toLocaleDateString()}
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'right' }}>
                            ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button onClick={() => onEditExpense(expense)} style={{ 
                                padding: '0.5rem', 
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', background: 'transparent', color: 'var(--text-muted)',
                                cursor: 'pointer'
                            }} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={() => onDeleteExpense(expense.id)} className="btn-danger" style={{ 
                                padding: '0.5rem', 
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', background: 'transparent',
                                cursor: 'pointer'
                            }} title="Eliminar">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ExpenseList;
