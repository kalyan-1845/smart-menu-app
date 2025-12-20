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
            
            // Get Restaurant Name
            const nameRes = await axios.get(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || "Staff Area");

            // Get Orders
            const res = await axios.get(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders?restaurantId=${ownerId}`, config);
            
            // 🧠 LOGIC: Show active orders OR orders that were served < 3 mins ago
            const activeOrders = res.data.filter(o => 
                o.status !== "SERVED" || visibleServedIds.includes(o._id)
            ); 
            
            // Sort: Oldest orders first
            activeOrders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));

            setOrders(activeOrders);
            setLoading(false);
        } catch (error) { console.error(error); }
    };

    // --- 2. Live Updates ---
    useEffect(() => {
        fetchOrders();
        const socket = io("http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0");
        
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder.owner === ownerId) {
                notifSound.current.play().catch(()=>{});
                fetchOrders(); 
            }
        });

        // Refresh wait times every minute
        const timer = setInterval(() => { setOrders(prev => [...prev]); }, 60000);
        return () => { clearInterval(timer); socket.disconnect(); };
    }, [ownerId, visibleServedIds]); // Dependency on visibleServedIds ensures UI updates when list changes

    // --- 3. Actions ---
    
    // 🟢 MARK SERVED (With 3-Minute Delay)
    const markServed = async (id) => {
        try {
            // 1. Send data to Owner/Database immediately
            await axios.put(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders/${id}`, { status: "SERVED" }, { headers: { Authorization: `Bearer ${token}` } });
            
            // 2. Keep it visible locally
            setVisibleServedIds(prev => [...prev, id]);

            // 3. Force a refresh so the status turns to "SERVED" in the UI immediately
            fetchOrders();

            // 4. Start 3-minute timer to hide it later
            setTimeout(() => {
                setVisibleServedIds(prev => prev.filter(servedId => servedId !== id)); // Remove from visible list
                setOrders(prev => prev.filter(o => o._id !== id)); // Remove from screen
            }, 180000); // 180,000 ms = 3 Minutes

        } catch (e) { 
            alert("Error updating order"); 
        }
    };

    // 🔵 MARK PAID
    const markPaid = async (id) => {
        try {
            await axios.put(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/orders/${id}`, { status: "Paid" }, { headers: { Authorization: `Bearer ${token}` } });
            fetchOrders();
        } catch (e) { alert("Error updating"); }
    };

    // Helper for "Wait: 15m ago"
    const getWaitTime = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        return `${diff}m ago`;
    };

    if (loading) return <div style={styles.loading}>Loading Waiter Panel...</div>;

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
                {orders.map(order => (
                    <div key={order._id} style={{
                        ...styles.card,
                        // If served, dim the opacity slightly so they know it's done
                        opacity: order.status === "SERVED" ? 0.6 : 1,
                        borderColor: order.status === "SERVED" ? '#22c55e' : '#333'
                    }}>
                        
                        {/* 1. Large Table Title */}
                        <h2 style={styles.tableTitle}>
                            {order.tableNumber === "Takeaway" ? "T-Takeaway" : `Table ${order.tableNumber || order.tableNum}`}
                        </h2>

                        {/* 2. Wait Time & User */}
                        <div style={styles.metaRow}>
                            <span style={styles.waitText}>Wait: {getWaitTime(order.createdAt)}</span>
                        </div>
                        <div style={styles.userRow}>
                            <FaUser style={{fontSize:'12px', marginRight:'6px', color:'#8b949e'}} />
                            <span style={styles.userName}>{order.customerName}</span>
                        </div>

                        {/* 3. Status Badge */}
                        <div style={styles.statusRow}>
                            <span style={{ 
                                ...styles.statusBadge, 
                                color: order.status === 'SERVED' ? '#22c55e' : (order.status === 'READY' ? '#22c55e' : (order.status === 'Paid' ? '#3b82f6' : '#f97316')) 
                            }}>
                                {order.status === 'Pending Payment' ? 'PENDING_PAYMENT' : order.status.toUpperCase()}
                            </span>
                        </div>

                        {/* 4. Items List */}
                        <div style={styles.itemsList}>
                            {order.items.map((item, i) => (
                                <div key={i} style={styles.itemRow}>
                                    <span>{item.name}</span>
                                    <span style={{color:'#8b949e'}}>×{item.quantity}</span>
                                </div>
                            ))}
                        </div>

                        {/* 5. ID Footer */}
                        <p style={styles.idText}>ID: ...{order._id.slice(-8)}</p>

                        {/* 6. Action Buttons */}
                        <div style={styles.actionRow}>
                            
                            {/* If already Served, show "Done" message */}
                            {order.status === "SERVED" ? (
                                <div style={{width:'100%', textAlign:'center', color:'#22c55e', fontWeight:'bold', fontSize:'12px', padding:'10px', background:'#22c55e20', borderRadius:'8px'}}>
                                    ✅ COMPLETED (Clears in 3m)
                                </div>
                            ) : (
                                <>
                                    {/* Mark Paid Button (Visible if not paid yet) */}
                                    {order.status !== "Paid" && (
                                        <button onClick={() => markPaid(order._id)} style={styles.btnPay}>
                                            <FaMoneyBillWave /> Mark Paid
                                        </button>
                                    )}
                                    
                                    {/* Serve/Clear Button */}
                                    <button onClick={() => markServed(order._id)} style={styles.btnServe}>
                                        <FaCheckCircle /> Served / Clear
                                    </button>
                                </>
                            )}
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

// --- STYLES (Dark Mode) ---
const styles = {
    container: { minHeight: '100vh', background: '#000000', color: 'white', padding: '20px', fontFamily: "'Inter', sans-serif" },
    loading: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'black', color: 'white' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' },
    title: { fontSize: '28px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center' },
    subtitle: { color: '#888', fontSize: '14px', marginTop: '5px' },
    
    navBtn: { background: '#222', color: 'white', border: '1px solid #444', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    logoutBtn: { background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    
    // Card Styles
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
    
    actionRow: { display: 'flex', gap: '10px' },
    btnPay: { flex: 1, background: '#1e3a8a', color: '#60a5fa', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    btnServe: { flex: 1, background: '#14532d', color: '#4ade80', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
};

export default WaiterDashboard;