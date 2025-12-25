import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom"; // Dynamic URL support
import io from "socket.io-client";
import { 
    FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, 
    FaUser, FaBell, FaReceipt, FaTint, FaSignOutAlt, FaUnlock 
} from "react-icons/fa";

const WaiterDashboard = () => {
    const { id } = useParams(); // Get Restaurant ID from URL (e.g., /pizzahut/waiter)
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]); // Water/Bill/Help requests
    const [restaurantName, setRestaurantName] = useState(id);

    // Audio for alerts
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 1. LOGIN LOGIC ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Authenticate using the Restaurant ID from URL
            const res = await axios.post(`${API_BASE}/auth/login`, { email: id, password });
            
            // Store credentials temporarily
            localStorage.setItem(`waiter_token_${id}`, res.data.token);
            localStorage.setItem(`waiter_owner_id_${id}`, res.data.id); // MongoDB ID for Sockets
            
            setIsAuthenticated(true);
            setRestaurantName(res.data.restaurantName || id);
            
            // Initial Fetch
            fetchData(res.data.token, res.data.id);
        } catch (err) {
            alert("❌ Invalid Staff Password");
        } finally {
            setLoading(false);
        }
    };

    // --- 2. DATA FETCHING ---
    const fetchData = async (token, mongoId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Fetch Active Orders (Exclude Served)
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${mongoId}`, config);
            const activeOrders = orderRes.data.filter(o => o.status !== "SERVED");
            setOrders(activeOrders.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));

            // Fetch Waiter Calls
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${mongoId}`, config);
            setCalls(callRes.data);

        } catch (error) { console.error("Sync Error", error); }
    };

    // --- 3. SOCKET CONNECTION ---
    useEffect(() => {
        if (isAuthenticated) {
            const mongoId = localStorage.getItem(`waiter_owner_id_${id}`);
            const token = localStorage.getItem(`waiter_token_${id}`);
            
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-owner-room", mongoId); // Listen to THIS restaurant only

            // 🛎️ NEW WAITER CALL (Bill/Water)
            socket.on("new-waiter-call", (data) => {
                notifSound.current.play().catch(()=>{});
                fetchData(token, mongoId);
            });

            // 📦 ORDER UPDATES (Kitchen status)
            socket.on("order-updated", () => {
                fetchData(token, mongoId);
            });

            // 📦 NEW ORDER
            socket.on("new-order", () => {
                notifSound.current.play().catch(()=>{});
                fetchData(token, mongoId);
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, id]);

    // --- 4. ACTIONS ---
    
    // Resolve Call (Remove from list)
    const resolveCall = async (callId) => {
        const token = localStorage.getItem(`waiter_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCalls(prev => prev.filter(c => c._id !== callId));
        } catch (e) { alert("Error resolving request"); }
    };

    // Mark Served (Hide from Waiter View)
    const markServed = async (orderId) => {
        const token = localStorage.getItem(`waiter_token_${id}`);
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "SERVED" }, { headers: { Authorization: `Bearer ${token}` } });
            setOrders(prev => prev.filter(o => o._id !== orderId)); // Remove from list instantly
        } catch (e) { alert("Error updating status"); }
    };

    // Mark Paid (Cash collected)
    const markPaid = async (orderId) => {
        const token = localStorage.getItem(`waiter_token_${id}`);
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { paymentStatus: "Paid", status: "SERVED" }, { headers: { Authorization: `Bearer ${token}` } });
            setOrders(prev => prev.filter(o => o._id !== orderId)); // Remove from list
        } catch (e) { alert("Error updating payment"); }
    };

    // --- 5. RENDER: LOCK SCREEN ---
    if (!isAuthenticated) {
        return (
            <div style={styles.lockContainer}>
                <div style={styles.lockCard}>
                    <FaUserTie style={{ fontSize: '40px', color: '#3b82f6', marginBottom: '15px' }} />
                    <h1 style={styles.lockTitle}>{id} Staff</h1>
                    <p style={{ color: '#666', fontSize: '12px', marginBottom: '20px', fontWeight: 'bold' }}>WAITER ACCESS POINT</p>
                    <form onSubmit={handleLogin}>
                        <input 
                            type="password" 
                            placeholder="Enter Staff Password" 
                            style={styles.input}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        <button type="submit" style={styles.loginBtn} disabled={loading}>
                            {loading ? "Connecting..." : <><FaUnlock /> Access Dashboard</>}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- 6. RENDER: DASHBOARD ---
    return (
        <div style={styles.container}>
            
            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>Waiter Station</h1>
                    <p style={styles.subtitle}>{restaurantName}</p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} style={styles.logoutBtn}><FaSignOutAlt /> Logout</button>
            </div>

            {/* 🚨 PRIORITY SECTION: CUSTOMER REQUESTS */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaBell style={{color:'#f97316'}}/> Table Requests ({calls.length})</h2>
                {calls.length === 0 ? (
                    <div style={styles.emptyState}>No pending requests</div>
                ) : (
                    <div style={styles.grid}>
                        {calls.map(call => (
                            <div key={call._id} style={styles.callCard}>
                                <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                    <div style={styles.iconBox}>
                                        {call.type === "bill" ? <FaReceipt style={{color:'#ef4444'}}/> : 
                                         call.type === "water" ? <FaTint style={{color:'#3b82f6'}}/> : <FaBell style={{color:'#f97316'}}/>}
                                    </div>
                                    <div>
                                        <h3 style={{margin:0, fontSize:'18px', fontWeight:'900'}}>Table {call.tableNumber}</h3>
                                        <p style={styles.requestType}>
                                            {call.type === "bill" ? "REQUESTING BILL" : 
                                             call.type === "water" ? "NEEDS WATER" : "NEEDS HELP"}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => resolveCall(call._id)} style={styles.resolveBtn}>RESOLVE</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 📦 ORDER MONITOR */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}><FaClock style={{color:'#3b82f6'}}/> Active Orders ({orders.length})</h2>
                {orders.length === 0 ? (
                    <div style={styles.emptyState}>No active orders</div>
                ) : (
                    <div style={styles.grid}>
                        {orders.map(order => (
                            <div key={order._id} style={{
                                ...styles.orderCard,
                                borderColor: order.status === 'READY' ? '#22c55e' : '#333'
                            }}>
                                <div style={styles.cardHeader}>
                                    <h2 style={{margin:0, fontSize:'20px', fontWeight:'900'}}>Table {order.tableNumber}</h2>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: order.status === 'READY' ? '#22c55e' : '#f97316'
                                    }}>
                                        ● {order.status === "PLACED" ? "KITCHEN RECEIVED" : order.status}
                                    </span>
                                </div>

                                <div style={styles.itemList}>
                                    {order.items.map((item, i) => (
                                        <div key={i} style={{fontSize:'13px', fontWeight:'700', marginBottom:'5px', display:'flex', justifyContent:'space-between'}}>
                                            <span>{item.name}</span>
                                            <span style={{color:'#f97316'}}>x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={styles.footerRow}>
                                    <div style={{fontSize:'16px', fontWeight:'900', color: '#fff'}}>₹{order.totalAmount}</div>
                                    
                                    <div style={{display:'flex', gap:'8px'}}>
                                        {/* Show PAY button only if not paid */}
                                        {order.paymentMethod === 'CASH' && order.paymentStatus !== 'Paid' && (
                                            <button onClick={() => markPaid(order._id)} style={styles.btnPay}>
                                                <FaMoneyBillWave /> Collected
                                            </button>
                                        )}
                                        
                                        {/* Show SERVE button if food is ready or served */}
                                        <button onClick={() => markServed(order._id)} style={styles.btnServe}>
                                            <FaCheckCircle /> Done
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

// --- STYLES (Inline for Copy-Paste) ---
const styles = {
    // Containers
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '20px', fontFamily: 'sans-serif' },
    lockContainer: { minHeight: '100vh', background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    lockCard: { width: '100%', maxWidth: '350px', background: '#111', padding: '40px', borderRadius: '30px', border: '1px solid #222', textAlign: 'center' },
    
    // Components
    title: { fontSize: '24px', fontWeight: '900', margin: 0, textTransform: 'uppercase' },
    subtitle: { color: '#666', fontSize: '12px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase' },
    logoutBtn: { background: '#1a1a1a', border: '1px solid #333', color: '#ef4444', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '20px' },
    
    // Forms
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '12px', color: 'white', fontSize: '16px', fontWeight: 'bold', outline: 'none', marginBottom: '15px', textAlign: 'center' },
    loginBtn: { width: '100%', background: '#3b82f6', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' },

    // Sections
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', color: '#888', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    emptyState: { padding: '30px', background: '#111', borderRadius: '20px', border: '1px dashed #333', textAlign: 'center', color: '#444', fontWeight: 'bold' },

    // Alert Cards
    callCard: { background: '#111', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #333', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' },
    iconBox: { width: '45px', height: '45px', background: '#000', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', border: '1px solid #222' },
    requestType: { fontSize: '10px', fontWeight: '900', color: '#fff', marginTop: '4px', background: '#222', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' },
    resolveBtn: { background: '#22c55e', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '12px', fontSize: '10px', fontWeight: '900', cursor: 'pointer' },

    // Order Cards
    orderCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '20px', padding: '20px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #222' },
    statusBadge: { fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' },
    itemList: { marginBottom: '20px' },
    footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    btnPay: { background: '#1e3a8a', color: '#60a5fa', border: '1px solid #1e3a8a', padding: '10px 15px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    btnServe: { background: '#22c55e', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '11px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default WaiterDashboard;