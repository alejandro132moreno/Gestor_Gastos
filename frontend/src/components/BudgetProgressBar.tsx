import React from 'react';

interface Props {
    categoryName: string;
    limit: number;
    spent: number;
    color: string;
    icon: string;
}

export default function BudgetProgressBar({ categoryName, limit, spent, color, icon }: Props) {
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
    
    // Determine status color based on percentage
    let statusColor = '#10b981'; // Green (Safe)
    if (percentage > 90) statusColor = '#ef4444'; // Red (Danger)
    else if (percentage > 75) statusColor = '#f59e0b'; // Yellow (Warning)

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: `4px solid ${statusColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ 
                        width: '40px', height: '40px', 
                        borderRadius: '10px', 
                        background: `${color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.25rem'
                    }}>
                        {icon}
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>{categoryName}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                            {percentage.toFixed(0)}% del límite
                        </p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.2rem', color: statusColor }}>
                        ${spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        de ${limit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>

            <div style={{ 
                height: '8px', 
                background: 'rgba(255,255,255,0.1)', 
                borderRadius: '4px',
                overflow: 'hidden'
            }}>
                <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: statusColor,
                    transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    borderRadius: '4px'
                }} />
            </div>
            
            {percentage > 90 && (
                <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    ⚠️ Has excedido o estás muy cerca del límite de este presupuesto.
                </p>
            )}
        </div>
    );
}
