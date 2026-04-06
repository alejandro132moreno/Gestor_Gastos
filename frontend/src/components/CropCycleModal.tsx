import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import * as api from '../services/api';
import type { Plot } from '../types';

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function CropCycleModal({ onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [variety, setVariety] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [hectareas, setHectareas] = useState('');
    const [plotId, setPlotId] = useState('');
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        api.fetchPlots().then(data => {
            setPlots(data);
            if (data.length > 0) setPlotId(data[0].id);
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!plotId) return alert('Debes seleccionar un lote');
        setIsLoading(true);
        const result = await api.createCropCycle({
            name, variety,
            start_date: startDate,
            end_date: endDate,
            hectareas: parseFloat(hectareas) || 0,
            plot_id: plotId,
            status: 'ACTIVE'
        });
        setIsLoading(false);
        if (result) onSaved();
        else alert('Error guardando el ciclo');
    };

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nuevo Ciclo de Cultivo</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre del Ciclo</label>
                        <input type="text" className="glass-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Primavera 2024" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Lote / Invernadero</label>
                        <select className="glass-input" value={plotId} onChange={(e) => setPlotId(e.target.value)} required>
                            {plots.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Variedad</label>
                            <input type="text" className="glass-input" value={variety} onChange={(e) => setVariety(e.target.value)} placeholder="Ej. Rafaello" required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Hectáreas Efectivas</label>
                            <input type="number" step="0.1" className="glass-input" value={hectareas} onChange={(e) => setHectareas(e.target.value)} placeholder="Ej. 1.2" required />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Inicio</label>
                            <input type="date" className="glass-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Fin (Estimado)</label>
                            <input type="date" className="glass-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="glass-input" style={{ width: 'auto', background: 'transparent' }}>Cancelar</button>
                        <button type="submit" className="btn" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Iniciar Ciclo'}</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
