import React, { useState, useEffect } from 'react';
import { PackageSearch, Plus, Leaf, PackageMinus, Search, Calendar, Trash2 } from 'lucide-react';
import { fetchInventoryItems, createInventoryItem, consumeInventoryItem, fetchCropCycles, deleteInventoryItem, fetchProviders, fetchPlots, fetchInventoryTransactions } from '../services/api';
import type { InventoryItem, InventoryItemInput, CropCycle, InventoryConsume, Provider, Plot, InventoryTransaction } from '../types';
import ItemModal from '../components/modals/ItemModal';
import ConsumeModal from '../components/modals/ConsumeModal';

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [cropCycles, setCropCycles] = useState<CropCycle[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [consumeModalData, setConsumeModalData] = useState<{ isOpen: boolean; item?: InventoryItem }>({ isOpen: false });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [itemsData, cyclesData, providersData, plotsData, txData] = await Promise.all([
            fetchInventoryItems(),
            fetchCropCycles(),
            fetchProviders(),
            fetchPlots(),
            fetchInventoryTransactions()
        ]);
        setItems(itemsData);
        setCropCycles(cyclesData);
        setProviders(providersData);
        setPlots(plotsData);
        setTransactions(txData);
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

    const handleDeleteItem = async (id: string) => {
        if (window.confirm("¿Estás seguro de eliminar este insumo?")) {
            await deleteInventoryItem(id);
            await loadData();
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="Buscar insumo por nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', flex: 1, outline: 'none', fontSize: '1rem' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filteredItems.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <Leaf size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                        <h3>Aún no tienes insumos en tu almacén</h3>
                        <p style={{ color: 'var(--text-muted)' }}>Agrega productos como Semillas o Fertilizantes para gestionar tu stock.</p>
                    </div>
                ) : (
                    filteredItems.map(item => (
                        <div key={item.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: 'var(--danger)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', paddingRight: '2.5rem' }}>
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
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                        Costo Promedio: ${item.average_cost.toFixed(2)} / {item.unit}
                                    </p>
                                    {item.date_added && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            <Calendar size={14} />
                                            <span>Añadido: {new Date(item.date_added).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    {item.provider_name && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                            <span>🚚 Proveedor: {item.provider_name}</span>
                                        </div>
                                    )}
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{item.current_stock.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{item.unit}</span></p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 500, color: '#10b981' }}>${(item.current_stock * item.average_cost).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
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

            {/* Historial de Consumos */}
            <div style={{ marginTop: '3rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PackageMinus size={24} color="var(--primary)" />
                    Historial de Consumos / Reducciones
                </h3>
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Insumo</th>
                                <th style={{ padding: '1rem' }}>Cantidad</th>
                                <th style={{ padding: '1rem' }}>Costo Total</th>
                                <th style={{ padding: '1rem' }}>Destino</th>
                                <th style={{ padding: '1rem' }}>Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                        No hay registros de consumos todavía.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map(tx => {
                                    const itemName = items.find(i => i.id === tx.item_id)?.name || 'Insumo desconocido';
                                    const itemUnit = items.find(i => i.id === tx.item_id)?.unit || '';
                                    const cycle = cropCycles.find(c => c.id === tx.related_entity_id);
                                    let destinationStr = '';
                                    if (cycle) {
                                        const plot = plots.find(p => p.id === cycle.plot_id);
                                        const plotName = plot ? plot.name : cycle.plot_id;
                                        destinationStr = `Lote: ${plotName} | ${cycle.name} (${cycle.variety})`;
                                    }
                                    return (
                                        <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '1rem' }}>{tx.date}</td>
                                            <td style={{ padding: '1rem', fontWeight: 500 }}>{itemName}</td>
                                            <td style={{ padding: '1rem', color: 'var(--danger)' }}>-{tx.quantity} {itemUnit}</td>
                                            <td style={{ padding: '1rem' }}>${tx.total_cost.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td style={{ padding: '1rem' }}>
                                                {destinationStr ? (
                                                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '4px', fontSize: '0.85rem' }}>{destinationStr}</span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{tx.notes || '-'}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isItemModalOpen && (
                <ItemModal
                    providers={providers}
                    onClose={() => setIsItemModalOpen(false)}
                    onSubmit={handleCreateItem}
                />
            )}

            {consumeModalData.isOpen && consumeModalData.item && (
                <ConsumeModal
                    item={consumeModalData.item}
                    cropCycles={cropCycles}
                    plots={plots}
                    onClose={() => setConsumeModalData({ isOpen: false })}
                    onSubmit={(payload) => handleConsumeItem(consumeModalData.item!.id, payload)}
                />
            )}
        </div>
    );
}
