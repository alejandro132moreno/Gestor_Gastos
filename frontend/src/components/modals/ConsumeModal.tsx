import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { InventoryItem, InventoryConsume, CropCycle } from '../../types';

interface ConsumeModalProps {
    item: InventoryItem;
    cropCycles: CropCycle[];
    onClose: () => void;
    onSubmit: (payload: InventoryConsume) => void;
}

export default function ConsumeModal({ item, cropCycles, onClose, onSubmit }: ConsumeModalProps) {
    const [quantity, setQuantity] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cropCycleId, setCropCycleId] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numericQty = parseFloat(quantity);
        if (numericQty > item.current_stock) {
            alert("No puedes consumir más de la cantidad en stock.");
            return;
        }

        onSubmit({
            quantity: numericQty,
            date,
            crop_cycle_id: cropCycleId || undefined,
            notes: notes || undefined
        });
    };

    const calculatedCost = (parseFloat(quantity) || 0) * item.average_cost;

    return createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 99999, padding: '1rem'
        }}>
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Registrar Consumo</h2>
                    <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Producto a consumir:</p>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{item.name}</p>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)' }}>Stock Disponible: <strong style={{ color: 'var(--text-main)' }}>{item.current_stock} {item.unit}</strong></p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Cantidad a consumir ({item.unit})</label>
                        <input type="number" step="0.01" max={item.current_stock} className="glass-input" required value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Fecha</label>
                        <input type="date" className="glass-input" required value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Destino Deportivo/Agrícola (Ciclo de Cultivo)</label>
                        <select className="glass-input" value={cropCycleId} onChange={e => setCropCycleId(e.target.value)} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <option value="">-- No aplicar a ninguno --</option>
                            {cropCycles.filter(c => c.status === 'ACTIVE').map(cycle => (
                                <option key={cycle.id} value={cycle.id}>Lote: {cycle.plot_id} - Cultivo: {cycle.variety}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Notas u observaciones</label>
                        <textarea className="glass-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Aplicado en todo el lote debido a plaga..." style={{ minHeight: '80px', resize: 'vertical' }} />
                    </div>

                    {calculatedCost > 0 && (
                        <div style={{ textAlign: 'center', padding: '0.5rem', border: '1px solid var(--primary)', borderRadius: '8px', color: 'var(--primary)' }}>
                            Costo estimado de salida: <strong>${calculatedCost.toFixed(2)}</strong>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--card-border)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn" style={{ flex: 1 }}>Registrar Salida</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
