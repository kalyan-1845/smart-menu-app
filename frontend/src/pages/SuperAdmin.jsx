import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaShieldAlt, FaPhone, FaUtensils, FaUserTie, 
    FaGhost, FaSave, FaSearch, FaExclamationTriangle, 
    FaSignOutAlt, FaTrash, FaRedo, FaEdit, FaKey, FaPlus, FaTimes,
    FaBullhorn, FaSync, FaSortAmountDown, FaCircle
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

// ✅ Correct Backend URL
const API_URL = "https://smart-menu-app-production.up.railway.app";

const SuperAdmin = () => {
    const navigate = useNavigate();
    
    // --- 1. STATE MANAGEMENT ---
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selected, setSelected] = useState(null); 
    const [noteDraft, setNoteDraft] = useState("");
    
    // System Settings
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    
    // Forms
    const [createForm, setCreateForm] = useState({ restaurantName: "", username: "", password: "" });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPassword, setNewPassword] = useState(""); // For quick reset

    // --- 2. API LOGIC ---

    // Sync Data
    const refreshData = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return navigate("/super-login");

        try {
            const [clientRes, sysRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/ceo-sync`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/superadmin/system-status`) 
            ]);

            setClients(clientRes.data);
            setBroadcastMsg(sysRes.data.message || "");
            setMaintenanceMode(sysRes.data.maintenance || false);
            setLoading(false);
        } catch (e) {
            console.error("Sync Error:", e);
            if(e.response && e.response.status === 401) {
                toast.error("Session Expired");
                localStorage.removeItem('admin_token');
                navigate("/super-login");
            } else {
                toast.error("Connection Error");
            }
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { refreshData(); }, [refreshData]);

    // System Updates
    const updateSystemSettings = async () => {
        try {
            await axios.put(`${API_URL}/api/superadmin/system-status`, {
                message: broadcastMsg,
                maintenance: maintenanceMode
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
            toast.success("Global System Updated 🌍");
        } catch (e) { toast.error("System Update Failed"); }
    };

    // Create Client
    const handleRegister = async () => {
        if(!createForm.username || !createForm.password) return toast.error("Fill all fields");
        try {
            await axios.post(`${API_URL}/api/auth/register`, createForm, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Restaurant Created! 🚀");
            setShowCreateModal(false);
            setCreateForm({ restaurantName: "", username: "", password: "" });
            refreshData();
        } catch (e) { toast.error("Registration Failed"); }
    };

    // Client Actions
    const openClientModal = (client) => {
        setSelected(client);
        setNoteDraft(client.ceoNotes || "");
        setNewPassword(""); 
    };

    const handleUpdateClient = async () => {
        try {
            await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, {
                restaurantName: selected.restaurantName,
                username: selected.username,
                phoneNumber: selected.phoneNumber
            }, { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
            toast.success("Details Updated ✅");
            refreshData();
        } catch (e) { toast.error("Update Failed"); }
    };

    const handlePasswordReset = async () => {
        if (!newPassword) return toast.error("Enter a password");
        try {
            await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, { password: newPassword }, 
            { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } });
            toast.success("Password Changed 🔒");
            setNewPassword("");
        } catch (e) { toast.error("Reset Failed"); }
    };

    const toggleSwitch = async (id, field, currentVal) => {
        try {
            // Optimistic Update
            setSelected(prev => ({ ...prev, settings: { ...prev.settings, [field.split('.')[1]]: !currentVal } })); 
            
            await axios.put(`${API_URL}/api/superadmin/control/${id}`, { field, value: !currentVal },
                { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
            );
            toast.success("Setting Updated");
            refreshData(); 
        } catch (e) { toast.error("Switch Failed"); }
    };

    const enterGodMode = async (id, username) => {
        try {
            const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            
            // ✅ Save Owner Token & Redirect
            localStorage.setItem(`owner_token_${username}`, res.data.token);
            localStorage.setItem(`owner_id_${username}`, res.data.ownerId); 
            
            // Open in new tab so you don't lose admin access
            window.open(`/${username}/admin`, '_blank');
            toast.success(`Accessing ${username}...`);
        } catch (e) { toast.error("God Mode Failed"); }
    };

    const handleResetData = async () => {
        if(!window.confirm("⚠️ Factory Reset: Clear all orders and revenue?")) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/client/${selected._id}/reset`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Data Wiped 🔄");
            refreshData();
        } catch (e) { toast.error("Reset Failed"); }
    };

    const handleDeleteClient = async () => {
        if (!window.confirm("⛔ DELETE ACCOUNT PERMANENTLY?")) return;
        try {
            await axios.delete(`${API_URL}/api/superadmin/client/${selected._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Account Deleted 🗑️");
            setSelected(null);
            refreshData();
        } catch (e) { toast.error("Delete Failed"); }
    };

    const saveNotes = async (id) => {
        await axios.put(`${API_URL}/api/superadmin/notes/${id}`, { notes: noteDraft }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        });
        toast.success("Notes Saved");
        refreshData();
    };

    // --- 3. METRICS ---
    const filtered = clients.filter(c => 
        c.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.username?.includes(searchTerm)
    );

    const metrics = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.health && c.health.includes("Healthy")).length;
        const paid = clients.filter(c => c.settings?.isPro).length;
        const mrr = paid * 999;
        return { total, active, paid, mrr };
    }, [clients]);

    if (loading) return <div style={styles.center}><FaShieldAlt className="spin" size={50} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* --- HEADER --- */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}><FaShieldAlt color="#f97316"/> CEO DASHBOARD</h1>
                    <p style={styles.sub}>Master Control Center</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={refreshData} style={styles.iconBtn}><FaSync/></button>
                    <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}><FaPlus/> NEW RESTAURANT</button>
                    <button onClick={() => { localStorage.removeItem('admin_token'); navigate('/super-login'); }} style={styles.logoutBtn}><FaSignOutAlt/></button>
                </div>
            </div>

            {/* --- SYSTEM CONTROL --- */}
            <div style={styles.broadcastBar}>
                <div style={{flex: 1, display:'flex', gap:10, alignItems:'center'}}>
                    <FaBullhorn color="#f97316" />
                    <input style={styles.broadcastInput} placeholder="Global System Broadcast Message..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                </div>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <label style={{fontSize:10, fontWeight:'bold', color: maintenanceMode ? '#ef4444' : '#666'}}>MAINTENANCE</label>
                    <div onClick={() => setMaintenanceMode(!maintenanceMode)} style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#333'}}>
                        <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(18px)' : 'translateX(0)'}} />
                    </div>
                    <button onClick={updateSystemSettings} style={styles.saveSysBtn}>UPDATE</button>
                </div>
            </div>

            {/* --- SEARCH & STATS --- */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <input style={styles.search} placeholder="Search Client..." onChange={(e) => setSearchTerm(e.target.value)} />
                <div style={{fontSize:12, color:'#666', display:'flex', alignItems:'center', gap:5}}>
                    <FaSortAmountDown/> {filtered.length} Results
                </div>
            </div>

            <div style={styles.statsRow}>
                <div style={styles.statCard}><span>TOTAL CLIENTS</span><h2>{metrics.total}</h2></div>
                <div style={styles.statCard}><span>ACTIVE TODAY</span><h2 style={{color:'#22c55e'}}>{metrics.active}</h2></div>
                <div style={styles.statCard}><span>PRO USERS</span><h2>{metrics.paid}</h2></div>
                <div style={styles.statCard}><span>EST. MRR</span><h2 style={{color:'#f97316'}}>₹{metrics.mrr.toLocaleString()}</h2></div>
            </div>

            {/* --- CLIENT LIST --- */}
            <div style={styles.grid}>
                {filtered.map(c => (
                    <div key={c._id} style={styles.card} onClick={() => openClientModal(c)}>
                        <div style={styles.cardHeader}>
                            <h3>{c.restaurantName}</h3>
                            <span style={{...styles.badge, background: c.health?.includes("Healthy") ? '#064e3b' : '#450a0a', color: c.health?.includes("Healthy") ? '#4ade80' : '#f87171'}}>
                                <FaCircle size={6} style={{marginRight:5}} /> {c.health === "🟢 Healthy" ? "ONLINE" : "OFFLINE"}
                            </span>
                        </div>
                        <div style={styles.cardBody}>
                            <p><strong>User:</strong> {c.username}</p>
                            <p><strong>Plan:</strong> {c.settings?.isPro ? <span style={{color:'#f97316'}}>👑 PRO</span> : "TRIAL"}</p>
                            <p style={{fontSize:'10px', marginTop:'5px', color:'#555'}}>Active: {c.lastActive || "Never"}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODALS --- */}
            
            {/* 1. CREATE MODAL */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h2 style={{marginTop:0}}>🚀 Register New Restaurant</h2>
                        <input style={styles.input} placeholder="Restaurant Name" value={createForm.restaurantName} onChange={e => setCreateForm({...createForm, restaurantName: e.target.value})} />
                        <input style={styles.input} placeholder="Username" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} />
                        <input style={styles.input} placeholder="Password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                        <div style={{display:'flex', gap:10, marginTop:10}}>
                            <button onClick={handleRegister} style={styles.saveBtn}>CREATE ACCOUNT</button>
                            <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. MANAGEMENT MODAL */}
            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}>
                            <h2>{selected.restaurantName}</h2>
                            <button onClick={() => setSelected(null)} style={{background:'none', border:'none', color:'white', fontSize:'20px'}}><FaTimes/></button>
                        </div>

                        <div style={styles.scrollContent}>
                            {/* A. EDIT INFO */}
                            <div style={styles.section}>
                                <label style={styles.label}>📝 BASIC DETAILS</label>
                                <input style={styles.input} value={selected.restaurantName} onChange={e => setSelected({...selected, restaurantName: e.target.value})} placeholder="Name" />
                                <input style={styles.input} value={selected.username} onChange={e => setSelected({...selected, username: e.target.value})} placeholder="Username" />
                                <input style={styles.input} value={selected.phoneNumber || ""} onChange={e => setSelected({...selected, phoneNumber: e.target.value})} placeholder="Phone" />
                                <button onClick={handleUpdateClient} style={styles.updateBtn}>UPDATE INFO</button>
                            </div>

                            {/* B. SAAS CONTROLS */}
                            <div style={styles.switchGrid}>
                                <button onClick={() => toggleSwitch(selected._id, 'settings.menuActive', selected.settings?.menuActive)}
                                    style={{...styles.swBtn, background: selected.settings?.menuActive ? '#111' : '#450a0a', border: selected.settings?.menuActive ? '1px solid #333' : '1px solid #f00'}}>
                                    <FaUtensils color={selected.settings?.menuActive ? '#22c55e' : '#666'} /> {selected.settings?.menuActive ? "MENU LIVE" : "KILLED"}
                                </button>
                                <button onClick={() => toggleSwitch(selected._id, 'settings.isPro', selected.settings?.isPro)}
                                    style={{...styles.swBtn, border: '1px solid #f97316'}}>
                                    {selected.settings?.isPro ? "⬇️ DOWNGRADE" : "👑 UPGRADE PRO"}
                                </button>
                                <button onClick={() => enterGodMode(selected._id, selected.username)} style={{...styles.swBtn, background:'#f97316', color:'black', gridColumn:'span 2'}}>
                                    <FaGhost /> LOGIN AS OWNER (GOD MODE)
                                </button>
                            </div>

                            {/* C. PASSWORD RESET */}
                            <div style={styles.section}>
                                <label style={styles.label}>🔑 RESET PASSWORD</label>
                                <div style={{display:'flex', gap:10}}>
                                    <input style={{...styles.input, marginBottom:0}} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" type="text" />
                                    <button onClick={handlePasswordReset} style={{...styles.saveBtn, width:'auto', padding:'0 20px'}}>SAVE</button>
                                </div>
                            </div>

                            {/* D. NOTES */}
                            <div style={styles.section}>
                                <label style={styles.label}>📓 PRIVATE NOTES</label>
                                <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} style={styles.textarea}/>
                                <button onClick={() => saveNotes(selected._id)} style={styles.saveBtn}>SAVE NOTES</button>
                            </div>

                            {/* E. DANGER ZONE */}
                            <div style={styles.dangerZone}>
                                <label style={{...styles.label, color:'#ef4444'}}>⛔ DANGER ZONE</label>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={handleResetData} style={styles.dangerBtn}><FaRedo/> RESET DATA</button>
                                    <button onClick={handleDeleteClient} style={styles.dangerBtn}><FaTrash/> DELETE ACCOUNT</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' },
    center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap:'wrap', gap:10 },
    title: { fontSize: '20px', fontWeight: '900', margin: 0, display:'flex', alignItems:'center', gap:'10px' },
    sub: { fontSize: '12px', color: '#666', margin: 0 },
    headerActions: { display: 'flex', gap: '10px' },
    iconBtn: { background:'#111', border:'1px solid #333', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer' },
    createBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    logoutBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    
    broadcastBar: { background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 15, flexWrap: 'wrap' },
    broadcastInput: { background: 'transparent', border: 'none', color: '#fff', fontSize: '14px', width: '100%', outline: 'none' },
    toggle: { width: '40px', height: '20px', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' },
    knob: { width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', transition: '0.3s' },
    saveSysBtn: { background: '#f97316', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' },

    search: { background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', width: '100%', flex:1, marginRight:10 },
    
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px', borderRadius: '12px' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
    card: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    badge: { fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' },
    cardBody: { fontSize: '12px', color: '#888', lineHeight: '1.6' },
    
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', zIndex: 999 },
    modal: { background: '#0a0a0a', border: '1px solid #333', borderRadius: '20px', padding: '25px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
    modalTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    closeBtn: { background: '#333', border: 'none', color: '#fff', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' },
    scrollContent: { overflowY: 'auto', paddingRight: '5px' },
    
    section: { marginBottom: '20px', borderTop: '1px solid #222', paddingTop: '15px' },
    label: { fontSize: '10px', fontWeight: 'bold', color: '#666', marginBottom: '10px', display: 'block' },
    input: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '10px', marginBottom: '10px', borderRadius: '8px' },
    updateBtn: { background: '#3b82f6', border: 'none', color: '#fff', width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' },
    
    switchGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
    swBtn: { padding: '15px', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '10px' },
    
    textarea: { width: '100%', height: '80px', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', borderRadius: '8px' },
    saveBtn: { background: '#22c55e', border: 'none', color: '#000', width: '100%', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    
    dangerZone: { marginTop: '20px', borderTop: '1px solid #450a0a', paddingTop: '15px', background: 'rgba(69, 10, 10, 0.2)', padding: '15px', borderRadius: '10px' },
    dangerBtn: { flex: 1, background: '#450a0a', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '11px' }
};

export default SuperAdmin;