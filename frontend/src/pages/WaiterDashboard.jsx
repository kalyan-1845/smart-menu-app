import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { FaUserTie, FaBell, FaCheck, FaUtensils, FaSpinner, FaWifi, FaSync } from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const [readyOrders, setReadyOrders] = useState([]);
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); 
    const [isConnected, setIsConnected] = useState(false);

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- 1. RESTAURANT IDENTIFICATION ---
    const fetchRestaurantId = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/restaurant/${id}`); 
            if (res.data && res.data._id) {
                setMongoId(res.data._id);
                return res.data._id;
            }
        } catch (e) { console.error("Waiter Error:", e); }
        return null;
    };

    // --- 2. DATA SYNCHRONIZATION ---
    const refreshData = async (rId = mongoId) => {
        if (!rId) return;
        try {
            const orderRes = await axios.get(`${API_BASE}/orders?restaurantId=${rId}`);
            // Show only orders Chef marked as "Ready"
            const ready = orderRes.data.filter(o => o.status === "Ready");
            setReadyOrders(ready);
            
            const callRes = await axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`);
            setServiceCalls(callRes.data);
            setLoading(false);
        } catch (e) { setLoading(false); }
    };

    useEffect(() => {
        const init = async () => {
            const rId = await fetchRestaurantId();
            if (rId) refreshData(rId);
        };
        init();
    }, [id]);

    // --- 3. REAL-TIME SAAS ISOLATION ---
    useEffect(() => {
        if(mongoId) {
            const socket = io(SERVER_URL);
            
            // 🔒 JOIN PRIVATE SHOP ROOM
            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => setIsConnected(true));
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("order-updated", (updatedOrder) => {
                if (updatedOrder.status === "Ready") {
                    dingRef.current.play().catch(()=>{});
                    refreshData(mongoId);
                }
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
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try {
            // Updating to "Served" triggers the PDF generator in the Customer's OrderTracker
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); 
        } catch (e) {
            alert("Sync Error");
            refreshData(mongoId); 
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

            {/* LIVE SERVICE ALERTS */}
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

            {/* READY FOR DELIVERY */}
            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY FOR TABLE ({readyOrders.length})</h3>
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}><p>No pending pickups.</p></div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <div style={styles.tableBig}>
                                        {order.tableNum === "Takeaway" ? "TAKEAWAY" : `TABLE ${order.tableNum}`}
                                    </div>
                                    <div style={styles.custName}>{order.customerName}</div>
                                </div>
                                <div style={styles.time}>
                                    {new Date(order.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                            <div style={styles.items}>
                                {order.items.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}x</span> 
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>
                                <FaCheck/> DELIVERED TO TABLE
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
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "Inter, sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom:'15px', borderBottom:'1px solid #222' },
    brand: { display: 'flex', alignItems: 'center', gap: '12px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing:'1px' },
    sub: { fontSize: '12px', color: '#888', fontWeight: 'bold' },
    status: { background:'#1a1a1a', padding:'10px', borderRadius:'10px' },
    iconBtn: { background:'#222', border:'none', color:'white', borderRadius:'10px', padding:'10px', cursor:'pointer' },
    sectionTitle: { fontSize: '12px', color: '#888', fontWeight: 'bold', marginBottom: '15px', letterSpacing:'1px' },
    alertCard: { background: '#ef4444', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'10px' },
    alertContent: { display:'flex', alignItems:'center', gap:'15px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'4px 8px', borderRadius:'6px', fontSize:'14px' },
    alertMsg: { fontWeight:'bold', fontSize:'14px' },
    checkBtn: { width: '35px', height: '35px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    card: { background: '#111', borderRadius: '16px', padding: '15px', border: '1px solid #333', marginBottom:'15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px', borderBottom:'1px dashed #333', paddingBottom:'12px' },
    tableBig: { fontSize: '20px', fontWeight: '900', color: '#22c55e', display:'block', marginBottom:'4px' },
    custName: { color: '#f97316', fontSize: '15px', fontWeight: 'bold' },
    time: { fontSize: '12px', color: '#666', fontWeight:'bold' },
    items: { marginBottom: '20px' },
    itemRow: { display:'flex', gap:'12px', marginBottom: '8px', fontSize: '16px' },
    qty: { color: '#22c55e', fontWeight: '900', minWidth:'20px' },
    name: { color: '#ddd', fontWeight:'500' },
    serveBtn: { width: '100%', padding: '15px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
    empty: { textAlign:'center', marginTop:'50px', color:'#333' }
};

export default WaiterDashboard;