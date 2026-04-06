import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import * as api from '../services/api';

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function PlotModal({ onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [type, setType] = useState('invernadero');
    const [hectareas, setHectareas] = useState('');
    const [capacidad, setCapacidad] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await api.createPlot({
            name,
            type,
            hectareas: parseFloat(hectareas) || 0,
            capacidad_plantas: parseInt(capacidad) || 0
        });
        setIsLoading(false);
        if (result) {
            onSaved();
        } else {
            alert('Error guardando el lote');
        }
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
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nuevo Lote / Invernadero</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre Identificador</label>
                        <input type="text" className="glass-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Invernadero Norte 1" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tipo</label>
                        <select className="glass-input" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="invernadero">Invernadero</option>
                            <option value="suelo_abierto">Suelo Abierto</option>
                            <option value="hidroponia">Hidroponía</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Hectáreas</label>
                            <input type="number" step="0.1" className="glass-input" value={hectareas} onChange={(e) => setHectareas(e.target.value)} placeholder="Ej. 2.5" required />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Capacidad (Plantas)</label>
                            <input type="number" className="glass-input" value={capacidad} onChange={(e) => setCapacidad(e.target.value)} placeholder="Ej. 15000" />
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="glass-input" style={{ width: 'auto', background: 'transparent' }}>Cancelar</button>
                        <button type="submit" className="btn" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Lote'}</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
