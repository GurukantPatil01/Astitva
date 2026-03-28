import { useMemo } from 'react';
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#ea580c', '#dc2626', '#0891b2', '#d946ef', '#65a30d'];

export default function Analytics({ expenses, members, group }) {
    const currencySymbol = group?.base_currency === 'INR' ? '₹' : (group?.base_currency + ' ');

    // Who paid the most
    const paidByData = useMemo(() => {
        const map = {};
        members.forEach((m) => (map[m.id] = { name: m.name, value: 0 }));
        expenses.forEach((e) => {
            if (map[e.paid_by]) map[e.paid_by].value += parseFloat(e.converted_amount || e.amount);
        });
        return Object.values(map).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    }, [expenses, members]);

    // Split method distribution
    const splitMethodData = useMemo(() => {
        const map = {};
        expenses.forEach((e) => {
            map[e.split_method] = (map[e.split_method] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    // Monthly spending trend
    const monthlyData = useMemo(() => {
        const map = {};
        expenses.forEach((e) => {
            const month = e.date?.slice(0, 7); // YYYY-MM
            if (month) {
                map[month] = (map[month] || 0) + parseFloat(e.converted_amount || e.amount);
            }
        });
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, total]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                total: Math.round(total),
            }));
    }, [expenses]);

    // Smart insights
    const totalSpent = expenses.reduce((s, e) => s + parseFloat(e.converted_amount || e.amount), 0);
    const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;
    const topSpender = paidByData[0];
    const recurringCount = expenses.filter((e) => e.is_recurring).length;

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload?.[0]) {
            return (
                <div style={{
                    background: 'var(--bg-1)', border: '1px solid var(--border)',
                    padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem',
                    boxShadow: 'var(--shadow-md)',
                }}>
                    <p style={{ fontWeight: 600, color: 'var(--text-0)' }}>{payload[0].name || payload[0].payload?.month}</p>
                    <p style={{ color: 'var(--text-2)' }}>{currencySymbol}{payload[0].value?.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    if (expenses.length === 0) {
        return (
            <div className="empty-state">
                <div className="icon">📊</div>
                <p>Add some expenses to see analytics and insights.</p>
            </div>
        );
    }

    return (
        <div>
            {/* ── Insights Strip ───────────────────────── */}
            <div className="grid-3" style={{ marginBottom: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="stat-card">
                    <div className="stat-label">Total Spent</div>
                    <div className="stat-value" style={{ color: 'var(--text-0)', fontSize: '1.2rem' }}>
                        {currencySymbol}{totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Avg. Expense</div>
                    <div className="stat-value" style={{ color: 'var(--text-0)', fontSize: '1.2rem' }}>
                        {currencySymbol}{avgExpense.toFixed(0)}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Top Spender</div>
                    <div className="stat-value" style={{ color: 'var(--blue)', fontSize: '1.2rem' }}>
                        {topSpender?.name || '—'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Recurring</div>
                    <div className="stat-value" style={{ color: 'var(--orange)', fontSize: '1.2rem' }}>
                        {recurringCount}
                    </div>
                </div>
            </div>

            {/* ── Charts Row ───────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                {/* Paid By Distribution */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Who Paid
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={paidByData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                paddingAngle={3} dataKey="value" stroke="none">
                                {paidByData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                        {paidByData.map((d, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                                <span style={{ color: 'var(--text-2)' }}>{d.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Trend */}
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Spending Trend
                    </h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={45} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.85rem' }}>
                            Need more data for trend
                        </div>
                    )}
                </div>
            </div>

            {/* Split Method Distribution */}
            {splitMethodData.length > 1 && (
                <div className="card" style={{ padding: 20 }}>
                    <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Split Methods Used
                    </h3>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {splitMethodData.map((d, i) => (
                            <div key={i} className="stat-card" style={{ flex: 1, minWidth: 100, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: COLORS[i % COLORS.length] }}>{d.value}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', textTransform: 'capitalize', marginTop: 2 }}>{d.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
