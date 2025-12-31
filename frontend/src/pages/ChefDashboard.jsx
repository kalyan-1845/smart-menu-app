import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaFire, FaCheck, FaBell, 
    FaSignOutAlt, FaSpinner, FaUnlock, FaBoxOpen, FaClipboardList, FaRocket 
} from "react-icons/fa";

// 🔗 API CONFIGURATION
const SERVER_URL = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000" 
    : "https://smart-menu-backend-5ge7.onrender.com";

const API_BASE = `${SERVER_URL}/api`;

const ChefDashboard = () => {
    const { id } = useParams(); // This is the username from URL
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState("");

    const [orders, setOrders] = useState([]); 
    const [dishes, setDishes] = useState([]); 
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeTab, setActiveTab] = useState("orders"); // 'orders' or 'stock'
    const [mongoId, setMongoId] = useState(null); // The real DB ID

    // 🔊 AUDIO REFS
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK (Keep screen on) ---
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
            };
            requestWakeLock();
            document.addEventListener('visibilitychange', async () => {
                if (wakeLock !== null && document.visibilityState === 'visible') requestWakeLock();
            });
        }
    }, [isAuthenticated]);

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError("");

        // Unlock audio context on user interaction
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }).catch(() => {});

        try {
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, 
                password: password,
                role: 'chef' 
            });
            
            if (res.data._id) {
                setMongoId(res.data._id);
                localStorage.setItem(`chef_session_${id}`, res.data._id);
                setIsAuthenticated(true);
                fetchData(res.data._id);
            }
        } catch (err) {
            setError("❌ Invalid Kitchen Password");
        } finally {
            setAuthLoading(false);
        }
    };

    // Auto-login from local storage
    useEffect(() => {
        const savedId = localStorage.getItem(`chef_session_${id}`);
        if (savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            fetchData(savedId);
        }
    }, [id]);

    // --- 2. DATA FETCHING ---
    const fetchData = async (rId) => {
        if (!rId) return;
        try {
            // Get Orders
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            // Filter: Show Pending, Cooking, Ready. Hide Served.
            const active = orderRes.data.filter(o => o.status !== "SERVED" && o.status !== "Completed");
            // Sort: Oldest first
            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));

            // Get Stock (Dishes)
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${rId}`);
            setDishes(dishRes.data);

            // Get Waiter Calls
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);
        } catch (e) { console.error("Sync Failed", e); }
    };

    // --- 3. SOCKETS (Real-time) ---
    useEffect(() => {
        if(isAuthenticated && mongoId) {
            const socket = io(SERVER_URL);
            socket.emit("join-restaurant", mongoId);

            socket.on("new-order", () => {
                if (!isMuted) audioRef.current.play().catch(()=>{});
                fetchData(mongoId);
            });

            socket.on("order-updated", () => fetchData(mongoId));

            socket.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                setServiceCalls(prev => [callData, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId, isMuted]);

    // --- 4. CHEF ACTIONS ---
    
    // Step 1: Start Cooking
    // Step 2: Mark Ready
    // Step 3: Serve (Remove)
    const advanceOrderStatus = async (order) => {
        let nextStatus = "";
        
        if (order.status === "Pending" || order.status === "PLACED") nextStatus = "Cooking";
        else if (order.status === "Cooking") nextStatus = "Ready";
        else if (order.status === "Ready") nextStatus = "SERVED"; // This hides it

        // Optimistic Update (Immediate UI change)
        setOrders(prev => {
            if (nextStatus === "SERVED") return prev.filter(o => o._id !== order._id);
            return prev.map(o => o._id === order._id ? { ...o, status: nextStatus } : o);
        });

        // API Call
        try {
            await axios.put(`${API_BASE}/orders/${order._id}`, { status: nextStatus });
        } catch (error) {
            fetchData(mongoId); // Revert on error
        }
    };

    const toggleStock = async (dishId, currentStatus) => {
        try {
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: !currentStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: !currentStatus });
        } catch (e) { alert("Stock update failed"); }
    };

    const dismissCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } catch (e) {}
    };

    const handleLogout = () => {
        localStorage.removeItem(`chef_session_${id}`);
        setIsAuthenticated(false);
        setPassword("");
    };

    // --- RENDER: LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}><FaUtensils style={{fontSize:'30px', color:'#f97316'}}/></div>
                    <h1 style={styles.lockTitle}>{id.toUpperCase()}</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold', letterSpacing:'1px' }}>KITCHEN DISPLAY SYSTEM</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="Kitchen Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} />
                        {error && <p style={{color: '#ef4444', fontSize: '12px'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : <><FaUnlock/> UNLOCK</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- RENDER: MAIN DASHBOARD ---
    return (
        <div style={styles.dashboardContainer}>
            
            {/* 1. WAITER CALLS (Sticky Alert) */}
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} className="call-active" style={styles.alertBanner}>
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} - {call.type?.toUpperCase()}</span>
                        <button onClick={() => dismissCall(call._id)} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            {/* 2. HEADER */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>KDS</h1>
                    <div style={styles.statusDot}></div><span style={{fontSize:'10px', color:'#9ca3af', fontWeight:'bold'}}>LIVE</span>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
                    <button onClick={handleLogout} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            {/* 3. TABS */}
            <div style={styles.tabContainer}>
                <button onClick={() => setActiveTab("orders")} style={{ ...styles.tabButton, background: activeTab === 'orders' ? '#f97316' : '#1f2937' }}>
                    <FaClipboardList /> LIVE ORDERS ({orders.length})
                </button>
                <button onClick={() => setActiveTab("stock")} style={{ ...styles.tabButton, background: activeTab === 'stock' ? '#3b82f6' : '#1f2937' }}>
                    <FaBoxOpen /> STOCK
                </button>
            </div>

            {/* 4. ORDERS GRID */}
            {activeTab === "orders" && (
                <div style={styles.grid}>
                    {orders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <h2>No Pending Orders</h2>
                            <p style={{color:'#666'}}>The kitchen is all clear!</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderTop: order.status === 'Ready' ? '4px solid #22c55e' : (order.status === 'Cooking' ? '4px solid #eab308' : '4px solid #f97316')
                            }}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>{order.tableNum === "Takeaway" ? "TAKEAWAY" : `TABLE ${order.tableNum}`}</h2>
                                    <span style={{...styles.statusBadge, background: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151')}}>
                                        {order.status}
                                    </span>
                                </div>
                                <div style={styles.timer}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>

                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}>
                                            <span style={styles.itemQuantity}>{item.quantity}x</span>
                                            <div>
                                                <div style={styles.itemName}>{item.name}</div>
                                                {item.customizations?.map((c, i) => <div key={i} style={styles.specTag}>{c}</div>)}
                                            </div>
                                        </div>
                                    ))}
                                    {order.note && <div style={styles.note}>📝 {order.note}</div>}
                                </div>

                                <div style={styles.actionContainer}>
                                    <button 
                                        onClick={() => advanceOrderStatus(order)} 
                                        style={{
                                            ...styles.actionBtn, 
                                            background: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#f97316'),
                                            color: order.status === 'Cooking' ? 'black' : 'white'
                                        }}
                                    >
                                        {order.status === "Pending" && <><FaFire /> START COOKING</>}
                                        {order.status === "PLACED" && <><FaFire /> START COOKING</>}
                                        {order.status === "Cooking" && <><FaCheck /> MARK READY</>}
                                        {order.status === "Ready" && <><FaRocket /> SERVE ORDER</>}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 5. STOCK GRID */}
            {activeTab === "stock" && (
                <div style={styles.grid}>
                    {dishes.map(dish => (
                        <div key={dish._id} style={{...styles.stockCard, opacity: dish.isAvailable ? 1 : 0.5}}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={dish.image || "https://cdn-icons-png.flaticon.com/512/706/706164.png"} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit:'cover' }} alt="" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px' }}>{dish.name}</h3>
                                    <p style={{margin:0, fontSize:'12px', color: dish.isAvailable ? '#22c55e' : '#ef4444'}}>
                                        {dish.isAvailable ? "In Stock" : "Sold Out"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => toggleStock(dish._id, dish.isAvailable)} style={{...styles.stockBtn, background: dish.isAvailable ? '#1f2937' : '#22c55e'}}>
                                {dish.isAvailable ? "DISABLE" : "ENABLE"}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .call-active { animation: pulse-red 2s infinite; } @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }`}</style>
        </div>
    );
};

// --- PREMIUM DARK STYLES ---
const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', fontFamily: 'Inter, sans-serif' },
    
    // Login
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#111', padding: '40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '350px', border:'1px solid #222' },
    iconCircle: { background: '#1a1a1a', borderRadius: '50%', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' },
    lockTitle: { color: 'white', fontSize: '28px', fontWeight: '900', margin: '0 0 5px 0' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center', fontSize:'16px', outline:'none' },
    loginBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize:'14px', cursor:'pointer' },

    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#111', borderRadius: '16px', marginBottom: '15px', border:'1px solid #222' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    headerTitle: { fontSize: '22px', fontWeight: '900', margin: 0 },
    statusDot: { width:'10px', height:'10px', background:'#22c55e', borderRadius:'50%', boxShadow:'0 0 10px #22c55e' },
    headerRight: { display: 'flex', gap: '10px' },
    iconButton: { background: '#1f2937', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor:'pointer' },
    iconButtonRed: { background: '#3b0a0a', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px', cursor:'pointer' },

    // Tabs
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tabButton: { flex: 1, padding: '15px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', cursor:'pointer', fontSize:'14px' },

    // Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', color: '#666', marginTop: '50px' },

    // Order Card
    card: { background: '#111', borderRadius: '16px', border: '1px solid #222', display: 'flex', flexDirection: 'column', overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.5)' },
    cardHeader: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'#1a1a1a' },
    tableNumber: { fontSize: '18px', fontWeight: '900', color: 'white', margin:0 },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: 'white', textTransform:'uppercase' },
    timer: { fontSize: '12px', color: '#888', padding:'0 15px', marginTop:'10px', fontStyle:'italic' },
    
    itemsContainer: { padding: '15px', flex: 1 },
    itemRow: { display: 'flex', gap:'12px', marginBottom: '10px', alignItems:'flex-start' },
    itemName: { fontSize: '16px', fontWeight: '600', lineHeight:'1.4' },
    itemQuantity: { color: '#f97316', fontWeight: '900', fontSize:'18px', minWidth:'30px' },
    specTag: { fontSize: '12px', color: '#888', fontStyle: 'italic', marginTop:'2px' },
    note: { background:'#331f05', color:'#f97316', padding:'8px', borderRadius:'6px', fontSize:'12px', marginTop:'10px' },

    actionContainer: { padding: '15px', paddingTop:0 },
    actionBtn: { width: '100%', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },

    // Stock Card
    stockCard: { background: '#111', padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #222' },
    stockBtn: { padding: '10px 20px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px', cursor:'pointer' },

    // Alerts
    alertWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth:'500px', display:'flex', flexDirection:'column', gap:'5px' },
    alertBanner: { background: '#ef4444', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow:'0 10px 25px rgba(239, 68, 68, 0.4)' },
    alertText: { fontWeight:'bold', fontSize:'14px', display:'flex', alignItems:'center', gap:'10px' },
    attendBtn: { background: 'white', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
};

export default ChefDashboard;