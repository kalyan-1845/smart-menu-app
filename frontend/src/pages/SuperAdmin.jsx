import React, { useState, useEffect, useMemo } from "react";
import { 
    FaShieldAlt, FaPhone, FaCalendarAlt, FaUtensils, FaUserTie, 
    FaGhost, FaSave, FaSearch, FaDownload, FaExclamationTriangle, FaCheckCircle, FaSignOutAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com";

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null); // The client currently open in modal
    const [noteDraft, setNoteDraft] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    // 📱 PWA INSTALL LOGIC & AUTH CHECK
    useEffect(() => {
        // PWA Event Listener
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        // Auth Check
        const token = localStorage.getItem('admin_token');
        if (!token) {
            navigate("/super-login"); // Redirect if not logged in
        } else {
            refreshData();
        }
    }, [navigate]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            setDeferredPrompt(null);
        } else {
            toast("App is already installed or not supported.");
        }
    };

    // 🔄 MASTER SYNC (Fetches Health, Money, Notes)
    const refreshData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await axios.get(`${API_URL}/api/superadmin/ceo-sync`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClients(res.data);
            setLoading(false);
        } catch (e) {
            console.error(e);
            if(e.response && e.response.status === 401) {
                toast.error("Session Expired");
                navigate("/super-login");
            } else {
                toast.error("Sync Failed");
            }
        }
    };

    // ⚡ KILL SWITCH TOGGLE (Menu / Kitchen / Pro)
    const toggleSwitch = async (id, field, currentVal) => {
        try {
            await axios.put(`${API_URL}/api/superadmin/control/${id}`, 
                { field, value: !currentVal },
                { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
            );
            toast.success("System Updated Instantly");
            refreshData(); // Re-fetch to confirm server state
            
            // Update local state immediately for UI speed
            if (selected) setSelected(prev => ({ 
                ...prev, 
                settings: { ...prev.settings, [field.split('.')[1]]: !currentVal } 
            }));
        } catch (e) { toast.error("Hardware Switch Failed"); }
    };

    // 📝 SAVE PRIVATE NOTES
    const saveNotes = async (id) => {
        await axios.put(`${API_URL}/api/superadmin/notes/${id}`, { notes: noteDraft }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
        });
        toast.success("Intelligence Saved");
        refreshData();
    };

    // 👻 GOD MODE (Ghost Login)
    const enterGodMode = async (id, username) => {
        try {
            const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            // Save the owner token securely
            localStorage.setItem(`owner_token_${username}`, res.data.token);
            // Open their panel in a new tab
            window.open(`/${username}/admin`, '_blank');
            toast.success(`Accessing ${username}...`);
        } catch (e) { toast.error("God Mode Failed"); }
    };

    // 📊 CALCULATED METRICS (Money View)
    const metrics = useMemo(() => {
        const total = clients.length;
        const active = clients.filter(c => c.health && c.health.includes("Healthy")).length;
        const paid = clients.filter(c => c.settings?.isPro).length;
        const mrr = paid * 999;
        return { total, active, paid, mrr };
    }, [clients]);

    // 🔍 SEARCH FILTER
    const filtered = clients.filter(c => 
        c.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phoneNumber?.includes(searchTerm) ||
        c.username?.includes(searchTerm)
    );

    return (
        <div style={styles.container}>
            {/* --- HEADER --- */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}><FaShieldAlt color="#f97316"/> CEO DASHBOARD</h1>
                    <p style={styles.sub}>Master Control Center</p>
                </div>
                <div style={styles.headerActions}>
                    <button onClick={handleInstall} style={styles.installBtn}><FaDownload/> APP</button>
                    <button onClick={() => { localStorage.removeItem('admin_token'); navigate('/super-login'); }} style={styles.logoutBtn}><FaSignOutAlt/></button>
                </div>
            </div>

            <div style={{marginBottom: '20px'}}>
                 <input 
                    style={styles.search} 
                    placeholder="Search Client by Name, Phone, or ID..." 
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* --- MONEY VIEW & KPI --- */}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <span>TOTAL CLIENTS</span>
                    <h2>{metrics.total}</h2>
                </div>
                <div style={styles.statCard}>
                    <span>ACTIVE (Daily)</span>
                    <h2 style={{color:'#22c55e'}}>{metrics.active}</h2>
                </div>
                <div style={styles.statCard}>
                    <span>PAID USERS</span>
                    <h2>{metrics.paid}</h2>
                </div>
                <div style={styles.statCard}>
                    <span>EST. MRR</span>
                    <h2 style={{color:'#f97316'}}>₹{metrics.mrr.toLocaleString()}</h2>
                </div>
            </div>

            {/* --- CLIENT GRID --- */}
            <div style={styles.grid}>
                {loading ? <p>Syncing...</p> : filtered.map(c => (
                    <div key={c._id} style={styles.card} onClick={() => { setSelected(c); setNoteDraft(c.ceoNotes || ""); }}>
                        <div style={styles.cardHeader}>
                            <h3>{c.restaurantName}</h3>
                            {/* Health Badge */}
                            <span style={{
                                ...styles.badge, 
                                background: c.health?.includes("Healthy") ? '#064e3b' : c.health?.includes("Risk") ? '#450a0a' : '#713f12',
                                color: c.health?.includes("Healthy") ? '#4ade80' : c.health?.includes("Risk") ? '#f87171' : '#facc15'
                            }}>
                                {c.health === "🟢 Healthy" ? <FaCheckCircle/> : <FaExclamationTriangle/>} {c.health}
                            </span>
                        </div>
                        <div style={styles.cardBody}>
                            <p><strong>User:</strong> {c.username}</p>
                            <p><strong>Last Active:</strong> {c.lastActive}</p>
                            <p><strong>Plan:</strong> {c.settings?.isPro ? "👑 PRO" : "TRIAL"}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- MODAL: COMMAND CENTER --- */}
            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}>
                            <h2>Control: {selected.restaurantName}</h2>
                            <button onClick={() => setSelected(null)} style={styles.closeBtn}>CLOSE</button>
                        </div>

                        {/* KILL SWITCHES */}
                        <div style={styles.switchGrid}>
                            <button onClick={() => toggleSwitch(selected._id, 'settings.menuActive', selected.settings?.menuActive)}
                                style={{...styles.swBtn, background: selected.settings?.menuActive ? '#111' : '#450a0a', border: selected.settings?.menuActive ? '1px solid #333' : '1px solid #f00'}}>
                                <FaUtensils color={selected.settings?.menuActive ? '#22c55e' : '#666'} /> 
                                {selected.settings?.menuActive ? "MENU LIVE" : "MENU KILLED"}
                            </button>
                            
                            <button onClick={() => toggleSwitch(selected._id, 'settings.chefActive', selected.settings?.chefActive)}
                                style={{...styles.swBtn, background: selected.settings?.chefActive ? '#111' : '#450a0a', border: selected.settings?.chefActive ? '1px solid #333' : '1px solid #f00'}}>
                                <FaUserTie color={selected.settings?.chefActive ? '#22c55e' : '#666'} /> 
                                {selected.settings?.chefActive ? "CHEF LIVE" : "CHEF KILLED"}
                            </button>
                            
                            <button onClick={() => toggleSwitch(selected._id, 'settings.isPro', selected.settings?.isPro)}
                                style={{...styles.swBtn, border: '1px solid #f97316'}}>
                                {selected.settings?.isPro ? "⬇️ DOWNGRADE TO TRIAL" : "👑 UPGRADE TO PRO"}
                            </button>

                            <button onClick={() => enterGodMode(selected._id, selected.username)} style={{...styles.swBtn, background:'#f97316', color:'black'}}>
                                <FaGhost /> ENTER GOD MODE
                            </button>
                        </div>

                        {/* CONTACT INFO */}
                        <div style={styles.infoBox}>
                            <p><FaPhone/> {selected.phoneNumber || "No Phone"}</p>
                            <p>Revenue: ₹{selected.totalRevenue}</p>
                            <p>Expires: {new Date(selected.subscriptionExpires).toLocaleDateString()}</p>
                        </div>

                        {/* CEO NOTES */}
                        <div style={styles.notesSection}>
                            <label>📓 PRIVATE NOTES</label>
                            <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} style={styles.textarea}/>
                            <button onClick={() => saveNotes(selected._id)} style={styles.saveBtn}><FaSave/> SAVE NOTES</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap:'10px' },
    title: { fontSize: '20px', fontWeight: '900', margin: 0, display:'flex', alignItems:'center', gap:'10px' },
    sub: { fontSize: '12px', color: '#666', margin: 0 },
    headerActions: { display: 'flex', gap: '10px' },
    installBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    logoutBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    search: { background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', width: '100%', maxWidth: '400px' },
    
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px', borderRadius: '12px' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    card: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    badge: { fontSize: '10px', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', display:'flex', alignItems:'center', gap:'5px' },
    cardBody: { fontSize: '12px', color: '#888', lineHeight: '1.6' },
    
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', zIndex: 999 },
    modal: { background: '#0a0a0a', border: '1px solid #333', borderRadius: '20px', padding: '25px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' },
    modalTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
    closeBtn: { background: '#333', border: 'none', color: '#fff', padding: '5px 15px', borderRadius: '6px', cursor: 'pointer' },
    
    switchGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' },
    swBtn: { padding: '15px', borderRadius: '10px', cursor: 'pointer', color: '#fff', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '10px' },
    
    infoBox: { background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '12px' },
    notesSection: { borderTop: '1px solid #222', paddingTop: '15px' },
    textarea: { width: '100%', height: '100px', background: '#000', border: '1px solid #333', color: '#fff', padding: '10px', marginTop: '10px', borderRadius: '8px' },
    saveBtn: { background: '#f97316', border: 'none', color: '#fff', width: '100%', padding: '12px', marginTop: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default SuperAdmin;