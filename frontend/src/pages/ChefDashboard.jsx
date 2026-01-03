import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaCheck, FaBell, 
    FaSignOutAlt, FaSpinner, FaCheckDouble, FaConciergeBell 
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const ChefDashboard = () => {
    const { id } = useParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [orders, setOrders] = useState([]); 
    const [dishes, setDishes] = useState([]); 
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [alertsActive, setAlertsActive] = useState(true); 
    const [activeTab, setActiveTab] = useState("orders");
    const [mongoId, setMongoId] = useState(null);
    const socketRef = useRef(null);

    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // ✅ 1. SYNC ENGINE: Fetches latest Orders & Menu
    const forceSync = useCallback(async (rId) => {
        if (!rId) return;
        try {
            const [orderRes, dishRes] = await Promise.all([
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${rId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/dishes?restaurantId=${rId}&t=${Date.now()}`)
            ]);
            
            const activeOrders = orderRes.data.filter(o => 
                !["served", "completed", "archived"].includes(o.status.toLowerCase())
            );

            if (activeOrders.length > orders.length && !isMuted) {
                audioRef.current.play().catch(()=>{});
            }

            setOrders(activeOrders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setDishes(dishRes.data || []);
        } catch (e) { console.error("Sync Failed"); }
    }, [orders.length, isMuted]);

    // ✅ 2. AUTHENTICATION
    useEffect(() => {
        const savedId = localStorage.getItem(`chef_session_${id}`);
        if (savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            forceSync(savedId);
        }
    }, [id, forceSync]);

    const handleLogin = async (e) => {
        if(e) e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { 
                username: id, password: password
            });
            const dbId = res.data._id;
            setMongoId(dbId);
            localStorage.setItem(`chef_token_${id}`, res.data.token);
            localStorage.setItem(`chef_session_${id}`, dbId);
            setIsAuthenticated(true);
            forceSync(dbId);
            toast.success("Kitchen System Online");
        } catch (err) { toast.error("Invalid Access Key"); } finally { setAuthLoading(false); }
    };

    // ✅ 3. STOCK TOGGLE (Out of Stock Logic)
    const toggleStock = async (dishId, currentStatus) => {
        try {
            // Optimistic UI update
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: !currentStatus } : d));
            
            await axios.put(`${API_BASE}/dishes/${dishId}`, { 
                isAvailable: !currentStatus,
                restaurantId: mongoId 
            });
            
            toast.success(currentStatus ? "Marked OUT OF STOCK" : "Item Back IN STOCK");
        } catch (e) { 
            toast.error("Failed to update status"); 
            forceSync(mongoId);
        }
    };

    // ✅ 4. REAL-TIME SOCKET CONNECTION
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            socketRef.current = io(SERVER_URL, { query: { restaurantId: mongoId } });
            const s = socketRef.current;
            
            s.on("connect", () => {
                s.emit("join-restaurant", mongoId);
                forceSync(mongoId);
            });

            s.on("new-order", () => forceSync(mongoId));
            
            s.on("new-waiter-call", (data) => {
                if (alertsActive) {
                    if (!isMuted) callSound.current.play().catch(()=>{});
                    setServiceCalls(prev => [data, ...prev]);
                }
            });

            const backupTimer = setInterval(() => forceSync(mongoId), 15000);
            return () => { s.disconnect(); clearInterval(backupTimer); };
        }
    }, [isAuthenticated, mongoId, isMuted, alertsActive, forceSync]);

    // ✅ 5. ORDER STATUS UPDATER
    const updateStatus = async (order, nextStatus) => {
        try {
            await axios.put(`${API_BASE}/orders/${order._id}`, { status: nextStatus });

            if (nextStatus === "served") {
                setOrders(prev => prev.filter(o => o._id !== order._id));
                toast.success(`Table ${order.tableNum} Served`);
            } else {
                toast.success(`Table ${order.tableNum}: ${nextStatus.toUpperCase()}`);
                forceSync(mongoId);
            }
        } catch (error) { 
            toast.error("Update failed");
        }
    };

    if (!isAuthenticated) return (
        <div style={styles.lockContainer}>
            <div style={styles.lockCard}>
                <FaUtensils style={{fontSize:'40px', color:'#f97316', marginBottom:'15px'}}/>
                <h1 style={styles.lockTitle}>{id?.toUpperCase()} KITCHEN</h1>
                <form onSubmit={handleLogin}>
                    <input type="password" placeholder="ACCESS PIN" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} autoFocus />
                    <button type="submit" style={styles.loginBtn} disabled={authLoading}>{authLoading ? <FaSpinner className="spin"/> : "UNLOCK DASHBOARD"}</button>
                </form>
            </div>
        </div>
    );

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} style={styles.alertBanner} className="pulse-red">
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} NEEDS HELP</span>
                        <button onClick={() => setServiceCalls(prev => prev.filter(c => c._id !== call._id))} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>
              
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>CHEF DASHBOARD</h1>
                    <div style={styles.statusDot}></div>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={() => setAlertsActive(!alertsActive)} style={{...styles.iconButton, background: alertsActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}}>
                        <FaConciergeBell color={alertsActive ? "#22c55e" : "#ef4444"} />
                    </button>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>{isMuted ? <FaVolumeMute color="#ef4444" /> : <FaVolumeUp color="#22c55e" />}</button>
                    <InstallButton />
                    <button onClick={() => {localStorage.clear(); window.location.reload();}} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <button onClick={() => setActiveTab("orders")} style={{ ...styles.tabButton, background: activeTab === 'orders' ? '#f97316' : '#111' }}>LIVE ORDERS ({orders.length})</button>
                <button onClick={() => setActiveTab("stock")} style={{ ...styles.tabButton, background: activeTab === 'stock' ? '#3b82f6' : '#111' }}>STOCK CONTROL</button>
            </div>
                    
            <div style={styles.grid}>
                {activeTab === "orders" ? (
                    orders.length === 0 ? <div style={styles.emptyState}><FaUtensils size={40}/><p>No orders pending.</p></div> : (
                        orders.map((order) => (
                            <div key={order._id} style={{...styles.card, borderTop: order.status.toLowerCase() === 'ready' ? '6px solid #22c55e' : (order.status.toLowerCase() === 'cooking' ? '6px solid #eab308' : '6px solid #f97316')}}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>T-{order.tableNum}</h2>
                                    <span style={{...styles.statusBadge, background: order.status.toLowerCase() === 'ready' ? '#22c55e' : (order.status.toLowerCase() === 'cooking' ? '#eab308' : '#222')}}>{order.status.toUpperCase()}</span>
                                </div>
                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}><span style={styles.itemQuantity}>{item.quantity}x</span><div style={styles.itemName}>{item.name}</div></div>
                                    ))}
                                </div>
                                <div style={styles.actionContainer}>
                                    {order.status.toLowerCase() === "ready" ? (
                                        <button onClick={() => updateStatus(order, "served")} style={{...styles.actionBtn, background:'#22c55e', color:'white'}}><FaCheckDouble /> MARK SERVED</button>
                                    ) : (
                                        <button onClick={() => updateStatus(order, order.status.toLowerCase() === 'cooking' ? "ready" : "cooking")} style={{...styles.actionBtn, background: order.status.toLowerCase() === 'cooking' ? '#eab308' : '#f97316', color: order.status.toLowerCase() === 'cooking' ? 'black' : 'white'}}>
                                            {order.status.toLowerCase() === "cooking" ? "READY FOR PICKUP" : "START PREPARING"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    dishes.map(dish => (
                        <div key={dish._id} style={{...styles.stockCard, borderLeft: dish.isAvailable ? '4px solid #22c55e' : '4px solid #ef4444'}}>
                            <div style={{flex:1}}>
                                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: dish.isAvailable ? 'white' : '#555' }}>{dish.name}</h3>
                                <p style={{margin:0, fontSize:'10px', color: dish.isAvailable ? '#22c55e' : '#ef4444'}}>{dish.isAvailable ? "AVAILABLE" : "OUT OF STOCK"}</p>
                            </div>
                            <button onClick={() => toggleStock(dish._id, dish.isAvailable)} style={{...styles.stockBtn, background: dish.isAvailable ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: dish.isAvailable ? '#ef4444' : '#22c55e', border: `1px solid ${dish.isAvailable ? '#ef4444' : '#22c55e'}`}}>
                                {dish.isAvailable ? "MARK OUT" : "MARK IN"}
                            </button>
                        </div>
                    ))
                )}
            </div>
            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }
                .pulse-red { animation: pulse-red 1s infinite alternate; } @keyframes pulse-red { from { background: #ef4444; } to { background: #991b1b; } }
            `}</style>
        </div>
    );
};

const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#000', color: 'white', padding: '15px', fontFamily: 'Inter, sans-serif' },
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', textAlign: 'center', width: '90%', maxWidth: '350px', border:'1px solid #111' },
    lockTitle: { color: 'white', fontSize: '20px', fontWeight: '900', margin: '0 0 20px 0' },
    input: { width: '100%', background: '#000', border: '1px solid #222', padding: '18px', borderRadius: '15px', color: 'white', marginBottom: '15px', textAlign: 'center', fontSize:'22px', outline:'none' },
    loginBtn: { width: '100%', background: 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#0a0a0a', borderRadius: '20px', marginBottom: '15px', border:'1px solid #111' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    headerTitle: { fontSize: '14px', fontWeight: '900', margin: 0, letterSpacing: '1px' },
    statusDot: { width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%', boxShadow:'0 0 10px #22c55e' },
    headerRight: { display: 'flex', gap: '8px', alignItems: 'center' },
    iconButton: { background: '#111', border: '1px solid #222', color: 'white', padding: '10px', borderRadius: '10px', display:'flex', alignItems:'center' },
    iconButtonRed: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '10px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '15px' },
    tabButton: { flex: 1, padding: '16px', borderRadius: '15px', border: '1px solid #222', color: 'white', fontWeight: '900', fontSize: '11px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' },
    card: { background: '#0a0a0a', borderRadius: '24px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow:'hidden' },
    cardHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom:'1px solid #111' },
    tableNumber: { fontSize: '24px', fontWeight: '900', margin:0, color:'#FF9933' },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },
    itemsContainer: { padding: '20px', flex: 1 },
    itemRow: { display: 'flex', gap:'12px', marginBottom: '10px', alignItems:'center' },
    itemQuantity: { color: '#f97316', fontWeight: '900', fontSize:'18px' },
    itemName: { fontSize: '16px', fontWeight:'600' },
    actionContainer: { padding: '15px' },
    actionBtn: { width: '100%', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', fontSize: '14px' },
    stockCard: { background: '#0a0a0a', padding: '15px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #111' },
    stockBtn: { padding: '10px 18px', borderRadius: '12px', fontWeight: '900', fontSize: '11px', cursor: 'pointer' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', color:'#444', fontWeight:'900' },
    alertWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: '95%', maxWidth:'400px' },
    alertBanner: { padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px', border: '1px solid rgba(255,255,255,0.2)' },
    alertText: { fontWeight:'900', fontSize:'13px' },
    attendBtn: { background: 'white', color: '#000', border: 'none', borderRadius: '10px', padding:'8px 12px' }
};

export default ChefDashboard;