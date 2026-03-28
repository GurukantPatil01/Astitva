import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, meAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Home() {
    const [groups, setGroups] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [activeTab, setActiveTab] = useState('groups');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [showGroupSelect, setShowGroupSelect] = useState(false);
    const handleAddExpense = () => {
        // Open group selection modal instead of auto-selecting a group
        setShowGroupSelect(true);
    };
    const closeGroupSelect = () => setShowGroupSelect(false);
    const selectGroup = (groupId) => {
        // Navigate to the group's detail page where expense can be added
        setShowGroupSelect(false);
        navigate(`/groups/${groupId}`);
    };

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        try {
            const [grpData, dashData] = await Promise.all([
                groupsAPI.list(),
                meAPI.getDashboard().catch(err => {
                    console.error("Dashboard err", err);
                    return { summary: {}, activities: [] };
                })
            ]);
            setGroups(grpData.groups || []);
            setDashboard(dashData || null);
        } catch (err) { toast.error(err.message); }
        finally { setLoading(false); }
    }

    async function deleteGroup(id, e) {
        e.stopPropagation();
        if (!confirm('Delete this group and all its data?')) return;
        try {
            await groupsAPI.delete(id);
            toast.success('Group deleted');
            loadData();
        } catch (err) { toast.error(err.message); }
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className="group-detail-page" style={{paddingBottom: 140}}>
            {/* ── Custom Header ───────────────────────── */}
            <div className="app-header-custom" style={{zIndex: 20}}>
                <div className="logo-area" style={{cursor: 'pointer'}}>
                    <span style={{ fontSize: '1.4rem', marginRight: 4 }}>≡</span>
                    SplitIt
                </div>
                <div className="user-area">
                    <div className="ib-avatar" style={{width: 32, height: 32}}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user_profile`} alt="User" />
                    </div>
                </div>
            </div>

            {/* ── Global Context Dashboard ─── */}
            {dashboard && dashboard.summary && (
                <div style={{ background: 'white', margin: '0 -24px 24px -24px', padding: '16px 24px 32px 24px', borderRadius: '0 0 32px 32px', boxShadow: '0 4px 24px rgba(2, 99, 155, 0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                        <div>
                            <p style={{ color: 'var(--text-3)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 6 }}>TOTAL BALANCE</p>
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: dashboard.summary.net_balance >= 0 ? 'var(--blue)' : 'var(--red)', letterSpacing: '-1px', lineHeight: 1 }}>
                                ₹{Math.abs(dashboard.summary.net_balance || 0).toLocaleString()}
                            </h2>
                            <span style={{fontSize: '0.85rem', color: 'var(--text-2)', fontWeight: 500, marginTop: 4, display: 'inline-block'}}>
                                {dashboard.summary.net_balance >= 0 ? 'You are owed in total' : 'You owe in total'}
                            </span>
                        </div>
                        <div style={{ textAlign: 'right', background: 'var(--bg-0)', padding: '12px 16px', borderRadius: 16 }}>
                            <div style={{ marginBottom: 12 }}>
                                <p style={{ color: 'var(--text-3)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>YOU OWE</p>
                                <p style={{ color: 'var(--red)', fontWeight: 700 }}>₹{(dashboard.summary.total_you_owe || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-3)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.5px' }}>YOU ARE OWED</p>
                                <p style={{ color: 'var(--blue)', fontWeight: 700 }}>₹{(dashboard.summary.total_owed_to_you || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="large-primary-btn" style={{ flex: 1, padding: '14px 16px', fontSize: '0.95rem', borderRadius: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }} onClick={handleAddExpense}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add expense
                        </button>
                        {/* Group selection modal */}
                        {showGroupSelect && (
                            <div className="modal-overlay" onClick={closeGroupSelect} style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                <div className="modal-content" onClick={e => e.stopPropagation()} style={{background: 'white', borderRadius: 16, padding: 24, width: '90%', maxWidth: 400}}>
                                    <h3 className="sub-heading-small" style={{marginBottom: 16}}>Select a group</h3>
                                    {groups.length > 0 ? (
                                        groups.map(g => (
                                            <div key={g.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)'}}>
                                                <span>{g.name}</span>
                                                <button className="btn-icon" onClick={() => selectGroup(g.id)} style={{background: 'var(--bg-0)', color: 'var(--primary)', padding: '4px 8px', fontSize: '0.8rem', borderRadius: 8}}>Select</button>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{color: 'var(--text-2)'}}>No groups available.</p>
                                    )}
                                    <button className="dashed-btn" style={{marginTop: 16, width: '100%'}} onClick={closeGroupSelect}>Cancel</button>
                                </div>
                            </div>
                        )}

                        <button className="dashed-btn" style={{ flex: 1, padding: '14px 16px', fontSize: '0.95rem', borderRadius: 16, borderColor: 'var(--border)', color: 'var(--text-1)' }} onClick={() => toast("Global settle-up coming soon")}>
                            Settle up
                        </button>
                    </div>
                </div>
            )}

            {/* ── Main Tab Content ─── */}
            {activeTab === 'groups' ? (
                <>
                    {groups.length === 0 ? (
                        <div className="empty-state">
                            <div className="icon">💳</div>
                            <p>Create your first group to start tracking shared expenses — trips, flatmates, lunches.</p>
                            <button className="large-primary-btn" onClick={() => navigate('/create-group')} style={{marginTop: 20}}>
                                Create Group →
                            </button>
                        </div>
                    ) : (
                        <div className="grid-2">
                            {groups.map((group, i) => {
                                const maxAvatars = 3;
                                const displayCount = Math.min(group.member_count || 1, maxAvatars);
                                const extraMembers = (group.member_count || 1) - maxAvatars;
                                const avatars = Array.from({ length: displayCount }).map((_, idx) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.id}-${idx}`);

                                return (
                                    <div
                                        key={group.id}
                                        className="group-card animate-in"
                                        style={{ animationDelay: `${i * 0.04}s` }}
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        <button
                                            className="btn-icon group-card-delete"
                                            onClick={(e) => deleteGroup(group.id, e)}
                                            title="Delete group"
                                        >
                                            ✕
                                        </button>
                                        
                                        <div className="group-card-top">
                                            <div className="group-card-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 12a10.06 10.06 0 0 0-20 0Z"/>
                                                    <path d="M12 12v8a2 2 0 0 0 4 0"/>
                                                    <path d="M12 2v1"/>
                                                </svg>
                                            </div>
                                            <div className="group-card-info">
                                                <h3 className="group-card-title">{group.name}</h3>
                                                <span className="group-card-category">{group.category || 'EXPENSES'}</span>
                                            </div>
                                            <div className="group-card-spent">
                                                <span className="group-card-spent-label">Members</span>
                                                <span className="group-card-spent-amount" style={{color: 'var(--text-1)'}}>{group.member_count}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="group-card-balance">
                                            <span>Your balance</span>
                                            <span className="settled" style={{ color: 'var(--text-1)' }}>Tap to detail →</span>
                                        </div>
                                        
                                        <div className="group-card-bottom">
                                            <div className="avatar-stack">
                                                {avatars.map((url, idx) => (
                                                    <div key={idx} className="avatar-circle">
                                                        <img src={url} alt="member" />
                                                    </div>
                                                ))}
                                                {extraMembers > 0 && (
                                                    <div className="avatar-circle" style={{background: 'var(--primary-soft)'}}>
                                                        +{extraMembers}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : activeTab === 'activity' ? (
                <div className="activity-feed animate-in">
                    <h3 className="sub-heading-small" style={{marginBottom: 16, marginTop: -8}}>RECENT ACTIVITY</h3>
                    {dashboard?.activities?.length > 0 ? (
                        dashboard.activities.map(act => (
                            <div key={act.id} style={{ display: 'flex', padding: '16px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                <div style={{width: 44, height: 44, background: 'var(--bg-0)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginRight: 16, border: '1px solid var(--border)'}}>
                                    🧾
                                </div>
                                <div style={{flex: 1}}>
                                    <p style={{fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)'}}>{act.title}</p>
                                    <p style={{color: 'var(--text-3)', fontSize: '0.8rem', fontWeight: 500, marginTop: 4}}>{act.group_name}</p>
                                </div>
                                <div style={{textAlign: 'right'}}>
                                    <p style={{fontWeight: 800, color: 'var(--primary)'}}>₹{act.amount.toLocaleString()}</p>
                                    <p style={{color: 'var(--text-2)', fontSize: '0.75rem', marginTop: 4}}>{act.paid_by_name} paid</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{color: 'var(--text-2)'}}>No recent activity across your groups.</p>
                    )}
                </div>
            ) : activeTab === 'friends' ? (
                <div className="activity-feed animate-in">
                    <h3 className="sub-heading-small" style={{marginBottom: 16, marginTop: -8}}>FRIEND BALANCES</h3>
                    {dashboard?.friends?.length > 0 ? (
                        dashboard.friends.map((friend, idx) => (
                            <div key={idx} style={{ display: 'flex', padding: '16px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                                <div style={{width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginRight: 16}}>
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} alt={friend.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                                </div>
                                <div style={{flex: 1}}>
                                    <p style={{fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-1)'}}>{friend.name}</p>
                                    <p style={{color: friend.balance > 0 ? 'var(--blue)' : 'var(--red)', fontSize: '0.85rem', fontWeight: 600, marginTop: 4}}>
                                        {friend.balance > 0 ? `owes you ₹${Math.abs(friend.balance).toLocaleString()}` : `you owe ₹${Math.abs(friend.balance).toLocaleString()}`}
                                    </p>
                                </div>
                                <div>
                                    <button className="btn-icon" style={{background: 'var(--bg-0)', color: 'var(--primary)', padding: '6px 12px', fontSize: '0.8rem', borderRadius: 12}}>Settle</button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{color: 'var(--text-2)'}}>You are completely settled up with all friends!</p>
                    )}
                </div>
            ) : activeTab === 'account' ? (
                <div className="account-tab animate-in" style={{padding: '0'}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: 32}}>
                        <div style={{width: 64, height: 64, borderRadius: 32, overflow: 'hidden', marginRight: 16, background: 'var(--primary-soft)'}}>
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user_profile`} alt="User" style={{width: '100%', height: '100%'}} />
                        </div>
                        <div>
                            <h2 style={{fontSize: '1.4rem', fontWeight: 800}}>Gurukant Patil</h2>
                            <p style={{color: 'var(--text-2)', fontSize: '0.9rem'}}>guru@hackathon.demo</p>
                        </div>
                    </div>
                    
                    <h3 className="sub-heading-small" style={{marginBottom: 16}}>PREFERENCES</h3>
                    <div style={{background: 'white', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24}}>
                        <div style={{padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 12}}><span style={{fontSize: '1.2rem'}}>💎</span> <span>SplitIt Pro</span></div>
                            <span style={{color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem'}}>Upgrade</span>
                        </div>
                        <div style={{padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 12}}><span style={{fontSize: '1.2rem'}}>📱</span> <span>Scan QR Code</span></div>
                            <span style={{color: 'var(--text-2)'}}>→</span>
                        </div>
                        <div style={{padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: 12}}><span style={{fontSize: '1.2rem'}}>⚙️</span> <span>Account Settings</span></div>
                            <span style={{color: 'var(--text-2)'}}>→</span>
                        </div>
                    </div>
                    
                    <button className="dashed-btn" style={{width: '100%', color: 'var(--red)', borderColor: 'rgba(255,0,0,0.2)'}} onClick={() => toast("Logged out")}>
                        Log out
                    </button>
                </div>
            ) : null}

            {/* Floating Create Button */}
            {activeTab === 'groups' && !(groups.length === 0) && (
                <button className="fab-bottom-right" onClick={() => navigate('/create-group')}>
                    +
                </button>
            )}

            {/* ── Bottom Nav ───────────────────────── */}
            <div className="bottom-nav">
                <button className={`bottom-nav-item ${activeTab === 'groups' ? 'active' : ''}`} onClick={() => setActiveTab('groups')}>
                    <div className="bottom-nav-icon">👥</div>
                    Groups
                </button>
                <button className={`bottom-nav-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                    <div className="bottom-nav-icon">👤</div>
                    Friends
                </button>
                <button className={`bottom-nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>
                    <div className="bottom-nav-icon">⏱️</div>
                    Activity
                </button>
                <button className={`bottom-nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                    <div className="bottom-nav-icon">⚙️</div>
                    Account
                </button>
            </div>
        </div>
    );
}
