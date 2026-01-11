import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaShieldAlt, FaPhone, FaUtensils, FaGhost, FaSearch, 
    FaSignOutAlt, FaTrash, FaRedo, FaEdit, FaKey, FaPlus, FaTimes,
    FaBullhorn, FaSync, FaSortAmountDown, FaCircle, 
    FaUserSecret, FaLock, FaArrowRight, FaSpinner, FaHeartbeat, FaEye, FaAd, 
    FaStar, FaCommentDots, FaQrcode // 🆕 Icons
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const API_URL = "https://smart-menu-app-production.up.railway.app";

const SuperAdmin = () => {
    // --- STATE ---
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [secret, setSecret] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const [clients, setClients] = useState([]);
    const [reviews, setReviews] = useState([]); // ⭐ Feedback
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

    // --- SOCKETS ---
    useEffect(() => {
        if (!token) return;
        const socket = io(API_URL);
        socket.on("new-order", (data) => {
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setFeed(prev => [`[${time}] 💰 ₹${data.totalAmount}`, ...prev.slice(0, 9)]);
        });
        return () => socket.disconnect();
    }, [token]);

    // --- LOGIN ---
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

    // --- SYNC ---
    const refreshData = useCallback(async () => {
        if (!token) return;
        const start = Date.now();
        try {
            const [clientRes, sysRes, pulseRes, reviewRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/ceo-sync`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/api/superadmin/system-status`),
                axios.get(`${API_URL}/api/superadmin/server-pulse`),
                axios.get(`${API_URL}/api/superadmin/reviews`, { headers: { Authorization: `Bearer ${token}` } }) // ⭐ Fetch Reviews
            ]);

            setClients(clientRes.data);
            setBroadcastMsg(sysRes.data.message || "");
            setMaintenanceMode(sysRes.data.maintenance || false);
            setGlobalBanner(sysRes.data.globalBanner || "");
            setReviews(reviewRes.data); // ⭐ Set Reviews
            
            const latency = Date.now() - start;
            setServerPulse({ ...pulseRes.data, latency: `${latency}ms` });
            
            setLoading(false);
        } catch (e) {
            if(e.response?.status === 401) { localStorage.removeItem('admin_token'); setToken(null); }
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { refreshData(); }, [refreshData]);

    // --- ACTIONS ---
    const updateSystemSettings = async () => {
        try {
            await axios.put(`${API_URL}/api/superadmin/system-status`, {
                message: broadcastMsg,
                maintenance: maintenanceMode,
                globalBanner 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("System Updated 📢");
        } catch (e) { toast.error("Update Failed"); }
    };

    const handleTimeWarp = async (days) => {
        try {
            const res = await axios.put(`${API_URL}/api/superadmin/client/${selected._id}/extend`, 
                { days }, { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`Access Updated`);
            refreshData(); 
            setSelected(prev => ({ ...prev, trialEndsAt: res.data.trialEndsAt, isPro: res.data.isPro })); 
        } catch (e) { toast.error("Failed"); }
    };

    // (Standard CRUD functions - same as before)
    const handleRegister = async () => { try { await axios.post(`${API_URL}/api/auth/register`, createForm); toast.success("Created! 🚀"); setShowCreateModal(false); refreshData(); } catch(e){ toast.error("Failed"); } };
    const handleUpdateClient = async () => { try { await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, selected, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Updated"); refreshData(); } catch(e){} };
    const handlePasswordReset = async () => { try { await axios.put(`${API_URL}/api/superadmin/client/${selected._id}`, { password: newPassword }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Reset 🔒"); setNewPassword(""); } catch(e){} };
    const toggleSwitch = async (id, field, val) => { try { setSelected(p => ({...p, settings: {...p.settings, [field.split('.')[1]]: !val}})); await axios.put(`${API_URL}/api/superadmin/control/${id}`, { field, value: !val }, { headers: { Authorization: `Bearer ${token}` } }); refreshData(); } catch(e){} };
    const enterGodMode = async (id, u) => { try { const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${id}`, { headers: { Authorization: `Bearer ${token}` } }); localStorage.setItem(`owner_token_${u}`, res.data.token); localStorage.setItem(`owner_id_${u}`, res.data.ownerId); window.open(`/${u}/admin`, '_blank'); } catch(e){} };
    const handleResetData = async () => { if(window.confirm("WIPE ORDERS?")) try { await axios.post(`${API_URL}/api/superadmin/client/${selected._id}/reset`, {}, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Wiped"); refreshData(); } catch(e){} };
    const handleDeleteClient = async () => { if(window.confirm("DELETE?")) try { await axios.delete(`${API_URL}/api/superadmin/client/${selected._id}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Deleted"); setSelected(null); refreshData(); } catch(e){} };
    const saveNotes = async (id) => { await axios.put(`${API_URL}/api/superadmin/notes/${id}`, { notes: noteDraft }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Saved"); refreshData(); };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
    const filtered = clients.filter(c => c.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.username?.includes(searchTerm));
    const metrics = useMemo(() => {
        return { 
            total: clients.length, 
            totalRev: clients.reduce((s, c) => s + (c.totalRevenue || 0), 0),
            monthlyRev: clients.reduce((s, c) => s + (c.monthlyRevenue || 0), 0)
        };
    }, [clients]);

    if (!token) return <LoginScreen secret={secret} setSecret={setSecret} handleLogin={handleLogin} loading={loginLoading} />;
    if (loading) return <div style={styles.center}><FaShieldAlt className="spin" size={50} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* PULSE HEADER */}
            <div style={styles.pulseHeader}>
                <div style={{display:'flex', gap:20, fontSize:11, color:'#888'}}>
                    <span style={{display:'flex', alignItems:'center', gap:5}}><FaHeartbeat color="#22c55e"/> Uptime: {serverPulse.uptime}</span>
                    <span style={{display:'flex', alignItems:'center', gap:5}}><FaCircle size={8} color={serverPulse.dbStatus === 'Connected' ? '#22c55e' : '#f00'}/> DB: {serverPulse.dbStatus}</span>
                    <span>Latency: <span style={{color:'#f97316'}}>{serverPulse.latency}</span></span>
                </div>
                <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); }} style={styles.logoutBtn}>LOGOUT</button>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h1 style={styles.title}><FaShieldAlt color="#f97316"/> CEO DASHBOARD</h1>
                <div style={styles.headerActions}>
                    <button onClick={refreshData} style={styles.iconBtn}><FaSync/></button>
                    <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}><FaPlus/> NEW CLIENT</button>
                </div>
            </div>

            <div style={styles.contentGrid}>
                {/* LEFT: MAIN */}
                <div style={{flex: 1}}>
                    {/* BROADCAST */}
                    <div style={styles.broadcastBar}>
                        <div style={{display:'flex', gap:10, marginBottom:10}}>
                            <FaBullhorn color="#f97316" />
                            <input style={styles.broadcastInput} placeholder="📢 Mobile Broadcast..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                        </div>
                        <div style={{display:'flex', gap:10, marginBottom:10}}>
                            <FaAd color="#f97316" />
                            <input style={styles.broadcastInput} placeholder="📺 Global Menu Banner..." value={globalBanner} onChange={(e) => setGlobalBanner(e.target.value)} />
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={{display:'flex', alignItems:'center', gap:10}}>
                                <label style={{fontSize:10, fontWeight:'bold', color: maintenanceMode ? '#ef4444' : '#666'}}>MAINTENANCE</label>
                                <div onClick={() => setMaintenanceMode(!maintenanceMode)} style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#333'}}>
                                    <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(18px)' : 'translateX(0)'}} />
                                </div>
                            </div>
                            <button onClick={updateSystemSettings} style={styles.saveSysBtn}>PUSH</button>
                        </div>
                    </div>

                    {/* STATS */}
                    <div style={styles.statsRow}>
                        <div style={styles.statCard}><span>CLIENTS</span><h2>{metrics.total}</h2></div>
                        <div style={styles.statCard}><span>REVENUE</span><h2 style={{color:'#22c55e'}}>{formatCurrency(metrics.totalRev)}</h2></div>
                        <div style={styles.statCard}><span>MONTHLY</span><h2 style={{color:'#f97316'}}>{formatCurrency(metrics.monthlyRev)}</h2></div>
                    </div>

                    <input style={styles.search} placeholder="Search clients..." onChange={(e) => setSearchTerm(e.target.value)} />

                    <div style={styles.grid}>
                        {filtered.map(c => (
                            <div key={c._id} style={styles.card} onClick={() => { setSelected(c); setNoteDraft(c.ceoNotes || ""); }}>
                                <div style={styles.cardHeader}>
                                    <h3>{c.restaurantName}</h3>
                                    <span style={{...styles.badge, background: c.health?.includes("Healthy") ? '#064e3b' : '#450a0a', color: c.health?.includes("Healthy") ? '#4ade80' : '#f87171'}}>
                                        {c.health === "🟢 Healthy" ? "ONLINE" : "OFFLINE"}
                                    </span>
                                </div>
                                <div style={styles.cardBody}>
                                    <p>User: {c.username}</p>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:5}}>
                                        {/* ⭐ RATING DISPLAY */}
                                        <span style={{color: '#facc15', fontWeight:'bold', fontSize:12, display:'flex', gap:3}}><FaStar/> {c.rating} ({c.reviewCount})</span>
                                        <span style={{color:'#f97316'}}>{formatCurrency(c.monthlyRevenue)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: SIDEBAR */}
                <div style={{display:'flex', flexDirection:'column', gap:20}}>
                    {/* 🕵️‍♂️ LIVE ORDERS */}
                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaEye/> LIVE ORDERS</h3>
                        <div style={styles.feedContainer}>
                            {feed.length === 0 ? <p style={{fontSize:10, color:'#444'}}>Listening...</p> : 
                                feed.map((msg, i) => <div key={i} style={styles.feedItem}>{msg}</div>)
                            }
                        </div>
                    </div>

                    {/* ⭐ REVIEWS FEED (NEW!) */}
                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaCommentDots/> LATEST REVIEWS</h3>
                        <div style={styles.feedContainer}>
                            {reviews.length === 0 ? <p style={{fontSize:10, color:'#444'}}>No reviews yet.</p> : 
                                reviews.map((r) => (
                                    <div key={r._id} style={styles.reviewItem}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:2}}>
                                            <span style={{color:'#fff', fontWeight:'bold'}}>{r.restaurantName.substring(0,10)}...</span>
                                            <span style={{color:'#facc15'}}>★ {r.rating}</span>
                                        </div>
                                        <div style={{color:'#aaa', fontStyle:'italic'}}>"{r.feedback.substring(0,30)}..."</div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showCreateModal && <div style={styles.overlay}><div style={styles.modal}><h2 style={{marginTop:0}}>New Restaurant</h2><input style={styles.input} placeholder="Name" value={createForm.restaurantName} onChange={e=>setCreateForm({...createForm, restaurantName:e.target.value})}/><input style={styles.input} placeholder="User" value={createForm.username} onChange={e=>setCreateForm({...createForm, username:e.target.value})}/><input style={styles.input} placeholder="Pass" value={createForm.password} onChange={e=>setCreateForm({...createForm, password:e.target.value})}/><button onClick={handleRegister} style={styles.saveBtn}>CREATE</button><button onClick={()=>setShowCreateModal(false)} style={styles.closeBtn}>X</button></div></div>}

            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}><h2>{selected.restaurantName}</h2><button onClick={()=>setSelected(null)}><FaTimes/></button></div>
                        <div style={styles.scrollContent}>
                            <div style={styles.switchGrid}>
                                <button onClick={()=>toggleSwitch(selected._id,'settings.menuActive',selected.settings?.menuActive)} style={{...styles.swBtn, background: selected.settings?.menuActive?'#111':'#450a0a', border:selected.settings?.menuActive?'1px solid #333':'1px solid red'}}><FaUtensils/> {selected.settings?.menuActive?"ACTIVE":"KILLED"}</button>
                                <button onClick={()=>enterGodMode(selected._id, selected.username)} style={{...styles.swBtn, background:'#f97316', color:'black'}}><FaGhost/> GHOST LOGIN</button>
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>⏳ TIME WARP (Expires: {selected.trialEndsAt ? new Date(selected.trialEndsAt).toLocaleDateString() : "Never"})</label>
                                <div style={{display:'flex', gap:5}}>
                                    <button onClick={()=>handleTimeWarp(7)} style={styles.timeBtn}>+7 D</button>
                                    <button onClick={()=>handleTimeWarp(30)} style={styles.timeBtn}>+30 D</button>
                                    <button onClick={()=>handleTimeWarp(365)} style={styles.timeBtn}>+1 Y</button>
                                    <button onClick={()=>handleTimeWarp(-999)} style={{...styles.timeBtn, background:'#450a0a', color:'red'}}>EXPIRE</button>
                                </div>
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>🖨️ THE FORGE</label>
                                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                    <FaQrcode size={30} color="white"/>
                                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://yourapp.com/menu/${selected.username}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:12}}>Download QR</a>
                                </div>
                            </div>
                            <div style={styles.section}>
                                <label style={styles.label}>DETAILS & RESET</label>
                                <input style={styles.input} value={selected.restaurantName} onChange={e=>setSelected({...selected, restaurantName:e.target.value})}/>
                                <div style={{display:'flex', gap:5}}><input style={{...styles.input, marginBottom:0}} placeholder="New Pass" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button onClick={handlePasswordReset} style={{...styles.saveBtn, width:'auto'}}>RESET</button></div>
                                <button onClick={handleUpdateClient} style={{...styles.updateBtn, marginTop:10}}>UPDATE INFO</button>
                            </div>
                            <div style={styles.section}><textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} style={styles.textarea}/><button onClick={()=>saveNotes(selected._id)} style={styles.saveBtn}>SAVE NOTES</button></div>
                            <div style={styles.dangerZone}><button onClick={handleResetData} style={styles.dangerBtn}><FaRedo/> RESET</button><button onClick={handleDeleteClient} style={styles.dangerBtn}><FaTrash/> DELETE</button></div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

const LoginScreen = ({ secret, setSecret, handleLogin, loading }) => (
    <div style={styles.center}><div style={styles.loginCard}><FaUserSecret size={50} color="#f97316" style={{marginBottom:20}}/><h1 style={styles.loginTitle}>CEO ACCESS</h1><form onSubmit={handleLogin}><div style={{position:'relative',marginBottom:20}}><FaLock style={{position:'absolute',left:15,top:18,color:'#444'}}/><input type="password" placeholder="Master Key" value={secret} autoFocus onChange={e=>setSecret(e.target.value)} style={styles.loginInput}/></div><button type="submit" disabled={loading} style={styles.loginBtn}>{loading?<FaSpinner className="spin"/>:<>ENTER <FaArrowRight/></>}</button></form></div></div>
);

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: '#fff', fontFamily: 'Inter, sans-serif' },
    pulseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 10, borderBottom: '1px solid #222' },
    contentGrid: { display: 'flex', gap: 20, flexDirection: 'row', alignItems: 'flex-start' },
    spyglass: { width: '250px', background: '#0a0a0a', border: '1px solid #222', borderRadius: 12, padding: 15, height: 'calc(50vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    sideTitle: { fontSize:12, color:'#666', margin:'0 0 10px 0', display:'flex', alignItems:'center', gap:5 },
    feedContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 },
    feedItem: { fontSize: 10, color: '#aaa', borderBottom: '1px solid #1a1a1a', paddingBottom: 5 },
    reviewItem: { fontSize: 10, borderBottom: '1px solid #1a1a1a', paddingBottom: 8, marginBottom: 8 },
    
    // ... (Standard Styles) ...
    center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', fontWeight: '900', margin: 0, display:'flex', alignItems:'center', gap:'10px' },
    headerActions: { display: 'flex', gap: '10px' },
    iconBtn: { background:'#111', border:'1px solid #333', color:'#fff', padding:'10px', borderRadius:'8px', cursor:'pointer' },
    createBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    logoutBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    broadcastBar: { background: '#0a0a0a', border: '1px solid #222', padding: '15px', borderRadius: '12px', marginBottom: '20px' },
    broadcastInput: { background: '#111', border: '1px solid #222', color: '#fff', fontSize: '12px', width: '100%', padding: '8px', borderRadius: 6 },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px', borderRadius: '12px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    card: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px', borderRadius: '12px', cursor: 'pointer', transition: '0.2s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    badge: { fontSize: '9px', padding: '3px 6px', borderRadius: '4px', fontWeight: 'bold' },
    cardBody: { fontSize: '11px', color: '#888' },
    search: { background: '#111', border: '1px solid #333', padding: '12px', borderRadius: '8px', color: '#fff', width: '100%', marginBottom: 20 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px', zIndex: 999 },
    modal: { background: '#0a0a0a', border: '1px solid #333', borderRadius: '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
    modalTop: { display: 'flex', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid #222' },
    scrollContent: { overflowY: 'auto', padding: 20 },
    section: { marginBottom: 15, borderTop: '1px solid #222', paddingTop: 10 },
    label: { fontSize: 10, fontWeight: 'bold', color: '#666', marginBottom: 5, display: 'block' },
    input: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: 10, marginBottom: 10, borderRadius: 8 },
    timeBtn: { flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 'bold' },
    saveBtn: { background: '#22c55e', border: 'none', color: '#000', width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
    updateBtn: { background: '#3b82f6', border: 'none', color: '#fff', width: '100%', padding: 10, borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
    closeBtn: { background: '#333', border: 'none', color: '#fff', padding: 10, borderRadius: 8, cursor: 'pointer' },
    switchGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
    swBtn: { padding: 15, borderRadius: 10, cursor: 'pointer', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 10 },
    dangerZone: { marginTop: 20, background: 'rgba(69, 10, 10, 0.2)', padding: 15, borderRadius: 10, border: '1px solid #450a0a' },
    dangerBtn: { flex: 1, background: '#450a0a', border: '1px solid #ef4444', color: '#ef4444', padding: 10, borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 },
    loginCard: { width: "90%", maxWidth: "350px", padding: "40px", background: "#0a0a0a", borderRadius: "24px", border: "1px solid #222", textAlign: "center" },
    loginTitle: { fontSize: "24px", fontWeight: "900", margin: "0 0 10px 0" },
    loginInput: { width: "100%", padding: "16px 16px 16px 45px", background: "#000", border: "1px solid #222", borderRadius: "14px", color: "white", outline: "none", fontSize: '18px' },
    loginBtn: { width: "100%", padding: "16px", background: "#f97316", border: "none", borderRadius: "14px", color: 'white', fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" },
    toggle: { width: '40px', height: '20px', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' },
    knob: { width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px', transition: '0.3s' },
    saveSysBtn: { background: '#f97316', color: '#000', border: 'none', padding: '5px 12px', borderRadius: '6px', fontWeight: 'bold', fontSize: '10px', cursor: 'pointer' },
    textarea: { width: '100%', height: 80, background: '#000', border: '1px solid #333', color: '#fff', padding: 10, borderRadius: 8 }
};

export default SuperAdmin;