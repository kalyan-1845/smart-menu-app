import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
// 🎨 ICONS
import { FaUtensils, FaCog, FaLock, FaVolumeUp, FaVolumeMute, FaRegClock, FaUser, FaCircle, FaFire, FaCheck, FaRocket, FaBell, FaExternalLinkAlt, FaUserTie, FaWalking } from "react-icons/fa";

const ChefDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [restaurantName, setRestaurantName] = useState("Kitchen");
    const [loading, setLoading] = useState(true);
    const [serviceCalls, setServiceCalls] = useState([]); 
    const [isMuted, setIsMuted] = useState(false);
    
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");

    // 🔊 AUDIO REFS
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    const callSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2190/2190-preview.mp3"));
    // Socket Ref to keep connection stable
    const socketRef = useRef();

    // --- 1. FETCH ORDERS ---
    const fetchOrders = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const nameRes = await axios.get(`http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || nameRes.data.restaurantName);

            const res = await axios.get(`http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders?restaurantId=${ownerId}`, config);
            const activeOrders = res.data.filter(o => o.status !== "SERVED");

            setOrders(prevOrders => {
                if (activeOrders.length > prevOrders.length && prevOrders.length !== 0 && !isMuted) {
                    audioRef.current.currentTime = 0; 
                    audioRef.current.play().catch(e => console.log("Audio blocked"));
                }
                return activeOrders;
            });
            setLoading(false);
        } catch (error) { 
            console.error("Fetch error:", error); 
            if (error.response?.status === 401) { localStorage.clear(); navigate("/login"); }
        }
    };

    // --- 2. LIVE SOCKET (With Sync Logic) ---
    useEffect(() => {
        fetchOrders(); 
        
        // Initialize Socket
        socketRef.current = io("http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        const socket = socketRef.current;
        
        // Listen for NEW calls
        socket.on("waiter-call", (callData) => {
            if (callData.restaurantId === ownerId) {
                // Prevent duplicate alerts for the same table
                setServiceCalls(prev => {
                    const exists = prev.find(c => c.tableNumber === callData.tableNumber);
                    if (exists) return prev;
                    
                    if (!isMuted) { callSound.current.currentTime = 0; callSound.current.play().catch(() => {}); }
                    return [callData, ...prev];
                });
            }
        });

        // Listen for RESOLVED calls (When another waiter clicks "I'll Go")
        socket.on("call-resolved", (data) => {
            if (data.restaurantId === ownerId) {
                setServiceCalls(prev => prev.filter(c => c.tableNumber !== data.tableNumber));
            }
        });

        const interval = setInterval(fetchOrders, 5000); 
        return () => { clearInterval(interval); socket.disconnect(); };
    }, [ownerId, isMuted]);

    // --- 3. HANDLE "I'LL GO" (Syncs with everyone) ---
    const handleAttendTable = (tableNumber) => {
        // 1. Remove from my screen immediately
        setServiceCalls(prev => prev.filter(c => c.tableNumber !== tableNumber));
        
        // 2. Tell server to remove from EVERYONE else's screen
        if(socketRef.current) {
            socketRef.current.emit("resolve-call", { restaurantId: ownerId, tableNumber });
        }
    };

    // --- 4. ORDER STATUS LOGIC ---
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
            await axios.put(`http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders/${orderId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            
            if (newStatus === "Ready") { 
                setTimeout(() => { setOrders(prev => prev.filter(o => o._id !== orderId)); }, 600000); 
            }
        } catch (error) { alert("Failed to update status."); fetchOrders(); }
    };

    const handleDeleteOrder = async (orderId) => {
        if(!window.confirm("Remove this order from the list?")) return;
        try { 
            await axios.delete(`http://mongodb+srv://axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/login", { ... })_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } }); 
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (error) { console.error("Delete failed", error); }
    };

    const handleLogout = () => { localStorage.clear(); window.location.href = "/"; };

    if (loading) return <div style={styles.loadingContainer}>Loading Kitchen...</div>;

    return (
        <div style={styles.dashboardContainer}>
            
            {/* 🛎️ WAITER CALL ALERTS (SYNCED) */}
            {serviceCalls.length > 0 && (
                <div style={styles.alertContainer}>
                    {serviceCalls.map((call, idx) => (
                        <div key={idx} style={styles.alertBanner}>
                            <span style={styles.alertText}><FaBell /> Table {call.tableNumber} needs help!</span>
                            
                            {/* "I'LL GO" BUTTON - Syncs with other waiters */}
                            <button onClick={() => handleAttendTable(call.tableNumber)} style={styles.attendBtn}>
                                <FaWalking /> I'll Go
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- HEADER --- */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>
                        <FaUtensils style={{ color: '#f97316', marginRight: '10px' }} /> Kitchen Live
                    </h1>
                    <p style={styles.headerSubtitle}>
                        Station: {restaurantName} <span style={{ color: '#22c55e', margin: '0 5px' }}>•</span> <span style={{ color: '#22c55e' }}>Online</span>
                    </p>
                    <a href={`/menu/${ownerId}`} target="_blank" rel="noreferrer" style={styles.menuLink}>
                        Live Menu: Open Customer View <FaExternalLinkAlt style={{ fontSize: '10px', marginLeft: '5px' }} />
                    </a>
                </div>

                <div style={styles.headerButtons}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton} title="Toggle Sound">
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    
                    <Link to="/waiter">
                        <button style={styles.iconButtonText}>
                            <FaUserTie style={{ marginRight: '8px' }}/> Waiter View
                        </button>
                    </Link>

                    <Link to="/manager-login">
                        <button style={styles.iconButtonText}>
                            <FaCog style={{ marginRight: '8px' }}/> Menu
                        </button>
                    </Link>

                    <button onClick={handleLogout} style={styles.iconButtonRed}>
                        <FaLock style={{ marginRight: '8px' }}/> Logout
                    </button>
                </div>
            </header>

            {/* --- ORDERS GRID --- */}
            <div style={styles.grid}>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FaUtensils style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.3 }} />
                        <p>No active orders</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h2 style={styles.tableNumber}>
                                        {order.tableNumber === "Takeaway" ? "Takeaway" : `Table ${order.tableNumber || order.tableNum}`}
                                    </h2>
                                    <p style={styles.orderId}>Order ID: #{order._id?.slice(-5).toUpperCase()}</p>
                                </div>
                                <span style={order.status === 'Cooking' ? styles.badgeCooking : (order.status === 'Ready' ? styles.badgeReady : styles.badgeNew)}>
                                    {order.status === "PLACED" ? "NEW" : order.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={styles.metaContainer}>
                                <span style={styles.metaItem}>
                                    <FaRegClock style={styles.metaIcon} /> 
                                    {new Date(order.createdAt || order.date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                                <span style={styles.metaItem}>
                                    <FaUser style={styles.metaIcon} /> 
                                    {order.customerName || "Guest"}
                                </span>
                            </div>

                            <div style={styles.itemsContainer}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={styles.itemRow}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                                            <FaCircle style={styles.itemBullet} />
                                            <span>
                                                <span style={styles.itemName}>{item.name}</span>
                                                {item.selectedSpecs && item.selectedSpecs.length > 0 && (
                                                    <div style={styles.specsContainer}>
                                                        {item.selectedSpecs.map((spec, sIdx) => (
                                                            <span key={sIdx} style={styles.specTag}>🚨 {spec}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </span>
                                        </div>
                                        <span style={styles.itemQuantity}>×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.actionContainer}>
                                {(order.status === "PLACED" || order.status === "Pending") && (
                                    <button onClick={() => updateOrderStatus(order._id, "Cooking")} style={styles.btnStart}>
                                        <FaFire style={{ marginRight: '8px' }} /> START PREPARING
                                    </button>
                                )}
                                {order.status === "Cooking" && (
                                    <button onClick={() => updateOrderStatus(order._id, "Ready")} style={styles.btnReady}>
                                        <FaCheck style={{ marginRight: '8px' }} /> MARK READY
                                    </button>
                                )}
                                {order.status === "Ready" && (
                                    <div>
                                        <div style={styles.waitingBanner}>
                                            <FaBell style={{ marginRight: '8px' }} /> WAITING FOR WAITER
                                        </div>
                                        <button onClick={() => handleDeleteOrder(order._id)} style={styles.btnClear}>
                                            <FaRocket style={{ marginRight: '8px' }} /> PICKED UP / CLEAR
                                        </button>
                                        <p style={styles.autoClearText}>Auto-clears in 10 mins</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#0d1117', color: 'white', padding: '24px', fontFamily: "'Inter', sans-serif" },
    loadingContainer: { minHeight: '100vh', background: '#0d1117', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '600', letterSpacing: '1px' },
    
    // Header
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    headerTitle: { fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center' },
    headerSubtitle: { color: '#8b949e', fontSize: '14px', marginTop: '4px', fontWeight: '500' },
    headerButtons: { display: 'flex', gap: '12px' },
    menuLink: { color: '#58a6ff', fontSize: '13px', textDecoration: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', marginTop: '8px' },

    // Buttons
    iconButton: { background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' },
    iconButtonText: { background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', fontSize: '13px' },
    iconButtonRed: { background: '#3d1316', border: '1px solid #5a1e23', color: '#f85149', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600', fontSize: '13px' },

    // Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#8b949e', border: '2px dashed #30363d', borderRadius: '16px' },

    // Card
    card: { background: '#161b22', borderRadius: '16px', border: '1px solid #30363d', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    cardHeader: { padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    tableNumber: { fontSize: '20px', fontWeight: '700', margin: 0 },
    orderId: { color: '#8b949e', fontSize: '13px', marginTop: '4px', fontWeight: '500' },

    // Badges
    badgeNew: { background: '#f97316', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' },
    badgeCooking: { background: '#eab308', color: 'black', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' },
    badgeReady: { background: '#22c55e', color: 'white', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', letterSpacing: '0.5px' },

    // Meta
    metaContainer: { padding: '0 20px 16px', display: 'flex', gap: '20px', borderBottom: '1px solid #30363d' },
    metaItem: { display: 'flex', alignItems: 'center', color: '#8b949e', fontSize: '13px', fontWeight: '500' },
    metaIcon: { marginRight: '6px', color: '#58a6ff' },

    // Items
    itemsContainer: { padding: '20px', maxHeight: '250px', overflowY: 'auto' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    itemBullet: { color: '#f97316', fontSize: '8px', marginTop: '6px', marginRight: '10px' },
    itemName: { fontSize: '15px', fontWeight: '600', color: '#e6edf3' },
    itemQuantity: { fontSize: '16px', fontWeight: '700', color: '#f97316' },
    specsContainer: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' },
    specTag: { background: 'rgba(248, 81, 73, 0.2)', color: '#ff7b72', border: '1px solid rgba(248, 81, 73, 0.4)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' },

    // Buttons
    actionContainer: { padding: '20px', background: '#0d1117', borderTop: '1px solid #30363d' },
    btnStart: { width: '100%', background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    btnReady: { width: '100%', background: '#22c55e', border: 'none', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    btnClear: { width: '100%', background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '14px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '12px' },
    waitingBanner: { background: 'rgba(234, 179, 8, 0.2)', color: '#eab308', padding: '10px', borderRadius: '8px', textAlign: 'center', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    autoClearText: { textAlign: 'center', color: '#8b949e', fontSize: '11px', marginTop: '8px', fontWeight: '500' },

    // Alerts
    alertContainer: { marginBottom: '20px' },
    alertBanner: { background: '#f97316', padding: '12px 20px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    alertText: { fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' },
    // "I'LL GO" Button Style
    attendBtn: { background: 'white', color: '#f97316', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }
};

export default ChefDashboard;