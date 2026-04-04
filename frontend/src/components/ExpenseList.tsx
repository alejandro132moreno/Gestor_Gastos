import React from 'react';
import type { Expense } from '../types';

interface ExpenseListProps {
    expenses: Expense[];
    onDeleteExpense: (id: string) => void;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
    if (expenses.length === 0) {
        return (
            <div className="glass-panel animate-slide-up" style={{ padding: '2rem', textAlign: 'center', animationDelay: '0.2s', marginTop: '2rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>Aún no hay gastos registrados. ¡Comienza a añadir tus finanzas!</p>
            </div>
        );
    }

    return (
        <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem', animationDelay: '0.2s', marginTop: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: 600 }}>Tus Gastos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {expenses.map((expense) => (
                    <div key={expense.id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <div>
                            <div style={{ fontWeight: 500, fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {expense.description}
                                {expense.receipt_url && (
                                    <a href={expense.receipt_url} target="_blank" rel="noreferrer" title="Ver comprobante"
                                        style={{ fontSize: '0.8rem', color: 'var(--secondary)', textDecoration: 'none', border: '1px solid var(--secondary)', borderRadius: '4px', padding: '0.1rem 0.4rem', marginLeft: '0.5rem' }}>
                                        📎 Comprobante
                                    </a>
                                )}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                                <span style={{ border: '1px solid var(--primary)', borderRadius: '12px', padding: '0 0.5rem', color: 'var(--primary)' }}>{expense.category}</span>
                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '1.25rem' }}>${expense.amount.toFixed(2)}</span>
                            <button onClick={() => onDeleteExpense(expense.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExpenseList;
