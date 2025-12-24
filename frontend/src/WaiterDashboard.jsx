import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
// 🎨 Icons
import { FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, FaUser, FaBell, FaReceipt, FaTint } from "react-icons/fa";

/**
 * WaiterDashboard Component
 * Manages active table orders and real-time customer service requests.
 */
const WaiterDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]); // For Water/Bill/Help requests
    const [restaurantName, setRestaurantName] = useState("Restaurant");
    const [loading, setLoading] = useState(true);
    const [visibleServedIds, setVisibleServedIds] = useState([]);

    // Auth & Identification
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    
    // Audio Notification Reference
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 1. DATA FETCHING ---
    const fetchData = async () => {
        if (!ownerId || !token) { 
            navigate("/login"); 
            return; 
        }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Fetch Restaurant Info
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || "Staff Area");

            // Fetch Active Orders
            const orderRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders?restaurantId=${ownerId}`, config);
            
            // Logic: Filter out served orders unless they are within the 3-minute "visible" grace period
            const activeOrders = orderRes.data.filter(o => 
                o.status !== "SERVED" || visibleServedIds.includes(o._id)
            );
            
            // Sort by Oldest First
            setOrders(activeOrders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));

            // Fetch Active Waiter Calls (Water/Bill/Help)
            const callRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/calls?restaurantId=${ownerId}`, config);
            setCalls(callRes.data);

            setLoading(false);
        } catch (error) { 
            console.error("Fetch error:", error); 
        }
    };

    // --- 2. LIVE SOCKET UPDATES ---
    useEffect(() => {
        fetchData();
        
        // Connect to Production Socket
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        
        // Listen for standard order updates (New orders, Cooking started, Ready)
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder.owner === ownerId) {
                notifSound.current.play().catch(()=>{});
                fetchData(); 
            }
        });

        // Listen for specific Waiter Assistance Calls (Water/Bill/Help)
        socket.on("new-waiter-call", (data) => {
            if (data.restaurantId === ownerId) {
                notifSound.current.play().catch(()=>{});
                fetchData();
            }
        });

        // Interval fallback to refresh wait timers
        const timer = setInterval(() => fetchData(), 30000); 
        
        return () => { 
            clearInterval(timer); 
            socket.disconnect(); 
        };
    }, [ownerId, visibleServedIds]); 

    // --- 3. STAFF ACTIONS ---
    
    // Mark a Bill/Water/Help request as completed
    const resolveCall = async (callId) => {
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/orders/calls/${callId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (e) { 
            alert("Error resolving call"); 
        }
    };

    // Mark an order as Served (remains on screen for 3 minutes)
    const markServed = async (id) => {
        try {
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}`, 
                { status: "SERVED" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Track visibility
            setVisibleServedIds(prev => [...prev, id]);
            fetchData();

            // Set timer to remove from local view after 3 minutes
            setTimeout(() => {
                setVisibleServedIds(prev => prev.filter(servedId => servedId !== id)); 
                fetchData();
            }, 180000); 
        } catch (e) { 
            alert("Error updating order status"); 
        }
    };

    // Toggle Payment status for table orders
    const markPaid = async (id) => {
        try {
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}`, 
                { status: "Paid" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchData();
        } catch (e) { 
            alert("Error updating payment status"); 
        }
    };

    const getWaitTime = (dateStr) => {
        const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
        return `${diff}m ago`;
    };

    if (loading) return (
        <div style={styles.loading}>
            <div style={styles.spinner}></div>
            <p>Connecting to Waiter Station...</p>
        </div>
    );

    return (
        <div style={styles.container}>
            
            {/* --- DASHBOARD HEADER --- */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>
                        <FaUserTie style={{ color: '#3b82f6', marginRight: '10px' }} /> 
                        Waiter Dashboard
                    </h1>
                    <p style={styles.subtitle}>{restaurantName} • <span style={{color:'#22c55e'}}>Staff Sync Active</span></p>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <Link to="/chef"><button style={styles.navBtn}>Kitchen View</button></Link>
                    <button onClick={() => { localStorage.clear(); navigate("/"); }} style={styles.logoutBtn}>Logout</button>
                </div>
            </div>

            {/* --- 🛎️ SERVICE REQUESTS SECTION --- */}
            <div style={styles.callsSection}>
                <h2 style={styles.sectionTitle}><FaBell style={{marginRight:'10px', color:'#f97316'}}/> Customer Requests</h2>
                {calls.length === 0 ? (
                    <p style={{color:'#444', fontSize:'13px', fontWeight:'bold'}}>No pending table requests.</p>
                ) : (
                    <div style={styles.callsGrid}>
                        {calls.map(call => (
                            <div key={call._id} style={styles.callCard}>
                                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                    <div style={styles.callIcon}>
                                        {/* Dynamic Icons for Bill, Water, or General Help */}
                                        {call.type === "bill" ? <FaReceipt style={{color:'#60a5fa'}}/> : 
                                         call.type === "water" ? <FaTint style={{color:'#3b82f6'}}/> : <FaBell/>}
                                    </div>
                                    <div>
                                        <h3 style={{margin:0, fontSize:'18px', fontWeight:'900'}}>Table {call.tableNumber}</h3>
                                        <p style={styles.callType}>
                                            {call.type === "bill" ? "BILL REQUEST" : 
                                             call.type === "water" ? "WATER REQUEST" : "ASSISTANCE NEEDED"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => resolveCall(call._id)} style={styles.resolveBtn}>DONE</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- 📦 ACTIVE ORDERS GRID --- */}
            <h2 style={styles.sectionTitle}><FaClock style={{marginRight:'10px', color:'#3b82f6'}}/> Table Service Monitor</h2>
            <div style={styles.grid}>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>Waiting for new orders...</div>
                ) : (
                    orders.map(order => (
                        <div key={order._id} style={{
                            ...styles.card,
                            opacity: order.status === "SERVED" ? 0.6 : 1,
                            borderColor: order.status === "SERVED" ? '#22c55e' : (order.status === 'READY' ? '#f97316' : '#333')
                        }}>
                            <div style={styles.cardHeader}>
                                <h2 style={styles.tableTitle}>
                                    {order.tableNumber === "Takeaway" ? "Takeaway" : `Table ${order.tableNumber}`}
                                </h2>
                                <span style={styles.waitText}>{getWaitTime(order.createdAt)}</span>
                            </div>

                            <div style={styles.userRow}>
                                <FaUser style={{fontSize:'12px', marginRight:'6px', color:'#8b949e'}} />
                                <span style={styles.userName}>{order.customerName || "Anonymous Guest"}</span>
                            </div>

                            <div style={styles.statusRow}>
                                <span style={{ 
                                    ...styles.statusBadge, 
                                    color: order.status === 'SERVED' ? '#22c55e' : (order.status === 'READY' ? '#f97316' : (order.status === 'Paid' ? '#3b82f6' : '#888')) 
                                }}>
                                    ● {order.status === "PENDING_PAYMENT" ? "AWAITING PAYMENT" : order.status.toUpperCase()}
                                </span>
                            </div>

                            <div style={styles.itemsList}>
                                {order.items.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={{fontWeight:'700'}}>{item.name} <span style={{color:'#555'}}>x{item.quantity}</span></span>
                                        {item.selectedSpecs?.length > 0 && (
                                            <span style={styles.specText}>Note: {item.selectedSpecs.join(", ")}</span>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div style={styles.actionRow}>
                                {order.status === "SERVED" ? (
                                    <div style={styles.completedBanner}>✓ ORDER SERVED</div>
                                ) : (
                                    <>
                                        {order.status !== "Paid" && (
                                            <button onClick={() => markPaid(order._id)} style={styles.btnPay}><FaMoneyBillWave /> Pay</button>
                                        )}
                                        <button onClick={() => markServed(order._id)} style={styles.btnServe}><FaCheckCircle /> Serve</button>
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

// --- MODERN STYLES ---
const styles = {
    container: { minHeight: '100vh', background: '#000000', color: 'white', padding: '25px', fontFamily: "'Inter', sans-serif" },
    loading: { height: '100vh', display: 'flex', flexDirection:'column', justifyContent: 'center', alignItems: 'center', background: 'black', color: 'white' },
    spinner: { width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '15px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px' },
    title: { fontSize: '26px', fontWeight: '900', margin: 0, display: 'flex', alignItems: 'center' },
    subtitle: { color: '#666', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '1px' },
    navBtn: { background: '#111', color: 'white', border: '1px solid #333', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' },
    logoutBtn: { background: '#450a0a', color: '#f87171', border: '1px solid #7f1d1d', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900', fontSize: '12px' },
    sectionTitle: { fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px', color: '#444', marginBottom: '25px', display: 'flex', alignItems: 'center' },
    
    // Service Requests
    callsSection: { marginBottom: '50px', padding: '25px', background: '#050505', borderRadius: '24px', border: '1px solid #111' },
    callsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    callCard: { background: '#111', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #222' },
    callIcon: { width: '50px', height: '50px', background: '#000', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid #1a1a1a' },
    callType: { fontSize: '10px', fontWeight: '900', color: '#f97316', marginTop: '3px', letterSpacing: '0.5px' },
    resolveBtn: { background: '#22c55e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 10px rgba(34, 197, 94, 0.2)' },

    // Orders Grid
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
    emptyState: { textAlign: 'center', padding: '60px', color: '#333', fontWeight: '900', fontSize: '20px', gridColumn: '1/-1' },
    card: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', padding: '25px', transition: '0.3s ease' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    tableTitle: { fontSize: '24px', fontWeight: '900', margin: 0, tracking: '-0.5px' },
    waitText: { fontSize: '12px', color: '#444', fontWeight: '900' },
    userRow: { display: 'flex', alignItems: 'center', marginBottom: '20px' },
    userName: { color: '#666', fontSize: '13px', fontWeight: 'bold' },
    statusRow: { marginBottom: '20px' },
    statusBadge: { fontSize: '10px', fontWeight: '900', tracking: '2px' },
    itemsList: { borderTop: '1px solid #111', paddingTop: '20px', marginBottom: '25px' },
    itemRow: { display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '12px' },
    specText: { color: '#ef4444', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
    actionRow: { display: 'flex', gap: '12px' },
    btnPay: { flex: 1, background: '#1e3a8a', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' },
    btnServe: { flex: 2, background: '#14532d', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' },
    completedBanner: { width: '100%', textAlign: 'center', color: '#22c55e', fontWeight: '900', fontSize: '11px', padding: '12px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: '12px', border: '1px dashed #22c55e' }
};

export default WaiterDashboard;