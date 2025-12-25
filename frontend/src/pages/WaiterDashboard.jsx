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

    // Audio Ref
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK (Keep Phone On) ---
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('Screen Wake Lock active');
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

        // 🔊 Audio Unlock Trick: Play silent sound on user interaction (Login Click)
        // This tells mobile browsers "User allowed audio", so future notifications will play.
        notifSound.current.volume = 1.0;
        notifSound.current.play().then(() => {
            notifSound.current.pause();
            notifSound.current.currentTime = 0;
        }).catch(e => console.log("Audio permission pending"));

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
            console.error(err);
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

            // 🛎️ NEW WAITER CALL
            socket.on("new-waiter-call", (data) => {
                // Play Sound
                notifSound.current.currentTime = 0;
                notifSound.current.play().catch(e => console.log("Sound blocked", e));
                
                // Vibrate Phone (if supported)
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);

                fetchData(mongoId);
            });

            socket.on("order-updated", () => fetchData(mongoId));
            
            socket.on("new-order", () => {
                notifSound.current.currentTime = 0;
                notifSound.current.play().catch(()=>{});
                fetchData(mongoId);
            });

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

    const markPaid = async (orderId) => {
        if(!window.confirm("Confirm CASH payment received?")) return;
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { paymentStatus: "Paid", status: "SERVED" });
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (e) { alert("Error updating payment"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`waiter_session_${id}`);
        setIsAuthenticated(false);
        setPassword("");
        setOrders([]);
    };

    // --- 5. LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}>
                        <FaUserTie style={{ fontSize: '24px', color: '#3b82f6' }} />
                    </div>
                    <h1 style={styles.lockTitle}>{id} Staff</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold', letterSpacing: '1px' }}>WAITER ACCESS POINT</p>
                    
                    <form onSubmit={handleLogin}>
                        <input 
                            type="text" name="username" value={id} readOnly 
                            style={{ display: 'none' }} autoComplete="username"
                        />
                        <input 
                            type="password" placeholder="Enter Waiter Password" 
                            style={styles.input} value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                        {error && <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '15px'}}>{error}</p>}
                        
                        <button type="submit" style={styles.loginBtn} disabled={loading}>
                            {loading ? <FaSpinner className="spin" /> : <><FaUnlock /> Access Dashboard</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- 6. MAIN DASHBOARD ---
    return (
        <div style={styles.container}>
             <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                /* Pulse animation for active calls */
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .call-active { animation: pulse-red 2s infinite; }
            `}</style>

            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Waiter Station</h1>
                    <p style={styles.subtitle}>{id.toUpperCase()}</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt /> <span className="hide-mobile">Logout</span></button>
            </div>

            {/* 🚨 PRIORITY: TABLE CALLS */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaBell style={{color:'#f97316'}}/> Requests ({calls.length})</h2>
                {calls.length === 0 ? (
                    <div style={styles.emptyState}>No pending requests</div>
                ) : (
                    <div style={styles.grid}>
                        {calls.map(call => (
                            <div key={call._id} className="call-active" style={styles.callCard}>
                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                    <div style={styles.iconBox}>
                                        {call.type === "bill" ? <FaReceipt style={{color:'#ef4444'}}/> : 
                                         call.type === "water" ? <FaTint style={{color:'#3b82f6'}}/> : <FaBell style={{color:'#f97316'}}/>}
                                    </div>
                                    <div>
                                        <h3 style={{margin:0, fontSize:'22px', fontWeight:'900', color: 'white'}}>Table {call.tableNumber}</h3>
                                        <p style={styles.requestType}>
                                            {call.type === "bill" ? "REQUESTING BILL" : 
                                             call.type === "water" ? "NEEDS WATER" : "NEEDS HELP"}
                                        </p>
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
                <h2 style={styles.sectionTitle}><FaClock style={{color:'#3b82f6'}}/> Orders ({orders.length})</h2>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>No active orders</div>
                ) : (
                    <div style={styles.grid}>
                        {orders.map(order => (
                            <div key={order._id} style={{
                                ...styles.orderCard,
                                borderColor: order.status === 'READY' ? '#22c55e' : '#222'
                            }}>
                                <div style={styles.cardHeader}>
                                    <h2 style={{margin:0, fontSize:'18px', fontWeight:'900'}}>Table {order.tableNumber}</h2>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: order.status === 'READY' ? '#22c55e' : '#f97316'
                                    }}>
                                        {order.status === "PLACED" ? "COOKING" : order.status}
                                    </span>
                                </div>

                                <div style={styles.itemList}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{fontSize:'14px', fontWeight:'500', marginBottom:'8px', display:'flex', justifyContent:'space-between', color: '#ccc'}}>
                                            <span>{item.name}</span>
                                            <span style={{color:'#f97316', fontWeight: 'bold'}}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.footerRow}>
                                    <div style={{fontSize:'18px', fontWeight:'900', color: '#fff'}}>₹{order.totalAmount}</div>
                                    
                                    <div style={{display:'flex', gap:'8px'}}>
                                        {order.paymentMethod === 'CASH' && order.paymentStatus !== 'Paid' && (
                                            <button onClick={() => markPaid(order._id)} style={styles.btnPay}>
                                                <FaMoneyBillWave /> Cash
                                            </button>
                                        )}
                                        <button onClick={() => markServed(order._id)} style={styles.btnServe}>
                                            <FaCheckCircle /> Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MOBILE OPTIMIZED STYLES ---
const styles = {
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '15px', fontFamily: '"Inter", sans-serif', paddingBottom: '80px' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '"Inter", sans-serif' },
    lockCard: { width: '100%', maxWidth: '320px', background: '#111', padding: '30px', borderRadius: '24px', border: '1px solid #222', textAlign: 'center' },
    iconCircle: { width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' },
    
    title: { fontSize: '20px', fontWeight: '900', margin: 0, textTransform: 'uppercase' },
    subtitle: { color: '#666', fontSize: '11px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase' },
    logoutBtn: { background: '#222', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #222', paddingBottom: '15px' },
    
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 'bold', outline: 'none', marginBottom: '15px', textAlign: 'center' },
    loginBtn: { width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' },

    section: { marginBottom: '30px' },
    sectionTitle: { fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#888', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
    
    // Grid now supports 1 column on mobile, more on desktop
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '15px' },
    
    emptyState: { padding: '30px', background: '#111', borderRadius: '16px', border: '1px dashed #333', textAlign: 'center', color: '#444', fontWeight: 'bold', fontSize: '14px' },

    callCard: { background: '#111', padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', marginBottom: '10px' },
    iconBox: { width: '50px', height: '50px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #222' },
    requestType: { fontSize: '11px', fontWeight: '900', color: '#fff', marginTop: '4px', background: '#222', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' },
    resolveBtn: { background: '#22c55e', color: 'black', border: 'none', padding: '12px 16px', borderRadius: '12px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', height: '50px' },

    orderCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '15px', transition: '0.3s' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #222' },
    statusBadge: { fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' },
    itemList: { marginBottom: '15px' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #222' },
    btnPay: { background: 'rgba(30, 58, 138, 0.4)', color: '#60a5fa', border: '1px solid #1e3a8a', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    btnServe: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default WaiterDashboard;