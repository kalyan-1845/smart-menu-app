import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { FaUserTie, FaBell, FaCheck, FaUtensils, FaSpinner, FaWifi, FaSync } from "react-icons/fa";

// 🔗 API CONFIGURATION
const SERVER_URL = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000" 
    : "https://smart-menu-backend-5ge7.onrender.com";

const API_BASE = `${SERVER_URL}/api`;

const WaiterDashboard = () => {
    const { id } = useParams(); // "kalyanresto1"
    const [readyOrders, setReadyOrders] = useState([]);
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); // "65a..."
    const [isConnected, setIsConnected] = useState(false);

    // 🔊 Sound
    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 1. LOGIN (FIND RESTAURANT ID) ---
    const fetchRestaurantId = async () => {
        try {
            // This calls the NEW route we added in Step 1
            const res = await axios.get(`${API_BASE}/auth/restaurant/${id}`); 
            if (res.data && res.data._id) {
                setMongoId(res.data._id);
                return res.data._id;
            }
        } catch (e) {
            console.error("Waiter: Restaurant not found", e);
        }
        return null;
    };

    // --- 2. FETCH DATA ---
    const refreshData = async (rId = mongoId) => {
        if (!rId) return;
        try {
            setLoading(true);
            // Get Orders that are marked "Ready" by Chef
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            const ready = orderRes.data.filter(o => o.status === "Ready");
            setReadyOrders(ready);
            
            // Get Service Calls
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);
            
            setLoading(false);
        } catch (e) { 
            console.error("Data Load Error", e);
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const rId = await fetchRestaurantId();
            if (rId) refreshData(rId);
        };
        init();
    }, [id]);

    // --- 3. REAL-TIME UPDATES ---
    useEffect(() => {
        if(mongoId) {
            const socket = io(SERVER_URL);
            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => setIsConnected(true));
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("order-updated", (updatedOrder) => {
                // If Chef marks "Ready", add to list
                if (updatedOrder.status === "Ready") {
                    dingRef.current.play().catch(()=>{});
                    refreshData(mongoId);
                }
                // If served, remove from list
                if (updatedOrder.status === "Served") {
                    setReadyOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
                }
            });

            socket.on("new-waiter-call", () => {
                dingRef.current.play().catch(()=>{});
                refreshData(mongoId);
            });

            return () => socket.disconnect();
        }
    }, [mongoId]);

    // --- 4. ACTIONS ---
    const handleServe = async (orderId) => {
        // Optimistic UI: Remove instantly
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));

        try {
            // Mark as Served -> This triggers Customer PDF Download
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); 
        } catch (e) {
            alert("Connection Failed");
            refreshData(mongoId); // Revert if failed
        }
    };

    const dismissCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } catch (e) {}
    };

    if (!mongoId && loading) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.brand}>
                    <FaUserTie size={24} color="#f97316"/>
                    <div>
                        <h1 style={styles.title}>WAITER PANEL</h1>
                        <span style={styles.sub}>{id.toUpperCase()}</span>
                    </div>
                </div>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={() => refreshData()} style={styles.iconBtn}><FaSync/></button>
                    <div style={styles.status}>
                        {isConnected ? <FaWifi color="#22c55e"/> : <FaWifi color="#666"/>}
                    </div>
                </div>
            </header>

            {/* WAITER CALLS */}
            <div style={styles.section}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse">
                        <div style={styles.alertContent}>
                            <span style={styles.tableBadge}>T-{call.tableNumber}</span>
                            <span style={styles.alertMsg}>{call.type.toUpperCase()} REQUEST</span>
                        </div>
                        <button onClick={() => dismissCall(call._id)} style={styles.checkBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            {/* READY ORDERS */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY TO SERVE ({readyOrders.length})</h3>
                
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}>
                        <p>No orders ready in kitchen.</p>
                    </div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <div style={styles.tableBig}>
                                        {order.tableNum === "Takeaway" ? "TAKEAWAY" : `TABLE ${order.tableNum}`}
                                    </div>
                                    <div style={styles.custName}>Guest: {order.customerName}</div>
                                </div>
                                <div style={styles.time}>
                                    {new Date(order.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            
                            <div style={styles.items}>
                                {order.items.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}</span> 
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>
                                <FaUtensils/> MARK SERVED
                            </button>
                        </div>
                    ))
                )}
            </div>
            
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pulse { animation: pulse-red 1.5s infinite; } @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom:'15px', borderBottom:'1px solid #222' },
    brand: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing:'1px' },
    sub: { fontSize: '12px', color: '#888', fontWeight: 'bold' },
    status: { background:'#1a1a1a', padding:'10px', borderRadius:'10px' },
    iconBtn: { background:'#222', border:'none', color:'white', borderRadius:'10px', padding:'10px', cursor:'pointer' },

    sectionTitle: { fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '15px', letterSpacing:'1px' },
    
    // Alerts
    alertCard: { background: '#ef4444', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'10px' },
    alertContent: { display:'flex', alignItems:'center', gap:'15px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'4px 8px', borderRadius:'6px', fontSize:'14px' },
    alertMsg: { fontWeight:'bold', fontSize:'14px' },
    checkBtn: { width: '35px', height: '35px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },

    // Order Card
    card: { background: '#111', borderRadius: '16px', padding: '15px', border: '1px solid #333', marginBottom:'15px', boxShadow:'0 4px 20px rgba(0,0,0,0.4)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', borderBottom:'1px dashed #333', paddingBottom:'12px' },
    tableBig: { fontSize: '20px', fontWeight: '900', color: '#22c55e', display:'block', marginBottom:'4px' },
    custName: { color: '#f97316', fontSize: '15px', fontWeight: 'bold' },
    time: { fontSize: '12px', color: '#666', fontWeight:'bold' },
    
    items: { marginBottom: '20px' },
    itemRow: { display:'flex', gap:'12px', marginBottom: '8px', fontSize: '16px' },
    qty: { color: '#22c55e', fontWeight: '900', minWidth:'20px' },
    name: { color: '#ddd', fontWeight:'500' },

    serveBtn: { width: '100%', padding: '15px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', boxShadow:'0 4px 15px rgba(34, 197, 94, 0.3)' },

    empty: { textAlign:'center', marginTop:'50px', color:'#333', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', fontWeight:'bold' }
};

export default WaiterDashboard;