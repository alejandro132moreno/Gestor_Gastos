import React from 'react';

interface DashboardProps {
    total: number;
}

const Dashboard: React.FC<DashboardProps> = ({ total }) => {
    return (
        <div className="glass-panel animate-slide-up" style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '1.25rem', fontWeight: 500 }}>
                Gasto Total
            </h2>
            <div className="total-display">
                ${total.toFixed(2)}
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
                Gestiona tus finanzas inteligentemente.
            </p>
        </div>
    );
};

export default Dashboard;
