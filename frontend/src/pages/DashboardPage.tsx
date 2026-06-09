import { useEffect, useState } from 'react';
import { DollarSign, AlertCircle, Calendar } from 'lucide-react';
import * as api from '../services/api';
import type { DashboardSummary } from '../types';
import ExpenseByCategoryChart from '../components/charts/ExpenseByCategoryChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import '../index.css';

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        setIsLoading(true);
        const data = await api.fetchDashboardSummary();
        if (data) setSummary(data);
        setIsLoading(false);
    };

    if (isLoading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando métricas...</div>;
    }

    if (!summary) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>Error cargando el dashboard. Asegúrate de que el backend está corriendo.</div>;
    }

    const totalSpent = summary.total_spent || 0;

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
                <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Vista General</h2>
                <p style={{ color: 'var(--text-muted)' }}>Métricas clave y resumen analítico.</p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '16px', color: '#6366f1' }}>
                        <DollarSign size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Gasto Histórico Total</p>
                        <h3 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '1rem', borderRadius: '16px', color: '#ec4899' }}>
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Top Categoría</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
                            {Object.entries(summary.spending_by_category).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'Ninguna'}
                        </h3>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px', color: '#10b981' }}>
                        <Calendar size={28} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Mes más alto</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600, margin: 0 }}>
                            {Object.entries(summary.monthly_trend).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Desglose por Categoría (Top 5)</h3>
                    {Object.keys(summary.spending_by_category).length > 0 ? (
                        <ExpenseByCategoryChart data={summary.spending_by_category} />
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay datos suficientes</p>
                    )}
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Evolución del Gasto (Mensual)</h3>
                    {Object.keys(summary.monthly_trend).length > 0 ? (
                        <MonthlyTrendChart data={summary.monthly_trend} />
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No hay datos suficientes</p>
                    )}
                </div>
            </div>

            {/* Recent Expenses Table */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Gastos Recientes</h3>
                {summary.recent_expenses.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem' }}>Categoría</th>
                                    <th style={{ padding: '0.75rem' }}>Descripción</th>
                                    <th style={{ padding: '0.75rem' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.recent_expenses.map((exp, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '0.75rem' }}>{exp.date}</td>
                                        <td style={{ padding: '0.75rem' }}>{exp.category}</td>
                                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{exp.description}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>${exp.amount.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No hay gastos registrados todavía.</p>
                )}
            </div>
        </div>
    );
}
