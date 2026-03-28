import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function CreateGroup() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('INR');
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState(['Me']);
    const [memberName, setMemberName] = useState('');

    function addMember() {
        const trimmed = memberName.trim();
        if (trimmed && !members.includes(trimmed)) {
            setMembers([...members, trimmed]);
            setMemberName('');
        }
    }

    function removeMember(nameToRemove) {
        if (nameToRemove === 'Me') return; // Protect "Me"
        setMembers(members.filter(m => m !== nameToRemove));
    }

    async function handleCreate(e) {
        e.preventDefault();
        if (!name.trim()) return toast.error('Group name is required');
        setLoading(true);
        try {
            const data = await groupsAPI.create({ 
                name, 
                base_currency: currency,
                members // Send the array of names
            });
            toast.success('Group created');
            const gId = data.id || (data.group && data.group.id);
            navigate(`/groups/${gId}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ padding: '0 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ paddingTop: 32, paddingBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                    className="btn-icon" 
                    onClick={() => navigate('/app')} 
                    style={{background: 'var(--bg-0)', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}
                    title="Close"
                >
                    ✕
                </button>
            </div>

            <div>
                <h1 className="blue-heading" style={{fontSize: '2.8rem', letterSpacing: '-1px'}}>
                    Start a new<br/>
                    <span style={{color: 'var(--primary)'}}>shared chapter.</span>
                </h1>
            </div>

            <form onSubmit={handleCreate} style={{flex: 1, display: 'flex', flexDirection: 'column', marginTop: 16}}>
                <div className="camera-upload-box">
                    <div className="camera-icon-circle">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                            <circle cx="12" cy="13" r="3"/>
                        </svg>
                    </div>
                    <div>
                        <div style={{fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '1px', marginBottom: 4}}>ADD COVER</div>
                        <div style={{fontSize: '0.9rem', color: 'var(--text-2)'}}>Bring your gang together.</div>
                    </div>
                </div>

                <div className="modern-input-wrapper">
                    <div className="modern-input-icon">🏷️</div>
                    <input 
                        className="modern-input" 
                        placeholder="Name your squad (e.g. Goa Trip)" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        style={{marginLeft: 16}}
                    />
                </div>

                <div className="modern-input-wrapper">
                    <div className="modern-input-icon">💵</div>
                    <select 
                        className="modern-input" 
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        style={{marginLeft: 16, cursor: 'pointer', appearance: 'none', paddingRight: 32}}
                    >
                        <option value="INR">INR — Indian Rupee</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — British Pound</option>
                    </select>
                </div>

                <div style={{marginTop: 16}}>
                    <div className="sub-heading-small">WHO'S IN?</div>
                    
                    <div className="pill-list-horizontal">
                        {members.map(mName => (
                            <div key={mName} className={`modern-pill ${mName === 'Me' ? 'active' : ''}`} style={{position: 'relative', overflow: 'visible'}}>
                                <div className="pill-avatar">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mName}`} alt={mName} />
                                </div>
                                {mName}
                                {mName !== 'Me' && (
                                    <button 
                                        type="button" 
                                        onClick={() => removeMember(mName)}
                                        style={{position: 'absolute', top: -4, right: -4, background: 'var(--red)', color: 'white', borderRadius: '50%', border: 'none', width: 14, height: 14, fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'}}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="modern-input-wrapper" style={{marginTop: 12, borderStyle: 'dashed', borderColor: 'var(--primary-soft)'}}>
                        <div className="modern-input-icon">➕</div>
                        <input 
                            className="modern-input" 
                            placeholder="Add a friend's name..." 
                            value={memberName}
                            onChange={(e) => setMemberName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addMember();
                                }
                            }}
                            style={{marginLeft: 16}}
                        />
                        <button 
                            type="button" 
                            onClick={addMember}
                            style={{background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 12, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, marginLeft: 8}}
                        >
                            Add
                        </button>
                    </div>
                </div>

                <div style={{marginTop: 'auto', paddingBottom: 40, paddingTop: 32}}>
                    <button type="submit" className="large-primary-btn" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </form>
        </div>
    );
}
