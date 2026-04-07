import { useState, useEffect } from 'react';
import { RefreshCcw, Plus, Activity, Trash2, X } from 'lucide-react';
import * as api from '../services/api';
import type { CropCycle } from '../types';
import CropCycleModal from '../components/CropCycleModal';

export default function CropCyclesPage() {
    const [cycles, setCycles] = useState<CropCycle[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [harvestModal, setHarvestModal] = useState<{isOpen: boolean, id: string, current: number}>({isOpen: false, id: '', current: 0});
    const [harvestForm, setHarvestForm] = useState({ amount: '', action: 'add' });

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

    const handleOpenHarvestModal = (id: string, currentTotal: number) => {
        setHarvestModal({ isOpen: true, id, current: currentTotal });
        setHarvestForm({ amount: '', action: 'add' });
    };

    const handleHarvestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(harvestForm.amount);
        if (isNaN(amount) || amount <= 0) {
            alert('Por favor, introduce una cantidad válida mayor a 0.');
            return;
        }

        let newTotal = harvestModal.current;
        if (harvestForm.action === 'add') {
            newTotal += amount;
        } else {
            newTotal -= amount;
            if (newTotal < 0) newTotal = 0;
        }

        const success = await api.updateCropCycle(harvestModal.id, { total_harvest_kg: newTotal });
        if (success) {
            setHarvestModal({ isOpen: false, id: '', current: 0 });
            loadCycles();
        } else {
            alert('Hubo un error al actualizar la cosecha.');
        }
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{cycle.total_harvest_kg || 0} kg</p>
                                        <button 
                                            title="Actualizar cosecha"
                                            onClick={() => handleOpenHarvestModal(cycle.id, cycle.total_harvest_kg || 0)} 
                                            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            <RefreshCcw size={14} />
                                        </button>
                                    </div>
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

            {harvestModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="glass-panel animate-slide-up" style={{ padding: '2rem', width: '100%', maxWidth: '400px', position: 'relative' }}>
                        <button 
                            onClick={() => setHarvestModal({ isOpen: false, id: '', current: 0 })}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Actualizar Cosecha Total</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Cosecha actual: <strong style={{ color: 'var(--primary)' }}>{harvestModal.current} kg</strong>
                        </p>
                        <form onSubmit={handleHarvestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Acción</label>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="action" 
                                            value="add" 
                                            checked={harvestForm.action === 'add'} 
                                            onChange={(e) => setHarvestForm({...harvestForm, action: e.target.value})}
                                        />
                                        Añadir (Sumar)
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input 
                                            type="radio" 
                                            name="action" 
                                            value="subtract" 
                                            checked={harvestForm.action === 'subtract'} 
                                            onChange={(e) => setHarvestForm({...harvestForm, action: e.target.value})}
                                        />
                                        Quitar (Restar)
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Cantidad (kg)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.01"
                                    required 
                                    className="glass-input" 
                                    placeholder="Ej: 50"
                                    value={harvestForm.amount} 
                                    onChange={(e) => setHarvestForm({...harvestForm, amount: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                Guardar Cosecha
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
