import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom"; 
import io from "socket.io-client";
import { 
    FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, 
    FaBell, FaReceipt, FaTint, FaSignOutAlt, FaUnlock, FaSpinner,
    FaFilter, FaVolumeUp, FaVolumeMute, FaUtensils, FaExclamationCircle
} from "react-icons/fa";

// Helper for "12 mins ago"
const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "Just now";
};

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]); 
    const [mongoId, setMongoId] = useState(null); 
    
    // UI State
    const [activeTab, setActiveTab] = useState("ALL"); // ALL, READY, COOKING
    const [isMuted, setIsMuted] = useState(false);
    const [now, setNow] = useState(Date.now()); // For live timer updates

    // Audio Ref
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK & TIMER ---
    useEffect(() => {
        if (isAuthenticated) {
            // Wake Lock
            if ('wakeLock' in navigator) {
                let wakeLock = null;
                const requestWakeLock = async () => {
                    try { wakeLock = await navigator.wakeLock.request('screen'); } 
                    catch (err) { console.error("WakeLock failed:", err.message); }
                };
                requestWakeLock();
                return () => wakeLock?.release();
            }
            
            // Live Timer Update (every minute)
            const timerInterval = setInterval(() => setNow(Date.now()), 60000);
            return () => clearInterval(timerInterval);
        }
    }, [isAuthenticated]);

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Unlock audio context
        if(!isMuted) {
            notifSound.current.play().then(() => {
                notifSound.current.pause();
                notifSound.current.currentTime = 0;
            }).catch(() => {});
        }

        try {
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, 
                password: password,
                role: 'waiter' 
            });

            if (res.data.success) {
                const rId = res.data.restaurantId;
                setMongoId(rId);
                localStorage.setItem(`waiter_session_${id}`, rId);
                setIsAuthenticated(true);
                fetchData(rId);
            }
        } catch (err) {
            setError("❌ Access Denied. Check Staff Password.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const savedId = localStorage.getItem(`waiter_session_${id}`);
        if (savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            fetchData(savedId);
        }
    }, [id]);

    // --- 2. DATA FETCHING ---
    const fetchData = async (rId) => {
        try {
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            // Exclude completed, show served for a short time or filter logic
            const activeOrders = orderRes.data.filter(o => o.status !== "SERVED" && o.status !== "completed");
            setOrders(activeOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setCalls(callRes.data);
        } catch (error) { console.error("Sync Error", error); }
    };

    // --- 3. REAL-TIME SOCKETS ---
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);

            const handleNotification = () => {
                if (!isMuted) {
                    notifSound.current.currentTime = 0;
                    notifSound.current.play().catch(()=>{});
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                }
                fetchData(mongoId);
            };

            socket.on("new-waiter-call", handleNotification);
            socket.on("order-updated", () => fetchData(mongoId)); // Status change (Ready)
            socket.on("new-order", () => fetchData(mongoId)); // New kitchen order

            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId, isMuted]);

    // --- 4. ACTIONS ---
    const resolveCall = async (callId) => {
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`);
            setCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) { alert("Error resolving request"); }
    };

    const markServed = async (orderId) => {
        if(!window.confirm("Confirm: Order delivered to customer?")) return;
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "completed" });
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (e) { alert("Error updating status"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`waiter_session_${id}`);
        setIsAuthenticated(false);
    };

    // --- 5. FILTERING LOGIC ---
    const filteredOrders = useMemo(() => {
        if (activeTab === "READY") return orders.filter(o => o.status === "Ready" || o.status === "ready");
        if (activeTab === "COOKING") return orders.filter(o => o.status === "pending" || o.status === "preparing");
        return orders;
    }, [orders, activeTab]);

    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}><FaUserTie style={{fontSize:'24px', color:'#3b82f6'}}/></div>
                    <h1 style={styles.lockTitle}>{id.toUpperCase()} Staff</h1>
                    <p style={styles.lockSubtitle}>WAITER STATION LOGIN</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="Waiter Password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} />
                        {error && <p style={{color: '#ef4444', fontSize: '12px'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn} disabled={loading}>
                            {loading ? <FaSpinner className="spin" /> : <><FaUnlock /> ACCESS DASHBOARD</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
             <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes pulse-orange { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
                .call-active { animation: pulse-orange 2s infinite; border: 1px solid #f97316 !important; }
                .tab-btn { flex: 1; padding: 10px; background: #111; border: 1px solid #333; color: #666; border-radius: 8px; font-size: 11px; font-weight: 800; cursor: pointer; }
                .tab-active { background: #222; color: white; border-color: #555; }
            `}</style>

            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Waiter Station</h1>
                    <p style={styles.subtitle}>{id.toUpperCase()} LIVE FEED</p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                        {isMuted ? <FaVolumeMute color="#ef4444" /> : <FaVolumeUp color="#22c55e"/>}
                    </button>
                    <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /></button>
                </div>
            </div>

            {/* 🚨 TABLE CALLS (Top Priority) */}
            {calls.length > 0 && (
                <div style={styles.section}>
                    <h2 style={{...styles.sectionTitle, color: '#f97316'}}><FaBell/> URGENT REQUESTS ({calls.length})</h2>
                    <div style={styles.grid}>
                        {calls.map(call => (
                            <div key={call._id} className="call-active" style={styles.callCard}>
                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                    <div style={styles.iconBox}>
                                        {call.type === "bill" ? <FaReceipt color="#ef4444"/> : 
                                         call.type === "water" ? <FaTint color="#3b82f6"/> : <FaBell color="#f97316"/>}
                                    </div>
                                    <div>
                                        <h3 style={{margin:0, fontSize:'20px', fontWeight:'900'}}>Table {call.tableNumber}</h3>
                                        <p style={styles.requestType}>{call.message || call.type?.toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={() => resolveCall(call._id)} style={styles.resolveBtn}>RESOLVE</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 📦 ORDER TABS */}
            <div style={styles.section}>
                <div style={{display:'flex', gap:'8px', marginBottom:'15px'}}>
                    <button className={`tab-btn ${activeTab === 'ALL' ? 'tab-active' : ''}`} onClick={() => setActiveTab('ALL')}>ALL ({orders.length})</button>
                    <button className={`tab-btn ${activeTab === 'READY' ? 'tab-active' : ''}`} onClick={() => setActiveTab('READY')}>READY 🍲</button>
                    <button className={`tab-btn ${activeTab === 'COOKING' ? 'tab-active' : ''}`} onClick={() => setActiveTab('COOKING')}>COOKING 👨‍🍳</button>
                </div>

                {filteredOrders.length === 0 ? (
                    <div style={styles.emptyState}>No orders found in this category.</div>
                ) : (
                    <div style={styles.grid}>
                        {filteredOrders.map(order => {
                            const isReady = order.status === "Ready" || order.status === "ready";
                            const isLate = (Date.now() - new Date(order.createdAt).getTime()) > 20 * 60 * 1000; // 20 mins

                            return (
                                <div key={order._id} style={{...styles.orderCard, borderColor: isReady ? '#22c55e' : (isLate ? '#ef4444' : '#333')}}>
                                    
                                    {/* Card Header */}
                                    <div style={styles.cardHeader}>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            <h2 style={{margin:0, fontSize:'18px', fontWeight:'900', color: isReady ? '#22c55e' : 'white'}}>Table {order.tableNumber}</h2>
                                            {isLate && !isReady && <FaExclamationCircle color="#ef4444" title="Running Late"/>}
                                        </div>
                                        <span style={{fontSize:'10px', color: '#888', fontWeight:'bold'}}><FaClock style={{marginRight:'4px'}}/>{timeAgo(order.createdAt)}</span>
                                    </div>

                                    {/* Status Bar */}
                                    <div style={{background: isReady ? 'rgba(34, 197, 94, 0.1)' : '#1a1a1a', padding:'5px 10px', borderRadius:'6px', marginBottom:'10px', fontSize:'10px', fontWeight:'bold', color: isReady ? '#22c55e' : '#f97316', display:'inline-block'}}>
                                        {isReady ? "✅ READY TO SERVE" : "🔥 KITCHEN PREPARING"}
                                    </div>

                                    {/* Items */}
                                    <div style={styles.itemList}>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={styles.itemRow}>
                                                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                                    <span style={{background:'#222', padding:'2px 6px', borderRadius:'4px', color:'white', fontSize:'12px', fontWeight:'bold'}}>{item.quantity}x</span>
                                                    <span style={{color: '#ddd'}}>{item.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {order.note && <div style={{fontSize:'11px', color:'#f97316', marginTop:'5px', fontStyle:'italic'}}>"{order.note}"</div>}
                                    </div>

                                    {/* Action Footer */}
                                    <div style={styles.footerRow}>
                                        <div style={{fontWeight:'900', fontSize: '15px'}}>₹{order.totalAmount}</div>
                                        {isReady ? (
                                            <button onClick={() => markServed(order._id)} style={styles.btnServe}>
                                                <FaCheckCircle /> DELIVERED
                                            </button>
                                        ) : (
                                            <div style={{fontSize:'10px', color:'#555', fontWeight:'bold'}}>WAITING FOR KITCHEN</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '15px', paddingBottom: '40px' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { width: '90%', maxWidth: '340px', background: '#111', padding: '40px', borderRadius: '24px', textAlign: 'center', border: '1px solid #222' },
    iconCircle: { width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
    lockTitle: { fontSize: '20px', fontWeight: '900', margin: 0 },
    lockSubtitle: { color: '#444', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '25px' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' },
    loginBtn: { width: '100%', background: '#3b82f6', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: '900', letterSpacing: '0.5px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: '#111', padding: '15px', borderRadius: '16px' },
    title: { fontSize: '16px', fontWeight: '900', margin: 0 },
    subtitle: { color: '#3b82f6', fontSize: '9px', fontWeight: '900', letterSpacing: '1px' },
    logoutBtn: { background: '#2d0a0a', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px', cursor:'pointer' },
    iconBtn: { background: '#1a1a1a', border: 'none', padding: '10px', borderRadius: '10px', cursor:'pointer' },
    section: { marginBottom: '30px' },
    sectionTitle: { fontSize: '10px', fontWeight: '900', color: '#666', marginBottom: '15px', letterSpacing: '1.5px', display:'flex', alignItems:'center', gap:'8px' },
    emptyState: { padding: '40px 20px', background: '#080808', border: '1px dashed #222', borderRadius: '16px', textAlign: 'center', color: '#333', fontSize: '12px', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' },
    callCard: { background: '#111', padding: '18px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    requestType: { fontSize: '11px', fontWeight: 'bold', color: '#888', marginTop: '4px' },
    resolveBtn: { background: '#22c55e', color: 'black', border: 'none', padding: '12px 18px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor:'pointer' },
    orderCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '20px', padding: '18px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    itemList: { marginBottom: '15px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#888', marginBottom: '6px' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #222', paddingTop: '15px' },
    btnServe: { background: '#22c55e', color: 'black', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '900', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor:'pointer' }
};

export default WaiterDashboard;