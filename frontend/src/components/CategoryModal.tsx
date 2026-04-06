import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Trash2 } from 'lucide-react';
import * as api from '../services/api';
import type { CategoryInput } from '../types';

interface Props {
    onClose: () => void;
    onSaved: () => void;
}

export default function CategoryModal({ onClose, onSaved }: Props) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('🌾');
    const [color, setColor] = useState('#10b981');
    const [priority, setPriority] = useState('Media');
    const [subcategories, setSubcategories] = useState<string[]>([]);
    
    // UI state
    const [newSub, setNewSub] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAddSub = () => {
        if (newSub.trim() && !subcategories.includes(newSub.trim())) {
            setSubcategories([...subcategories, newSub.trim()]);
            setNewSub('');
        }
    };

    const handleRemoveSub = (sub: string) => {
        setSubcategories(subcategories.filter(s => s !== sub));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return alert('El nombre es requerido');

        setIsLoading(true);
        const data: CategoryInput = {
            name,
            icon,
            color,
            priority,
            subcategories,
        };

        const result = await api.createCategory(data);
        setIsLoading(false);
        if (result) {
            onSaved();
        } else {
            alert('Error guardando categoría');
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
            <div className="glass-panel animate-slide-up" style={{ 
                width: '100%', maxWidth: '500px', 
                padding: '2rem', 
                maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Nueva Categoría</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nombre</label>
                        <input 
                            type="text" 
                            className="glass-input" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Ej. Mano de Obra" 
                            required 
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Ícono (Emoji)</label>
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={icon} 
                                onChange={(e) => setIcon(e.target.value)} 
                                maxLength={2}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Color Identificador</label>
                            <input 
                                type="color" 
                                className="glass-input" 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)} 
                                style={{ height: '48px', padding: '0.2rem' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Prioridad</label>
                        <select className="glass-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                        </select>
                    </div>

                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Subcategorías</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <input 
                                type="text" 
                                className="glass-input" 
                                value={newSub} 
                                onChange={(e) => setNewSub(e.target.value)} 
                                placeholder="Agregar subcategoría (Ej. Poda)..." 
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSub())}
                            />
                            <button type="button" className="btn" style={{ padding: '0.75rem' }} onClick={handleAddSub}>
                                <Plus size={20} />
                            </button>
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                            {subcategories.map(sub => (
                                <div key={sub} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid var(--card-border)'
                                }}>
                                    <span style={{ fontSize: '0.9rem' }}>{sub}</span>
                                    <button type="button" onClick={() => handleRemoveSub(sub)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', display: 'flex' }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                            {subcategories.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No hay subcategorías.</p>}
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="glass-input" style={{ width: 'auto', background: 'transparent', cursor: 'pointer' }}>Cancelar</button>
                        <button type="submit" className="btn" disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Guardando...' : 'Guardar Categoría'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
