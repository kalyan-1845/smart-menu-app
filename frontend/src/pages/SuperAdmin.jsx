import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaShieldAlt, FaPhone, FaUtensils, FaGhost, FaSearch, 
    FaSignOutAlt, FaTrash, FaRedo, FaEdit, FaKey, FaPlus, FaTimes,
    FaBullhorn, FaSync, FaSortAmountDown, FaCircle, 
    FaUserSecret, FaLock, FaArrowRight, FaSpinner, FaHeartbeat, FaEye, FaAd, 
    FaStar, FaCommentDots, FaQrcode 
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

// ✅ FIXED: Using the new working domain
const API_URL = "https://kovixa-backend-v99-production-a1b2.up.railway.app";

const SuperAdmin = () => {
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [secret, setSecret] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [globalBanner, setGlobalBanner] = useState(""); 
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [serverPulse, setServerPulse] = useState({ uptime: '0h', dbStatus: 'Unknown', latency: '0ms' });
    const [feed, setFeed] = useState([]); 
    const [selected, setSelected] = useState(null); 
    const [noteDraft, setNoteDraft] = useState("");
    const [createForm, setCreateForm] = useState({ restaurantName: "", username: "", password: "" });
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newPassword, setNewPassword] = useState(""); 

    useEffect(() => {
        if (!token) return;
        const socket = io(API_URL);
        socket.on("new-order", (data) => {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setFeed(prev => [`[${time}] 💰 Table ${data.tableNum}: ₹${data.totalAmount}`, ...prev.slice(0, 15)]);
        });
        return () => socket.disconnect();
    }, [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/superadmin/login`, { password: secret });
            if (res.data.success) {
                localStorage.setItem("admin_token", res.data.token);
                setToken(res.data.token);
                toast.success("Welcome, CEO.");
            }
        } catch (err) { toast.error("ACCESS DENIED"); setSecret(""); }
        finally { setLoginLoading(false); }
    };

    const refreshData = useCallback(async () => {
        if (!token) return;
        const start = Date.now();
        try {
            const [clientRes, sysRes, pulseRes, reviewRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/ceo-sync`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/superadmin/system-status`),
                axios.get(`${API_URL}/api/superadmin/server-pulse`),
                axios.get(`${API_URL}/api/superadmin/reviews`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setClients(clientRes.data);
            setBroadcastMsg(sysRes.data.message || "");
            setMaintenanceMode(sysRes.data.maintenance || false);
            setGlobalBanner(sysRes.data.globalBanner || "");
            setReviews(reviewRes.data || []);
            setServerPulse({ ...pulseRes.data, latency: `${Date.now() - start}ms` });
            setLoading(false);
        } catch (e) {
            if(e.response?.status === 401) { localStorage.removeItem('admin_token'); setToken(null); }
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { refreshData(); }, [refreshData]);

    const updateSystemSettings = async () => {
        try {
            await axios.put(`${API_URL}/api/superadmin/system-status`, {
                message: broadcastMsg, maintenance: maintenanceMode, globalBanner 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("System Updated 📢");
        } catch (e) { toast.error("Update Failed"); }
    };

    const handleTimeWarp = async (days) => {
        try {
            const res = await axios.put(`${API_URL}/api/superadmin/client/${selected._id}/extend`, { days }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Access Updated`);
            refreshData(); 
            setSelected(prev => ({ ...prev, trialEndsAt: res.data.trialEndsAt, isPro: res.data.isPro })); 
        } catch (e) { toast.error("Failed"); }
    };

    const handleRegister = async () => { try { await axios.post(`${API_URL}/api/auth/register`, createForm); toast.success("Created! 🚀"); setShowCreateModal(false); refreshData(); } catch(e){ toast.error("Failed"); } };
    const handleUpdateClient = async () => { try { await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, selected, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Updated"); refreshData(); } catch(e){} };
    const toggleSwitch = async (id, field, val) => { try { await axios.put(`${API_URL}/api/superadmin/control/${id}`, { field, value: !val }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Status Toggled"); refreshData(); setSelected(null); } catch(e){} };
    const enterGodMode = async (id, u) => { try { const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${id}`, { headers: { Authorization: `Bearer ${token}` } }); localStorage.setItem(`owner_token_${u}`, res.data.token); localStorage.setItem(`owner_id_${u}`, res.data.ownerId); window.open(`/${u}/admin`, '_blank'); } catch(e){} };

    const metrics = useMemo(() => ({
        total: clients.length, 
        totalRev: clients.reduce((s, c) => s + (c.totalRevenue || 0), 0),
        monthlyRev: clients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0)
    }), [clients]);

    const filtered = clients.filter(c => c.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.username?.includes(searchTerm));

    if (!token) return <LoginScreen secret={secret} setSecret={setSecret} handleLogin={handleLogin} loading={loginLoading} />;
    if (loading) return <div style={styles.center}><FaShieldAlt className="spin" size={80} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <div style={styles.pulseHeader}>
                <div style={{display:'flex', gap:30, fontSize:14, color:'#aaa', fontWeight:'bold'}}>
                    <span style={{display:'flex', alignItems:'center', gap:8}}><FaHeartbeat color="#22c55e"/> Uptime: {serverPulse.uptime}</span>
                    <span style={{display:'flex', alignItems:'center', gap:8}}><FaCircle size={10} color={serverPulse.dbStatus === 'Connected' ? '#22c55e' : '#f00'}/> DB: {serverPulse.dbStatus}</span>
                    <span>Latency: <span style={{color:'#f97316'}}>{serverPulse.latency}</span></span>
                </div>
                <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); }} style={styles.logoutBtn}>LOGOUT</button>
            </div>

            <h1 style={styles.title}><FaShieldAlt color="#f97316" size={32}/> CEO DASHBOARD</h1>

            <div style={styles.contentGrid}>
                <div style={{flex: 1}}>
                    <div style={styles.broadcastBar}>
                        <div style={{display:'flex', gap:15, marginBottom:15}}>
                            <FaBullhorn color="#f97316" size={24} />
                            <input style={styles.broadcastInput} placeholder="📢 Mobile Broadcast Message..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                        </div>
                        <div style={{display:'flex', gap:15, marginBottom:15}}>
                            <FaAd color="#f97316" size={24} />
                            <input style={styles.broadcastInput} placeholder="📺 Global Menu Banner..." value={globalBanner} onChange={(e) => setGlobalBanner(e.target.value)} />
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{display:'flex', alignItems:'center', gap:15}}>
                                <label style={{fontSize:12, fontWeight:'bold', color: maintenanceMode ? '#ef4444' : '#888'}}>MAINTENANCE MODE</label>
                                <div onClick={() => setMaintenanceMode(!maintenanceMode)} style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#333'}}>
                                    <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(24px)' : 'translateX(0)'}} />
                                </div>
                            </div>
                            <button onClick={updateSystemSettings} style={styles.saveSysBtn}>PUSH UPDATES</button>
                        </div>
                    </div>

                    <div style={styles.statsRow}>
                        <div style={styles.statCard}><span>TOTAL CLIENTS</span><h2>{metrics.total}</h2></div>
                        <div style={styles.statCard}><span>TOTAL REVENUE</span><h2 style={{color:'#22c55e'}}>₹{metrics.totalRev.toLocaleString()}</h2></div>
                        <div style={styles.statCard}><span>MONTHLY REV</span><h2 style={{color:'#f97316'}}>₹{metrics.monthlyRev.toLocaleString()}</h2></div>
                    </div>

                    <div style={{display:'flex', gap:15, marginBottom:20}}>
                        <input style={styles.search} placeholder="🔍 Search restaurants..." onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}><FaPlus/></button>
                    </div>

                    <div style={styles.grid}>
                        {filtered.map(c => (
                            <div key={c._id} style={styles.card} onClick={() => { setSelected(c); setNoteDraft(c.ceoNotes || ""); }}>
                                <div style={styles.cardHeader}>
                                    <h3>{c.restaurantName}</h3>
                                    <span style={{...styles.badge, background: c.health?.includes("Healthy") ? '#064e3b' : '#450a0a', color: c.health?.includes("Healthy") ? '#4ade80' : '#f87171'}}>
                                        {c.health?.includes("Healthy") ? "LIVE" : "DEAD"}
                                    </span>
                                </div>
                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
                                    <span style={{color: '#facc15', fontWeight:'bold', fontSize:14}}><FaStar/> {c.rating}</span>
                                    <span style={{color:'#f97316', fontWeight:'bold', fontSize:14}}>₹{c.monthlyRevenue?.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.sidebar}>
                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaEye/> LIVE FEED</h3>
                        <div style={styles.feedContainer}>
                            {feed.map((msg, i) => <div key={i} style={styles.feedItem}>{msg}</div>)}
                        </div>
                    </div>

                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaCommentDots/> REVIEWS</h3>
                        <div style={styles.feedContainer}>
                            {reviews.map((r) => (
                                <div key={r._id} style={styles.reviewItem}>
                                    <div style={{display:'flex', justifyContent:'space-between'}}>
                                        <b style={{fontSize:12, color:'#fff'}}>{r.restaurantName}</b>
                                        <span style={{color:'#facc15'}}>★{r.rating}</span>
                                    </div>
                                    <div style={{color:'#888', fontSize:11, marginTop:4}}>"{r.feedback}"</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {selected && (
                <div style={styles.overlay} onClick={()=>setSelected(null)}>
                    <div style={styles.modal} onClick={e=>e.stopPropagation()}>
                        <div style={styles.modalTop}><h2>{selected.restaurantName}</h2><button onClick={()=>setSelected(null)} style={{background:'none', border:'none', color:'#fff'}}><FaTimes size={24}/></button></div>
                        <div style={styles.scrollContent}>
                            <div style={styles.switchGrid}>
                                <button onClick={()=>toggleSwitch(selected._id,'settings.menuActive',selected.settings?.menuActive)} style={{...styles.swBtn, background: selected.settings?.menuActive?'#111':'#450a0a'}}>
                                    <FaUtensils/> {selected.settings?.menuActive?"MENU ACTIVE":"KILLED"}
                                </button>
                                <button onClick={()=>enterGodMode(selected._id, selected.username)} style={{...styles.swBtn, background:'#f97316', color:'black'}}><FaGhost/> GHOST LOGIN</button>
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>TIME WARP (Expires: {new Date(selected.trialEndsAt).toLocaleDateString()})</label>
                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                                    <button onClick={()=>handleTimeWarp(7)} style={styles.timeBtn}>+7 Days</button>
                                    <button onClick={()=>handleTimeWarp(30)} style={styles.timeBtn}>+30 Days</button>
                                    <button onClick={()=>handleTimeWarp(-999)} style={{...styles.timeBtn, background:'#450a0a'}}>EXPIRE</button>
                                </div>
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>OVERRIDE INFO</label>
                                <input style={styles.input} value={selected.restaurantName} onChange={e=>setSelected({...selected, restaurantName:e.target.value})}/>
                                <button onClick={handleUpdateClient} style={styles.updateBtn}>UPDATE RESTAURANT</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}><h2>New Account</h2><button onClick={()=>setShowCreateModal(false)} style={{background:'none', border:'none', color:'#fff'}}><FaTimes/></button></div>
                        <div style={{padding:30}}>
                            <input style={styles.input} placeholder="Restaurant Name" onChange={e=>setCreateForm({...createForm, restaurantName:e.target.value})}/>
                            <input style={styles.input} placeholder="Admin Username" onChange={e=>setCreateForm({...createForm, username:e.target.value})}/>
                            <input style={styles.input} placeholder="Admin Password" onChange={e=>setCreateForm({...createForm, password:e.target.value})}/>
                            <button onClick={handleRegister} style={styles.saveBtn}>DEPLOY ACCOUNT</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

const LoginScreen = ({ secret, setSecret, handleLogin, loading }) => (
    <div style={styles.center}><div style={styles.loginCard}><FaUserSecret size={60} color="#f97316" style={{marginBottom:30}}/><h1>CEO ACCESS</h1><form onSubmit={handleLogin}><input type="password" placeholder="Master Key" value={secret} autoFocus onChange={e=>setSecret(e.target.value)} style={styles.loginInput}/><button type="submit" disabled={loading} style={styles.loginBtn}>{loading?<FaSpinner className="spin"/>:<>ENTER PANEL <FaArrowRight/></>}</button></form></div></div>
);

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif' },
    pulseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottom: '1px solid #111' },
    title: { fontSize: '24px', fontWeight: '900', marginBottom: 30, display: 'flex', alignItems: 'center', gap: 15 },
    contentGrid: { display: 'flex', gap: 20, flexWrap: 'wrap' },
    sidebar: { width: '350px', display: 'flex', flexDirection: 'column', gap: 20 },
    spyglass: { background: '#0a0a0a', border: '1px solid #111', borderRadius: 16, padding: 20, height: '350px', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    sideTitle: { fontSize: 12, color: '#444', marginBottom: 15, fontWeight: '900', letterSpacing: 1 },
    feedContainer: { flex: 1, overflowY: 'auto' },
    feedItem: { fontSize: 12, color: '#22c55e', padding: '8px 0', borderBottom: '1px solid #111', fontFamily: 'monospace' },
    reviewItem: { padding: '12px 0', borderBottom: '1px solid #111' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 15, marginBottom: 30 },
    statCard: { background: '#0a0a0a', border: '1px solid #111', padding: 20, borderRadius: 16 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 15 },
    card: { background: '#0a0a0a', border: '1px solid #111', padding: 20, borderRadius: 16, cursor: 'pointer' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    badge: { fontSize: 10, padding: '4px 8px', borderRadius: 4, fontWeight: '900' },
    search: { background: '#0a0a0a', border: '1px solid #111', padding: 15, borderRadius: 12, color: '#fff', flex: 1, outline: 'none' },
    broadcastBar: { background: '#0a0a0a', border: '1px solid #111', padding: 20, borderRadius: 16, marginBottom: 20 },
    broadcastInput: { background: '#000', border: '1px solid #111', color: '#fff', width: '100%', padding: 12, borderRadius: 8, outline: 'none' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#0a0a0a', width: '500px', borderRadius: 20, border: '1px solid #111' },
    modalTop: { padding: 25, borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between' },
    scrollContent: { padding: 25 },
    section: { marginBottom: 20 },
    label: { fontSize: 11, color: '#444', fontWeight: 'bold', marginBottom: 10, display: 'block' },
    input: { width: '100%', background: '#000', border: '1px solid #111', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 10 },
    swBtn: { padding: 15, borderRadius: 10, color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, border: 'none', cursor: 'pointer' },
    switchGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
    timeBtn: { background: '#111', border: 'none', color: '#fff', padding: 12, borderRadius: 8, cursor: 'pointer' },
    saveBtn: { width: '100%', background: '#22c55e', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' },
    updateBtn: { width: '100%', background: '#3b82f6', border: 'none', padding: 15, borderRadius: 10, fontWeight: 'bold' },
    logoutBtn: { background: '#111', border: 'none', color: '#fff', padding: '8px 15px', borderRadius: 6, fontWeight: 'bold' },
    center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    loginCard: { background: '#0a0a0a', padding: 50, borderRadius: 20, border: '1px solid #111', textAlign: 'center', width: '350px' },
    loginInput: { width: '100%', padding: 20, background: '#000', border: '1px solid #111', borderRadius: 12, color: '#fff', textAlign: 'center', fontSize: 20, marginBottom: 20 },
    loginBtn: { width: '100%', padding: 15, background: '#f97316', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 'bold' },
    toggle: { width: '50px', height: '26px', borderRadius: 30, position: 'relative', cursor: 'pointer' },
    knob: { width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: 3, transition: '0.3s' },
    saveSysBtn: { background: '#f97316', border: 'none', padding: '8px 15px', borderRadius: 6, fontWeight: 'bold' },
    createBtn: { background: '#22c55e', border: 'none', padding: '0 20px', borderRadius: 12, color: '#000' }
};

export default SuperAdmin;