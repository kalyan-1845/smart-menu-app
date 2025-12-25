import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaRegClock, 
    FaUser, FaFire, FaCheck, FaRocket, FaBell, 
    FaExternalLinkAlt, FaUserTie, FaBoxOpen, 
    FaUnlock, FaSignOutAlt, FaChartLine, FaClipboardList, FaSpinner, FaWifi
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
    const [dailyStats, setDailyStats] = useState({ count: 0, revenue: 0 }); 
    const [dishes, setDishes] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeChefTab, setActiveChefTab] = useState("orders");
    const [mongoId, setMongoId] = useState(null);

    // 🔊 AUDIO REFS
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // --- 0. SCREEN WAKE LOCK (Keep Screen On) ---
    useEffect(() => {
        if (isAuthenticated && 'wakeLock' in navigator) {
            let wakeLock = null;
            const requestWakeLock = async () => {
                try {
                    wakeLock = await navigator.wakeLock.request('screen');
                    console.log('Kitchen Display: Screen Wake Lock Active');
                } catch (err) {
                    console.error(`${err.name}, ${err.message}`);
                }
            };
            // Request on load
            requestWakeLock();
            
            // Re-request if tab becomes visible again
            document.addEventListener('visibilitychange', async () => {
                if (wakeLock !== null && document.visibilityState === 'visible') {
                    requestWakeLock();
                }
            });
        }
    }, [isAuthenticated]);

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError("");

        // 🔊 Audio Unlock for Mobile Browsers
        audioRef.current.volume = 1.0;
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
        setLoading(true);
        try {
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            
            const active = orderRes.data.filter(o => o.status !== "SERVED");
            const completedToday = orderRes.data.filter(o => {
                const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
                return o.status === "SERVED" && isToday;
            });

            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            
            const revenue = completedToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setDailyStats({
                count: completedToday.length,
                revenue: revenue
            });

            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${rId}`);
            setDishes(dishRes.data);

            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);

        } catch (e) { console.error("Sync Failed", e); }
        finally { setLoading(false); }
    };

    // --- 3. SOCKETS ---
    useEffect(() => {
        if(isAuthenticated && mongoId) {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);

            socket.on("new-order", () => {
                if (!isMuted) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(()=>{});
                }
                fetchData(mongoId);
            });

            socket.on("order-updated", () => fetchData(mongoId));

            socket.on("new-waiter-call", (callData) => {
                if (!isMuted) {
                    callSound.current.currentTime = 0;
                    callSound.current.play().catch(()=>{});
                }
                setServiceCalls(prev => [callData, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId, isMuted]);

    // --- 4. ACTIONS ---
    const toggleDishAvailability = async (dishId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: newStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: newStatus });
        } catch (e) { alert("Update failed"); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: newStatus });
        } catch (error) { alert("Status update failed"); }
    };

    const handleDeleteOrder = async (orderId) => {
        if(!window.confirm("Confirm Served?")) return;
        try { 
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" });
            const order = orders.find(o => o._id === orderId);
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
            setDailyStats(prev => ({
                count: prev.count + 1,
                revenue: prev.revenue + (order?.totalAmount || 0)
            }));
        } catch (error) { console.error(error); }
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
        setPassword("");
    };

    // --- 5. RENDER: LOCK SCREEN ---
    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <div style={styles.iconCircle}>
                        <FaUtensils style={{fontSize:'30px', color:'#f97316'}}/>
                    </div>
                    <h1 style={styles.lockTitle}>{id} Kitchen</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold', letterSpacing: '1px' }}>KITCHEN DISPLAY SYSTEM (KDS)</p>
                    
                    <form onSubmit={handleLogin}>
                        <input type="text" value={id} readOnly style={{ display: 'none' }} autoComplete="username"/>
                        <input 
                            type="password" placeholder="Enter Kitchen Password" 
                            value={password} onChange={e=>setPassword(e.target.value)} 
                            style={styles.input} autoComplete="current-password" 
                        />
                        {error && <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '15px'}}>{error}</p>}
                        
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : <><FaUnlock/> UNLOCK DISPLAY</>}
                        </button>
                    </form>
                </div>
                <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // --- 6. RENDER: MAIN DASHBOARD ---
    return (
        <div style={styles.dashboardContainer}>
            <style>{`
                @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
                .call-active { animation: pulse-red 2s infinite; }
            `}</style>

            {/* 🛎️ ALERTS BANNER (STICKY TOP) */}
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} className="call-active" style={styles.alertBanner}>
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} NEEDS {call.type?.toUpperCase()}</span>
                        <button onClick={() => handleAttendTable(call._id)} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            {/* HEADER */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>KDS</h1>
                    <div style={styles.statusDot}>
                        <span style={{width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%'}}></span>
                        <span style={{fontSize:'12px', color:'#9ca3af', fontWeight:'bold'}}>ONLINE</span>
                    </div>
                </div>

                <div style={styles.statsContainer}>
                    <div style={styles.statBox}>
                        <div style={styles.statLabel}>DONE</div>
                        <div style={styles.statValue}>{dailyStats.count}</div>
                    </div>
                    {/* Revenue Hidden on Mobile to save space, shown on desktop */}
                    <div style={{...styles.statBox, display: window.innerWidth < 600 ? 'none' : 'flex'}}>
                        <div style={styles.statLabel}>REV</div>
                        <div style={{...styles.statValue, color:'#22c55e'}}>₹{dailyStats.revenue}</div>
                    </div>
                </div>

                <div style={styles.headerRight}>
                     <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    <button onClick={handleLogout} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            {/* TABS */}
            <div style={styles.tabContainer}>
                <button onClick={() => setActiveChefTab("orders")} style={{ ...styles.tabButton, background: activeChefTab === 'orders' ? '#f97316' : '#1f2937' }}>
                    <FaUtensils /> ORDERS ({orders.length})
                </button>
                <button onClick={() => setActiveChefTab("stock")} style={{ ...styles.tabButton, background: activeChefTab === 'stock' ? '#3b82f6' : '#1f2937' }}>
                    <FaBoxOpen /> STOCK
                </button>
            </div>

            {/* === ORDERS VIEW === */}
            {activeChefTab === "orders" && (
                <div style={styles.grid}>
                    {orders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <FaCheckCircle style={{ fontSize: '60px', color: '#1f2937' }} />
                            <p style={{marginTop:'15px', fontWeight:'bold', color: '#4b5563', fontSize: '18px'}}>ALL CAUGHT UP</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderColor: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151')
                            }}>
                                {/* Card Header */}
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>{order.tableNumber === "Takeaway" ? "TAKEAWAY" : `TABLE ${order.tableNumber}`}</h2>
                                    <span style={{
                                        ...styles.statusBadge,
                                        background: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151'),
                                        color: order.status === 'Cooking' ? 'black' : 'white'
                                    }}>
                                        {order.status === "PLACED" ? "NEW" : order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={styles.timeTag}>
                                    <FaRegClock /> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>

                                {/* Items List */}
                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}>
                                            <div>
                                                <div style={styles.itemName}>{item.name}</div>
                                                {item.customizations?.map((c, i) => <div key={i} style={styles.specTag}>{c}</div>)}
                                            </div>
                                            <span style={styles.itemQuantity}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Action Buttons - Full Width on Mobile */}
                                <div style={styles.actionContainer}>
                                    {order.status === "PLACED" && (
                                        <button onClick={() => updateOrderStatus(order._id, "Cooking")} style={styles.btnStart}><FaFire /> START COOKING</button>
                                    )}
                                    {order.status === "Cooking" && (
                                        <button onClick={() => updateOrderStatus(order._id, "Ready")} style={styles.btnReady}><FaCheck /> MARK READY</button>
                                    )}
                                    {order.status === "Ready" && (
                                        <button onClick={() => handleDeleteOrder(order._id)} style={styles.btnClear}><FaRocket /> SERVE</button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* === STOCK VIEW === */}
            {activeChefTab === "stock" && (
                <div style={styles.grid}>
                    {dishes.map(dish => (
                        <div key={dish._id} style={styles.stockCard}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={dish.image || DEFAULT_DISH_IMG} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', opacity: dish.isAvailable ? 1 : 0.4 }} alt="" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: dish.isAvailable ? 'white' : '#6b7280' }}>{dish.name}</h3>
                                    <p style={{ margin: 0, fontSize: '11px', color: dish.isAvailable ? '#22c55e' : '#ef4444', fontWeight: '900', marginTop:'4px' }}>
                                        {dish.isAvailable ? "● IN STOCK" : "● SOLD OUT"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => toggleDishAvailability(dish._id, dish.isAvailable)} style={{
                                background: dish.isAvailable ? '#1f2937' : '#22c55e',
                                color: 'white',
                                border: dish.isAvailable ? '1px solid #374151' : 'none',
                                padding: '12px 20px',
                                borderRadius: '10px',
                                fontWeight: '900',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}>
                                {dish.isAvailable ? "DISABLE" : "RESTOCK"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- PREMIUM STYLES (Mobile First) ---
const styles = {
    // Layout
    dashboardContainer: { minHeight: '100vh', background: 'radial-gradient(circle at top, #111827 0%, #000 100%)', color: 'white', padding: '15px', fontFamily: '"Inter", sans-serif', paddingBottom: '80px' },
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif', padding: '20px' },
    lockCard: { background: '#111', padding: '40px', borderRadius: '24px', border: '1px solid #222', textAlign: 'center', width: '100%', maxWidth: '350px' },
    lockTitle: { fontSize: '28px', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' },
    iconCircle: { width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '1px solid rgba(249, 115, 22, 0.3)' },

    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' },
    headerLeft: { display: 'flex', flexDirection: 'column' },
    headerTitle: { fontSize: '22px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
    statusDot: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' },
    
    statsContainer: { display: 'flex', gap: '10px' },
    statBox: { background: '#000', padding: '8px 16px', borderRadius: '10px', border: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    statLabel: { fontSize: '9px', fontWeight: '900', color: '#6b7280' },
    statValue: { fontSize: '16px', fontWeight: '900', color: 'white' },

    headerRight: { display: 'flex', gap: '10px' },

    // Inputs & Buttons
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '16px', borderRadius: '12px', color: 'white', fontSize: '18px', outline: 'none', textAlign: 'center', marginBottom: '15px' },
    loginBtn: { width: '100%', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', border: 'none', padding: '16px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px' },
    
    iconButton: { background: '#1f2937', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    iconButtonRed: { background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#ef4444', width: '40px', height: '40px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px' },
    tabButton: { flex: 1, border: 'none', color: 'white', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' },

    // Responsive Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '80px 0', opacity: 0.5 },

    // Cards
    card: { background: '#111', borderRadius: '16px', border: '2px solid #333', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' },
    cardHeader: { padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' },
    tableNumber: { fontSize: '18px', fontWeight: '900', margin: 0, color: 'white' },
    statusBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '900' },
    timeTag: { padding: '0 15px', fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '-5px', marginBottom: '10px' },

    itemsContainer: { padding: '15px', borderTop: '1px solid #222', borderBottom: '1px solid #222', background: '#080a0f', flex: 1 },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' },
    itemName: { fontSize: '16px', fontWeight: '600', color: '#e5e7eb', lineHeight: '1.4' },
    itemQuantity: { fontSize: '18px', fontWeight: '900', color: '#f97316' },
    specTag: { fontSize: '11px', color: '#ef4444', fontStyle: 'italic', marginTop: '2px' },

    actionContainer: { padding: '10px', background: '#111' },
    btnStart: { width: '100%', background: '#f97316', border: 'none', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    btnReady: { width: '100%', background: '#eab308', border: 'none', color: 'black', padding: '14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    btnClear: { width: '100%', background: '#22c55e', border: 'none', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },

    // Stock Card
    stockCard: { background: '#111', padding: '15px', borderRadius: '16px', border: '1px solid #222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

    // Alerts
    alertWrapper: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, width: '92%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px' },
    alertBanner: { background: '#ef4444', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' },
    alertText: { fontWeight: '900', fontSize: '13px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' },
    attendBtn: { background: 'white', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

// Placeholder for missing icon import
const FaCheckCircle = ({style}) => <FaCheck style={style}/>;

export default ChefDashboard;