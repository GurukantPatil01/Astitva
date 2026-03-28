import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsAPI, membersAPI, expensesAPI, balancesAPI } from '../services/api';
import toast from 'react-hot-toast';

const SPLIT_METHODS = [
    { key: 'equal', label: '÷ Equal' },
    { key: 'percentage', label: '% Percent' },
    { key: 'share', label: '⚖ Shares' },
    { key: 'item', label: '🏷 Items' },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'THB', 'SGD', 'AED'];

export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState([]);
    const [settlements, setSettlements] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('expenses');
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newMember, setNewMember] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [dashboard, setDashboard] = useState(null);

    // Expense form state
    const [expenseForm, setExpenseForm] = useState({
        title: '',
        amount: '',
        currency: 'INR',
        paid_by: '',
        date: new Date().toISOString().split('T')[0],
        split_method: 'equal',
        is_recurring: false,
        recurrence_interval: 'monthly',
        split_details: {},
        members: [],
    });

    useEffect(() => {
        loadAll();
    }, [groupId]);

    async function loadAll() {
        try {
            const [groupData, memberData, expenseData] = await Promise.all([
                groupsAPI.get(groupId),
                membersAPI.list(groupId),
                expensesAPI.list(groupId),
            ]);
            setGroup(groupData.group);
            setMembers(groupData.group.members || memberData.members || []);
            setExpenses(expenseData.expenses || []);
            setExpenseForm((f) => ({
                ...f,
                currency: groupData.group.base_currency || 'INR',
            }));

            // Load balances
            try {
                const balData = await balancesAPI.getBalances(groupId);
                setBalances(balData.balances || []);
                const settData = await balancesAPI.getSettlements(groupId);
                setSettlements(settData);
            } catch (e) { }
        } catch (err) {
            toast.error('Failed to load group');
            navigate('/');
        } finally {
            setLoading(false);
        }
    }

    // ── Member actions ─────────────────────────────────
    async function addMember(e) {
        e.preventDefault();
        if (!newMember.trim()) return;
        try {
            await membersAPI.add(groupId, { name: newMember.trim() });
            setNewMember('');
            toast.success('Member added');
            loadAll();
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function removeMember(id) {
        if (!confirm('Remove this member?')) return;
        try {
            await membersAPI.remove(id);
            toast.success('Member removed');
            loadAll();
        } catch (err) {
            toast.error(err.message);
        }
    }

    // ── Expense actions ────────────────────────────────
    async function addExpense(e) {
        e.preventDefault();
        if (!expenseForm.title || !expenseForm.amount || !expenseForm.paid_by) {
            return toast.error('Fill in title, amount, and who paid');
        }

        try {
            const body = {
                title: expenseForm.title,
                amount: parseFloat(expenseForm.amount),
                currency: expenseForm.currency,
                paid_by: parseInt(expenseForm.paid_by),
                date: expenseForm.date,
                split_method: expenseForm.split_method,
                is_recurring: expenseForm.is_recurring,
                recurrence_interval: expenseForm.is_recurring ? expenseForm.recurrence_interval : null,
                members: expenseForm.members.length > 0 ? expenseForm.members : undefined,
                split_details: {},
            };

            // Build split details based on method
            if (expenseForm.split_method === 'percentage') {
                body.split_details.percentages = {};
                members.forEach((m) => {
                    const pct = expenseForm.split_details[`pct_${m.id}`];
                    if (pct) body.split_details.percentages[m.id] = parseFloat(pct);
                });
            } else if (expenseForm.split_method === 'share') {
                body.split_details.shares = {};
                members.forEach((m) => {
                    const share = expenseForm.split_details[`share_${m.id}`];
                    if (share) body.split_details.shares[m.id] = parseFloat(share);
                });
            } else if (expenseForm.split_method === 'item') {
                body.split_details.items = [];
                members.forEach((m) => {
                    const amt = expenseForm.split_details[`item_amt_${m.id}`];
                    const desc = expenseForm.split_details[`item_desc_${m.id}`];
                    if (amt) {
                        body.split_details.items.push({
                            member_id: m.id,
                            amount: parseFloat(amt),
                            description: desc || '',
                        });
                    }
                });
            }

            await expensesAPI.create(groupId, body);
            toast.success('Expense added!');
            setShowExpenseModal(false);
            resetExpenseForm();
            loadAll();
        } catch (err) {
            toast.error(err.message);
        }
    }

    function resetExpenseForm() {
        setExpenseForm({
            title: '',
            amount: '',
            currency: group?.base_currency || 'INR',
            paid_by: '',
            date: new Date().toISOString().split('T')[0],
            split_method: 'equal',
            is_recurring: false,
            recurrence_interval: 'monthly',
            split_details: {},
            members: [],
        });
    }

    async function deleteExpense(id) {
        if (!confirm('Delete this expense?')) return;
        try {
            await expensesAPI.delete(id);
            toast.success('Expense deleted');
            loadAll();
        } catch (err) {
            toast.error(err.message);
        }
    }

    // ── Member Dashboard ───────────────────────────────
    async function viewMemberDashboard(memberId) {
        try {
            const data = await balancesAPI.getDashboard(groupId, memberId);
            setDashboard(data);
            setSelectedMember(memberId);
        } catch (err) {
            toast.error(err.message);
        }
    }

    function updateSplitDetail(key, value) {
        setExpenseForm((f) => ({
            ...f,
            split_details: { ...f.split_details, [key]: value },
        }));
    }

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    if (!group) return null;

    return (
        <div>
            {/* Header */}
            <div className="section-header" style={{ marginBottom: 8 }}>
                <div>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate('/')}
                        style={{ marginBottom: 8 }}
                    >
                        ← Back
                    </button>
                    <h1 className="section-title">{group.name}</h1>
                    <p className="section-subtitle">
                        {members.length} member{members.length !== 1 ? 's' : ''} · Base currency: {group.base_currency}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                    + Add Expense
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {['expenses', 'members', 'balances', 'settlements'].map((tab) => (
                    <button
                        key={tab}
                        className={`tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'expenses' && '📝 '}
                        {tab === 'members' && '👥 '}
                        {tab === 'balances' && '📊 '}
                        {tab === 'settlements' && '🤝 '}
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* ── Expenses Tab ────────────────────────────── */}
            {activeTab === 'expenses' && (
                <div>
                    {expenses.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">📝</div>
                            <p>No expenses yet. Add one to start tracking!</p>
                            <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                                + Add First Expense
                            </button>
                        </div>
                    ) : (
                        expenses.map((exp, i) => (
                            <div key={exp.id} className="expense-item animate-in" style={{ animationDelay: `${i * 0.04}s` }}>
                                <div className="expense-info">
                                    <div className="expense-title">
                                        {exp.title}
                                        {exp.is_recurring && <span className="badge badge-orange" style={{ marginLeft: 8 }}>🔄 Recurring</span>}
                                    </div>
                                    <div className="expense-meta">
                                        <span>Paid by {exp.payer?.name || 'Unknown'}</span>
                                        <span>·</span>
                                        <span>{exp.date}</span>
                                        <span>·</span>
                                        <span className="badge badge-purple">{exp.split_method}</span>
                                        {exp.currency !== group.base_currency && (
                                            <span className="badge badge-orange">
                                                {exp.currency} → {group.base_currency} @{exp.exchange_rate}
                                            </span>
                                        )}
                                    </div>
                                    {exp.splits && (
                                        <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {exp.splits.map((s) => (
                                                <span key={s.id} className="badge badge-blue">
                                                    {s.member?.name}: ₹{parseFloat(s.amount).toFixed(0)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div className="expense-amount">
                                        {exp.currency === 'INR' ? '₹' : exp.currency + ' '}
                                        {parseFloat(exp.amount).toLocaleString()}
                                    </div>
                                    {exp.converted_amount && exp.currency !== group.base_currency && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            ≈ ₹{parseFloat(exp.converted_amount).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                <div className="expense-actions">
                                    <button className="btn btn-sm btn-danger" onClick={() => deleteExpense(exp.id)}>
                                        🗑
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Members Tab ─────────────────────────────── */}
            {activeTab === 'members' && (
                <div>
                    <form onSubmit={addMember} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                        <input
                            className="form-input"
                            placeholder="Enter member name..."
                            value={newMember}
                            onChange={(e) => setNewMember(e.target.value)}
                            style={{ maxWidth: 300 }}
                        />
                        <button type="submit" className="btn btn-primary">+ Add</button>
                    </form>
                    <div className="members-list">
                        {members.map((m) => (
                            <div key={m.id} className="member-chip">
                                👤 {m.name}
                                <span className="remove" onClick={() => removeMember(m.id)}>✕</span>
                            </div>
                        ))}
                    </div>
                    {members.length === 0 && (
                        <div className="empty-state">
                            <div className="icon">👥</div>
                            <p>No members yet. Add people to this group!</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Balances Tab ────────────────────────────── */}
            {activeTab === 'balances' && (
                <div>
                    <div className="grid-3" style={{ marginBottom: 24 }}>
                        <div className="stat-card stat-green">
                            <div className="stat-label">Total Owed to Others</div>
                            <div className="stat-value">
                                ₹{balances.filter((b) => b.net_balance > 0).reduce((s, b) => s + b.net_balance, 0).toFixed(0)}
                            </div>
                        </div>
                        <div className="stat-card stat-red">
                            <div className="stat-label">Total Debts</div>
                            <div className="stat-value">
                                ₹{Math.abs(balances.filter((b) => b.net_balance < 0).reduce((s, b) => s + b.net_balance, 0)).toFixed(0)}
                            </div>
                        </div>
                        <div className="stat-card stat-blue">
                            <div className="stat-label">Total Expenses</div>
                            <div className="stat-value">{expenses.length}</div>
                        </div>
                    </div>

                    {balances.map((b, i) => (
                        <div
                            key={b.member_id}
                            className="expense-item animate-in"
                            style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                            onClick={() => viewMemberDashboard(b.member_id)}
                        >
                            <div className="expense-info">
                                <div className="expense-title">👤 {b.member_name}</div>
                                <div className="expense-meta">
                                    <span className={`badge ${b.status === 'is_owed' ? 'badge-green' : b.status === 'owes' ? 'badge-red' : 'badge-blue'}`}>
                                        {b.status === 'is_owed' ? 'Gets back' : b.status === 'owes' ? 'Owes' : 'Settled'}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click for dashboard →</span>
                                </div>
                            </div>
                            <div className={`expense-amount`} style={{ color: b.net_balance > 0 ? 'var(--accent-green)' : b.net_balance < 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                {b.net_balance >= 0 ? '+' : ''}₹{b.net_balance.toFixed(2)}
                            </div>
                        </div>
                    ))}

                    {/* Member Dashboard Modal */}
                    {dashboard && (
                        <div className="modal-overlay" onClick={() => { setDashboard(null); setSelectedMember(null); }}>
                            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
                                <h2 className="modal-title">📊 {dashboard.member.name}'s Dashboard</h2>
                                <div className="grid-2" style={{ marginBottom: 20, gridTemplateColumns: '1fr 1fr' }}>
                                    <div className="stat-card stat-green">
                                        <div className="stat-label">Owed to You</div>
                                        <div className="stat-value">₹{dashboard.summary.total_owed_to_you.toFixed(0)}</div>
                                    </div>
                                    <div className="stat-card stat-red">
                                        <div className="stat-label">You Owe</div>
                                        <div className="stat-value">₹{dashboard.summary.total_you_owe.toFixed(0)}</div>
                                    </div>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 16, textAlign: 'center' }}>
                                    Net: <span style={{ color: dashboard.summary.net_balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                        {dashboard.summary.net_balance >= 0 ? '+' : ''}₹{dashboard.summary.net_balance.toFixed(2)}
                                    </span>
                                </div>
                                {dashboard.details.map((d, i) => (
                                    <div key={i} className="settlement-item">
                                        <span>{d.description}</span>
                                        <span className="settlement-amount" style={{ color: d.direction === 'owes_you' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                                            ₹{d.amount.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                                {dashboard.details.length === 0 && (
                                    <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>All settled up! 🎉</p>
                                )}
                                <div className="modal-actions">
                                    <button className="btn btn-secondary" onClick={() => { setDashboard(null); setSelectedMember(null); }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Settlements Tab ─────────────────────────── */}
            {activeTab === 'settlements' && (
                <div>
                    {settlements && settlements.settlements.length > 0 ? (
                        <>
                            <div className="stat-card" style={{ marginBottom: 20, textAlign: 'center' }}>
                                <div className="stat-label">Minimum Transactions Needed</div>
                                <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
                                    {settlements.total_transactions}
                                </div>
                            </div>
                            {settlements.settlements.map((s, i) => (
                                <div key={i} className="settlement-item animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <span style={{ fontWeight: 600 }}>{s.from_name}</span>
                                    <span className="settlement-arrow">→</span>
                                    <span style={{ fontWeight: 600 }}>{s.to_name}</span>
                                    <span className="settlement-amount">
                                        ₹{s.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="icon">🤝</div>
                            <p>No settlements needed — everyone is squared up!</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Expense Modal ───────────────────────── */}
            {showExpenseModal && (
                <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
                        <h2 className="modal-title">Add Expense</h2>
                        <form onSubmit={addExpense}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Dinner, Hotel, Uber"
                                    value={expenseForm.title}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Amount</label>
                                    <input
                                        className="form-input"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select
                                        className="form-input"
                                        value={expenseForm.currency}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                                    >
                                        {CURRENCIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Paid By</label>
                                    <select
                                        className="form-input"
                                        value={expenseForm.paid_by}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paid_by: e.target.value })}
                                    >
                                        <option value="">Select member...</option>
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        className="form-input"
                                        type="date"
                                        value={expenseForm.date}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Split Method */}
                            <div className="form-group">
                                <label>Split Method</label>
                                <div className="split-tabs">
                                    {SPLIT_METHODS.map((s) => (
                                        <button
                                            key={s.key}
                                            type="button"
                                            className={`split-tab ${expenseForm.split_method === s.key ? 'active' : ''}`}
                                            onClick={() => setExpenseForm({ ...expenseForm, split_method: s.key, split_details: {} })}
                                        >
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Split details based on method */}
                            {expenseForm.split_method === 'percentage' && (
                                <div className="form-group">
                                    <label>Percentage per member (must total 100%)</label>
                                    {members.map((m) => (
                                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <span style={{ minWidth: 80, fontSize: '0.85rem' }}>{m.name}</span>
                                            <input
                                                className="form-input"
                                                type="number"
                                                step="0.01"
                                                placeholder="0"
                                                style={{ maxWidth: 100 }}
                                                value={expenseForm.split_details[`pct_${m.id}`] || ''}
                                                onChange={(e) => updateSplitDetail(`pct_${m.id}`, e.target.value)}
                                            />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>%</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {expenseForm.split_method === 'share' && (
                                <div className="form-group">
                                    <label>Shares per member (e.g. 2 for double share)</label>
                                    {members.map((m) => (
                                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                            <span style={{ minWidth: 80, fontSize: '0.85rem' }}>{m.name}</span>
                                            <input
                                                className="form-input"
                                                type="number"
                                                step="0.5"
                                                placeholder="1"
                                                style={{ maxWidth: 100 }}
                                                value={expenseForm.split_details[`share_${m.id}`] || ''}
                                                onChange={(e) => updateSplitDetail(`share_${m.id}`, e.target.value)}
                                            />
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>×</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {expenseForm.split_method === 'item' && (
                                <div className="form-group">
                                    <label>Assign items to members</label>
                                    {members.map((m) => (
                                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <span style={{ minWidth: 80, fontSize: '0.85rem' }}>{m.name}</span>
                                            <input
                                                className="form-input"
                                                placeholder="Item desc"
                                                style={{ flex: 1 }}
                                                value={expenseForm.split_details[`item_desc_${m.id}`] || ''}
                                                onChange={(e) => updateSplitDetail(`item_desc_${m.id}`, e.target.value)}
                                            />
                                            <input
                                                className="form-input"
                                                type="number"
                                                step="0.01"
                                                placeholder="₹"
                                                style={{ maxWidth: 90 }}
                                                value={expenseForm.split_details[`item_amt_${m.id}`] || ''}
                                                onChange={(e) => updateSplitDetail(`item_amt_${m.id}`, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Recurring */}
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={expenseForm.is_recurring}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, is_recurring: e.target.checked })}
                                />
                                <label htmlFor="recurring" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontSize: '0.9rem' }}>
                                    🔄 Recurring expense
                                </label>
                                {expenseForm.is_recurring && (
                                    <select
                                        className="form-input"
                                        style={{ maxWidth: 130 }}
                                        value={expenseForm.recurrence_interval}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, recurrence_interval: e.target.value })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="weekly">Weekly</option>
                                    </select>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowExpenseModal(false); resetExpenseForm(); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">Add Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
