import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaShieldAlt, FaPhone, FaUtensils, FaGhost, FaSearch, 
    FaSignOutAlt, FaTrash, FaRedo, FaEdit, FaKey, FaPlus, FaTimes,
    FaBullhorn, FaSync, FaSortAmountDown, FaCircle, 
    FaUserSecret, FaLock, FaArrowRight, FaSpinner, FaHeartbeat, FaEye, FaAd, 
    FaStar, FaCommentDots, FaQrcode, FaWhatsapp, FaServer
} from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const API_URL = "https://smart-menu-app-production.up.railway.app";

const SuperAdmin = () => {
    // --- STATE (YOUR EXACT LOGIC) ---
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
    const [createForm, setCreateForm] = useState({ restaurantName: "", username: "", password: "", phoneNumber: "" });
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

    // --- 🔐 LOGIN LOGIC ---
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

    // 🔐 SHOW LOGIN SCREEN
    if (!token) return <LoginScreen secret={secret} setSecret={setSecret} handleLogin={handleLogin} loading={loginLoading} />;
    
    if (loading) return <div style={styles.center}><FaShieldAlt className="spin" size={50} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                body { margin: 0; background: #020617; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #020617; }
                ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            `}</style>

            {/* HEADER & PULSE */}
            <div style={styles.pulseHeader}>
                <h1 style={styles.title}><FaShieldAlt color="#f97316" size={28}/> CEO CONSOLE</h1>
                
                <div style={styles.pulseStats}>
                    <div style={styles.pulseItem}><FaHeartbeat color="#22c55e"/> {serverPulse.uptime}</div>
                    <div style={styles.pulseItem}><FaServer color={serverPulse.dbStatus === 'Connected' ? '#22c55e' : '#ef4444'}/> DB: {serverPulse.dbStatus}</div>
                    <div style={styles.pulseItem}>Ping: <span style={{color:'#f97316'}}>{serverPulse.latency}</span></div>
                </div>

                <div style={{display:'flex', gap:10}}>
                    <button onClick={refreshData} style={styles.iconBtn}><FaSync size={16}/></button>
                    <button onClick={() => { localStorage.removeItem('admin_token'); setToken(null); }} style={styles.logoutBtn}>LOGOUT</button>
                </div>
            </div>

            {/* MAIN DASHBOARD */}
            <div style={styles.contentGrid}>
                
                {/* LEFT COLUMN: CONTROLS & LIST */}
                <div style={{flex: 1}}>
                    
                    {/* SYSTEM BROADCAST PANEL */}
                    <div style={styles.glassCard}>
                        <h3 style={styles.sectionTitle}>📣 SYSTEM BROADCAST</h3>
                        <div style={styles.inputGroup}>
                            <FaBullhorn color="#64748b" />
                            <input style={styles.ghostInput} placeholder="Mobile Alert Message..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                        </div>
                        <div style={{...styles.inputGroup, marginTop:10}}>
                            <FaAd color="#64748b" />
                            <input style={styles.ghostInput} placeholder="Global Menu Banner URL..." value={globalBanner} onChange={(e) => setGlobalBanner(e.target.value)} />
                        </div>
                        
                        <div style={styles.controlRow}>
                            <div style={{display:'flex', alignItems:'center', gap:12}}>
                                <span style={{fontSize:12, fontWeight:'700', color: maintenanceMode ? '#ef4444' : '#94a3b8'}}>MAINTENANCE MODE</span>
                                <div onClick={() => setMaintenanceMode(!maintenanceMode)} style={{...styles.toggle, background: maintenanceMode ? '#ef4444' : '#334155'}}>
                                    <div style={{...styles.knob, transform: maintenanceMode ? 'translateX(24px)' : 'translateX(0)'}} />
                                </div>
                            </div>
                            <button onClick={updateSystemSettings} style={styles.actionBtn}>PUSH UPDATES</button>
                        </div>
                    </div>

                    {/* METRICS */}
                    <div style={styles.statsRow}>
                        <div style={styles.statCard}>
                            <span style={styles.statLabel}>TOTAL CLIENTS</span>
                            <h2 style={styles.statValue}>{metrics.total}</h2>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statLabel}>LIFETIME REVENUE</span>
                            <h2 style={{...styles.statValue, color:'#22c55e'}}>{formatCurrency(metrics.totalRev)}</h2>
                        </div>
                        <div style={styles.statCard}>
                            <span style={styles.statLabel}>THIS MONTH</span>
                            <h2 style={{...styles.statValue, color:'#f97316'}}>{formatCurrency(metrics.monthlyRev)}</h2>
                        </div>
                    </div>

                    {/* CLIENT LIST */}
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                        <input style={styles.searchBar} placeholder="🔍 Search Clients..." onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}><FaPlus/> NEW</button>
                    </div>

                    <div style={styles.clientGrid}>
                        {filtered.map(c => (
                            <div key={c._id} style={styles.clientCard} onClick={() => { setSelected(c); setNoteDraft(c.ceoNotes || ""); }}>
                                <div style={styles.clientHeader}>
                                    <h3 style={styles.clientName}>{c.restaurantName}</h3>
                                    <div style={{...styles.statusDot, background: c.health === "🟢 Healthy" ? '#22c55e' : '#ef4444'}}></div>
                                </div>
                                <div style={styles.clientInfo}>
                                    <p>ID: {c.username}</p>
                                    {c.phoneNumber && <p style={{color:'#3b82f6', display:'flex', alignItems:'center', gap:5}}><FaPhone size={10}/> {c.phoneNumber}</p>}
                                </div>
                                <div style={styles.clientFooter}>
                                    <span style={{color:'#facc15', display:'flex', gap:4}}><FaStar/> {c.rating}</span>
                                    <span style={{color:'#f97316'}}>{formatCurrency(c.monthlyRevenue)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COLUMN: FEEDS */}
                <div style={styles.sidebar}>
                    {/* LIVE ORDERS */}
                    <div style={styles.terminalCard}>
                        <h3 style={styles.terminalTitle}><FaEye color="#f97316"/> LIVE FEED</h3>
                        <div style={styles.feedScroll}>
                            {feed.length === 0 ? <p style={styles.emptyText}>Waiting for transactions...</p> : 
                                feed.map((msg, i) => <div key={i} style={styles.logLine}>{msg}</div>)
                            }
                        </div>
                    </div>

                    {/* REVIEWS */}
                    <div style={styles.terminalCard}>
                        <h3 style={styles.terminalTitle}><FaCommentDots color="#3b82f6"/> FEEDBACK</h3>
                        <div style={styles.feedScroll}>
                            {reviews.length === 0 ? <p style={styles.emptyText}>No recent reviews.</p> : 
                                reviews.map((r) => (
                                    <div key={r._id} style={styles.reviewBlock}>
                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'#94a3b8'}}>
                                            <span>{r.restaurantName.substring(0,12)}..</span>
                                            <span style={{color:'#facc15'}}>★ {r.rating}</span>
                                        </div>
                                        <div style={{fontSize:13, marginTop:4, color:'#e2e8f0'}}>"{r.feedback}"</div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CREATE MODAL --- */}
            {showCreateModal && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h2 style={styles.modalTitle}>🚀 Launch New Client</h2>
                        <input style={styles.input} placeholder="Restaurant Name" value={createForm.restaurantName} onChange={e=>setCreateForm({...createForm, restaurantName:e.target.value})}/>
                        <input style={styles.input} placeholder="Username (ID)" value={createForm.username} onChange={e=>setCreateForm({...createForm, username:e.target.value})}/>
                        <input style={styles.input} placeholder="Phone Number" value={createForm.phoneNumber} onChange={e=>setCreateForm({...createForm, phoneNumber:e.target.value})}/>
                        <input style={styles.input} placeholder="Password" value={createForm.password} onChange={e=>setCreateForm({...createForm, password:e.target.value})}/>
                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button onClick={handleRegister} style={styles.primaryBtn}>DEPLOY</button>
                            <button onClick={()=>setShowCreateModal(false)} style={styles.secondaryBtn}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DETAILS MODAL --- */}
            {selected && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h2 style={{margin:0, fontSize:20}}>{selected.restaurantName}</h2>
                            <button onClick={()=>setSelected(null)} style={styles.closeIcon}><FaTimes/></button>
                        </div>
                        
                        <div style={styles.modalBody}>
                            {/* ACTION GRID */}
                            <div style={styles.actionGrid}>
                                <button onClick={()=>toggleSwitch(selected._id,'settings.menuActive',selected.settings?.menuActive)} 
                                    style={{...styles.toggleBtn, borderColor: selected.settings?.menuActive ? '#334155' : '#ef4444', color: selected.settings?.menuActive ? '#fff' : '#ef4444'}}>
                                    <FaUtensils/> {selected.settings?.menuActive ? "MENU ONLINE" : "MENU KILLED"}
                                </button>
                                <button onClick={()=>enterGodMode(selected._id, selected.username)} style={{...styles.toggleBtn, borderColor:'#f97316', color:'#f97316'}}>
                                    <FaGhost/> GHOST LOGIN
                                </button>
                            </div>

                            {/* CONTACT */}
                            <div style={styles.fieldGroup}>
                                <label style={styles.fieldLabel}>CONTACT & WHATSAPP</label>
                                <div style={{display:'flex', gap:10}}>
                                    <input style={styles.input} value={selected.phoneNumber || ""} onChange={e=>setSelected({...selected, phoneNumber:e.target.value})}/>
                                    {selected.phoneNumber && (
                                        <a href={`https://wa.me/91${selected.phoneNumber}`} target="_blank" rel="noreferrer" style={styles.waBtn}>
                                            <FaWhatsapp size={20}/>
                                        </a>
                                    )}
                                </div>
                                <button onClick={handleUpdateClient} style={styles.miniBtn}>UPDATE NUMBER</button>
                            </div>

                            {/* SUBSCRIPTION */}
                            <div style={styles.fieldGroup}>
                                <label style={styles.fieldLabel}>SUBSCRIPTION (Expires: {selected.trialEndsAt ? new Date(selected.trialEndsAt).toLocaleDateString() : "Never"})</label>
                                <div style={{display:'flex', gap:5}}>
                                    <button onClick={()=>handleTimeWarp(7)} style={styles.timePill}>+7 Days</button>
                                    <button onClick={()=>handleTimeWarp(30)} style={styles.timePill}>+30 Days</button>
                                    <button onClick={()=>handleTimeWarp(365)} style={styles.timePill}>+1 Year</button>
                                    <button onClick={()=>handleTimeWarp(-999)} style={{...styles.timePill, background:'#450a0a', color:'#ef4444'}}>EXPIRE</button>
                                </div>
                            </div>

                            {/* QR CODE */}
                            <div style={styles.qrBox}>
                                <FaQrcode size={32} color="white"/>
                                <div>
                                    <div style={{fontWeight:'bold', fontSize:14}}>Menu QR Code</div>
                                    <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://yourapp.com/menu/${selected.username}`} target="_blank" rel="noreferrer" style={{color:'#3b82f6', fontSize:12}}>Download High-Res</a>
                                </div>
                            </div>

                            {/* CREDENTIALS */}
                            <div style={styles.fieldGroup}>
                                <label style={styles.fieldLabel}>CREDENTIALS</label>
                                <input style={styles.input} value={selected.username} readOnly />
                                <div style={{display:'flex', gap:10}}>
                                    <input style={styles.input} placeholder="New Password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
                                    <button onClick={handlePasswordReset} style={styles.secondaryBtn}>RESET</button>
                                </div>
                            </div>

                            {/* NOTES */}
                            <textarea value={noteDraft} onChange={e=>setNoteDraft(e.target.value)} style={styles.textarea} placeholder="CEO Notes..."/>
                            <button onClick={()=>saveNotes(selected._id)} style={styles.saveNoteBtn}>SAVE NOTES</button>

                            {/* DANGER */}
                            <div style={styles.dangerZone}>
                                <button onClick={handleResetData} style={styles.dangerBtn}><FaRedo/> WIPE ORDERS</button>
                                <button onClick={handleDeleteClient} style={styles.dangerBtn}><FaTrash/> DELETE ACCOUNT</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- PREMIUM LOGIN SCREEN ---
const LoginScreen = ({ secret, setSecret, handleLogin, loading }) => (
    <div style={styles.center}>
        <div style={styles.loginCard}>
            <div style={styles.loginIconBox}><FaUserSecret size={40} color="#f97316"/></div>
            <h1 style={styles.loginTitle}>CEO ACCESS</h1>
            <p style={{color:'#64748b', marginBottom:30}}>Enter Master Key to proceed</p>
            <form onSubmit={handleLogin}>
                <div style={{position:'relative', marginBottom:20}}>
                    <FaLock size={16} style={{position:'absolute', left:20, top:20, color:'#64748b'}}/>
                    <input type="password" placeholder="Master Key" value={secret} autoFocus onChange={e=>setSecret(e.target.value)} style={styles.loginInput}/>
                </div>
                <button type="submit" disabled={loading} style={styles.loginBtn}>
                    {loading ? <FaSpinner className="spin"/> : "AUTHENTICATE"}
                </button>
            </form>
        </div>
    </div>
);

// --- MIDNIGHT GLASS STYLES (PREMIUM) ---
const styles = {
    container: { background: '#020617', minHeight: '100vh', padding: '30px', color: '#f8fafc', fontFamily: 'Plus Jakarta Sans, sans-serif' },
    center: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' },
    
    // Header
    pulseHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, padding: '20px', background: 'rgba(30, 41, 59, 0.4)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid #1e293b' },
    title: { fontSize: '20px', fontWeight: '800', margin: 0, display:'flex', alignItems:'center', gap:'15px', letterSpacing:'1px', color: '#fff' },
    pulseStats: { display: 'flex', gap: 20, fontSize: 13, fontWeight: '600', color: '#94a3b8' },
    pulseItem: { display: 'flex', alignItems: 'center', gap: 8 },
    
    // Buttons
    iconBtn: { background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer' },
    logoutBtn: { background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize:12 },
    createBtn: { background: '#f97316', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize:'12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    actionBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '800', fontSize:'11px', cursor: 'pointer' },
    
    // Layout
    contentGrid: { display: 'flex', gap: 30, alignItems: 'flex-start' },
    sidebar: { width: 350, display: 'flex', flexDirection: 'column', gap: 20 },
    
    // Glass Cards
    glassCard: { background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1e293b', padding: '25px', borderRadius: '20px', marginBottom: '30px' },
    sectionTitle: { fontSize: 12, fontWeight: '800', color: '#64748b', letterSpacing: '1px', marginBottom: 15 },
    inputGroup: { display: 'flex', alignItems: 'center', gap: 15, background: '#0f172a', padding: '12px 20px', borderRadius: '12px', border: '1px solid #1e293b' },
    ghostInput: { background: 'transparent', border: 'none', color: '#fff', width: '100%', fontSize: '14px', outline: 'none' },
    controlRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    
    // Stats
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
    statCard: { background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '16px' },
    statLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: '0.5px' },
    statValue: { fontSize: 24, fontWeight: '800', margin: '5px 0 0 0', color: '#fff' },
    
    // Client Grid
    searchBar: { width: '100%', background: '#0f172a', border: '1px solid #1e293b', padding: '15px 20px', borderRadius: '14px', color: '#fff', outline: 'none', marginRight: 20 },
    clientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' },
    clientCard: { background: '#1e293b', border: '1px solid #334155', padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s', position: 'relative' },
    clientHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    clientName: { fontSize: 16, fontWeight: '700', color: '#fff', margin: 0 },
    statusDot: { width: 8, height: 8, borderRadius: '50%', boxShadow: '0 0 10px currentColor' },
    clientInfo: { fontSize: 13, color: '#94a3b8', marginBottom: 15 },
    clientFooter: { display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: '700', borderTop: '1px solid #334155', paddingTop: 12 },
    
    // Sidebar Terminals
    terminalCard: { background: '#020617', border: '1px solid #334155', borderRadius: '16px', padding: '20px', height: '400px', display: 'flex', flexDirection: 'column' },
    terminalTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', marginBottom: 15, display: 'flex', gap: 10, alignItems: 'center' },
    feedScroll: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 },
    logLine: { fontFamily: 'monospace', fontSize: 12, color: '#22c55e', borderBottom: '1px dashed #1e293b', paddingBottom: 5 },
    emptyText: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 20 },
    reviewBlock: { background: '#0f172a', padding: 10, borderRadius: 8, border: '1px solid #1e293b' },

    // Modals
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
    modal: { background: '#0f172a', width: '90%', maxWidth: '550px', borderRadius: '24px', border: '1px solid #334155', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' },
    modalHeader: { padding: '20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#020617' },
    closeIcon: { background: 'transparent', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer' },
    modalBody: { padding: '30px', maxHeight: '80vh', overflowY: 'auto' },
    modalTitle: { fontSize: 22, fontWeight: '800', margin: '0 0 20px 0', color: '#fff' },
    
    // Modal Form Elements
    actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 25 },
    toggleBtn: { padding: 15, borderRadius: 12, border: '1px solid', background: 'transparent', fontWeight: '700', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 },
    fieldGroup: { marginBottom: 20 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, display: 'block', letterSpacing: '0.5px' },
    input: { width: '100%', background: '#020617', border: '1px solid #334155', color: '#fff', padding: '14px', borderRadius: '10px', outline: 'none', fontSize: 14 },
    waBtn: { background: '#22c55e', color: '#fff', width: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, cursor: 'pointer' },
    miniBtn: { width: '100%', background: '#1e293b', color: '#94a3b8', border: 'none', padding: 10, borderRadius: 8, marginTop: 8, fontSize: 11, fontWeight: '700', cursor: 'pointer' },
    timePill: { flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: '600' },
    qrBox: { display: 'flex', gap: 15, alignItems: 'center', background: '#020617', padding: 15, borderRadius: 12, border: '1px solid #334155', marginBottom: 20 },
    textarea: { width: '100%', height: 80, background: '#020617', border: '1px solid #334155', color: '#fff', padding: 15, borderRadius: 10, outline: 'none', marginBottom: 10 },
    saveNoteBtn: { width: '100%', background: '#3b82f6', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontWeight: '700', cursor: 'pointer' },
    dangerZone: { marginTop: 30, paddingTop: 20, borderTop: '1px solid #334155', display: 'flex', gap: 15 },
    dangerBtn: { flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: 12, borderRadius: 8, fontSize: 11, fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    
    // Login
    loginCard: { background: '#0f172a', padding: '40px', borderRadius: '24px', border: '1px solid #1e293b', width: '350px', textAlign: 'center' },
    loginIconBox: { width: 80, height: 80, borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' },
    loginTitle: { fontSize: 24, fontWeight: '800', margin: 0, color: '#fff' },
    loginInput: { width: '100%', padding: '16px 16px 16px 50px', background: '#020617', border: '1px solid #334155', borderRadius: '12px', color: '#fff', outline: 'none' },
    loginBtn: { width: '100%', padding: '16px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: 14, cursor: 'pointer' },
    
    // Toggle
    toggle: { width: 44, height: 24, borderRadius: 20, position: 'relative', cursor: 'pointer', transition: '0.3s' },
    knob: { width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, left: 3, transition: '0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
    
    // General
    primaryBtn: { flex: 1, background: '#f97316', color: '#fff', border: 'none', padding: 15, borderRadius: 10, fontWeight: '700', cursor: 'pointer' },
    secondaryBtn: { flex: 1, background: '#334155', color: '#fff', border: 'none', padding: 15, borderRadius: 10, fontWeight: '700', cursor: 'pointer' }
};

export default SuperAdmin;