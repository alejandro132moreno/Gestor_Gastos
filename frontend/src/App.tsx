import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import CategoriesPage from './pages/CategoriesPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage from './pages/BudgetsPage';
import PlotsPage from './pages/PlotsPage';
import CropCyclesPage from './pages/CropCyclesPage';
import InventoryPage from './pages/InventoryPage';
import ProvidersPage from './pages/ProvidersPage';

import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<DashboardPage />} />
                        <Route path="expenses" element={<ExpensesPage />} />
                        <Route path="inventory" element={<InventoryPage />} />
                        
                        {/* Admin, Gerente, Supervisor */}
                        <Route element={<ProtectedRoute allowedRoles={['Admin', 'Gerente', 'Supervisor']} />}>
                            <Route path="crop-cycles" element={<CropCyclesPage />} />
                            <Route path="providers" element={<ProvidersPage />} />
                        </Route>
                        
                        {/* Admin, Gerente only */}
                        <Route element={<ProtectedRoute allowedRoles={['Admin', 'Gerente']} />}>
                            <Route path="categories" element={<CategoriesPage />} />
                            <Route path="budgets" element={<BudgetsPage />} />
                            <Route path="plots" element={<PlotsPage />} />
                        </Route>
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
