import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Home() {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', base_currency: 'INR' });
    const navigate = useNavigate();

    useEffect(() => {
        loadGroups();
    }, []);

    async function loadGroups() {
        try {
            const data = await groupsAPI.list();
            setGroups(data.groups || []);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function createGroup(e) {
        e.preventDefault();
        if (!newGroup.name.trim()) return toast.error('Group name is required');
        try {
            await groupsAPI.create(newGroup);
            toast.success('Group created!');
            setShowModal(false);
            setNewGroup({ name: '', base_currency: 'INR' });
            loadGroups();
        } catch (err) {
            toast.error(err.message);
        }
    }

    async function deleteGroup(id, e) {
        e.stopPropagation();
        if (!confirm('Delete this group and all its data?')) return;
        try {
            await groupsAPI.delete(id);
            toast.success('Group deleted');
            loadGroups();
        } catch (err) {
            toast.error(err.message);
        }
    }

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="section-title">Your Groups</h1>
                    <p className="section-subtitle">Manage shared expenses with friends & roommates</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + New Group
                </button>
            </div>

            {groups.length === 0 ? (
                <div className="empty-state">
                    <div className="icon">👥</div>
                    <p>No groups yet. Create one to start splitting expenses!</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        + Create Your First Group
                    </button>
                </div>
            ) : (
                <div className="grid-2">
                    {groups.map((group, i) => (
                        <div
                            key={group.id}
                            className="card animate-in"
                            style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                            onClick={() => navigate(`/groups/${group.id}`)}
                        >
                            <div className="card-header">
                                <h3 className="card-title">{group.name}</h3>
                                <button
                                    className="btn btn-sm btn-danger"
                                    onClick={(e) => deleteGroup(group.id, e)}
                                >
                                    🗑
                                </button>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span className="badge badge-purple">{group.base_currency}</span>
                                <span className="badge badge-blue">
                                    {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Create New Group</h2>
                        <form onSubmit={createGroup}>
                            <div className="form-group">
                                <label>Group Name</label>
                                <input
                                    className="form-input"
                                    placeholder="e.g. Goa Trip, Flat 4B, Office Lunch"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Base Currency</label>
                                <select
                                    className="form-input"
                                    value={newGroup.base_currency}
                                    onChange={(e) => setNewGroup({ ...newGroup, base_currency: e.target.value })}
                                >
                                    <option value="INR">🇮🇳 INR — Indian Rupee</option>
                                    <option value="USD">🇺🇸 USD — US Dollar</option>
                                    <option value="EUR">🇪🇺 EUR — Euro</option>
                                    <option value="GBP">🇬🇧 GBP — British Pound</option>
                                    <option value="JPY">🇯🇵 JPY — Japanese Yen</option>
                                    <option value="AUD">🇦🇺 AUD — Australian Dollar</option>
                                    <option value="THB">🇹🇭 THB — Thai Baht</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
