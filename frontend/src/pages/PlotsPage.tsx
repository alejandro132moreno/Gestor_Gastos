import { useState, useEffect } from 'react';
import { Network, Plus, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import type { Plot } from '../types';
import PlotModal from '../components/PlotModal';

export default function PlotsPage() {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadPlots();
    }, []);

    const loadPlots = async () => {
        const data = await api.fetchPlots();
        setPlots(data);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Seguro que deseas eliminar este lote?')) return;
        await api.deletePlot(id);
        loadPlots();
    };

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Lotes e Invernaderos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona los centros de costos fijos de tu producción agrónoma.</p>
                </div>
                <button className="btn" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} />
                    Nuevo Lote
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {plots.map(plot => (
                    <div key={plot.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '12px', color: '#6366f1' }}>
                                    <Network size={24} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{plot.name}</h3>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plot.type.replace('_', ' ')}</span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(plot.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--card-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Hectáreas</p>
                                <p style={{ fontWeight: 600 }}>{plot.hectareas} ha</p>
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Capacidad</p>
                                <p style={{ fontWeight: 600 }}>{plot.capacidad_plantas || 0} p</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {plots.length === 0 && (
                    <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Network size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                        <p>No tienes lotes ni invernaderos registrados.</p>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Crea tu primer lote para poder asignarle ciclos de cultivo.</p>
                    </div>
                )}
            </div>

            {isModalOpen && <PlotModal onClose={() => setIsModalOpen(false)} onSaved={() => { setIsModalOpen(false); loadPlots(); }} />}
        </div>
    );
}
