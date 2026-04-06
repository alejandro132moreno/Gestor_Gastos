import React from 'react';
import type { Expense, Category } from '../types';
import { Trash2, Link as LinkIcon, Sprout, Tag } from 'lucide-react';

interface ExpenseListProps {
    expenses: Expense[];
    categories?: Category[];
    onDeleteExpense: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, categories = [], onDeleteExpense }) => {
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
                gridTemplateColumns: 'minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 80px',
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
                const catObj = categories.find(c => c.name === expense.category);
                const color = catObj?.color || 'var(--primary)';
                const icon = catObj?.icon || '🏷️';
                
                return (
                    <div key={expense.id} className="glass-panel" style={{ 
                        display: 'grid',
                        gridTemplateColumns: 'minmax(150px, 2fr) minmax(120px, 1.5fr) minmax(100px, 1fr) minmax(100px, 1fr) 80px',
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
                            {(expense.subcategory || expense.crop_cycle) && (
                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {expense.subcategory && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Tag size={12} /> {expense.subcategory}</span>
                                    )}
                                    {expense.crop_cycle && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981' }}><Sprout size={12} /> {expense.crop_cycle}</span>
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
                                <span>{icon}</span> {expense.category}
                            </span>
                        </div>

                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            {new Date(expense.date).toLocaleDateString()}
                        </div>

                        <div style={{ fontWeight: 600, fontSize: '1.1rem', textAlign: 'right' }}>
                            ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button onClick={() => onDeleteExpense(expense.id)} className="btn-danger" style={{ 
                                padding: '0.5rem', 
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: 'none', background: 'transparent'
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
