import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Leaf, PackageMinus } from 'lucide-react';
import { fetchInventoryItems, createInventoryItem, consumeInventoryItem, fetchCropCycles } from '../services/api';
import type { InventoryItem, InventoryItemInput, CropCycle, InventoryConsume } from '../types';
import ItemModal from '../components/modals/ItemModal';
import ConsumeModal from '../components/modals/ConsumeModal';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [consumeModalData, setConsumeModalData] = useState<{ isOpen: boolean; item?: InventoryItem }>({ isOpen: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [itemsData, cyclesData] = await Promise.all([
            fetchInventoryItems(),
            fetchCropCycles()
        ]);
        setItems(itemsData);
        setCropCycles(cyclesData);
    };

    const handleCreateItem = async (itemInput: InventoryItemInput) => {
        try {
            await createInventoryItem(itemInput);
            await loadData();
            setIsItemModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleConsumeItem = async (itemId: string, consumePayload: InventoryConsume) => {
        try {
            await consumeInventoryItem(itemId, consumePayload);
            await loadData();
            setConsumeModalData({ isOpen: false });
        } catch (error) {
            console.error(error);
            alert("Error al consumir el inventario (ej. validación de stock excedido).");
        }
    };

    return (
        <div className="animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PackageSearch size={32} color="var(--primary)" />
                        Inventario
                    </h2>
                    <p style={{ color: 'var(--text-muted)' }}>Maneja existencias y consumos de insumos agrícolas.</p>
                </div>
                <button className="btn" onClick={() => setIsItemModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> Nuevo Insumo
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {items.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <Leaf size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <h3>Aún no tienes insumos en tu almacén</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Agrega productos como Semillas o Fertilizantes para gestionar tu stock.</p>
                    </div>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ 
                                        backgroundColor: 'rgba(16, 185, 129, 0.2)', 
                                        color: '#10b981',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600
                                    }}>
                                        {item.category}
                                    </span>
                                    <h3 style={{ marginTop: '0.5rem', fontSize: '1.25rem', marginBottom: '0.25rem' }}>{item.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        Costo Promedio: ${item.average_cost.toFixed(2)} / {item.unit}
                                    </p>
                                </div>
                            </div>
                            
                            <div style={{ 
                                backgroundColor: 'rgba(0,0,0,0.2)', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                marginBottom: '1rem',
                                borderLeft: item.current_stock < 10 ? '4px solid var(--danger)' : '4px solid var(--primary)'
                            }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Stock Actual</p>
                                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{item.current_stock.toFixed(2)} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>{item.unit}</span></p>
                            </div>

                            <button 
                                onClick={() => setConsumeModalData({ isOpen: true, item })}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    backgroundColor: 'rgba(255,255,255,0.05)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'var(--text-main)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                                disabled={item.current_stock <= 0}
                            >
                                <PackageMinus size={18} />
                                {item.current_stock > 0 ? "Consumir / Usar" : "Sin Stock"}
                            </button>
                        </div>
                    ))
                )}
            </div>

            {isItemModalOpen && (
                <ItemModal 
                    onClose={() => setIsItemModalOpen(false)} 
                    onSubmit={handleCreateItem} 
                />
            )}

            {consumeModalData.isOpen && consumeModalData.item && (
                <ConsumeModal 
                    item={consumeModalData.item}
                    cropCycles={cropCycles}
                    onClose={() => setConsumeModalData({ isOpen: false })} 
                    onSubmit={(payload) => handleConsumeItem(consumeModalData.item!.id, payload)} 
                />
            )}
        </div>
    );
}
