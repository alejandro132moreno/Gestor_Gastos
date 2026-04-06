import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { InventoryItemInput } from '../../types';

interface ItemModalProps {
    onClose: () => void;
    onSubmit: (item: InventoryItemInput) => void;
}

export default function ItemModal({ onClose, onSubmit }: ItemModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [unit, setUnit] = useState('');
    const [averageCost, setAverageCost] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            category,
            unit,
            average_cost: parseFloat(averageCost) || 0
        });
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999, padding: '1rem'
        }}>
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Registrar Nuevo Insumo</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre del producto</label>
                        <input className="glass-input" required value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Semilla Rafaello" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Categoría</label>
                        <select className="glass-input" required value={category} onChange={e => setCategory(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <option value="" disabled>Selecciona una categoría...</option>
                            <option value="Semillas">Semillas</option>
                            <option value="Fertilizantes">Fertilizantes</option>
                            <option value="Pesticidas">Pesticidas</option>
                            <option value="Materiales">Materiales</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Unidad de Medida (Ej. Kg, Lts, Piezas)</label>
                        <input className="glass-input" required value={unit} onChange={e => setUnit(e.target.value)} placeholder="Ej. Kg" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Costo Promedio (Por Unidad)</label>
                        <input type="number" step="0.01" className="glass-input" required value={averageCost} onChange={e => setAverageCost(e.target.value)} placeholder="0.00" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Este costo es para calcular el valor total cuando se consuma. (El stock se añade mediante compras, aquí lo iniciamos en 0 por ahora hasta que implementes Entradas y Salidas).</span>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--card-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn" style={{ flex: 1 }}>Guardar Insumo</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
