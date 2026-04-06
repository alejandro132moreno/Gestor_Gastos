import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import { Building2 } from 'lucide-react';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await registerUser({ 
                full_name: fullName, 
                email, 
                password,
                role: 'Admin', // Default for first
                currency: 'USD',
                theme: 'light'
            });
            alert("Registro exitoso. Ahora puedes iniciar sesión.");
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Error en el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div className="glass-panel animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary))', padding: '1rem', borderRadius: '16px' }}>
                        <Building2 size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Crear Cuenta</h2>
                
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>{error}</div>}
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                     <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nombre Completo</label>
                        <input type="text" required className="glass-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej. Juan Pérez" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
                        <input type="email" required className="glass-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@agricola.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Contraseña</label>
                        <input type="password" required minLength={6} className="glass-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button type="submit" className="btn" style={{ marginTop: '1rem' }} disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrar'}
                    </button>
                </form>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Iniciar Sesión</Link></p>
                </div>
            </div>
        </div>
    );
}
