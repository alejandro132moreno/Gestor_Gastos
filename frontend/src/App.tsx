import { useEffect, useState } from 'react';
import './index.css';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import type { Expense, ExpenseInput } from './types';
import * as api from './services/api';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fallback dev mode check if API is unreachable
  const [isApiConnected, setIsApiConnected] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await api.fetchExpenses();
      setExpenses(data);
      setIsApiConnected(true);
    } catch {
      setIsApiConnected(false);
    }
  };

  const handleAddExpense = async (expenseInput: ExpenseInput) => {
    setIsLoading(true);
    const newExpense = await api.createExpense(expenseInput);
    if (newExpense) {
      setExpenses([newExpense, ...expenses]);
      setIsApiConnected(true);
    } else {
      // Mock fallback if API not running yet (for UI demo purposes)
      if (!isApiConnected) {
        setExpenses([
          { ...expenseInput, id: Math.random().toString() },
          ...expenses
        ]);
      }
    }
    setIsLoading(false);
  };

  const handleDeleteExpense = async (id: string) => {
    const success = await api.deleteExpense(id);
    if (success || !isApiConnected) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="app-container">
      <header style={{
        textAlign: 'center',
        padding: '1rem',
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid var(--card-border)',
        marginBottom: '1rem'
      }}>
        <h1 style={{
          fontSize: '2rem', fontWeight: 700, margin: 0,
          background: 'linear-gradient(to right, var(--text-main), var(--text-muted))',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Gestor de Gastos Inteligente
        </h1>
        {!isApiConnected && <p style={{ color: 'var(--secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>El backend API no está disponible. Usando modo de demostración.</p>}
      </header>

      <div className="dashboard-grid">
        <div>
          <Dashboard total={total} />
        </div>
        <div>
          <ExpenseForm onAddExpense={handleAddExpense} isLoading={isLoading} />
        </div>
      </div>

      <ExpenseList expenses={expenses} onDeleteExpense={handleDeleteExpense} />
    </div>
  );
}

export default App;
