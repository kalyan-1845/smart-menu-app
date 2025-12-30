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

    // Audio Ref for Notifications
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK (Prevents Screen Dimming) ---
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
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

        // Unlock audio for mobile browsers on user gesture
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
            setError("❌ Access Denied. Check Password.");
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
            // Filter out orders already served to keep list clean
            const activeOrders = orderRes.data.filter(o => o.status !== "SERVED");
            setOrders(activeOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setCalls(callRes.data);
        } catch (error) { console.error("Sync Error", error); }
    };

    // --- 3. SOCKET CONNECTION ---
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);

            // Triggered when a customer calls from the menu
            socket.on("new-waiter-call", () => {
                notifSound.current.currentTime = 0;
                notifSound.current.play().catch(()=>{});
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
        if(!window.confirm("Mark order as served?")) return;
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" });
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (e) { alert("Error updating status"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`waiter_session_${id}`);
        setIsAuthenticated(false);
        setPassword("");
    };

    // --- 5. RENDER: LOGIN ---
    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}><FaUserTie style={{fontSize:'24px', color:'#3b82f6'}}/></div>
                    <h1 style={styles.lockTitle}>{id} Staff</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold' }}>WAITER ACCESS POINT</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="Waiter Password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} />
                        {error && <p style={{color: '#ef4444', fontSize: '12px'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn} disabled={loading}>
                            {loading ? <FaSpinner className="spin" /> : <><FaUnlock /> Access Dashboard</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- 6. RENDER: MAIN DASHBOARD ---
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
                    <p style={styles.subtitle}>{id.toUpperCase()}</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /></button>
            </div>

            {/* 🚨 PRIORITY REQUESTS */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaBell color="#f97316"/> TABLE REQUESTS ({calls.length})</h2>
                {calls.length === 0 ? (
                    <div style={styles.emptyState}>No pending requests</div>
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
                                <button onClick={() => resolveCall(call._id)} style={styles.resolveBtn}>DONE</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 📦 ACTIVE ORDERS */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaClock color="#3b82f6"/> ORDERS ({orders.length})</h2>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>No active orders</div>
                ) : (
                    <div style={styles.grid}>
                        {orders.map(order => (
                            <div key={order._id} style={{...styles.orderCard, borderColor: order.status === 'READY' ? '#22c55e' : '#222'}}>
                                <div style={styles.cardHeader}>
                                    <h2 style={{margin:0, fontSize:'16px', fontWeight:'900'}}>Table {order.tableNumber}</h2>
                                    <span style={{...styles.statusBadge, color: order.status === 'READY' ? '#22c55e' : '#f97316'}}>
                                        {order.status === "PLACED" ? "COOKING" : order.status}
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
                                    <div style={{fontWeight:'900'}}>₹{order.totalAmount}</div>
                                    <button onClick={() => markServed(order._id)} style={styles.btnServe}><FaCheckCircle /> Served</button>
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
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '15px' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { width: '90%', maxWidth: '320px', background: '#111', padding: '30px', borderRadius: '24px', textAlign: 'center' },
    iconCircle: { width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' },
    lockTitle: { fontSize: '24px', fontWeight: '900', margin: 0 },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center' },
    loginBtn: { width: '100%', background: '#3b82f6', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '18px', fontWeight: '900', margin: 0 },
    subtitle: { color: '#666', fontSize: '10px', fontWeight: 'bold' },
    logoutBtn: { background: '#222', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '8px' },
    section: { marginBottom: '25px' },
    sectionTitle: { fontSize: '11px', fontWeight: '900', color: '#555', marginBottom: '12px', letterSpacing: '1px' },
    emptyState: { padding: '20px', background: '#111', borderRadius: '12px', textAlign: 'center', color: '#444', fontSize: '12px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '10px' },
    callCard: { background: '#111', padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    iconBox: { width: '45px', height: '45px', background: '#000', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    requestType: { fontSize: '9px', fontWeight: '900', background: '#222', padding: '3px 6px', borderRadius: '4px', marginTop: '4px' },
    resolveBtn: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 15px', borderRadius: '8px', fontWeight: '900' },
    orderCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    statusBadge: { fontSize: '10px', fontWeight: '900' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#999', marginBottom: '5px' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px' },
    btnServe: { background: '#22c55e', color: '#000', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default WaiterDashboard;