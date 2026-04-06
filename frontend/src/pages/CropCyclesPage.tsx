import { useState, useEffect } from 'react';
import { RefreshCcw, Plus, Activity, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import type { CropCycle } from '../types';
import CropCycleModal from '../components/CropCycleModal';

export default function CropCyclesPage() {
    const [cycles, setCycles] = useState<CropCycle[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadCycles();
    }, []);

    const loadCycles = async () => {
        const data = await api.fetchCropCycles();
        setCycles(data);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este ciclo?')) return;
        await api.deleteCropCycle(id);
        loadCycles();
    };

    const getStatusColor = (status: string) => {
        if (status === 'ACTIVE') return '#10b981';
        if (status === 'COMPLETED') return '#6366f1';
        return '#ef4444';
    };

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Ciclos de Cultivo</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Registra y monitorea el avance y costos desde la siembra hasta la cosecha.</p>
                </div>
                <button className="btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    Nuevo Ciclo
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                {cycles.map(cycle => (
                    <div key={cycle.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '16px', color: '#10b981' }}>
                                    <RefreshCcw size={28} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 600 }}>{cycle.name}</h3>
                                        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '12px', border: `1px solid ${getStatusColor(cycle.status)}`, color: getStatusColor(cycle.status) }}>
                                            {cycle.status}
                                        </span>
                                    </div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Variedad: {cycle.variety} • Hectáreas: {cycle.hectareas}</p>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(cycle.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={20} /></button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: 'var(--text-muted)' }}><Activity size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Duración Proyectada</p>
                                    <p style={{ fontWeight: 500 }}>{cycle.start_date} al {cycle.end_date}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: 'var(--text-muted)' }}><RefreshCcw size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Gastos Acumulados</p>
                                    <p style={{ fontWeight: 600, color: 'var(--danger)' }}>${(cycle.total_expenses || 0).toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ color: 'var(--text-muted)' }}><Activity size={18} /></div>
                                <div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>Cosecha Total</p>
                                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{cycle.total_harvest_kg || 0} kg</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                
                {cycles.length === 0 && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <RefreshCcw size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>No tienes ciclos de cultivo registrados.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Un ciclo agrupa tus gastos a lo largo del tiempo de cosecha.</p>
                    </div>
                )}
            </div>

            {isModalOpen && <CropCycleModal onClose={() => setIsModalOpen(false)} onSaved={() => { setIsModalOpen(false); loadCycles(); }} />}
        </div>
    );
}
