import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaCheck, FaBell, 
    FaSignOutAlt, FaSpinner, FaBoxOpen, FaClipboardList 
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
    const [activeTab, setActiveTab] = useState("orders");
    const [mongoId, setMongoId] = useState(null);
    const socketRef = useRef(null);

    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // ✅ 1. AGGRESSIVE DATA SYNC (The "Safety Net")
    // If Sockets fail, this function manually pulls orders every 10 seconds.
    const forceSync = useCallback(async (rId) => {
        if (!rId) return;
        try {
            const [orderRes, dishRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/dishes?restaurantId=${rId}`)
            ]);
            
            const active = orderRes.data.filter(o => 
                o.status.toLowerCase() !== "served" && o.status.toLowerCase() !== "completed"
            );

            // Trigger sound only if new orders arrived since last sync
            if (active.length > orders.length && !isMuted) {
                audioRef.current.play().catch(()=>{});
            }

            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setDishes(dishRes.data);
        } catch (e) { console.error("Cloud Sync Failed"); }
    }, [orders.length, isMuted]);

    // ✅ 2. HANDLE SCREEN UNLOCK (Refresh immediately when chef looks at phone)
    useEffect(() => {
        const handleWakeUp = () => {
            if (document.visibilityState === 'visible' && mongoId) forceSync(mongoId);
        };
        document.addEventListener("visibilitychange", handleWakeUp);
        window.addEventListener("focus", handleWakeUp);
        return () => {
            document.removeEventListener("visibilitychange", handleWakeUp);
            window.removeEventListener("focus", handleWakeUp);
        };
    }, [mongoId, forceSync]);

    // ✅ 3. RESILIENT SOCKET CONNECTION
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            socketRef.current = io(SERVER_URL, {
                transports: ['websocket'],
                reconnection: true,
                query: { restaurantId: mongoId }
            });

            const s = socketRef.current;

            s.on("connect", () => {
                s.emit("join-restaurant", mongoId);
                forceSync(mongoId);
            });

            s.on("new-order", () => forceSync(mongoId));
            s.on("order-updated", () => forceSync(mongoId));
            
            s.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                if ("vibrate" in navigator) navigator.vibrate(500);
                setServiceCalls(prev => [callData, ...prev]);
            });

            // 🛡️ THE ULTIMATE BACKUP: Poll database every 10 seconds
            const backupTimer = setInterval(() => forceSync(mongoId), 10000);

            return () => {
                s.disconnect();
                clearInterval(backupTimer);
            };
        }
    }, [isAuthenticated, mongoId, isMuted, forceSync]);

    const handleLogin = async (e) => {
        if(e) e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, password: password, role: 'chef' 
            });
            if (res.data.success) {
                const dbId = res.data.restaurantId || res.data._id;
                setMongoId(dbId);
                localStorage.setItem(`chef_session_${id}`, dbId);
                setIsAuthenticated(true);
                forceSync(dbId);
            } else { toast.error("Invalid PIN"); }
        } catch (err) { toast.error("Login Failed"); } finally { setAuthLoading(false); }
    };

    useEffect(() => {
        const savedId = localStorage.getItem(`chef_session_${id}`);
        if (savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            forceSync(savedId);
        }
    }, [id, forceSync]);

    const advanceOrderStatus = async (order) => {
        let nextStatus = "";
        const current = order.status.toLowerCase();
        if (current === "pending" || current === "placed") nextStatus = "cooking";
        else if (current === "cooking") nextStatus = "ready";
        
        if (!nextStatus) return;

        try {
            // Optimistic UI (Update screen instantly)
            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: nextStatus } : o));
            await axios.put(`${API_BASE}/orders/${order._id}`, { status: nextStatus });
            
            if (socketRef.current) {
                socketRef.current.emit("chef-ready-alert", { 
                    restaurantId: mongoId, tableNum: order.tableNum, orderId: order._id, status: nextStatus
                });
            }
            toast.success(`Table ${order.tableNum} is ${nextStatus}`);
        } catch (error) { forceSync(mongoId); }
    };

    const toggleStock = async (dishId, currentStatus) => {
        try {
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: !currentStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: !currentStatus });
        } catch (e) { toast.error("Update Failed"); }
    };

    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <FaUtensils style={{fontSize:'40px', color:'#f97316', marginBottom:'15px'}}/>
                    <h1 style={styles.lockTitle}>{id.toUpperCase()} KITCHEN</h1>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="ENTER PIN" value={password} inputMode="numeric" onChange={e=>setPassword(e.target.value)} style={styles.input} autoFocus />
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : "START COOKING"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            {/* 🛎️ Top Alerts */}
            <div style={styles.alertWrapper}>
                {serviceCalls.map((call, idx) => (
                    <div key={idx} style={styles.alertBanner}>
                        <span style={styles.alertText}><FaBell /> TABLE {call.tableNumber} NEEDS HELP</span>
                        <button onClick={() => setServiceCalls(prev => prev.filter(c => c._id !== call._id))} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>
              
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.headerTitle}>CHEF PANEL</h1>
                    <div style={styles.statusDot}></div>
                </div>
                <div style={styles.headerRight}>
                    <InstallButton />
                    <button onClick={() => {
                        setIsMuted(!isMuted);
                        audioRef.current.play().then(()=>audioRef.current.pause());
                    }} style={styles.iconButton}>{isMuted ? <FaVolumeMute color="#ef4444" /> : <FaVolumeUp color="#22c55e" />}</button>
                    <button onClick={() => {localStorage.removeItem(`chef_session_${id}`); window.location.reload();}} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <button onClick={() => setActiveTab("orders")} style={{ ...styles.tabButton, background: activeTab === 'orders' ? '#f97316' : '#111' }}>
                    <FaClipboardList /> LIVE ({orders.length})
                </button>
                <button onClick={() => setActiveTab("stock")} style={{ ...styles.tabButton, background: activeTab === 'stock' ? '#3b82f6' : '#111' }}>
                    <FaBoxOpen /> MENU
                </button>
            </div>
                    
            <div style={styles.grid}>
                {activeTab === "orders" ? (
                    orders.length === 0 ? <div style={styles.emptyState}><FaUtensils size={40}/><p>No active orders</p></div> : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderTop: order.status.toLowerCase() === 'ready' ? '6px solid #22c55e' : (order.status.toLowerCase() === 'cooking' ? '6px solid #eab308' : '6px solid #f97316')
                            }}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>TABLE {order.tableNum}</h2>
                                    <span style={{...styles.statusBadge, background: order.status.toLowerCase() === 'ready' ? '#22c55e' : (order.status.toLowerCase() === 'cooking' ? '#eab308' : '#222')}}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={styles.itemsContainer}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={styles.itemRow}>
                                            <span style={styles.itemQuantity}>{item.quantity}x</span>
                                            <div style={styles.itemName}>{item.name}</div>
                                        </div>
                                    ))}
                                </div>
                                <div style={styles.actionContainer}>
                                    {order.status.toLowerCase() === "ready" ? (
                                        <div style={styles.readyIndicator}><FaCheck /> WAITER NOTIFIED</div>
                                    ) : (
                                        <button onClick={() => advanceOrderStatus(order)} style={{
                                            ...styles.actionBtn, 
                                            background: order.status.toLowerCase() === 'cooking' ? '#eab308' : '#f97316',
                                            color: order.status.toLowerCase() === 'cooking' ? 'black' : 'white'
                                        }}>
                                            {order.status.toLowerCase() === "cooking" ? "MARK AS READY" : "START COOKING"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    dishes.map(dish => (
                        <div key={dish._id} style={{...styles.stockCard, opacity: dish.isAvailable ? 1 : 0.5}}>
                            <h3 style={{ margin: 0, fontSize: '15px' }}>{dish.name}</h3>
                            <button onClick={() => toggleStock(dish._id, dish.isAvailable)} style={{...styles.stockBtn, background: dish.isAvailable ? '#ef4444' : '#22c55e'}}>
                                {dish.isAvailable ? "OUT" : "IN"}
                            </button>
                        </div>
                    ))
                )}
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#000', color: 'white', padding: '15px', fontFamily: 'Inter, sans-serif' },
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#0a0a0a', padding: '40px', borderRadius: '30px', textAlign: 'center', width: '90%', maxWidth: '350px', border:'1px solid #111' },
    lockTitle: { color: 'white', fontSize: '20px', fontWeight: '900', margin: '0 0 20px 0' },
    input: { width: '100%', background: '#000', border: '1px solid #222', padding: '18px', borderRadius: '15px', color: 'white', marginBottom: '15px', textAlign: 'center', fontSize:'22px', outline:'none' },
    loginBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', fontSize:'14px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#0a0a0a', borderRadius: '20px', marginBottom: '15px', border:'1px solid #111' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    headerTitle: { fontSize: '16px', fontWeight: '900', margin: 0 },
    statusDot: { width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%', boxShadow:'0 0 10px #22c55e' },
    headerRight: { display: 'flex', gap: '8px', alignItems: 'center' },
    iconButton: { background: '#111', border: '1px solid #222', color: 'white', padding: '12px', borderRadius: '12px' },
    iconButtonRed: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '12px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '15px' },
    tabButton: { flex: 1, padding: '18px', borderRadius: '15px', border: '1px solid #222', color: 'white', fontWeight: '900', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', fontSize: '12px', touchAction: 'manipulation' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' },
    card: { background: '#0a0a0a', borderRadius: '24px', border: '1px solid #111', display: 'flex', flexDirection: 'column', overflow:'hidden' },
    cardHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'rgba(255,255,255,0.02)' },
    tableNumber: { fontSize: '24px', fontWeight: '900', margin:0 },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },
    itemsContainer: { padding: '20px', flex: 1 },
    itemRow: { display: 'flex', gap:'12px', marginBottom: '10px', alignItems:'center' },
    itemQuantity: { color: '#f97316', fontWeight: '900', fontSize:'18px' },
    itemName: { fontSize: '16px', fontWeight:'600' },
    actionContainer: { padding: '20px', background:'rgba(0,0,0,0.2)' },
    actionBtn: { width: '100%', border: 'none', padding: '20px', borderRadius: '18px', fontWeight: '900', fontSize: '14px', touchAction: 'manipulation', boxShadow:'0 4px 15px rgba(0,0,0,0.3)' },
    readyIndicator: { textAlign: 'center', color: '#22c55e', fontSize: '12px', fontWeight: '900', background: 'rgba(34, 197, 94, 0.05)', padding: '18px', borderRadius: '15px', border: '1px dashed #22c55e' },
    stockCard: { background: '#0a0a0a', padding: '15px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #111' },
    stockBtn: { padding: '10px 20px', borderRadius: '12px', border: 'none', color: 'white', fontWeight: '900' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '100px 20px', color:'#333', fontWeight:'900' },
    alertWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '95%', maxWidth:'400px' },
    alertBanner: { background: '#ef4444', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px', boxShadow:'0 10px 30px rgba(0,0,0,0.5)' },
    alertText: { fontWeight:'900', fontSize:'13px' },
    attendBtn: { background: 'white', color: '#ef4444', border: 'none', borderRadius: '10px', padding:'8px 12px' }
};

export default ChefDashboard;