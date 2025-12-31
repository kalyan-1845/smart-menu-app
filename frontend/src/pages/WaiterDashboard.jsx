import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import { FaUserTie, FaBell, FaCheck, FaUtensils, FaSpinner, FaWifi, FaSync, FaTimes, FaConciergeBell } from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const [readyOrders, setReadyOrders] = useState([]);
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); 
    const [isConnected, setIsConnected] = useState(false);
    const [notification, setNotification] = useState(null);

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    const fetchRestaurantId = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/restaurant/${id}`); 
            if (res.data?._id) {
                setMongoId(res.data._id);
                return res.data._id;
            }
        } catch (e) { console.error("Sync error", e); }
        return null;
    };

    const refreshData = async (rId = mongoId) => {
        if (!rId) return;
        try {
            const [orderRes, callRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}`),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`)
            ]);
            setReadyOrders(orderRes.data.filter(o => o.status === "Ready"));
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

    useEffect(() => {
        if(mongoId) {
            const socket = io(SERVER_URL);
            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => setIsConnected(true));
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("order-updated", (updatedOrder) => {
                if (updatedOrder.status === "Ready") {
                    dingRef.current.play().catch(()=>{});
                    if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);
                    setNotification(updatedOrder);
                    refreshData(mongoId);
                    setTimeout(() => setNotification(null), 10000);
                }
                if (updatedOrder.status === "Served") {
                    setReadyOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
                }
            });

            socket.on("new-waiter-call", (newCall) => {
                dingRef.current.play().catch(()=>{});
                if ("vibrate" in navigator) navigator.vibrate(400);
                setServiceCalls(prev => [newCall, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [mongoId]);

    const handleServe = async (orderId) => {
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try { await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); } 
        catch (e) { refreshData(mongoId); }
    };

    if (!mongoId && loading) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* 🚨 ORDER READY POPUP */}
            {notification && (
                <div style={styles.popupOverlay}>
                    <div style={styles.popupCard} className="slide-up">
                        <div style={styles.popupHeader}>
                            <FaConciergeBell color="#22c55e" size={24}/>
                            <h2 style={styles.popupTitle}>READY TO PICKUP</h2>
                            <button onClick={() => setNotification(null)} style={styles.closePopup}><FaTimes/></button>
                        </div>
                        <div style={styles.popupBody}>
                            <div style={styles.popupTable}>TABLE {notification.tableNum}</div>
                            <div style={styles.popupItems}>
                                {notification.items.map((item, i) => (
                                    <div key={i} style={styles.popupItemRow}>{item.quantity}x {item.name}</div>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { handleServe(notification._id); setNotification(null); }} style={styles.popupBtn}>DELIVERED</button>
                    </div>
                </div>
            )}

            <header style={styles.header}>
                <div style={styles.brand}><FaUserTie size={24} color="#f97316"/>
                    <div><h1 style={styles.title}>WAITER</h1><span style={styles.sub}>{id.toUpperCase()}</span></div>
                </div>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={() => refreshData()} style={styles.iconBtn}><FaSync/></button>
                    <div style={styles.status}>{isConnected ? <FaWifi color="#22c55e"/> : <FaWifi color="#666"/>}</div>
                </div>
            </header>

            <div style={styles.section}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse">
                        <div style={styles.alertContent}><span style={styles.tableBadge}>T-{call.tableNumber}</span><span style={styles.alertMsg}>ASSISTANCE</span></div>
                        <button onClick={() => setServiceCalls(prev => prev.filter(c => c._id !== call._id))} style={styles.checkBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY FOR TABLE ({readyOrders.length})</h3>
                {readyOrders.length === 0 ? <div style={styles.empty}><p>No pending pickups.</p></div> : 
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.tableBig}>TABLE {order.tableNum}</div>
                                <div style={styles.time}>{new Date(order.updatedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            </div>
                            <div style={styles.items}>
                                {order.items.map((item, i) => (
                                    <div key={i} style={styles.itemRow}><span style={styles.qty}>{item.quantity}x</span><span style={styles.name}>{item.name}</span></div>
                                ))}
                            </div>
                            <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>DELIVERED</button>
                        </div>
                    ))
                }
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pulse { animation: pulse-red 1.5s infinite; } @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } } .slide-up { animation: slideUp 0.3s ease-out; } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "Inter, sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom:'1px solid #222', paddingBottom:'10px' },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    sub: { fontSize: '10px', color: '#666', fontWeight: 'bold' },
    iconBtn: { background:'#222', border:'none', color:'white', borderRadius:'8px', padding:'8px' },
    status: { background:'#1a1a1a', padding:'8px', borderRadius:'8px' },
    sectionTitle: { fontSize: '11px', color: '#555', fontWeight: 'bold', marginBottom: '15px' },
    alertCard: { background: '#ef4444', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'10px' },
    alertContent: { display:'flex', alignItems:'center', gap:'10px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'4px 8px', borderRadius:'6px' },
    alertMsg: { fontWeight:'bold', fontSize:'12px' },
    checkBtn: { width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'white', color: '#ef4444' },
    card: { background: '#111', borderRadius: '16px', padding: '15px', border: '1px solid #222', marginBottom:'15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    tableBig: { fontSize: '24px', fontWeight: '900', color: '#22c55e' },
    time: { fontSize: '11px', color: '#444' },
    itemRow: { display:'flex', gap:'10px', marginBottom: '5px' },
    qty: { color: '#22c55e', fontWeight: 'bold' },
    serveBtn: { width: '100%', padding: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900' },
    popupOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    popupCard: { background: '#1a1a1a', borderRadius: '24px', width: '100%', maxWidth: '350px', padding: '20px', border: '2px solid #22c55e' },
    popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    popupTitle: { fontSize: '16px', fontWeight: '900', color: '#22c55e', margin: 0 },
    closePopup: { background: 'none', border: 'none', color: '#444' },
    popupTable: { fontSize: '40px', fontWeight: '900', textAlign: 'center', margin: '10px 0' },
    popupItems: { background: '#0a0a0a', padding: '15px', borderRadius: '12px', marginBottom: '20px' },
    popupItemRow: { fontSize: '13px', color: '#888', marginBottom: '4px' },
    popupBtn: { width: '100%', background: '#22c55e', border: 'none', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: '900' },
    empty: { textAlign:'center', marginTop:'40px', color:'#222' }
};

export default WaiterDashboard;