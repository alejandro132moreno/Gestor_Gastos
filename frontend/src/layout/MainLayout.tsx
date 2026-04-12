import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, ScrollText, Building2, Wallet, Network, RefreshCcw, Package, LogOut, Truck } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import '../index.css';

export default function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
            {/* Header / Nav */}
            <header className="glass-panel" style={{ 
                margin: '1rem', 
                padding: '1rem', 
                display: 'flex', 
                flexWrap: 'wrap',
                justifyContent: 'space-between', 
                alignItems: 'center',
                position: 'sticky',
                top: '1rem',
                zIndex: 40,
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '0.5rem', borderRadius: '12px' }}>
                        <Building2 size={24} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.25rem', fontWeight: 700, margin: 0,
                        background: 'linear-gradient(to right, var(--text-main), var(--text-muted))',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        whiteSpace: 'nowrap'
                    }}>
                        Gestor Agrícola
                    </h1>
                </div>
                
                <nav style={{ 
                    display: 'flex', gap: '0.5rem', overflowX: 'auto', 
                    paddingBottom: '0.25rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
                    flex: '1 1 auto', justifyContent: 'flex-start'
                }}>
                    <NavLink to="/" current={location.pathname} icon={<LayoutDashboard size={18} />} text="Dashboard" />
                    <NavLink to="/categories" current={location.pathname} icon={<ScrollText size={18} />} text="Categorías" />
                    <NavLink to="/expenses" current={location.pathname} icon={<Receipt size={18} />} text="Gastos" />
                    <NavLink to="/budgets" current={location.pathname} icon={<Wallet size={18} />} text="Presupuestos" />
                    <NavLink to="/plots" current={location.pathname} icon={<Network size={18} />} text="Lotes" />
                    <NavLink to="/crop-cycles" current={location.pathname} icon={<RefreshCcw size={18} />} text="Ciclos" />
                    <NavLink to="/inventory" current={location.pathname} icon={<Package size={18} />} text="Inventario" />
                    <NavLink to="/providers" current={location.pathname} icon={<Truck size={18} />} text="Proveedores" />
                </nav>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{user?.full_name || 'Usuario'}</span>
                    <button onClick={handleLogout} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', display: 'flex' }} title="Cerrar sesión">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '0 1rem 2rem 1rem' }}>
                <Outlet />
            </main>
        </div>
    );
}

function NavLink({ to, current, icon, text }: { to: string, current: string, icon: React.ReactNode, text: string }) {
    const isActive = current === to || (to !== '/' && current.startsWith(to));
    
    return (
        <Link to={to} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '12px',
            textDecoration: 'none',
            color: isActive ? 'white' : 'var(--text-muted)',
            background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            transition: 'all 0.3s ease',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            fontSize: '0.9rem'
        }}>
            {icon}
            <span className="nav-text">{text}</span>
        </Link>
    );
}
