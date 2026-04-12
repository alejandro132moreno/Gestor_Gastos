import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { ExpenseInput, Category } from '../types';
import * as api from '../services/api';

const expenseSchema = z.object({
    description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
    amount: z.number().positive('El monto debe ser mayor a 0'),
    category: z.string().min(1, 'La categoría es obligatoria'),
    subcategory: z.string().optional(),
    crop_cycle: z.string().optional(),
    provider_name: z.string().optional(),
    date: z.string().min(1, 'La fecha es obligatoria'),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
    onAddExpense: (expense: ExpenseInput) => void;
    isLoading: boolean;
    categories?: Category[];
    onCancel?: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, isLoading, categories = [], onCancel }) => {
    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<ExpenseFormData>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            amount: 0
        }
    });

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const [cropCycles, setCropCycles] = useState<any[]>([]);
    const [providers, setProviders] = useState<any[]>([]);

    useEffect(() => {
        Promise.all([
            api.fetchCropCycles(),
            api.fetchProviders()
        ]).then(([cycles, provs]) => {
            setCropCycles(cycles);
            setProviders(provs);
        });
    }, []);

    // Watch selected category to update subcategories
    const selectedCategoryName = watch('category');
    const selectedCategory = categories.find(c => c.name === selectedCategoryName);

    const onSubmit = async (data: ExpenseFormData) => {
        setIsUploading(true);
        let receiptUrl: string | undefined = undefined;

        if (receiptFile) {
            const uploadedUrl = await api.uploadReceipt(receiptFile);
            if (uploadedUrl) {
                receiptUrl = uploadedUrl;
            } else {
                console.warn("Fallo al subir recibo.");
            }
        }

        onAddExpense({
            ...data,
            ...(receiptUrl && { receipt_url: receiptUrl })
        });
        
        reset();
        setReceiptFile(null);
        setIsUploading(false);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Descripción</label>
                <input
                    className="glass-input"
                    type="text"
                    placeholder="Ej. Fertilizante NPK"
                    {...register('description')}
                />
                {errors.description && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.description.message}</p>}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Monto ($)</label>
                    <input
                        className="glass-input"
                        type="number"
                        step="0.01"
                        {...register('amount', { valueAsNumber: true })}
                    />
                    {errors.amount && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.amount.message}</p>}
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Fecha</label>
                    <input
                        className="glass-input"
                        type="date"
                        {...register('date')}
                    />
                    {errors.date && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.date.message}</p>}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Categoría</label>
                    <select className="glass-input" {...register('category')}>
                        <option value="">Selecciona una categoría...</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))}
                    </select>
                    {errors.category && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{errors.category.message}</p>}
                </div>

                {selectedCategory && selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                    <div style={{ flex: '1 1 200px' }} className="animate-slide-up">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Subcategoría</label>
                        <select className="glass-input" {...register('subcategory')}>
                            <option value="">(Opcional)</option>
                            {selectedCategory.subcategories.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Ciclo de Cultivo (Opcional)</label>
                    <select className="glass-input" {...register('crop_cycle')}>
                        <option value="">Ninguno / Gastos Generales</option>
                        {cropCycles.map(cycle => (
                            <option key={cycle.id} value={cycle.id}>{cycle.name} ({cycle.variety})</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Proveedor (Opcional)</label>
                    <select className="glass-input" {...register('provider_name')}>
                        <option value="">Ninguno</option>
                        {providers.map(prov => (
                            <option key={prov.id} value={prov.name}>{prov.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                background: 'rgba(0,0,0,0.1)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px dashed var(--card-border)'
            }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Comprobante (Factura/Ticket en PDF o Imagen)
                </label>
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    style={{ color: 'var(--text-main)', fontSize: '0.85rem' }}
                />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                {onCancel && (
                    <button type="button" className="glass-input" style={{ width: 'auto', background: 'transparent' }} onClick={onCancel}>Cancelar</button>
                )}
                <button type="submit" className="btn" disabled={isLoading || isUploading}>
                    {isUploading ? 'Subiendo Archivo...' : isLoading ? 'Guardando...' : 'Añadir Gasto'}
                </button>
            </div>
        </form>
    );
};

export default ExpenseForm;
