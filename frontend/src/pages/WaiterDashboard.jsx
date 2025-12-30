import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; 
import io from "socket.io-client";
import { 
    FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, 
    FaBell, FaReceipt, FaTint, FaSignOutAlt, FaUnlock, FaSpinner
} from "react-icons/fa";

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

    // Audio Ref for pocket notifications
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK ---
    // Prevents the waiter's phone screen from turning off during a busy shift
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.error("WakeLock failed:", err.message);
                }
            };
            requestWakeLock();
            return () => wakeLock?.release();
        }
    }, [isAuthenticated]);

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Unlock audio context for mobile browsers on first tap
        notifSound.current.play().then(() => {
            notifSound.current.pause();
            notifSound.current.currentTime = 0;
        }).catch(() => {});

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
            // Fetch all orders for this specific owner
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            const activeOrders = orderRes.data.filter(o => o.status !== "SERVED");
            setOrders(activeOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

            // Fetch table requests (Water, Bill, etc.)
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setCalls(callRes.data);
        } catch (error) { console.error("Sync Error", error); }
    };

    // --- 3. REAL-TIME SOCKETS ---
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);

            // Triggered when a customer calls from the menu
            socket.on("new-waiter-call", () => {
                notifSound.current.currentTime = 0;
                notifSound.current.play().catch(()=>{});
                // Vibrate the phone in the waiter's pocket
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                fetchData(mongoId);
            });

            socket.on("order-updated", () => fetchData(mongoId));
            socket.on("new-order", () => fetchData(mongoId));

            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId]);

    // --- 4. ACTIONS ---
    const resolveCall = async (callId) => {
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`);
            setCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) { alert("Error resolving request"); }
    };

    const markServed = async (orderId) => {
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" });
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (e) { alert("Error updating status"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`waiter_session_${id}`);
        setIsAuthenticated(false);
    };

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
            `}</style>

            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Waiter Station</h1>
                    <p style={styles.subtitle}>{id.toUpperCase()} LIVE FEED</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /></button>
            </div>

            {/* 🚨 TABLE CALLS (Priority Section) */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaBell color="#f97316"/> SERVICE CALLS ({calls.length})</h2>
                {calls.length === 0 ? (
                    <div style={styles.emptyState}>No current table requests.</div>
                ) : (
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
                                        <p style={styles.requestType}>{call.type?.toUpperCase()}</p>
                                    </div>
                                </div>
                                <button onClick={() => resolveCall(call._id)} style={styles.resolveBtn}>RESOLVE</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 📦 READY TO SERVE */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaClock color="#3b82f6"/> ORDER DELIVERY ({orders.length})</h2>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>No orders waiting to be served.</div>
                ) : (
                    <div style={styles.grid}>
                        {orders.map(order => (
                            <div key={order._id} style={{...styles.orderCard, borderColor: order.status === 'Ready' ? '#22c55e' : '#222'}}>
                                <div style={styles.cardHeader}>
                                    <h2 style={{margin:0, fontSize:'16px', fontWeight:'900'}}>Table {order.tableNumber}</h2>
                                    <span style={{...styles.statusBadge, color: order.status === 'Ready' ? '#22c55e' : '#f97316'}}>
                                        {order.status === "PLACED" ? "COOKING" : order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={styles.itemList}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={styles.itemRow}>
                                            <span>{item.name}</span>
                                            <span>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.footerRow}>
                                    <div style={{fontWeight:'900', fontSize: '15px'}}>₹{order.totalAmount}</div>
                                    <button onClick={() => markServed(order._id)} style={styles.btnServe} disabled={order.status !== 'Ready'}>
                                        <FaCheckCircle /> MARK SERVED
                                    </button>
                                </div>
                            </div>
                        ))}
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
    subtitle: { color: '#f97316', fontSize: '9px', fontWeight: '900', letterSpacing: '1px' },
    logoutBtn: { background: '#2d0a0a', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px' },
    section: { marginBottom: '30px' },
    sectionTitle: { fontSize: '10px', fontWeight: '900', color: '#666', marginBottom: '15px', letterSpacing: '1.5px' },
    emptyState: { padding: '40px 20px', background: '#080808', border: '1px dashed #222', borderRadius: '16px', textAlign: 'center', color: '#333', fontSize: '12px', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '12px' },
    callCard: { background: '#111', padding: '18px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { width: '48px', height: '48px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' },
    requestType: { fontSize: '9px', fontWeight: '900', background: '#222', padding: '4px 8px', borderRadius: '6px', marginTop: '6px', display: 'inline-block' },
    resolveBtn: { background: '#22c55e', color: 'black', border: 'none', padding: '12px 18px', borderRadius: '10px', fontWeight: '900', fontSize: '12px' },
    orderCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '20px', padding: '18px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    statusBadge: { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' },
    itemList: { marginBottom: '15px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#888', marginBottom: '6px' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #222', paddingTop: '15px' },
    btnServe: { background: '#22c55e', color: 'black', border: 'none', padding: '10px 16px', borderRadius: '10px', fontWeight: '900', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }
};

export default WaiterDashboard;