import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, 
    FaFire, FaCheck, FaRocket, FaBell, 
    FaUnlock, FaSignOutAlt, FaSpinner, FaHistory, FaExclamationTriangle
} from "react-icons/fa";

const DEFAULT_DISH_IMG = "https://cdn-icons-png.flaticon.com/512/706/706164.png"; 

const ChefDashboard = () => {
    const { id } = useParams();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState("");

    const [orders, setOrders] = useState([]); 
    const [dailyStats, setDailyStats] = useState({ count: 0 }); 
    const [dishes, setDishes] = useState([]); 
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeChefTab, setActiveChefTab] = useState("orders");
    const [mongoId, setMongoId] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // --- EFFECT: CLOCK FOR TIMERS ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 10000); // Update every 10s
        return () => clearInterval(timer);
    }, []);

    // --- CALCULATION: PREP SUMMARY (Shortcut for Chef) ---
    const prepSummary = useMemo(() => {
        const summary = {};
        orders.filter(o => o.status !== "Ready").forEach(order => {
            order.items.forEach(item => {
                summary[item.name] = (summary[item.name] || 0) + item.quantity;
            });
        });
        return Object.entries(summary);
    }, [orders]);

    // --- SCREEN WAKE LOCK ---
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try { wakeLock = await navigator.wakeLock.request('screen'); } catch (err) {}
            };
            requestWakeLock();
        }
    }, [isAuthenticated]);

    // --- LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError("");
        try {
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, password: password, role: 'chef'
            });
            if (res.data.success) {
                const rId = res.data.restaurantId;
                setMongoId(rId);
                localStorage.setItem(`chef_session_${id}`, rId);
                setIsAuthenticated(true);
                fetchData(rId);
            }
        } catch (err) {
            setError("❌ Invalid Kitchen Password");
        } finally {
            setAuthLoading(false);
        }
    };

    useEffect(() => {
        const savedId = localStorage.getItem(`chef_session_${id}`);
        if (savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            fetchData(savedId);
        }
    }, [id]);

    const fetchData = async (rId) => {
        if (!rId) return;
        try {
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            const active = orderRes.data.filter(o => o.status !== "SERVED" && o.status !== "COMPLETED");
            const completedToday = orderRes.data.filter(o => {
                const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
                return (o.status === "SERVED" || o.status === "COMPLETED") && isToday;
            });
            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setDailyStats({ count: completedToday.length });
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${rId}`);
            setDishes(dishRes.data);
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);
        } catch (e) { console.error("Sync Failed", e); }
    };

    useEffect(() => {
        if(isAuthenticated && mongoId) {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);
            socket.on("new-order", () => {
                if (!isMuted) audioRef.current.play().catch(()=>{});
                fetchData(mongoId);
            });
            socket.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                setServiceCalls(prev => [callData, ...prev]);
            });
            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId, isMuted]);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: newStatus });
            if (newStatus === "SERVED") fetchData(mongoId);
        } catch (error) { alert("Status update failed"); }
    };

    const toggleDishAvailability = async (dishId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: newStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: newStatus });
        } catch (e) { alert("Stock update failed"); }
    };

    const handleAttendTable = async (callId) => {
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`);
            setServiceCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) {}
    };

    const getElapsedTime = (createdAt) => {
        const diff = Math.floor((currentTime - new Date(createdAt)) / 60000);
        return diff;
    };

    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}><FaUtensils style={{fontSize:'30px', color:'#f97316'}}/></div>
                    <h1 style={styles.lockTitle}>{id} Kitchen</h1>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="PIN" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} />
                        <button type="submit" style={styles.loginBtn}>{authLoading ? <FaSpinner className="spin"/> : "ENTER KITCHEN"}</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} className="call-active alert-banner-pulse">
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} - {call.type?.toUpperCase()}</span>
                        <button onClick={() => handleAttendTable(call._id)} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>CHEF'S STATION</h1>
                    <div style={styles.statusDot}><span className="live-pulse"></span><span>LIVE KDS</span></div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statValue}>{dailyStats.count}</div>
                    <div style={styles.statLabel}>SERVED</div>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
                    <button onClick={() => window.location.reload()} style={styles.iconButton}><FaRocket/></button>
                </div>
            </header>

            {/* 🔥 NEW: PREP SUMMARY BAR */}
            {activeChefTab === "orders" && prepSummary.length > 0 && (
                <div style={styles.summaryBar}>
                    {prepSummary.map(([name, qty], i) => (
                        <div key={i} style={styles.summaryItem}>
                            <span style={{color: '#f97316'}}>{qty}x</span> {name}
                        </div>
                    ))}
                </div>
            )}

            <div style={styles.tabContainer}>
                <button onClick={() => setActiveChefTab("orders")} style={{ ...styles.tabButton, borderBottom: activeChefTab === 'orders' ? '4px solid #f97316' : 'none' }}>ACTIVE ORDERS ({orders.length})</button>
                <button onClick={() => setActiveChefTab("stock")} style={{ ...styles.tabButton, borderBottom: activeChefTab === 'stock' ? '4px solid #3b82f6' : 'none' }}>STOCK CONTROL</button>
            </div>

            <div style={styles.grid}>
                {activeChefTab === "orders" ? (
                    orders.map((order) => {
                        const time = getElapsedTime(order.createdAt);
                        const isLate = time > 15;
                        return (
                            <div key={order._id} className={isLate ? "order-late-pulse" : ""} style={{...styles.card, borderColor: isLate ? '#ef4444' : '#222'}}>
                                <div style={{...styles.cardHeader, background: isLate ? '#450a0a' : '#111'}}>
                                    <h2 style={styles.tableNumber}>T-{order.tableNumber}</h2>
                                    <div style={{textAlign: 'right'}}>
                                        <div style={{fontSize: '14px', fontWeight: '900', color: isLate ? '#f87171' : '#f97316'}}><FaClock /> {time}m</div>
                                        <div style={{fontSize: '8px', color: '#666'}}>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                    </div>
                                </div>
                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}>
                                            <div style={styles.itemName}><span style={styles.qtyBox}>{item.quantity}</span> {item.name}</div>
                                        </div>
                                    ))}
                                    {order.note && <div style={styles.chefNote}><FaExclamationTriangle /> {order.note}</div>}
                                </div>
                                <div style={styles.actionContainer}>
                                    {order.status === "PLACED" && <button onClick={() => updateOrderStatus(order._id, "Cooking")} style={styles.btnStart}>START COOKING</button>}
                                    {order.status === "Cooking" && <button onClick={() => updateOrderStatus(order._id, "Ready")} style={styles.btnReady}>SET TO READY</button>}
                                    {order.status === "Ready" && <button onClick={() => updateOrderStatus(order._id, "SERVED")} style={styles.btnClear}>SERVED / CLEAR</button>}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={styles.stockGrid}>
                        {dishes.map(dish => (
                            <div key={dish._id} style={styles.stockCard}>
                                <span style={{fontSize: '14px', flex: 1, opacity: dish.isAvailable ? 1 : 0.4}}>{dish.name}</span>
                                <button onClick={() => toggleDishAvailability(dish._id, dish.isAvailable)} style={{...styles.stockBtn, background: dish.isAvailable ? '#374151' : '#22c55e'}}>
                                    {dish.isAvailable ? "OUT" : "IN STOCK"}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                .live-pulse { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: pulse-green 1.5s infinite; }
                .order-late-pulse { animation: pulse-late 2s infinite; }
                .alert-banner-pulse { animation: pulse-red 2s infinite; background: #ef4444; padding: 15px; border-radius: 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                @keyframes pulse-green { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
                @keyframes pulse-late { 0% { box-shadow: inset 0 0 0px #ef4444; } 50% { box-shadow: inset 0 0 20px #ef4444; } 100% { box-shadow: inset 0 0 0px #ef4444; } }
                @keyframes pulse-red { 0% { transform: scale(1); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#050505', color: 'white', padding: '10px' },
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#111', padding: '30px', borderRadius: '24px', textAlign: 'center', width: '300px' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center' },
    loginBtn: { width: '100%', background: '#f97316', color: 'black', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#111', borderRadius: '20px', marginBottom: '10px' },
    headerTitle: { fontSize: '20px', fontWeight: '900', margin: 0, color: '#f97316' },
    statusDot: { display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' },
    statBox: { textAlign: 'center' },
    statValue: { fontSize: '24px', fontWeight: '900', color: '#fff', lineHeight: 1 },
    statLabel: { fontSize: '8px', color: '#666', marginTop: '2px' },
    summaryBar: { display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 5px', marginBottom: '10px', background: '#0a0a0a', borderRadius: '10px' },
    summaryItem: { whiteSpace: 'nowrap', background: '#111', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid #222' },
    tabContainer: { display: 'flex', marginBottom: '15px', borderBottom: '1px solid #222' },
    tabButton: { flex: 1, padding: '15px', background: 'none', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '13px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
    card: { background: '#111', borderRadius: '20px', border: '2px solid #222', overflow: 'hidden' },
    cardHeader: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tableNumber: { fontSize: '24px', fontWeight: '900', margin: 0 },
    itemsContainer: { padding: '15px', minHeight: '100px' },
    itemRow: { marginBottom: '8px' },
    qtyBox: { background: '#f97316', color: 'black', padding: '2px 8px', borderRadius: '5px', marginRight: '10px', fontWeight: '900' },
    itemName: { fontSize: '18px', fontWeight: 'bold' },
    chefNote: { fontSize: '12px', color: '#f97316', marginTop: '10px', padding: '8px', background: '#1a130a', borderRadius: '8px' },
    actionContainer: { padding: '10px' },
    btnStart: { width: '100%', background: '#f97316', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    btnReady: { width: '100%', background: '#eab308', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    btnClear: { width: '100%', background: '#22c55e', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    stockGrid: { gridColumn: '1/-1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' },
    stockCard: { background: '#111', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #222' },
    stockBtn: { padding: '8px 12px', borderRadius: '8px', border: 'none', color: 'white', fontSize: '10px', fontWeight: 'bold' },
    alertWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '90%' },
    iconButton: { background: '#222', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', marginLeft: '5px' }
};

export default ChefDashboard;