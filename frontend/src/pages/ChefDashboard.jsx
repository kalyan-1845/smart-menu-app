import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaRegClock, 
    FaUser, FaFire, FaCheck, FaRocket, FaBell, 
    FaExternalLinkAlt, FaUserTie, FaBoxOpen, 
    FaUnlock, FaSignOutAlt, FaChartLine, FaClipboardList, FaSpinner
} from "react-icons/fa";

// 🖼️ ASSETS
const DEFAULT_DISH_IMG = "https://cdn-icons-png.flaticon.com/512/706/706164.png"; 

const ChefDashboard = () => {
    const { id } = useParams(); // Get Restaurant ID from URL
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState("");

    const [orders, setOrders] = useState([]); // Active Orders
    const [dailyStats, setDailyStats] = useState({ count: 0, revenue: 0 }); 
    const [dishes, setDishes] = useState([]); // For Stock Tab
    const [loading, setLoading] = useState(false);
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeChefTab, setActiveChefTab] = useState("orders"); // "orders" or "stock"
    const [mongoId, setMongoId] = useState(null);

    // 🔊 REFS
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        setError("");

        try {
            // Verify Role API Call
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, 
                password: password,
                role: 'chef'
            });
            
            if (res.data.success) {
                const rId = res.data.restaurantId;
                setMongoId(rId);
                
                // Store Session
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

    // Check session on load
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
            // Fetch All Orders
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            
            // Filter Active vs Completed
            const active = orderRes.data.filter(o => o.status !== "SERVED");
            const completedToday = orderRes.data.filter(o => {
                const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
                return o.status === "SERVED" && isToday;
            });

            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt))); // Oldest first for kitchen
            
            // Calculate Daily Stats
            const revenue = completedToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setDailyStats({
                count: completedToday.length,
                revenue: revenue
            });

            // Fetch Dishes (for Stock)
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${rId}`);
            setDishes(dishRes.data);

            // Fetch Active Calls
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

            // New Orders
            socket.on("new-order", () => {
                if (!isMuted) audioRef.current.play().catch(()=>{});
                fetchData(mongoId);
            });

            // Order Updates
            socket.on("order-updated", () => fetchData(mongoId));

            // Waiter Calls
            socket.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                setServiceCalls(prev => [callData, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, mongoId, isMuted]);

    // --- 4. ACTIONS ---

    const toggleDishAvailability = async (dishId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            // Optimistic Update
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
        if(!window.confirm("Complete Order?")) return;
        try { 
            // Mark as Served
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" });
            
            // Optimistic update
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
                        <FaUtensils style={{fontSize:'24px', color:'#f97316'}}/>
                    </div>
                    <h1 style={styles.lockTitle}>{id} Kitchen</h1>
                    <p style={{ color: '#666', fontSize: '11px', marginBottom: '25px', fontWeight: 'bold', letterSpacing: '1px' }}>CHEF ACCESS POINT</p>
                    
                    <form onSubmit={handleLogin}>
                        {/* ✅ FIX: Hidden username input to satisfy accessibility warnings */}
                        <input 
                            type="text" 
                            name="username" 
                            value={id} 
                            readOnly 
                            style={{ display: 'none' }} 
                            autoComplete="username"
                        />

                        <input 
                            type="password" 
                            placeholder="Kitchen Password" 
                            value={password} 
                            onChange={e=>setPassword(e.target.value)} 
                            style={styles.input}
                            autoComplete="current-password" 
                        />
                        {error && <p style={{color: '#ef4444', fontSize: '12px', marginBottom: '15px'}}>{error}</p>}
                        
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : <><FaUnlock/> OPEN KITCHEN</>}
                        </button>
                    </form>
                </div>
                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    // --- 6. RENDER: DASHBOARD ---
    return (
        <div style={styles.dashboardContainer}>
            
            {/* 🛎️ ALERTS BANNER */}
            {serviceCalls.length > 0 && (
                <div style={styles.alertContainer}>
                    {serviceCalls.map((call, idx) => (
                        <div key={idx} style={styles.alertBanner}>
                            <span style={styles.alertText}><FaBell /> Table {call.tableNumber}: {call.type?.toUpperCase()}</span>
                            <button onClick={() => handleAttendTable(call._id)} style={styles.attendBtn}><FaCheck/> Done</button>
                        </div>
                    ))}
                </div>
            )}

            {/* HEADER */}
            <header style={styles.header}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div>
                        <h1 style={styles.headerTitle}>Kitchen Console</h1>
                        <p style={styles.headerSubtitle}>{id.toUpperCase()} • <span style={{ color: '#22c55e' }}>Online</span></p>
                    </div>
                </div>

                {/* STATS WIDGETS */}
                <div style={styles.statsRow}>
                    <div style={styles.statWidget}>
                        <span style={styles.statLabel}><FaChartLine/> ORDERS</span>
                        <span style={styles.statValue}>{dailyStats.count}</span>
                    </div>
                    <div style={styles.statWidget}>
                        <span style={styles.statLabel}><FaClipboardList/> REVENUE</span>
                        <span style={{...styles.statValue, color: '#22c55e'}}>₹{dailyStats.revenue.toLocaleString()}</span>
                    </div>
                </div>

                <div style={styles.headerButtons}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    
                    <Link to={`/menu/${id}`} target="_blank" style={{textDecoration:'none'}}>
                        <button style={styles.iconButtonText}><FaExternalLinkAlt style={{ marginRight: '8px' }}/> Menu</button>
                    </Link>

                    <Link to={`/${id}/waiter`} target="_blank" style={{textDecoration:'none'}}>
                        <button style={styles.iconButtonText}><FaUserTie style={{ marginRight: '8px' }}/> Waiter</button>
                    </Link>
                    
                    <button onClick={handleLogout} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            {/* TABS */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                <button onClick={() => setActiveChefTab("orders")} style={{ ...styles.tabButton, background: activeChefTab === 'orders' ? '#f97316' : '#1f2937' }}>
                    <FaUtensils style={{marginRight:'8px'}}/> LIVE ORDERS ({orders.length})
                </button>
                <button onClick={() => setActiveChefTab("stock")} style={{ ...styles.tabButton, background: activeChefTab === 'stock' ? '#3b82f6' : '#1f2937' }}>
                    <FaBoxOpen style={{marginRight:'8px'}}/> STOCK CONTROL
                </button>
            </div>

            {/* === ORDERS VIEW === */}
            {activeChefTab === "orders" && (
                <div style={styles.grid}>
                    {orders.length === 0 ? (
                        <div style={styles.emptyState}>
                            <FaUtensils style={{ fontSize: '50px', opacity: 0.2, color: 'white' }} />
                            <p style={{marginTop:'15px', fontWeight:'bold', color: '#666'}}>KITCHEN IS CLEAR</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderColor: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#374151')
                            }}>
                                <div style={styles.cardHeader}>
                                    <div>
                                        <h2 style={styles.tableNumber}>{order.tableNumber === "Takeaway" ? "Takeaway" : `Table ${order.tableNumber}`}</h2>
                                        <p style={styles.orderId}>#{order._id?.slice(-4).toUpperCase()}</p>
                                    </div>
                                    <span style={order.status === 'Cooking' ? styles.badgeCooking : (order.status === 'Ready' ? styles.badgeReady : styles.badgeNew)}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>

                                <div style={styles.metaContainer}>
                                    <span style={styles.metaItem}><FaRegClock style={{marginRight:'6px'}}/> {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    <span style={styles.metaItem}><FaUser style={{marginRight:'6px'}}/> {order.customerName}</span>
                                </div>

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

                                <div style={styles.actionContainer}>
                                    <div style={{display:'flex', gap:'8px', marginTop:'10px'}}>
                                        {order.status === "PLACED" && (
                                            <button onClick={() => updateOrderStatus(order._id, "Cooking")} style={styles.btnStart}><FaFire style={{marginRight:'5px'}}/> COOK</button>
                                        )}
                                        {(order.status === "Cooking" || order.status === "PLACED") && (
                                            <button onClick={() => updateOrderStatus(order._id, "Ready")} style={styles.btnReady}><FaCheck style={{marginRight:'5px'}}/> READY</button>
                                        )}
                                        {order.status === "Ready" && (
                                            <button onClick={() => handleDeleteOrder(order._id)} style={styles.btnClear}><FaRocket style={{marginRight:'5px'}}/> SERVED</button>
                                        )}
                                    </div>
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
                        <div key={dish._id} style={{ ...styles.card, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={dish.image || DEFAULT_DISH_IMG} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover', opacity: dish.isAvailable ? 1 : 0.3 }} alt="" />
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', color: dish.isAvailable ? 'white' : '#555' }}>{dish.name}</h3>
                                    <p style={{ margin: 0, fontSize: '10px', color: dish.isAvailable ? '#22c55e' : '#ef4444', fontWeight: '900' }}>
                                        {dish.isAvailable ? "IN STOCK" : "SOLD OUT"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => toggleDishAvailability(dish._id, dish.isAvailable)} style={{ background: dish.isAvailable ? '#ef4444' : '#22c55e', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: '900', fontSize: '12px', cursor: 'pointer' }}>
                                {dish.isAvailable ? "DISABLE" : "ENABLE"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const styles = {
    // Layout
    dashboardContainer: { minHeight: '100vh', background: '#080a0f', color: 'white', padding: '30px', fontFamily: '"Inter", sans-serif' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Inter", sans-serif' },
    lockCard: { background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '320px' },
    lockTitle: { fontSize: '24px', fontWeight: '900', color: 'white', margin: 0 },
    iconCircle: { width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' },

    // Header
    header: { display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#111827', padding: '20px', borderRadius: '20px', border: '1px solid #1f2937' },
    headerTitle: { fontSize: '24px', fontWeight: '900', margin: 0 },
    headerSubtitle: { color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' },
    headerButtons: { display: 'flex', gap: '10px' },
    statsRow: { display: 'flex', gap: '15px' },
    
    // Stats Widgets
    statWidget: { background: '#1f2937', padding: '10px 20px', borderRadius: '12px', display:'flex', flexDirection:'column', alignItems:'center', border: '1px solid #374151', minWidth: '100px' },
    statLabel: { fontSize: '10px', fontWeight: '900', color: '#9ca3af', display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' },
    statValue: { fontSize: '18px', fontWeight: '900', color: 'white' },

    // Buttons
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '14px', borderRadius: '10px', color: 'white', fontSize: '16px', outline: 'none', textAlign: 'center', marginBottom: '15px' },
    loginBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    iconButton: { background: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    iconButtonText: { background: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '12px' },
    iconButtonRed: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    tabButton: { border: '1px solid #374151', color: 'white', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', fontSize: '12px' },

    // Grid & Cards
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: '#333' },
    card: { background: '#111827', borderRadius: '20px', border: '2px solid #374151', overflow: 'hidden', transition: '0.3s' },
    cardHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', borderBottom: '1px solid #1f2937' },
    tableNumber: { fontSize: '20px', fontWeight: '900', margin: 0 },
    orderId: { color: '#6b7280', fontSize: '10px', fontWeight: 'bold' },
    
    // Badges
    badgeNew: { background: '#f97316', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },
    badgeCooking: { background: '#eab308', color: 'black', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },
    badgeReady: { background: '#22c55e', color: 'white', padding: '5px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },

    // Items
    metaContainer: { padding: '10px 20px', display: 'flex', gap: '20px', background: '#0d1117' },
    metaItem: { display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold' },
    itemsContainer: { padding: '20px', maxHeight: '250px', overflowY: 'auto' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' },
    itemName: { fontSize: '15px', fontWeight: '700' },
    itemQuantity: { fontSize: '16px', fontWeight: '900', color: '#f97316' },
    specTag: { fontSize: '10px', color: '#ef4444', fontStyle: 'italic' },

    // Actions
    actionContainer: { padding: '20px', background: '#080a0f', borderTop: '1px solid #1f2937' },
    btnStart: { flex: 1, background: '#f97316', border: 'none', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' },
    btnReady: { flex: 1, background: '#22c55e', border: 'none', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' },
    btnClear: { flex: 1, background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', padding: '12px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' },

    // Alerts
    alertContainer: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '500px' },
    alertBanner: { background: '#f97316', padding: '15px 20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: '10px', animation: 'slideDown 0.3s ease' },
    alertText: { fontWeight: '900', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' },
    attendBtn: { background: 'white', color: '#f97316', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }
};

export default ChefDashboard;