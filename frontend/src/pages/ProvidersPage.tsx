import { useState, useEffect } from 'react';
import { Truck, Plus, Search, Edit2, Trash2, Mail, Phone, Package, Tag } from 'lucide-react';
import { Provider } from '../types';
import { fetchProviders, createProvider, updateProvider, deleteProvider } from '../services/api';
import ProviderModal from '../components/modals/ProviderModal';

export default function ProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        setLoading(true);
        const data = await fetchProviders();
        setProviders(data);
        setLoading(false);
    };

    const handleSave = async (providerData: any) => {
        if (editingProvider) {
            await updateProvider(editingProvider.id, providerData);
        } else {
            await createProvider(providerData);
        }
        setIsModalOpen(false);
        setEditingProvider(null);
        loadProviders();
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este proveedor?')) {
            await deleteProvider(id);
            loadProviders();
        }
    };

    const openEditModal = (provider: Provider) => {
        setEditingProvider(provider);
        setIsModalOpen(true);
    };

    const filteredProviders = providers.filter(p => {
        const matchesMain = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.contact_name && p.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.service_type && p.service_type.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesProducts = p.products && p.products.some(prod => prod.name.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesMain || matchesProducts;
    });

    return (
        <div style={{ padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
                        <Truck size={24} color="#38bdf8" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Directorio de Proveedores</h2>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Gestiona tus contactos y sus productos</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => { setEditingProvider(null); setIsModalOpen(true); }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 500, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                >
                    <Plus size={20} /> Nuevo Proveedor
                </button>
            </div>

            <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={20} color="var(--text-muted)" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, contacto o rubro..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', flex: 1, outline: 'none', fontSize: '1rem' }}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Cargando proveedores...</div>
            ) : filteredProviders.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
                    <Truck size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No hay proveedores</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No se encontraron proveedores. Añade uno nuevo para comenzar.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {filteredProviders.map(provider => (
                        <div key={provider.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => openEditModal(provider)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(provider.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', color: 'var(--danger)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: '0 0 0.25rem 0', paddingRight: '4rem' }}>{provider.name}</h3>
                                {provider.service_type && (
                                    <span style={{ display: 'inline-block', fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {provider.service_type}
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {provider.contact_name && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '20px', display: 'flex', justifyContent: 'center' }}>👤</div>
                                        <span>{provider.contact_name}</span>
                                    </div>
                                )}
                                {provider.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={16} />
                                        <span>{provider.phone}</span>
                                    </div>
                                )}
                                {provider.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={16} />
                                        <span>{provider.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Products Section in Card */}
                            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                    <Package size={16} color="var(--primary)" />
                                    <span>Productos ({provider.products?.length || 0})</span>
                                </div>
                                
                                {provider.products && provider.products.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {provider.products.slice(0, 3).map(prod => (
                                            <div key={prod.id} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <Tag size={12} color="var(--text-muted)" />
                                                <span style={{ color: 'var(--text-main)' }}>{prod.name}</span>
                                                {prod.price > 0 && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>${prod.price}</span>}
                                            </div>
                                        ))}
                                        {provider.products.length > 3 && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                +{provider.products.length - 3} más
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin productos registrados</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ProviderModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingProvider={editingProvider}
            />
        </div>
    );
}
