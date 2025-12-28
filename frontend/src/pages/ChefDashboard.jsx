import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, 
    FaFire, FaCheck, FaRocket, FaBell, 
    FaUnlock, FaSignOutAlt, FaSpinner
} from "react-icons/fa";

// 🖼️ ASSETS
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

    // 🔊 AUDIO REFS: For new orders and service alerts
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK: Keeps tablet screen on during service ---
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
        }
    }, [isAuthenticated]);

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError("");

        // Unlock audio for mobile browsers on first interaction
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

    // --- 2. DATA FETCHING ---
    const fetchData = async (rId) => {
        if (!rId) return;
        try {
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            // Show only active orders in KDS
            const active = orderRes.data.filter(o => o.status !== "SERVED");
            const completedToday = orderRes.data.filter(o => {
                const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
                return o.status === "SERVED" && isToday;
            });

            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setDailyStats({ count: completedToday.length });

            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${rId}`);
            setDishes(dishRes.data);

            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);
        } catch (e) { console.error("Sync Failed", e); }
    };

    // --- 3. SOCKETS: Real-time updates ---
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

    // --- 4. KDS ACTIONS ---
    const toggleDishAvailability = async (dishId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: newStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: newStatus });
        } catch (e) { alert("Stock update failed"); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Update UI instantly for performance
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: newStatus });
        } catch (error) { alert("Status update failed"); }
    };

    const handleAttendTable = async (callId) => {
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`);
            setServiceCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) {}
    };

    const handleLogout = () => {
        localStorage.removeItem(`chef_session_${id}`);
        setIsAuthenticated(false);
    };

    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}><FaUtensils style={{fontSize:'30px', color:'#f97316'}}/></div>
                    <h1 style={styles.lockTitle}>{id} Kitchen</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold' }}>BITEBOX KDS ACCESS</p>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="Kitchen Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} />
                        {error && <p style={{color: '#ef4444', fontSize: '12px'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : <><FaUnlock/> OPEN DASHBOARD</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            {/* PRIORITY ALERTS: For Table Calls */}
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} className="call-active" style={styles.alertBanner}>
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} - {call.type?.toUpperCase()}</span>
                        <button onClick={() => handleAttendTable(call._id)} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>KDS STATION</h1>
                    <div style={styles.statusDot}><span style={{width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%'}}></span><span style={{fontSize:'10px', color:'#9ca3af', marginLeft:'5px'}}>LIVE</span></div>
                </div>
                <div style={styles.statBox}>
                    <div style={styles.statLabel}>COMPLETED TODAY</div>
                    <div style={styles.statValue}>{dailyStats.count}</div>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
                    <button onClick={handleLogout} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <button onClick={() => setActiveChefTab("orders")} style={{ ...styles.tabButton, background: activeChefTab === 'orders' ? '#f97316' : '#1f2937' }}>ORDERS ({orders.length})</button>
                <button onClick={() => setActiveChefTab("stock")} style={{ ...styles.tabButton, background: activeChefTab === 'stock' ? '#3b82f6' : '#1f2937' }}>MANAGE STOCK</button>
            </div>

            <div style={styles.grid}>
                {activeChefTab === "orders" ? (
                    orders.length === 0 ? (
                        <div style={styles.emptyState}>No active orders. Rest up, Chef!</div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} style={{...styles.card, borderColor: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151')}}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>TABLE {order.tableNumber}</h2>
                                    <span style={{...styles.statusBadge, background: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151')}}>{order.status}</span>
                                </div>
                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}>
                                            <div>
                                                <div style={styles.itemName}>{item.name}</div>
                                                {order.note && <div style={styles.chefNote}>Note: "{order.note}"</div>}
                                            </div>
                                            <span style={styles.itemQuantity}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.actionContainer}>
                                    {order.status === "PLACED" && <button onClick={() => updateOrderStatus(order._id, "Cooking")} style={styles.btnStart}><FaFire /> START COOKING</button>}
                                    {order.status === "Cooking" && <button onClick={() => updateOrderStatus(order._id, "Ready")} style={styles.btnReady}><FaCheck /> MARK READY</button>}
                                    {order.status === "Ready" && <button onClick={() => updateOrderStatus(order._id, "SERVED")} style={styles.btnClear}><FaRocket /> FINISH</button>}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    dishes.map(dish => (
                        <div key={dish._id} style={styles.stockCard}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <img src={dish.image || DEFAULT_DISH_IMG} style={{ width: '45px', height: '45px', borderRadius: '8px', opacity: dish.isAvailable ? 1 : 0.3 }} alt="" />
                                <div><h3 style={{ margin: 0, fontSize: '14px' }}>{dish.name}</h3></div>
                            </div>
                            <button onClick={() => toggleDishAvailability(dish._id, dish.isAvailable)} style={{...styles.stockBtn, background: dish.isAvailable ? '#374151' : '#22c55e'}}>
                                {dish.isAvailable ? "OUT OF STOCK" : "RESTOCK"}
                            </button>
                        </div>
                    ))
                )}
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .call-active { animation: pulse-red 2s infinite; } @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }`}</style>
        </div>
    );
};

// --- MOBILE-FIRST STYLES ---
const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#000', color: 'white', padding: '10px', paddingBottom: '30px' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#111', padding: '30px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '350px', border: '1px solid #222' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' },
    loginBtn: { width: '100%', background: '#f97316', color: 'black', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', letterSpacing: '1px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#111', borderRadius: '16px', marginBottom: '15px' },
    headerTitle: { fontSize: '18px', fontWeight: '900', margin: 0 },
    statBox: { background: '#000', padding: '8px 12px', borderRadius: '12px', textAlign: 'center', border: '1px solid #222' },
    statLabel: { fontSize: '7px', color: '#666', fontWeight: 'bold' },
    statValue: { fontSize: '18px', fontWeight: '900', color: '#f97316' },
    tabContainer: { display: 'flex', gap: '8px', marginBottom: '15px' },
    tabButton: { flex: 1, padding: '14px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: '900', fontSize: '12px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' },
    card: { background: '#111', borderRadius: '16px', border: '2px solid #222', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    cardHeader: { padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' },
    tableNumber: { fontSize: '16px', fontWeight: '900', margin: 0 },
    statusBadge: { fontSize: '9px', fontWeight: '900', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' },
    itemsContainer: { padding: '15px', flex: 1 },
    itemRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #222', paddingBottom: '8px' },
    itemName: { fontSize: '14px', fontWeight: '700' },
    chefNote: { fontSize: '11px', color: '#f97316', fontWeight: 'bold', marginTop: '4px' },
    itemQuantity: { color: '#f97316', fontWeight: '900', fontSize: '16px' },
    actionContainer: { padding: '10px' },
    btnStart: { width: '100%', background: '#f97316', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    btnReady: { width: '100%', background: '#eab308', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    btnClear: { width: '100%', background: '#22c55e', border: 'none', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', color: '#444', fontWeight: 'bold' },
    stockCard: { background: '#111', padding: '12px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222' },
    stockBtn: { padding: '10px 15px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '10px' },
    alertWrapper: { position: 'fixed', top: '15px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%' },
    alertBanner: { background: '#ef4444', padding: '15px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)' },
    attendBtn: { background: 'white', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    iconButton: { background: '#1f2937', border: 'none', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '18px' },
    iconButtonRed: { background: '#2d0a0a', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '12px', fontSize: '18px' }
};

export default ChefDashboard;