import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaShieldAlt, FaPhone, FaCalendarAlt, FaUtensils, FaUserTie, 
    FaGhost, FaSave, FaSearch, FaDownload, FaExclamationTriangle, 
    FaCheckCircle, FaSignOutAlt, FaTrash, FaRedo, FaEdit, FaKey, FaPlus, FaTimes,
    FaBullhorn, FaSync, FaSortAmountDown
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com";

const SuperAdmin = () => {
    const navigate = useNavigate();
    
    // --- STATE ---
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selected, setSelected] = useState(null); 
    const [noteDraft, setNoteDraft] = useState("");
    
    // 🆕 SYSTEM WIDE SETTINGS
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    
    // Forms
    const [editForm, setEditForm] = useState({ name: "", username: "", password: "", phone: "" });
    const [createForm, setCreateForm] = useState({ restaurantName: "", username: "", password: "" });
    const [showCreateModal, setShowCreateModal] = useState(false);

    // --- 🔄 1. MASTER SYNC ---
    const refreshData = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return navigate("/super-login");

        try {
            const [clientRes, sysRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/ceo-sync`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/superadmin/system-status`) // Get global settings
            ]);

            setClients(clientRes.data);
            setBroadcastMsg(sysRes.data.message || "");
            setMaintenanceMode(sysRes.data.maintenance || false);
            setLoading(false);
        } catch (e) {
            console.error("Sync Error:", e);
            if(e.response && e.response.status === 401) {
                toast.error("Session Expired");
                navigate("/super-login");
            }
        }
    }, [navigate]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    // --- 📢 2. GLOBAL BROADCAST & MAINTENANCE ---
    const updateSystemSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            await axios.put(`${API_URL}/api/superadmin/system-status`, {
                message: broadcastMsg,
                maintenance: maintenanceMode
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Global System Updated 🌍");
        } catch (e) { toast.error("System Update Failed"); }
    };

    // --- 🆕 3. REGISTER NEW RESTAURANT ---
    const handleRegister = async () => {
        if(!createForm.username || !createForm.password) return toast.error("Fill all fields");
        try {
            const token = localStorage.getItem('admin_token');
            await axios.post(`${API_URL}/api/auth/register`, createForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("New Restaurant Created! 🚀");
            setShowCreateModal(false);
            setCreateForm({ restaurantName: "", username: "", password: "" });
            refreshData();
        } catch (e) { toast.error(e.response?.data?.message || "Registration Failed"); }
    };

    // --- 🟢 4. OPEN EDIT MODAL ---
    const openClientModal = (client) => {
        setSelected(client);
        setNoteDraft(client.ceoNotes || "");
        setEditForm({ 
            name: client.restaurantName, 
            username: client.username, 
            phone: client.phoneNumber || "",
            password: "" 
        }); 
    };

    // --- 💾 5. UPDATE DETAILS & PASSWORD ---
    const handleUpdateClient = async () => {
        try {
            await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, {
                restaurantName: editForm.name,
                username: editForm.username,
                phoneNumber: editForm.phone,
                password: editForm.password 
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Details Updated ✅");
            refreshData();
            setSelected(null);
        } catch (e) { toast.error("Update Failed"); }
    };

    // --- 🗑️ 6. DELETE ACCOUNT ---
    const handleDeleteClient = async () => {
        if (!window.confirm(`⚠️ DELETE ${selected.restaurantName.toUpperCase()} PERMANENTLY?`)) return;
        if (!window.confirm("⛔ FINAL WARNING: This data will be lost forever.")) return;
        
        try {
            await axios.delete(`${API_URL}/api/superadmin/client/${selected._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Account Deleted 🗑️");
            setSelected(null);
            refreshData();
        } catch (e) { toast.error("Delete Failed"); }
    };

    // --- 🔄 7. RESET DATA ---
    const handleResetData = async () => {
        if(!window.confirm("⚠️ Factory Reset: Clear all orders and revenue?")) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/client/${selected._id}/reset`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Data Wiped Successfully 🔄");
            refreshData();
        } catch (e) { toast.error("Reset Failed"); }
    };

    // --- ⚡ 8. TOGGLES & GOD MODE ---
    const toggleSwitch = async (id, field, currentVal) => {
        try {
            setSelected(prev => ({ ...prev, settings: { ...prev.settings, [field.split('.')[1]]: !currentVal } })); 
            await axios.put(`${API_URL}/api/superadmin/control/${id}`, 
                { field, value: !currentVal },
                { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
            );
            toast.success("System Updated");
            refreshData(); 
        } catch (e) { toast.error("Switch Failed"); }
    };

    const enterGodMode = async (id, username) => {
        try {
            const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            localStorage.setItem(`owner_token_${username}`, res.data.token);
            localStorage.setItem(`owner_id_${username}`, res.data.ownerId); 
            window.open(`/${username}/admin`, '_blank');
            toast.success(`Accessing ${username}...`);
        } catch (e) { toast.error("God Mode Failed"); }
    };

    const saveNotes = async (id) => {
        await axios.put(`${API_URL}/api/superadmin/notes/${id}`, { notes: noteDraft }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        });
        toast.success("Notes Saved");
        refreshData();
    };

    // --- 🔍 FILTER & METRICS ---
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

            {/* --- 📢 SYSTEM CONTROL BAR --- */}
            <div style={styles.broadcastBar}>
                <div style={{flex: 1, display:'flex', gap:10, alignItems:'center'}}>
                    <FaBullhorn color="#f97316" />
                    <input 
                        style={styles.broadcastInput} 
                        placeholder="Global Announcement Message (Scrolls on all dashboards)" 
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                    />
                </div>
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <label style={{fontSize:10, fontWeight:'bold', color: maintenanceMode ? '#ef4444' : '#666'}}>
                        MAINTENANCE MODE
                    </label>
                    <div 
                        onClick={() => setMaintenanceMode(!maintenanceMode)}
                        style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#333'}}
                    >
                        <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(18px)' : 'translateX(0)'}} />
                    </div>
                    <button onClick={updateSystemSettings} style={styles.saveSysBtn}>UPDATE SYSTEM</button>
                </div>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
                <input style={styles.search} placeholder="Search Client..." onChange={(e) => setSearchTerm(e.target.value)} />
                <div style={{fontSize:12, color:'#666', display:'flex', alignItems:'center', gap:5}}>
                    <FaSortAmountDown/> {filtered.length} Results
                </div>
            </div>

            {/* --- METRICS --- */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}><span>TOTAL CLIENTS</span><h2>{metrics.total}</h2></div>
                <div style={styles.statCard}><span>ACTIVE TODAY</span><h2 style={{color:'#22c55e'}}>{metrics.active}</h2></div>
                <div style={styles.statCard}><span>PRO USERS</span><h2>{metrics.paid}</h2></div>
                <div style={styles.statCard}><span>EST. MRR</span><h2 style={{color:'#f97316'}}>₹{metrics.mrr.toLocaleString()}</h2></div>
            </div>

            {/* --- LIST --- */}
            <div style={styles.grid}>
                {filtered.map(c => (
                    <div key={c._id} style={styles.card} onClick={() => openClientModal(c)}>
                        <div style={styles.cardHeader}>
                            <h3>{c.restaurantName}</h3>
                            <span style={{...styles.badge, background: c.health?.includes("Healthy") ? '#064e3b' : '#450a0a', color: c.health?.includes("Healthy") ? '#4ade80' : '#f87171'}}>
                                {c.health === "🟢 Healthy" ? "ONLINE" : "OFFLINE"}
                            </span>
                        </div>
                        <div style={styles.cardBody}>
                            <p><strong>User:</strong> {c.username}</p>
                            <p><strong>Items Added:</strong> {c.itemCount || 0}</p>
                            <p><strong>Plan:</strong> {c.settings?.isPro ? <span style={{color:'#f97316'}}>👑 PRO</span> : "TRIAL"}</p>
                            <p style={{fontSize:'10px', marginTop:'5px', color:'#555'}}>Active: {c.lastActive || "Never"}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- CREATE MODAL --- */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h2 style={{marginTop:0}}>🚀 Register New Restaurant</h2>
                        <input style={styles.input} placeholder="Restaurant Name" value={createForm.restaurantName} onChange={e => setCreateForm({...createForm, restaurantName: e.target.value})} />
                        <input style={styles.input} placeholder="Username (Login ID)" value={createForm.username} onChange={e => setCreateForm({...createForm, username: e.target.value})} />
                        <input style={styles.input} placeholder="Password" value={createForm.password} onChange={e => setCreateForm({...createForm, password: e.target.value})} />
                        <div style={{display:'flex', gap:10, marginTop:10}}>
                            <button onClick={handleRegister} style={styles.saveBtn}>CREATE ACCOUNT</button>
                            <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT / CONTROL MODAL --- */}
            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}>
                            <h2>Manage: {selected.restaurantName}</h2>
                            <button onClick={() => setSelected(null)} style={{background:'none', border:'none', color:'white', fontSize:'20px'}}><FaTimes/></button>
                        </div>

                        <div style={styles.scrollContent}>
                            {/* ✏️ EDIT SECTION */}
                            <div style={styles.section}>
                                <label style={styles.label}>📝 EDIT DETAILS & PASSWORD</label>
                                <input style={styles.input} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Restaurant Name" />
                                <input style={styles.input} value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} placeholder="Username" />
                                <input style={styles.input} value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="Phone Number" />
                                <div style={{position:'relative'}}>
                                    <FaKey style={{position:'absolute', top:12, right:12, color:'#666'}}/>
                                    <input style={styles.input} value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} placeholder="Enter New Password to Reset" type="text" />
                                </div>
                                <button onClick={handleUpdateClient} style={styles.updateBtn}>UPDATE INFO</button>
                            </div>

                            {/* ⚡ SWITCHES */}
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

                            {/* 📝 NOTES */}
                            <div style={styles.section}>
                                <label style={styles.label}>📓 PRIVATE NOTES</label>
                                <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} style={styles.textarea}/>
                                <button onClick={() => saveNotes(selected._id)} style={styles.saveBtn}>SAVE NOTES</button>
                            </div>

                            {/* ⚠️ DANGER ZONE */}
                            <div style={styles.dangerZone}>
                                <label style={{...styles.label, color:'#ef4444'}}>⛔ DANGER ZONE</label>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button onClick={handleResetData} style={styles.dangerBtn}><FaRedo/> RESET ORDERS</button>
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