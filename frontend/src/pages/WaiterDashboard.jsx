import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { 
    FaUserTie, FaBell, FaCheck, FaUtensils, FaSpinner, 
    FaSync, FaTimes, FaConciergeBell, FaTruckLoading, 
    FaHistory, FaClock, FaTrash 
} from "react-icons/fa";
import { toast } from "react-hot-toast";

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
    const [systemAlerts, setSystemAlerts] = useState([]);

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // --- REFRESH ON SITE LOAD / MOBILE UNLOCK ---
    useEffect(() => {
        const handleEntryRefresh = () => {
            if (document.visibilityState === 'visible' && mongoId) {
                refreshData(mongoId);
            }
        };
        window.addEventListener('load', handleEntryRefresh);
        document.addEventListener("visibilitychange", handleEntryRefresh);
        return () => {
            window.removeEventListener('load', handleEntryRefresh);
            document.removeEventListener("visibilitychange", handleEntryRefresh);
        };
    }, [mongoId]);

    const fetchRestaurantId = async () => {
        try {
            const res = await axios.get(`${API_BASE}/auth/restaurant/${id}`); 
            if (res.data && res.data._id) {
                setMongoId(res.data._id);
                return res.data._id;
            }
        } catch (e) { console.error("ID Fetch Error", e); }
        return null;
    };

    const refreshData = async (rId) => {
        if (!rId) return;
        try {
            const [orderRes, callRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}`),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`)
            ]);
            
            // Only show orders that are exactly "Ready" (Chef finished cooking)
            const pickupReady = orderRes.data.filter(o => 
                o.status && o.status.toLowerCase() === "ready"
            );
            setReadyOrders(pickupReady);
            setServiceCalls(callRes.data || []);
            setLoading(false);
        } catch (e) { 
            setLoading(false); 
        }
    };

    // --- REAL-TIME ACTIONS ---
    const handleServe = async (orderId) => {
        // 1. Instant UI update (Faster experience)
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        if ("vibrate" in navigator) navigator.vibrate(50);
        
        try { 
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); 
            toast.success("Served!");
        } catch (e) { 
            // 2. Rollback if server fails
            refreshData(mongoId); 
            toast.error("Failed to update status");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Remove this order?")) return;
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try {
            await axios.delete(`${API_BASE}/orders/${orderId}`);
            toast.success("Order Deleted");
        } catch (e) { toast.error("Delete failed"); refreshData(mongoId); }
    };

    const resolveCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } 
        catch (e) { console.error("Sync error"); }
    };

    // --- INITIALIZATION ---
    useEffect(() => {
        const init = async () => {
            const fetchedId = await fetchRestaurantId();
            if (fetchedId) refreshData(fetchedId);
        };
        init();
    }, [id]);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if(mongoId) {
            const socket = io(SERVER_URL, { transports: ['websocket'], reconnection: true });
            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => setIsConnected(true));
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("new-order", (order) => {
                if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
                setSystemAlerts(prev => [{ id: Date.now(), table: order.tableNum, type: 'ORDER', msg: 'NEW ORDER' }, ...prev]);
                // Orders are handled by chef first, so we just log the alert
            });

            socket.on("chef-ready-alert", (data) => {
                if ("vibrate" in navigator) navigator.vibrate([400, 100, 400]);
                dingRef.current.play().catch(()=>{});
                
                // Show floating popup
                setSystemAlerts(prev => [{ id: Date.now(), table: data.tableNum, type: 'READY', msg: 'FOOD READY' }, ...prev]);

                // Fetch full order details for the big popup
                axios.get(`${API_BASE}/orders/${data.orderId}`).then(res => {
                    setNotification(res.data);
                    setReadyOrders(prev => {
                        const exists = prev.find(o => o._id === res.data._id);
                        return exists ? prev : [res.data, ...prev];
                    });
                }).catch(() => refreshData(mongoId));

                setTimeout(() => setNotification(null), 15000);
            });

            socket.on("new-waiter-call", (newCall) => {
                if ("vibrate" in navigator) navigator.vibrate(500);
                dingRef.current.play().catch(()=>{});
                setServiceCalls(prev => [newCall, ...prev]);
            });

            return () => socket.disconnect();
        }
    }, [mongoId]);

    if (!mongoId && loading) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* Top Alerts */}
            <div style={styles.callNotificationWrapper}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse-top">
                        <div style={styles.alertContent}>
                            <span style={styles.tableBadge}>T-{call.tableNumber}</span>
                            <span style={styles.alertMsg}>CALLING WAITER 🛎️</span>
                        </div>
                        <button onClick={() => resolveCall(call._id)} style={styles.checkBtn}><FaCheck/></button>
                    </div>
                ))}
                {systemAlerts.map(alert => (
                    <div key={alert.id} style={{...styles.alertCard, background: alert.type === 'ORDER' ? '#3b82f6' : '#22c55e'}}>
                        <div style={styles.alertContent}>
                            <span style={{...styles.tableBadge, color: alert.type === 'ORDER' ? '#3b82f6' : '#22c55e'}}>T-{alert.table}</span>
                            <span style={styles.alertMsg}>{alert.msg}</span>
                        </div>
                        <button onClick={() => setSystemAlerts(prev => prev.filter(a => a.id !== alert.id))} style={styles.checkBtn}><FaTimes color={alert.type === 'ORDER' ? '#3b82f6' : '#22c55e'}/></button>
                    </div>
                ))}
            </div>

            {/* Chef Ready Big Popup */}
            {notification && (
                <div style={styles.popupOverlay}>
                    <div style={styles.popupCard} className="slide-up">
                        <div style={styles.popupHeader}><FaConciergeBell color="#22c55e" size={24}/><h2 style={styles.popupTitle}>PICKUP FROM KITCHEN</h2></div>
                        <div style={styles.popupBody}>
                            <div style={styles.popupTable}>TABLE {notification.tableNum}</div>
                            <div style={styles.popupItems}>
                                {notification.items?.map((item, i) => (<div key={i} style={styles.popupItemRow}>{item.quantity}x {item.name}</div>))}
                            </div>
                        </div>
                        <button onClick={() => { handleServe(notification._id); setNotification(null); }} style={styles.popupBtn}>I HAVE PICKED IT UP</button>
                    </div>
                </div>
            )}

            <header style={styles.header}>
                <div style={styles.brand}><FaUserTie size={24} color="#f97316"/><div><h1 style={styles.title}>WAITER DASH</h1><span style={styles.sub}>{id?.toUpperCase()}</span></div></div>
                <button onClick={() => { 
                    dingRef.current.play().catch(()=>{}); // Unlock sound
                    refreshData(mongoId); 
                }} style={styles.iconBtn}><FaSync className={loading ? "spin" : ""}/></button>
            </header>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY ORDERS ({readyOrders.length})</h3>
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}><FaTruckLoading size={30} style={{marginBottom: 10}}/><p>No pending pickups</p></div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.tableBig}>TABLE {order.tableNum}</div>
                                <div style={styles.readyBadge}>FOOD READY</div>
                            </div>
                            
                            <div style={styles.items}>
                                {order.customerName && <p style={styles.custName}><span style={{color: '#f97316'}}>•</span> {order.customerName}</p>}
                                {order.items?.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}x</span>
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.historyBox}>
                                <div style={styles.historyItem}><FaClock size={10}/> Order: {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <div style={styles.historyItem}><FaCheck size={10} color="#22c55e"/> Chef marked Ready</div>
                            </div>

                            <div style={styles.actionGroup}>
                                <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>MARK AS SERVED</button>
                                <button onClick={() => handleDeleteOrder(order._id)} style={styles.deleteBtn}><FaTrash /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-top { animation: pulse-red 1s infinite alternate; } @keyframes pulse-red { from { background: #ef4444; } to { background: #991b1b; } } 
                .slide-up { animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                * { -webkit-tap-highlight-color: transparent; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "Inter, sans-serif" },
    callNotificationWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: '95%', maxWidth: '400px', display:'flex', flexDirection:'column', gap:'5px' },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom:'1px solid #222', paddingBottom:'10px' },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    sub: { fontSize: '10px', color: '#666', fontWeight: 'bold' },
    iconBtn: { background:'#222', border:'none', color:'white', borderRadius:'8px', padding:'12px', cursor:'pointer' },
    sectionTitle: { fontSize: '11px', color: '#f97316', fontWeight: 'bold', marginBottom: '15px', textTransform:'uppercase' },
    alertCard: { background: '#ef4444', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px rgba(0,0,0,0.5)' },
    alertContent: { display:'flex', alignItems:'center', gap:'10px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'4px 8px', borderRadius:'6px' },
    alertMsg: { fontWeight:'bold', fontSize:'12px' },
    checkBtn: { width: '35px', height: '35px', borderRadius: '50%', border: 'none', background: 'white', color: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' },
    card: { background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', marginBottom:'15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    tableBig: { fontSize: '32px', fontWeight: '900', color: 'white' },
    readyBadge: { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '10px', fontWeight: '900', padding: '6px 12px', borderRadius: '8px', border:'1px solid #22c55e' },
    custName: { margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold', color: '#fff' },
    itemRow: { display:'flex', gap:'10px', marginBottom: '6px' },
    qty: { color: '#f97316', fontWeight: '900', minWidth: '25px' },
    name: { fontSize: '15px', color: '#ccc' },
    historyBox: { background: '#0a0a0a', padding: '10px', borderRadius: '10px', marginTop: '15px', border: '1px solid #222' },
    historyItem: { fontSize: '10px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' },
    actionGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
    serveBtn: { flex: 1, height: '55px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' },
    deleteBtn: { width: '55px', height: '55px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '12px', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    popupOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' },
    popupCard: { background: '#1a1a1a', borderRadius: '32px', width: '100%', maxWidth: '350px', padding: '25px', border: '1px solid #22c55e', boxShadow:'0 0 40px rgba(34, 197, 94, 0.2)' },
    popupHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
    popupTitle: { fontSize: '18px', fontWeight: '900', color: '#22c55e', margin: 0 },
    popupTable: { fontSize: '48px', fontWeight: '900', textAlign: 'center', margin: '15px 0', color:'white' },
    popupItems: { background: '#0a0a0a', padding: '15px', borderRadius: '15px', marginBottom: '20px', maxHeight: '150px', overflowY:'auto' },
    popupItemRow: { fontSize: '14px', color: '#aaa', marginBottom: '6px' },
    popupBtn: { width: '100%', background: '#22c55e', border: 'none', padding: '18px', borderRadius: '15px', color: 'white', fontWeight: '900', fontSize: '16px', cursor:'pointer' },
    empty: { textAlign:'center', marginTop:'60px', color:'#333', display:'flex', flexDirection:'column', alignItems:'center', gap: '10px' }
};

export default WaiterDashboard;