import React, { useState } from 'react';
import type { ExpenseInput } from '../types';
import { uploadReceipt } from '../services/api';

interface ExpenseFormProps {
    onAddExpense: (expense: ExpenseInput) => void;
    isLoading: boolean;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, isLoading }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!description || !amount || !category || !date) return;

        setIsUploading(true);
        let receiptUrl: string | undefined = undefined;

        if (receiptFile) {
            const uploadedUrl = await uploadReceipt(receiptFile);
            if (uploadedUrl) {
                receiptUrl = uploadedUrl;
            } else {
                console.warn("Fallo al subir recibo.");
            }
        }

        onAddExpense({
            description,
            amount: parseFloat(amount),
            category,
            date,
            ...(receiptUrl && { receipt_url: receiptUrl })
        });

        // Reset fields
        setDescription('');
        setAmount('');
        setCategory('');
        setReceiptFile(null);
        setIsUploading(false);
    };

    return (
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', animationDelay: '0.1s' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>Añadir Gasto</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <input
                        className="glass-input"
                        type="text"
                        placeholder="Descripción (ej. Supermercado)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className="glass-input"
                        type="number"
                        step="0.01"
                        placeholder="Monto"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        style={{ flex: 1 }}
                    />
                    <input
                        className="glass-input"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        style={{ flex: 1 }}
                    />
                </div>
                <div>
                    <input
                        className="glass-input"
                        type="text"
                        placeholder="Categoría"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
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
                <button type="submit" className="btn" disabled={isLoading || isUploading} style={{ marginTop: '0.5rem' }}>
                    {isUploading ? 'Subiendo Archivo...' : isLoading ? 'Guardando...' : 'Añadir Gasto'}
                </button>
            </form>
        </div>
    );
};

export default ExpenseForm;
