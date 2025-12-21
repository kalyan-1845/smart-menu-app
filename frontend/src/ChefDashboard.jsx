import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
// 🎨 ICONS
import { FaUtensils, FaCog, FaLock, FaVolumeUp, FaVolumeMute, FaRegClock, FaUser, FaCircle, FaFire, FaCheck, FaRocket, FaBell, FaExternalLinkAlt, FaUserTie, FaWalking } from "react-icons/fa";

/**
 * ChefDashboard Component
 * The central hub for kitchen staff to manage incoming orders and real-time service requests.
 */
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
    const socketRef = useRef();

    // --- 1. DATA FETCHING ---
    const fetchOrders = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Fetch Restaurant Profile
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || nameRes.data.restaurantName);

            // Fetch Active Orders (Excluding those already served)
            const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders?restaurantId=${ownerId}`, config);
            const activeOrders = res.data.filter(o => o.status !== "SERVED");

            setOrders(prevOrders => {
                // Play notification sound if a new order arrives
                if (activeOrders.length > prevOrders.length && prevOrders.length !== 0 && !isMuted) {
                    audioRef.current.currentTime = 0; 
                    audioRef.current.play().catch(() => console.log("Audio blocked"));
                }
                return activeOrders;
            });
            setLoading(false);
        } catch (error) { 
            console.error("Dashboard Fetch Error:", error); 
            if (error.response?.status === 401) { localStorage.clear(); navigate("/login"); }
        }
    };

    // --- 2. REAL-TIME SOCKET CONNECTION ---
    useEffect(() => {
        fetchOrders(); 
        
        socketRef.current = io("https://smart-menu-backend-5ge7.onrender.com");
        const socket = socketRef.current;
        
        // Listen for new customer assistance calls
        socket.on("new-waiter-call", (callData) => {
            if (callData.restaurantId === ownerId) {
                setServiceCalls(prev => {
                    const exists = prev.find(c => c._id === callData._id);
                    if (exists) return prev;
                    
                    if (!isMuted) { 
                        callSound.current.currentTime = 0; 
                        callSound.current.play().catch(() => {}); 
                    }
                    return [callData, ...prev];
                });
            }
        });

        // Listen for calls resolved by waiters
        socket.on("call-resolved", (data) => {
            if (data.restaurantId === ownerId) {
                setServiceCalls(prev => prev.filter(c => c.tableNumber !== data.tableNumber));
            }
        });

        const interval = setInterval(fetchOrders, 15000); // Polling backup
        return () => { 
            clearInterval(interval); 
            socket.disconnect(); 
        };
    }, [ownerId, isMuted]);

    // --- 3. ACTIONS ---

    const handleAttendTable = async (callId, tableNumber) => {
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/orders/calls/${callId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setServiceCalls(prev => prev.filter(c => c._id !== callId));
            if(socketRef.current) {
                socketRef.current.emit("resolve-call", { restaurantId: ownerId, tableNumber });
            }
        } catch (e) { alert("Error resolving call"); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Optimistic Update for UI speed
            setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
            
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${orderId}`, 
                { status: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // If marked ready, the order will clear from the Chef's view after 10 mins
            if (newStatus === "Ready") { 
                setTimeout(() => { 
                    setOrders(prev => prev.filter(o => o._id !== orderId)); 
                }, 600000); 
            }
        } catch (error) { 
            alert("Failed to update status. Please check connection."); 
            fetchOrders(); 
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if(!window.confirm("Permanently clear this order?")) return;
        try { 
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${orderId}`, 
                { headers: { Authorization: `Bearer ${token}` } }
            ); 
            setOrders(prev => prev.filter(o => o._id !== orderId)); 
        } catch (error) { 
            console.error("Delete failed", error); 
        }
    };

    const handleLogout = () => { 
        localStorage.clear(); 
        window.location.href = "/"; 
    };

    if (loading) return (
        <div style={styles.loadingContainer}>
            <div style={{ textAlign: 'center' }}>
                <div style={styles.spinner}></div>
                <p style={{fontWeight:'bold', marginTop:'10px'}}>Syncing Kitchen...</p>
            </div>
        </div>
    );

    return (
        <div style={styles.dashboardContainer}>
            
            {/* 🛎️ TOP ALERTS: SERVICE REQUESTS */}
            {serviceCalls.length > 0 && (
                <div style={styles.alertContainer}>
                    {serviceCalls.map((call, idx) => (
                        <div key={idx} style={styles.alertBanner}>
                            <span style={styles.alertText}><FaBell /> Table {call.tableNumber} needs {call.type?.toUpperCase()}!</span>
                            <button onClick={() => handleAttendTable(call._id, call.tableNumber)} style={styles.attendBtn}>
                                <FaWalking /> I'll Handle It
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* --- STICKY HEADER --- */}
            <header style={styles.header}>
                <div>
                    <h1 style={styles.headerTitle}>
                        <FaUtensils style={{ color: '#f97316', marginRight: '12px' }} /> Kitchen Console
                    </h1>
                    <p style={styles.headerSubtitle}>
                        Restaurant: {restaurantName} <span style={{ color: '#22c55e', margin: '0 8px' }}>•</span> <span style={{ color: '#22c55e' }}>Live Sync Active</span>
                    </p>
                    <a href={`/menu/${ownerId}`} target="_blank" rel="noreferrer" style={styles.menuLink}>
                        Open Digital Menu Preview <FaExternalLinkAlt style={{ fontSize: '10px', marginLeft: '6px' }} />
                    </a>
                </div>

                <div style={styles.headerButtons}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconButton} title="Notification Sound">
                        {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    
                    <Link to="/waiter">
                        <button style={styles.iconButtonText}><FaUserTie style={{ marginRight: '8px' }}/> Waiter Dashboard</button>
                    </Link>

                    <Link to="/admin">
                        <button style={styles.iconButtonText}><FaCog style={{ marginRight: '8px' }}/> Manage Menu</button>
                    </Link>

                    <button onClick={handleLogout} style={styles.iconButtonRed}>
                        <FaLock style={{ marginRight: '8px' }}/> Log Out
                    </button>
                </div>
            </header>

            {/* --- LIVE ORDERS GRID --- */}
            <div style={styles.grid}>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FaUtensils style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.1 }} />
                        <p style={{fontSize:'20px', fontWeight:'900', color:'#333'}}>NO ACTIVE ORDERS</p>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <h2 style={styles.tableNumber}>
                                        {order.tableNumber === "Takeaway" ? "🛍️ Takeaway" : `🍽️ Table ${order.tableNumber}`}
                                    </h2>
                                    <p style={styles.orderId}>ID: #{order._id?.slice(-6).toUpperCase()}</p>
                                </div>
                                <span style={order.status === 'Cooking' ? styles.badgeCooking : (order.status === 'Ready' ? styles.badgeReady : styles.badgeNew)}>
                                    ● {order.status === "PLACED" ? "NEW ORDER" : order.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={styles.metaContainer}>
                                <span style={styles.metaItem}><FaRegClock style={styles.metaIcon} /> Received {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                <span style={styles.metaItem}><FaUser style={styles.metaIcon} /> {order.customerName || "Guest"}</span>
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
                                        <FaCheck style={{ marginRight: '8px' }} /> MARK AS READY
                                    </button>
                                )}
                                {order.status === "Ready" && (
                                    <div>
                                        <div style={styles.waitingBanner}>
                                            <FaBell style={{ marginRight: '8px' }} /> WAITING FOR PICKUP
                                        </div>
                                        <button onClick={() => handleDeleteOrder(order._id)} style={styles.btnClear}>
                                            <FaRocket style={{ marginRight: '8px' }} /> DISMISS ORDER
                                        </button>
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

// --- MODERN DARK THEME STYLES ---
const styles = {
    dashboardContainer: { minHeight: '100vh', background: '#080a0f', color: 'white', padding: '30px', fontFamily: "'Inter', sans-serif" },
    loadingContainer: { minHeight: '100vh', background: '#080a0f', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    spinner: { width: '45px', height: '45px', border: '5px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', background: '#111827', padding: '25px', borderRadius: '24px', border: '1px solid #1f2937', flexWrap: 'wrap', gap: '20px' },
    headerTitle: { fontSize: '32px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center', letterSpacing: '-1px' },
    headerSubtitle: { color: '#9ca3af', fontSize: '14px', marginTop: '6px', fontWeight: 'bold', textTransform: 'uppercase' },
    headerButtons: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
    menuLink: { color: '#3b82f6', fontSize: '12px', textDecoration: 'none', fontWeight: '800', display: 'flex', alignItems: 'center', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' },

    iconButton: { background: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' },
    iconButtonText: { background: '#1f2937', border: '1px solid #374151', color: '#f3f4f6', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', fontSize: '13px' },
    iconButtonRed: { background: '#450a0a', border: '1px solid #7f1d1d', color: '#f87171', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', fontSize: '13px' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '30px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '120px 0', color: '#1f2937', background: '#0a0d14', borderRadius: '32px', border: '3px dashed #111827' },

    card: { background: '#111827', borderRadius: '28px', border: '1px solid #1f2937', overflow: 'hidden', transition: '0.3s ease', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' },
    cardHeader: { padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1f2937' },
    tableNumber: { fontSize: '24px', fontWeight: '900', margin: 0, tracking: '-1px' },
    orderId: { color: '#6b7280', fontSize: '11px', marginTop: '6px', fontWeight: 'bold', fontFamily: 'monospace' },

    badgeNew: { background: '#f97316', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' },
    badgeCooking: { background: '#eab308', color: 'black', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' },
    badgeReady: { background: '#22c55e', color: 'white', padding: '6px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' },

    metaContainer: { padding: '15px 25px', display: 'flex', gap: '25px', background: '#0d1117' },
    metaItem: { display: 'flex', alignItems: 'center', color: '#9ca3af', fontSize: '12px', fontWeight: 'bold' },
    metaIcon: { marginRight: '8px', color: '#3b82f6' },

    itemsContainer: { padding: '25px', maxHeight: '300px', overflowY: 'auto' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' },
    itemBullet: { color: '#f97316', fontSize: '8px', marginTop: '8px', marginRight: '12px' },
    itemName: { fontSize: '17px', fontWeight: '700', letterSpacing: '-0.5px' },
    itemQuantity: { fontSize: '18px', fontWeight: '900', color: '#f97316', background: 'rgba(249, 115, 22, 0.1)', padding: '2px 10px', borderRadius: '8px' },
    specsContainer: { display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' },
    specTag: { background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '10px', padding: '4px 10px', borderRadius: '6px', fontWeight: '900' },

    actionContainer: { padding: '25px', background: '#080a0f', borderTop: '1px solid #1f2937' },
    btnStart: { width: '100%', background: '#f97316', border: 'none', color: 'white', padding: '16px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', transition: '0.2s', boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' },
    btnReady: { width: '100%', background: '#22c55e', border: 'none', color: 'white', padding: '16px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', transition: '0.2s', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' },
    btnClear: { width: '100%', background: '#1f2937', border: '1px solid #374151', color: '#d1d5db', padding: '16px', borderRadius: '14px', fontWeight: '900', cursor: 'pointer', marginTop: '12px', fontSize: '14px' },
    waitingBanner: { background: 'rgba(34, 197, 94, 0.05)', color: '#22c55e', padding: '12px', borderRadius: '12px', textAlign: 'center', fontWeight: '900', fontSize: '12px', marginBottom: '10px', border: '1px dashed #22c55e' },

    alertContainer: { position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '95%', maxWidth: '550px' },
    alertBanner: { background: '#f97316', padding: '20px 25px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', marginBottom: '12px', border: '2px solid rgba(255,255,255,0.2)' },
    alertText: { fontWeight: '900', fontSize: '18px', color: 'white', letterSpacing: '-0.5px' },
    attendBtn: { background: 'white', color: '#f97316', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }
};

export default ChefDashboard;