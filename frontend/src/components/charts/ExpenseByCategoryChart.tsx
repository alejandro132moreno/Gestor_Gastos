import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ExpenseByCategoryChart({ data }: { data: Record<string, number> }) {
    // Transform object into array for Recharts
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
    
    // Sort array desc and take top 5, group rest into "Otros"
    chartData.sort((a, b) => b.value - a.value);
    
    let finalData = chartData;
    if (chartData.length > 5) {
        finalData = chartData.slice(0, 5);
        const others = chartData.slice(5).reduce((acc, curr) => acc + curr.value, 0);
        finalData.push({ name: 'Otros', value: others });
    }

    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={finalData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {finalData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: 'white' }}
                    />
                    <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
