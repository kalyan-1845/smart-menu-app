import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUtensils, FaVolumeUp, FaVolumeMute, FaCheck, FaBell, 
    FaSignOutAlt, FaSpinner, FaBoxOpen, FaClipboardList 
} from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const ChefDashboard = () => {
    const { id } = useParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [error, setError] = useState("");
    const [orders, setOrders] = useState([]); 
    const [dishes, setDishes] = useState([]); 
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    const [activeTab, setActiveTab] = useState("orders");
    const [mongoId, setMongoId] = useState(null);
    const [socket, setSocket] = useState(null); 

    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));

    // 🔄 AUTOMATIC REFRESH ON SITE LOAD & VISIBILITY CHANGE
    useEffect(() => {
        const handleEntryRefresh = () => {
            if (document.visibilityState === 'visible' && mongoId) {
                fetchData(mongoId);
            }
        };
        window.addEventListener('load', handleEntryRefresh);
        document.addEventListener("visibilitychange", handleEntryRefresh);
        return () => {
            window.removeEventListener('load', handleEntryRefresh);
            document.removeEventListener("visibilitychange", handleEntryRefresh);
        };
    }, [mongoId]);

    // 📱 MOBILE PUSH NOTIFICATION SETUP
    const enableMobileAlerts = async (rId) => {
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }).catch(() => {});

        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: 'YOUR_PUBLIC_VAPID_KEY' 
                    });
                    await axios.post(`${API_BASE}/auth/save-subscription`, {
                        restaurantId: rId,
                        subscription: subscription
                    });
                }
            } catch (e) { console.log("Notification setup skipped"); }
        }
    };

    const handleLogin = async (e) => {
        if(e) e.preventDefault();
        setAuthLoading(true);
        setError("");
        try {
            const res = await axios.post(`${API_BASE}/auth/verify-role`, { 
                username: id, 
                password: password,
                role: 'chef' 
            });
            if (res.data.success) {
                const dbId = res.data.restaurantId || res.data._id;
                setMongoId(dbId);
                localStorage.setItem(`chef_session_${id}`, dbId);
                setIsAuthenticated(true);
                enableMobileAlerts(dbId); 
                fetchData(dbId);
            } else { setError("❌ Access Denied"); }
        } catch (err) { setError("❌ Invalid PIN"); } finally { setAuthLoading(false); }
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
            const [orderRes, dishRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}`),
                axios.get(`${API_BASE}/dishes?restaurantId=${rId}`)
            ]);
            // ✅ AUTO-CLEAR: Filter out orders marked as Served
            const active = orderRes.data.filter(o => 
                o.status.toLowerCase() !== "served" && o.status.toLowerCase() !== "completed"
            );
            setOrders(active.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));
            setDishes(dishRes.data);
        } catch (e) { console.error("Sync Failed", e); }
    };

    // 🔒 REAL-TIME WEB-SOCKET LOGIC
    useEffect(() => {
        if(isAuthenticated && mongoId) {
            const newSocket = io(SERVER_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                timeout: 10000
            });
            
            setSocket(newSocket);
            newSocket.emit("join-restaurant", mongoId);

            newSocket.on("new-order", (newOrder) => {
                if (!isMuted) audioRef.current.play().catch(()=>{});
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
                fetchData(mongoId);
            });

            newSocket.on("order-updated", (updatedOrder) => {
                if (updatedOrder.status.toLowerCase() === "served" || updatedOrder.status.toLowerCase() === "completed") {
                    setOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
                } else {
                    fetchData(mongoId);
                }
            });

            newSocket.on("new-waiter-call", (callData) => {
                if (!isMuted) callSound.current.play().catch(()=>{});
                if ("vibrate" in navigator) navigator.vibrate(500);
                setServiceCalls(prev => [callData, ...prev]);
            });

            newSocket.on("global-broadcast", (data) => {
                alert(`📢 BROADCAST: ${data.title}\n${data.message}`);
            });

            const mobileSync = setInterval(() => fetchData(mongoId), 20000);

            return () => {
                newSocket.disconnect();
                clearInterval(mobileSync);
            };
        }
    }, [isAuthenticated, mongoId, isMuted]);

    const advanceOrderStatus = async (order) => {
        let nextStatus = "";
        const currentStatus = order.status.toLowerCase();

        if (currentStatus === "pending" || currentStatus === "placed") nextStatus = "cooking";
        else if (currentStatus === "cooking") nextStatus = "ready";
        
        if (currentStatus === "ready") return; 

        try {
            setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: nextStatus } : o));
            await axios.put(`${API_BASE}/orders/${order._id}`, { status: nextStatus });
            
            if (socket) {
                // Notify Tracker and Waiter
                socket.emit("chef-ready-alert", { 
                    restaurantId: mongoId, 
                    tableNum: order.tableNum,
                    orderId: order._id,
                    status: nextStatus
                });
            }
        } catch (error) { fetchData(mongoId); }
    };

    const toggleStock = async (dishId, currentStatus) => {
        try {
            setDishes(prev => prev.map(d => d._id === dishId ? { ...d, isAvailable: !currentStatus } : d));
            await axios.put(`${API_BASE}/dishes/${dishId}`, { isAvailable: !currentStatus });
        } catch (e) { alert("Stock update failed"); }
    };

    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <FaUtensils style={{fontSize:'40px', color:'#f97316', marginBottom:'15px'}}/>
                    <h1 style={styles.lockTitle}>{id.toUpperCase()} KITCHEN</h1>
                    <form onSubmit={handleLogin}>
                        <input type="password" placeholder="••••" value={password} onChange={e=>setPassword(e.target.value)} style={styles.input} autoFocus />
                        {error && <p style={{color: '#ef4444', fontSize: '13px'}}>{error}</p>}
                        <button type="submit" style={styles.loginBtn} disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin"/> : "UNLOCK KITCHEN"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
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
                    <h1 style={styles.headerTitle}>KDS PANEL</h1>
                    <div style={styles.statusDot}></div>
                </div>
                <div style={styles.headerRight}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton}>{isMuted ? <FaVolumeMute /> : <FaVolumeUp />}</button>
                    <button onClick={() => {localStorage.removeItem(`chef_session_${id}`); window.location.reload();}} style={styles.iconButtonRed}><FaSignOutAlt/></button>
                </div>
            </header>

            <div style={styles.tabContainer}>
                <button onClick={() => setActiveTab("orders")} style={{ ...styles.tabButton, background: activeTab === 'orders' ? '#f97316' : '#1f2937' }}>
                    <FaClipboardList /> LIVE ({orders.length})
                </button>
                <button onClick={() => setActiveTab("stock")} style={{ ...styles.tabButton, background: activeTab === 'stock' ? '#3b82f6' : '#1f2937' }}>
                    <FaBoxOpen /> STOCK
                </button>
            </div>

            <div style={styles.grid}>
                {activeTab === "orders" ? (
                    orders.length === 0 ? <div style={styles.emptyState}><h2>No Pending Orders</h2></div> : (
                        orders.map((order) => (
                            <div key={order._id} style={{
                                ...styles.card, 
                                borderTop: order.status.toLowerCase() === 'ready' ? '5px solid #22c55e' : (order.status.toLowerCase() === 'cooking' ? '5px solid #eab308' : '5px solid #f97316')
                            }}>
                                <div style={styles.cardHeader}>
                                    <h2 style={styles.tableNumber}>T-{order.tableNum}</h2>
                                    <span style={{
                                        ...styles.statusBadge, 
                                        background: order.status.toLowerCase() === 'ready' ? '#22c55e' : (order.status.toLowerCase() === 'cooking' ? '#eab308' : '#374151')
                                    }}>
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
                                        <div style={styles.readyIndicator}><FaCheck /> SENT TO WAITER</div>
                                    ) : (
                                        <button onClick={() => advanceOrderStatus(order)} style={{
                                            ...styles.actionBtn, 
                                            background: order.status.toLowerCase() === 'cooking' ? '#eab308' : '#f97316',
                                            color: order.status.toLowerCase() === 'cooking' ? 'black' : 'white'
                                        }}>
                                            {order.status.toLowerCase() === "cooking" ? "MARK READY" : "START COOKING"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )
                ) : (
                    dishes.map(dish => (
                        <div key={dish._id} style={{...styles.stockCard, opacity: dish.isAvailable ? 1 : 0.6}}>
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
    dashboardContainer: { minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', fontFamily: 'Inter, sans-serif' },
    lockContainer: { minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    lockCard: { background: '#111', padding: '40px', borderRadius: '24px', textAlign: 'center', width: '90%', maxWidth: '350px', border:'1px solid #222' },
    lockTitle: { color: 'white', fontSize: '24px', fontWeight: '900', margin: '0 0 10px 0' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', marginBottom: '15px', textAlign: 'center', fontSize:'20px', outline:'none' },
    loginBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#111', borderRadius: '12px', marginBottom: '15px' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    headerTitle: { fontSize: '18px', fontWeight: '900', margin: 0 },
    statusDot: { width:'8px', height:'8px', background:'#22c55e', borderRadius:'50%' },
    headerRight: { display: 'flex', gap: '10px' },
    iconButton: { background: '#1f2937', border: 'none', color: 'white', padding: '10px', borderRadius: '8px' },
    iconButtonRed: { background: '#3b0a0a', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '8px' },
    tabContainer: { display: 'flex', gap: '10px', marginBottom: '15px' },
    tabButton: { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' },
    card: { background: '#111', borderRadius: '12px', border: '1px solid #222', display: 'flex', flexDirection: 'column' },
    cardHeader: { padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    tableNumber: { fontSize: '20px', fontWeight: '900', margin:0 },
    statusBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
    itemsContainer: { padding: '12px', flex: 1 },
    itemRow: { display: 'flex', gap:'10px', marginBottom: '5px' },
    itemQuantity: { color: '#f97316', fontWeight: '900' },
    itemName: { fontSize: '15px' },
    actionContainer: { padding: '12px' },
    actionBtn: { width: '100%', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '900' },
    readyIndicator: { textAlign: 'center', color: '#22c55e', fontSize: '12px', fontWeight: '900', background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '8px', border: '1px dashed #22c55e' },
    stockCard: { background: '#111', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #222' },
    stockBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', color: 'white', fontWeight: 'bold' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '50px', color:'#666' },
    alertWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 100, width: '90%', maxWidth:'400px' },
    alertBanner: { background: '#ef4444', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'5px' },
    alertText: { fontWeight:'bold', fontSize:'12px' },
    attendBtn: { background: 'white', color: '#ef4444', border: 'none', borderRadius: '5px', padding:'4px 8px' }
};

export default ChefDashboard;