import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Provider, ProviderInput, ProviderProduct } from '../../types';

interface ProviderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (provider: ProviderInput) => void;
    editingProvider?: Provider | null;
}

export default function ProviderModal({ isOpen, onClose, onSave, editingProvider }: ProviderModalProps) {
    const [name, setName] = useState('');
    const [contactName, setContactName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [serviceType, setServiceType] = useState('');
    const [notes, setNotes] = useState('');
    const [products, setProducts] = useState<ProviderProduct[]>([]);

    useEffect(() => {
        if (editingProvider) {
            setName(editingProvider.name || '');
            setContactName(editingProvider.contact_name || '');
            setPhone(editingProvider.phone || '');
            setEmail(editingProvider.email || '');
            setServiceType(editingProvider.service_type || '');
            setNotes(editingProvider.notes || '');
            setProducts(editingProvider.products || []);
        } else {
            resetForm();
        }
    }, [editingProvider, isOpen]);

    const resetForm = () => {
        setName('');
        setContactName('');
        setPhone('');
        setEmail('');
        setServiceType('');
        setNotes('');
        setProducts([]);
    };

    const handleAddProduct = () => {
        const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
        setProducts([...products, { id: tempId, name: '', price: 0, description: '' }]);
    };

    const handleRemoveProduct = (index: number) => {
        const newProducts = [...products];
        newProducts.splice(index, 1);
        setProducts(newProducts);
    };

    const handleProductChange = (index: number, field: keyof ProviderProduct, value: string | number) => {
        const newProducts = [...products];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setProducts(newProducts);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            contact_name: contactName,
            phone,
            email,
            service_type: serviceType,
            notes,
            products,
        });
        resetForm();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem'
        }}>
            <div className="glass-panel" style={{
                width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', position: 'relative'
            }}>
                <button 
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                    {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre del Proveedor / Empresa *</label>
                        <input type="text" className="glass-input" required value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre del Contacto</label>
                            <input type="text" className="glass-input" value={contactName} onChange={e => setContactName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Teléfono</label>
                            <input type="text" className="glass-input" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                            <input type="email" className="glass-input" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Tipo de Servicio / Rubro</label>
                            <input type="text" className="glass-input" placeholder="Ej. Semillas, Fertilizantes" value={serviceType} onChange={e => setServiceType(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Notas</label>
                        <textarea className="glass-input" value={notes} onChange={e => setNotes(e.target.value)} rows={2}></textarea>
                    </div>

                    {/* Products Section */}
                    <div style={{ 
                        marginTop: '1rem', padding: '1rem', 
                        background: 'rgba(0,0,0,0.1)', borderRadius: '8px', border: '1px dashed var(--card-border)' 
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-main)' }}>Productos Ofrecidos</h3>
                            <button type="button" onClick={handleAddProduct} style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem'
                            }}>
                                <Plus size={16} /> Añadir Producto
                            </button>
                        </div>

                        {products.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '1rem 0' }}>No hay productos añadidos. Añada un producto manualmente.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {products.map((prop, index) => (
                                    <div key={prop.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
                                        <input 
                                            type="text" className="glass-input" placeholder="Nombre" required
                                            value={prop.name} onChange={e => handleProductChange(index, 'name', e.target.value)} 
                                            style={{ flex: 2 }} 
                                        />
                                        <input 
                                            type="number" step="0.01" className="glass-input" placeholder="Precio ($)" required
                                            value={prop.price === 0 ? '' : prop.price} onChange={e => handleProductChange(index, 'price', parseFloat(e.target.value) || 0)} 
                                            style={{ flex: 1 }} 
                                        />
                                        <button type="button" onClick={() => handleRemoveProduct(index)} style={{ 
                                            background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)', border: 'none', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer' 
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" className="glass-input" style={{ width: 'auto', background: 'transparent' }} onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn">
                            {editingProvider ? 'Guardar Cambios' : 'Crear Proveedor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
