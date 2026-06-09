import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import type { Category } from '../types';
import * as api from '../services/api';
import CategoryModal from '../components/CategoryModal';

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadCategories = async () => {
        setIsLoading(true);
        const data = await api.fetchCategories();
        setCategories(data);
        setIsLoading(false);
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
        const success = await api.deleteCategory(id);
        if (success) {
            setCategories(categories.filter(c => c.id !== id));
        } else {
            alert('Error al eliminar categoría. Verifica si tiene gastos asociados o si tienes los permisos adecuados.');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    return (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 600 }}>Categorías de Gastos</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Gestiona los rubros operativos y productivos</p>
                </div>
                <button 
                    className="btn" 
                    onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={20} />
                    <span style={{ display: 'none', '@media (minWidth: 768px)': { display: 'inline' } } as any}>Nueva Categoría</span>
                </button>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Cargando categorías...</div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '1.5rem' 
                }}>
                    {categories.length === 0 ? (
                        <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No hay categorías registradas.</p>
                        </div>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id} className="glass-panel" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                                {/* Accent line at top */}
                                <div style={{ 
                                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px', 
                                    background: cat.color || 'var(--primary)' 
                                }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div style={{ 
                                        width: '48px', height: '48px', 
                                        borderRadius: '12px', 
                                        background: `${cat.color || 'var(--primary)'}22`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem'
                                    }}>
                                        {cat.icon || '📦'}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(cat)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px' }}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="btn-danger" onClick={() => handleDelete(cat.id!)} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: '8px' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{cat.name}</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {cat.subcategories && cat.subcategories.map((sub, i) => (
                                        <span key={i} style={{ 
                                            fontSize: '0.75rem', padding: '0.2rem 0.6rem', 
                                            background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                                            color: 'var(--text-main)'
                                        }}>
                                            {sub}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {isModalOpen && (
                <CategoryModal 
                    onClose={handleCloseModal} 
                    onSaved={() => {
                        handleCloseModal();
                        loadCategories();
                    }}
                    initialData={editingCategory}
                />
            )}
        </div>
    );
}
