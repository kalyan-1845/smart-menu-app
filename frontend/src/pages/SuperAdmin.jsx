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

const API_URL = "https://smart-menu-app-production.up.railway.app";

const SuperAdmin = () => {
    // --- STATE ---
    const [token, setToken] = useState(localStorage.getItem('admin_token'));
    const [secret, setSecret] = useState("");
    const [loginLoading, setLoginLoading] = useState(false);

    const [clients, setClients] = useState([]);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // System
    const [broadcastMsg, setBroadcastMsg] = useState("");
    const [globalBanner, setGlobalBanner] = useState(""); 
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [serverPulse, setServerPulse] = useState({ uptime: '0h', dbStatus: 'Unknown', latency: '0ms' });
    const [feed, setFeed] = useState([]); 

    // Selection
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
            setFeed(prev => [`[${time}] 💰 ₹${data.totalAmount}`, ...prev.slice(0, 15)]);
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
                axios.get(`${API_URL}/api/superadmin/reviews`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setClients(clientRes.data);
            setBroadcastMsg(sysRes.data.message || "");
            setMaintenanceMode(sysRes.data.maintenance || false);
            setGlobalBanner(sysRes.data.globalBanner || "");
            setReviews(reviewRes.data);
            
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
    if (loading) return <div style={styles.center}><FaShieldAlt className="spin" size={80} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* PULSE HEADER */}
            <div style={styles.pulseHeader}>
                <div style={{display:'flex', gap:30, fontSize:16, color:'#aaa', fontWeight:'bold'}}>
                    <span style={{display:'flex', alignItems:'center', gap:8}}><FaHeartbeat color="#22c55e"/> Uptime: {serverPulse.uptime}</span>
                    <span style={{display:'flex', alignItems:'center', gap:8}}><FaCircle size={10} color={serverPulse.dbStatus === 'Connected' ? '#22c55e' : '#f00'}/> DB: {serverPulse.dbStatus}</span>
                    <span>Latency: <span style={{color:'#f97316'}}>{serverPulse.latency}</span></span>
                </div>
                <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); }} style={styles.logoutBtn}>LOGOUT</button>
            </div>

            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:30}}>
                <h1 style={styles.title}><FaShieldAlt color="#f97316" size={32}/> CEO DASHBOARD</h1>
                <div style={styles.headerActions}>
                    <button onClick={refreshData} style={styles.iconBtn}><FaSync size={20}/></button>
                    <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}><FaPlus size={18}/> NEW CLIENT</button>
                </div>
            </div>

            <div style={styles.contentGrid}>
                {/* LEFT: MAIN */}
                <div style={{flex: 1}}>
                    {/* BROADCAST */}
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
                                <label style={{fontSize:14, fontWeight:'bold', color: maintenanceMode ? '#ef4444' : '#888', letterSpacing:1}}>MAINTENANCE MODE</label>
                                <div onClick={() => setMaintenanceMode(!maintenanceMode)} style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#333'}}>
                                    <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(26px)' : 'translateX(0)'}} />
                                </div>
                            </div>
                            <button onClick={updateSystemSettings} style={styles.saveSysBtn}>PUSH UPDATES</button>
                        </div>
                    </div>

                    {/* BIG STATS */}
                    <div style={styles.statsRow}>
                        <div style={styles.statCard}><span>TOTAL CLIENTS</span><h2>{metrics.total}</h2></div>
                        <div style={styles.statCard}><span>TOTAL REVENUE</span><h2 style={{color:'#22c55e'}}>{formatCurrency(metrics.totalRev)}</h2></div>
                        <div style={styles.statCard}><span>THIS MONTH</span><h2 style={{color:'#f97316'}}>{formatCurrency(metrics.monthlyRev)}</h2></div>
                    </div>

                    <input style={styles.search} placeholder="🔍 Search clients..." onChange={(e) => setSearchTerm(e.target.value)} />

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
                                    <p>User: <span style={{color:'#fff'}}>{c.username}</span></p>
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10}}>
                                        <span style={{color: '#facc15', fontWeight:'bold', fontSize:14, display:'flex', alignItems:'center', gap:5}}><FaStar/> {c.rating} ({c.reviewCount})</span>
                                        <span style={{color:'#f97316', fontWeight:'bold', fontSize:14}}>{formatCurrency(c.monthlyRevenue)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: SIDEBAR */}
                <div style={{display:'flex', flexDirection:'column', gap:25, width: 380}}>
                    {/* 🕵️‍♂️ ORDERS */}
                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaEye/> LIVE ORDERS FEED</h3>
                        <div style={styles.feedContainer}>
                            {feed.length === 0 ? <p style={{fontSize:14, color:'#666', textAlign:'center', marginTop:20}}>Listening for orders...</p> : 
                                feed.map((msg, i) => <div key={i} style={styles.feedItem}>{msg}</div>)
                            }
                        </div>
                    </div>

                    {/* ⭐ REVIEWS */}
                    <div style={styles.spyglass}>
                        <h3 style={styles.sideTitle}><FaCommentDots/> LATEST REVIEWS</h3>
                        <div style={styles.feedContainer}>
                            {reviews.length === 0 ? <p style={{fontSize:14, color:'#666', textAlign:'center', marginTop:20}}>No reviews yet.</p> : 
                                reviews.map((r) => (
                                    <div key={r._id} style={styles.reviewItem}>
                                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:4}}>
                                            <span style={{color:'#fff', fontWeight:'bold', fontSize:14}}>{r.restaurantName.substring(0,15)}...</span>
                                            <span style={{color:'#facc15', fontWeight:'bold'}}>★ {r.rating}</span>
                                        </div>
                                        <div style={{color:'#ccc', fontStyle:'italic', fontSize:13}}>"{r.feedback}"</div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showCreateModal && <div style={styles.overlay}><div style={styles.modal}><h2 style={{marginTop:0, fontSize:28}}>🚀 New Restaurant</h2><input style={styles.input} placeholder="Restaurant Name" value={createForm.restaurantName} onChange={e=>setCreateForm({...createForm, restaurantName:e.target.value})}/><input style={styles.input} placeholder="Username" value={createForm.username} onChange={e=>setCreateForm({...createForm, username:e.target.value})}/><input style={styles.input} placeholder="Password" value={createForm.password} onChange={e=>setCreateForm({...createForm, password:e.target.value})}/><button onClick={handleRegister} style={styles.saveBtn}>CREATE ACCOUNT</button><button onClick={()=>setShowCreateModal(false)} style={styles.closeBtn}>CANCEL</button></div></div>}

            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalTop}><h2>{selected.restaurantName}</h2><button onClick={()=>setSelected(null)}><FaTimes size={24}/></button></div>
                        <div style={styles.scrollContent}>
                            <div style={styles.switchGrid}>
                                <button onClick={()=>toggleSwitch(selected._id,'settings.menuActive',selected.settings?.menuActive)} style={{...styles.swBtn, background: selected.settings?.menuActive?'#111':'#450a0a', border:selected.settings?.menuActive?'1px solid #333':'1px solid red'}}><FaUtensils size={20}/> {selected.settings?.menuActive?"MENU ACTIVE":"KILLED"}</button>
                                <button onClick={()=>enterGodMode(selected._id, selected.username)} style={{...styles.swBtn, background:'#f97316', color:'black'}}><FaGhost size={20}/> GHOST LOGIN</button>
                            </div>
                            
                            <div style={styles.section}>
                                <label style={styles.label}>⏳ TIME WARP (Expires: {selected.trialEndsAt ? new Date(selected.trialEndsAt).toLocaleDateString() : "Never"})</label>
                                <div style={{display:'flex', gap:10}}>
                                    <button onClick={()=>handleTimeWarp(7)} style={styles.timeBtn}>+7 Days</button>
                                    <button onClick={()=>handleTimeWarp(30)} style={styles.timeBtn}>+30 Days</button>
                                    <button onClick={()=>handleTimeWarp(365)} style={styles.timeBtn}>+1 Year</button>
                                    <button onClick={()=>handleTimeWarp(-999)} style={{...styles.timeBtn, background:'#450a0a', color:'red'}}>EXPIRE NOW</button>
                                </div>
                            </div>

                            <div style={styles.section}>
                                <label style={styles.label}>🖨️ THE FORGE</label>
                                <div style={{display:'flex', gap:15, alignItems:'center', background:'#111', padding:15, borderRadius:10}}>
                                    <FaQrcode size={40} color="white"/>
                                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://yourapp.com/menu/${selected.username}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:14, fontWeight:'bold', textDecoration:'underline'}}>Download High-Res QR Code</a>
                                </div>
                            </div>

                            <div style={styles.section}>
                                <label style={styles.label}>DETAILS & RESET</label>
                                <input style={styles.input} value={selected.restaurantName} onChange={e=>setSelected({...selected, restaurantName:e.target.value})}/>
                                <div style={{display:'flex', gap:10}}><input style={{...styles.input, marginBottom:0}} placeholder="New Password Override" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/><button onClick={handlePasswordReset} style={{...styles.saveBtn, width:'auto'}}>RESET PASS</button></div>
                                <button onClick={handleUpdateClient} style={{...styles.updateBtn, marginTop:15}}>UPDATE INFO</button>
                            </div>

                            <div style={styles.section}><textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} style={styles.textarea}/><button onClick={()=>saveNotes(selected._id)} style={styles.saveBtn}>SAVE CEO NOTES</button></div>
                            <div style={styles.dangerZone}><button onClick={handleResetData} style={styles.dangerBtn}><FaRedo/> RESET DATA</button><button onClick={handleDeleteClient} style={styles.dangerBtn}><FaTrash/> DELETE ACCOUNT</button></div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{100%{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

const LoginScreen = ({ secret, setSecret, handleLogin, loading }) => (
    <div style={styles.center}><div style={styles.loginCard}><FaUserSecret size={60} color="#f97316" style={{marginBottom:30}}/><h1 style={styles.loginTitle}>CEO ACCESS</h1><form onSubmit={handleLogin}><div style={{position:'relative',marginBottom:30}}><FaLock size={20} style={{position:'absolute',left:20,top:22,color:'#444'}}/><input type="password" placeholder="Master Key" value={secret} autoFocus onChange={e=>setSecret(e.target.value)} style={styles.loginInput}/></div><button type="submit" disabled={loading} style={styles.loginBtn}>{loading?<FaSpinner className="spin"/>:<>ENTER PANEL <FaArrowRight/></>}</button></form></div></div>
);

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '30px', color: '#fff', fontFamily: 'Inter, sans-serif' },
    pulseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, paddingBottom: 15, borderBottom: '1px solid #222' },
    contentGrid: { display: 'flex', gap: 30, flexDirection: 'row', alignItems: 'flex-start' },
    spyglass: { background: '#0a0a0a', border: '1px solid #222', borderRadius: 16, padding: 20, height: 'calc(50vh - 60px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    sideTitle: { fontSize:14, color:'#888', margin:'0 0 15px 0', display:'flex', alignItems:'center', gap:8, fontWeight:'bold', letterSpacing:1 },
    feedContainer: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
    feedItem: { fontSize: 13, color: '#ccc', borderBottom: '1px solid #1a1a1a', paddingBottom: 8, fontFamily:'monospace' },
    reviewItem: { fontSize: 13, borderBottom: '1px solid #1a1a1a', paddingBottom: 10, marginBottom: 10 },
    
    // ... (Big Mode Styles) ...
    center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '32px', fontWeight: '900', margin: 0, display:'flex', alignItems:'center', gap:'15px', letterSpacing:'-1px' },
    headerActions: { display: 'flex', gap: '15px' },
    iconBtn: { background:'#111', border:'1px solid #333', color:'#fff', padding:'15px', borderRadius:'12px', cursor:'pointer', transition:'0.2s' },
    createBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '15px 25px', borderRadius: '12px', fontWeight: '900', fontSize:'14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    logoutBtn: { background: '#333', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight:'bold' },
    broadcastBar: { background: '#0a0a0a', border: '1px solid #222', padding: '25px', borderRadius: '16px', marginBottom: '30px' },
    broadcastInput: { background: '#111', border: '1px solid #222', color: '#fff', fontSize: '16px', width: '100%', padding: '12px', borderRadius: 8, outline:'none' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '25px', borderRadius: '16px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
    card: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '25px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    badge: { fontSize: '11px', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold' },
    cardBody: { fontSize: '14px', color: '#888' },
    search: { background: '#111', border: '1px solid #333', padding: '16px', borderRadius: '12px', color: '#fff', width: '100%', marginBottom: 30, fontSize:'16px' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 999 },
    modal: { background: '#0a0a0a', border: '1px solid #333', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' },
    modalTop: { display: 'flex', justifyContent: 'space-between', padding: '30px', borderBottom: '1px solid #222' },
    scrollContent: { overflowY: 'auto', padding: 30 },
    section: { marginBottom: 25, borderTop: '1px solid #222', paddingTop: 20 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 10, display: 'block', letterSpacing:1 },
    input: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: 16, marginBottom: 15, borderRadius: 10, fontSize:16, outline:'none' },
    timeBtn: { flex: 1, background: '#111', border: '1px solid #333', color: '#fff', padding: 12, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' },
    saveBtn: { background: '#22c55e', border: 'none', color: '#000', width: '100%', padding: 16, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize:16 },
    updateBtn: { background: '#3b82f6', border: 'none', color: '#fff', width: '100%', padding: 16, borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', fontSize:16 },
    closeBtn: { background: '#333', border: 'none', color: '#fff', padding: 16, borderRadius: 10, cursor: 'pointer', fontSize:16, fontWeight:'bold' },
    switchGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 30 },
    swBtn: { padding: 20, borderRadius: 12, cursor: 'pointer', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 12 },
    dangerZone: { marginTop: 30, background: 'rgba(69, 10, 10, 0.2)', padding: 20, borderRadius: 12, border: '1px solid #450a0a' },
    dangerBtn: { flex: 1, background: '#450a0a', border: '1px solid #ef4444', color: '#ef4444', padding: 15, borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 12 },
    loginCard: { width: "90%", maxWidth: "400px", padding: "60px 40px", background: "#0a0a0a", borderRadius: "30px", border: "1px solid #222", textAlign: "center" },
    loginTitle: { fontSize: "32px", fontWeight: "900", margin: "0 0 10px 0" },
    loginInput: { width: "100%", padding: "20px 20px 20px 50px", background: "#000", border: "1px solid #222", borderRadius: "16px", color: "white", outline: "none", fontSize: '20px' },
    loginBtn: { width: "100%", padding: "20px", background: "#f97316", border: "none", borderRadius: "16px", color: 'white', fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontSize:'18px' },
    toggle: { width: '50px', height: '26px', borderRadius: '30px', position: 'relative', cursor: 'pointer', transition: '0.3s' },
    knob: { width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: '3px', transition: '0.3s' },
    saveSysBtn: { background: '#f97316', color: '#000', border: 'none', padding: '10px 25px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' },
    textarea: { width: '100%', height: 100, background: '#000', border: '1px solid #333', color: '#fff', padding: 15, borderRadius: 10, fontSize:14 }
};

export default SuperAdmin;