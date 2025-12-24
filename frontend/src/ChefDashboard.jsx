import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaRegClock, 
    FaUser, FaFire, FaCheck, FaRocket, FaBell, 
    FaExternalLinkAlt, FaUserTie, FaBoxOpen, 
    FaUnlock, FaSignOutAlt, FaChartLine, FaClipboardList
} from "react-icons/fa";

// 🖼️ ASSETS
const DEFAULT_DISH_IMG = "https://cdn-icons-png.flaticon.com/512/706/706164.png"; 
const DASHBOARD_LOGO = "https://cdn-icons-png.flaticon.com/512/1830/1830839.png"; 

const ChefDashboard = () => {
    const { id } = useParams(); // Get Restaurant ID from URL
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    const [orders, setOrders] = useState([]); // Active Orders
    const [dailyStats, setDailyStats] = useState({ count: 0, revenue: 0 }); // New Stats State
    const [dishes, setDishes] = useState([]); // For Stock Tab
    const [restaurantName, setRestaurantName] = useState(id);
    const [loading, setLoading] = useState(false);
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeChefTab, setActiveChefTab] = useState("orders"); // "orders" or "stock"

    // 🔊 REFS
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));
    const socketRef = useRef();

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { email: id, password });
            
            // Store Session
            localStorage.setItem(`chef_token_${id}`, res.data.token);
            localStorage.setItem(`chef_owner_id_${id}`, res.data.id);
            
            setRestaurantName(res.data.restaurantName || id);
            setIsAuthenticated(true);
            
            // Initial Fetch
            fetchData(res.data.token, res.data.id);
        } catch (err) {
            alert("❌ Invalid Kitchen Password");
        } finally {
            setAuthLoading(false);
        }
    };

    // --- 2. DATA FETCHING ---
    const fetchData = async (token, mongoId) => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch All Orders (Active + History for stats)
            // Note: In a real app, you might have a separate endpoint for daily stats to save bandwidth
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${mongoId}`, config);
            
            const active = orderRes.data.filter(o => o.status !== "SERVED");
            const completedToday = orderRes.data.filter(o => {
                const isToday = new Date(o.createdAt).toDateString() === new Date().toDateString();
                return o.status === "SERVED" && isToday;
            });

            setOrders(active);
            
            // Calculate Daily Stats
            const revenue = completedToday.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            setDailyStats({
                count: completedToday.length,
                revenue: revenue
            });

            // Fetch Dishes (for Stock)
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${mongoId}`, config);
            setDishes(dishRes.data);

        } catch (e) { console.error("Sync Failed", e); }
        finally { setLoading(false); }
    };

    // --- 3. SOCKETS & EFFECTS ---
    useEffect(() => {
        if(isAuthenticated) {
            const token = localStorage.getItem(`chef_token_${id}`);
            const mongoId = localStorage.getItem(`chef_owner_id_${id}`);

            socketRef.current = io("https://smart-menu-backend-5ge7.onrender.com");
            const socket = socketRef.current;
            
            socket.emit("join-owner-room", mongoId);

            // New Orders
            socket.on("new-order", () => {
                if (!isMuted) audioRef.current.play().catch(()=>{});
                fetchData(token, mongoId);
            });

            // Order Updates
            socket.on("order-updated", () => fetchData(token, mongoId));

            // Waiter Calls
            socket.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                setServiceCalls(prev => [callData, ...prev]);
            });

            socket.on("call-resolved", (data) => {
                setServiceCalls(prev => prev.filter(c => c.tableNumber !== data.tableNumber));
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, id, isMuted]);

    // --- 4. ACTIONS ---

    const toggleDishAvailability = async (dishId, currentStatus) => {
        const token = localStorage.getItem(`chef_token_${id}`);
        try {
            const newStatus = !currentStatus;
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: newStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) { alert("Update failed"); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        const token = localStorage.getItem(`chef_token_${id}`);
        try {
            setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (error) { alert("Status update failed"); }
    };

    const handleDeleteOrder = async (orderId) => {
        if(!window.confirm("Complete & Archive Order?")) return;
        const token = localStorage.getItem(`chef_token_${id}`);
        try { 
            // Mark as Served instead of deleting to keep history stats
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" }, { headers: { Authorization: `Bearer ${token}` } });
            
            // Optimistic update: Remove from active list and update stats
            const order = orders.find(o => o._id === orderId);
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
            setDailyStats(prev => ({
                count: prev.count + 1,
                revenue: prev.revenue + (order?.totalAmount || 0)
            }));

        } catch (error) { console.error(error); }
    };

    const handleAttendTable = async (callId) => {
        const token = localStorage.getItem(`chef_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`, { headers: { Authorization: `Bearer ${token}` } });
            setServiceCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) {}
    };

    // --- 5. RENDER: LOCK SCREEN ---
    if (!isAuthenticated) {
        return (
            <div style={{minHeight:'100vh', background:'#080a0f', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <div style={styles.lockCard}>
                    <FaUtensils style={{fontSize:'40px', color:'#f97316', marginBottom:'15px'}}/>
                    <h1 style={styles.lockTitle}>{id} Kitchen</h1>
                    <form onSubmit={handleLogin} style={{marginTop:'20px'}}>
                        <input type="password" placeholder="Kitchen Password" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input}/>
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? "Unlocking..." : <><FaUnlock/> OPEN KITCHEN</>}
                        </button>
                    </form>
                </div>
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
                    <img src={DASHBOARD_LOGO} alt="Logo" style={{width: '50px', height: '50px'}} />
                    <div>
                        <h1 style={styles.headerTitle}>Kitchen Console</h1>
                        <p style={styles.headerSubtitle}>{restaurantName} • <span style={{ color: '#22c55e' }}>Online</span></p>
                    </div>
                </div>

                {/* STATS WIDGETS */}
                <div style={{display: 'flex', gap: '15px', marginLeft: 'auto', marginRight: '30px'}}>
                    <div style={styles.statWidget}>
                        <span style={styles.statLabel}><FaChartLine/> DAILY ORDERS</span>
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
                    
                    <a href={`/menu/${id}`} target="_blank" rel="noreferrer" style={{textDecoration:'none'}}>
                        <button style={styles.iconButtonText}><FaExternalLinkAlt style={{ marginRight: '8px' }}/> Public Menu</button>
                    </a>

                    <Link to={`/${id}/waiter`}>
                        <button style={styles.iconButtonText}><FaUserTie style={{ marginRight: '8px' }}/> Waiter View</button>
                    </Link>
                    
                    <button onClick={() => setIsAuthenticated(false)} style={styles.iconButtonRed}><FaSignOutAlt/></button>
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
                            <FaUtensils style={{ fontSize: '50px', opacity: 0.2 }} />
                            <p style={{marginTop:'15px', fontWeight:'bold'}}>KITCHEN IS CLEAR</p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderColor: order.status === 'Ready' ? '#22c55e' : (order.status === 'Cooking' ? '#eab308' : '#1f2937')
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
    dashboardContainer: { minHeight: '100vh', background: '#080a0f', color: 'white', padding: '30px', fontFamily: "sans-serif" },
    lockCard: { background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center', width: '300px' },
    lockTitle: { fontSize: '20px', fontWeight: '900', color: 'white', margin: 0 },
    
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', background: '#111827', padding: '20px', borderRadius: '20px', border: '1px solid #1f2937' },
    headerTitle: { fontSize: '24px', fontWeight: '900', margin: 0 },
    headerSubtitle: { color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' },
    headerButtons: { display: 'flex', gap: '10px' },
    
    // Stats Widgets
    statWidget: { background: '#1f2937', padding: '10px 20px', borderRadius: '12px', display:'flex', flexDirection:'column', alignItems:'center', border: '1px solid #374151' },
    statLabel: { fontSize: '10px', fontWeight: '900', color: '#9ca3af', display:'flex', alignItems:'center', gap:'5px', marginBottom:'4px' },
    statValue: { fontSize: '18px', fontWeight: '900', color: 'white' },

    // Buttons
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '12px', borderRadius: '10px', color: 'white', fontSize: '16px', outline: 'none', textAlign: 'center', marginBottom: '15px' },
    loginBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    iconButton: { background: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    iconButtonText: { background: '#1f2937', border: '1px solid #374151', color: '#fff', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', fontSize: '12px' },
    iconButtonRed: { background: '#450a0a', border: '1px solid #7f1d1d', color: '#f87171', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    tabButton: { border: '1px solid #374151', color: 'white', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900', display: 'flex', alignItems: 'center', fontSize: '12px' },

    // Grid & Cards
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '100px 0', color: '#333' },
    card: { background: '#111827', borderRadius: '20px', border: '2px solid #1f2937', overflow: 'hidden' },
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
    alertBanner: { background: '#f97316', padding: '15px 20px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', marginBottom: '10px' },
    alertText: { fontWeight: '900', fontSize: '14px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' },
    attendBtn: { background: 'white', color: '#f97316', border: 'none', padding: '8px 15px', borderRadius: '8px', fontWeight: '900', cursor: 'pointer', fontSize: '11px' }
};

export default ChefDashboard;