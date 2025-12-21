import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
// 🎨 Icons
import { FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, FaUser, FaReceipt } from "react-icons/fa";

const WaiterDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [restaurantName, setRestaurantName] = useState("Restaurant");
    const [loading, setLoading] = useState(true);
    
    // 🕒 Keep track of orders that were just served but should stay visible for 3 mins
    const [visibleServedIds, setVisibleServedIds] = useState([]);

    // Auth
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");

    // Sounds
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 1. Fetch Orders ---
    const fetchOrders = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // ✅ FIXED URL: Removed "...localhost" concatenation
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || "Staff Area");

            // ✅ FIXED URL: Removed "...localhost" concatenation
            const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders?restaurantId=${ownerId}`, config);
            
            // 🧠 LOGIC: Show active orders OR orders that were served < 3 mins ago
            const activeOrders = res.data.filter(o => 
                o.status !== "SERVED" || visibleServedIds.includes(o._id)
            ); 
            
            // Sort: Oldest orders first
            activeOrders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

            setOrders(activeOrders);
            setLoading(false);
        } catch (error) { 
            console.error("Fetch error:", error); 
        }
    };

    // --- 2. Live Updates ---
    useEffect(() => {
        fetchOrders();
        
        // ✅ FIXED URL: Production Socket link
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder.owner === ownerId) {
                notifSound.current.play().catch(()=>{});
                fetchOrders(); 
            }
        });

        // Refresh wait times every minute
        const timer = setInterval(() => { setOrders(prev => [...prev]); }, 60000);
        return () => { clearInterval(timer); socket.disconnect(); };
        // eslint-disable-next-line
    }, [ownerId, visibleServedIds]); 

    // --- 3. Actions ---
    
    // 🟢 MARK SERVED (With 3-Minute Delay)
    const markServed = async (id) => {
        try {
            // ✅ FIXED URL: Removed "...localhost"
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}`, 
                { status: "SERVED" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Keep it visible locally
            setVisibleServedIds(prev => [...prev, id]);

            // Force a refresh immediately
            fetchOrders();

            // Start 3-minute timer to hide it later
            setTimeout(() => {
                setVisibleServedIds(prev => prev.filter(servedId => servedId !== id)); 
                setOrders(prev => prev.filter(o => o._id !== id)); 
            }, 180000); 

        } catch (e) { 
            alert("Error updating order"); 
        }
    };

    // 🔵 MARK PAID
    const markPaid = async (id) => {
        try {
            // ✅ FIXED URL: Removed "...localhost"
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}`, 
                { status: "Paid" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchOrders();
        } catch (e) { alert("Error updating"); }
    };

    // Helper for "Wait: 15m ago"
    const getWaitTime = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        return `${diff}m ago`;
    };

    if (loading) return (
        <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Loading Waiter Panel...</p>
        </div>
    );

    return (
        <div style={styles.container}>
            
            {/* --- HEADER --- */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <FaUserTie style={{ color: '#3b82f6', marginRight: '10px' }} /> Waiter Panel
                    </h1>
                    <p style={styles.subtitle}>{restaurantName} • <span style={{color:'#22c55e'}}>Online</span></p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <Link to="/chef">
                        <button style={styles.navBtn}>Kitchen View</button>
                    </Link>
                    <button onClick={() => { localStorage.clear(); navigate("/"); }} style={styles.logoutBtn}>Logout</button>
                </div>
            </div>

            {/* --- ORDERS LIST --- */}
            <div style={styles.grid}>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>No active orders</div>
                ) : (
                    orders.map(order => (
                        <div key={order._id} style={{
                            ...styles.card,
                            opacity: order.status === "SERVED" ? 0.6 : 1,
                            borderColor: order.status === "SERVED" ? '#22c55e' : '#333'
                        }}>
                            
                            <h2 style={styles.tableTitle}>
                                {order.tableNumber === "Takeaway" ? "Takeaway" : `Table ${order.tableNumber || order.tableNum}`}
                            </h2>

                            <div style={styles.metaRow}>
                                <span style={styles.waitText}>Wait: {getWaitTime(order.createdAt)}</span>
                            </div>
                            <div style={styles.userRow}>
                                <FaUser style={{fontSize:'12px', marginRight:'6px', color:'#8b949e'}} />
                                <span style={styles.userName}>{order.customerName || "Guest"}</span>
                            </div>

                            <div style={styles.statusRow}>
                                <span style={{ 
                                    ...styles.statusBadge, 
                                    color: order.status === 'SERVED' ? '#22c55e' : (order.status === 'READY' ? '#22c55e' : (order.status === 'Paid' ? '#3b82f6' : '#f97316')) 
                                }}>
                                    {order.status === 'Pending Payment' ? 'PENDING_PAYMENT' : order.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={styles.itemsList}>
                                {order.items.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span>{item.name}</span>
                                        <span style={{color:'#8b949e'}}>×{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <p style={styles.idText}>ID: ...{order._id.slice(-8)}</p>

                            <div style={styles.actionRow}>
                                {order.status === "SERVED" ? (
                                    <div style={styles.completedBanner}>
                                        ✅ COMPLETED (Clears in 3m)
                                    </div>
                                ) : (
                                    <>
                                        {order.status !== "Paid" && (
                                            <button onClick={() => markPaid(order._id)} style={styles.btnPay}>
                                                <FaMoneyBillWave /> Mark Paid
                                            </button>
                                        )}
                                        <button onClick={() => markServed(order._id)} style={styles.btnServe}>
                                            <FaCheckCircle /> Served / Clear
                                        </button>
                                    </>
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
    container: { minHeight: '100vh', background: '#000000', color: 'white', padding: '20px', fontFamily: "'Inter', sans-serif" },
    loading: { height: '100vh', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', background: 'black', color: 'white' },
    spinner: { width: '30px', height: '30px', border: '3px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '10px' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    title: { fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center' },
    subtitle: { color: '#888', fontSize: '14px', marginTop: '5px' },
    
    navBtn: { background: '#222', color: 'white', border: '1px solid #444', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    logoutBtn: { background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#555', fontSize: '18px' },
    
    card: { background: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', padding: '20px', position: 'relative', transition: '0.3s' },
    tableTitle: { fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '5px' },
    
    metaRow: { marginBottom: '5px' },
    waitText: { color: '#888', fontSize: '13px' },
    userRow: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
    userName: { color: '#ccc', fontWeight: '600', fontSize: '14px' },
    
    statusRow: { marginBottom: '15px' },
    statusBadge: { fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' },
    
    itemsList: { marginBottom: '15px', borderTop: '1px solid #222', paddingTop: '10px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#eee', marginBottom: '4px' },
    
    idText: { color: '#555', fontSize: '11px', fontFamily: 'monospace', marginBottom: '20px' },
    
    actionRow: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    btnPay: { flex: 1, background: '#1e3a8a', color: '#60a5fa', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    btnServe: { flex: 1, background: '#14532d', color: '#4ade80', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '140px' },
    completedBanner: { width: '100%', textAlign: 'center', color: '#22c55e', fontWeight: 'bold', fontSize: '12px', padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }
};

export default WaiterDashboard;