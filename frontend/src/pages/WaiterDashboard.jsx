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

    // ✅ AUTOMATIC REFRESH ON SITE LOAD / MOBILE UNLOCK
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
        } catch (e) { 
            console.error("Failed to fetch Restaurant MongoID", e); 
        }
        return null;
    };

    const refreshData = async (rId) => {
        if (!rId || rId === "null" || rId === "undefined") return;
        try {
            const [orderRes, callRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}`),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}`)
            ]);
            
            const pickupReady = orderRes.data.filter(o => 
                o.status && o.status.toLowerCase() === "ready"
            );
            setReadyOrders(pickupReady);
            setServiceCalls(callRes.data);
            setLoading(false);
        } catch (e) { 
            console.error("Refresh Data Error:", e.response?.data || e.message);
            setLoading(false); 
        }
    };

    // ✅ DELETE ORDER (Cancellations)
    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm("Delete this order? This cannot be undone.")) return;
        try {
            await axios.delete(`${API_BASE}/orders/${orderId}`);
            setReadyOrders(prev => prev.filter(o => o._id !== orderId));
            toast.success("Order Removed");
        } catch (e) {
            toast.error("Delete failed");
        }
    };

    // ✅ RESOLVE SERVICE CALL
    const resolveCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try {
            await axios.delete(`${API_BASE}/orders/calls/${callId}`);
        } catch (e) { console.error("Sync error"); }
    };

    useEffect(() => {
        const init = async () => {
            const fetchedId = await fetchRestaurantId();
            if (fetchedId) refreshData(fetchedId);
        };
        init();
    }, [id]);

    useEffect(() => {
        if(mongoId) {
            const socket = io(SERVER_URL, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionAttempts: Infinity,
                timeout: 10000
            });

            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => {
                setIsConnected(true);
                refreshData(mongoId); 
            });
            
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("new-order", (order) => {
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
                dingRef.current.play().catch(()=>{});
                setSystemAlerts(prev => [{ id: Date.now(), table: order.tableNum, type: 'ORDER', msg: 'NEW ORDER RECEIVED' }, ...prev]);
                refreshData(mongoId);
            });

            socket.on("chef-ready-alert", (data) => {
                if ("vibrate" in navigator) navigator.vibrate([500, 200, 500]);
                dingRef.current.play().catch(()=>{});
                setSystemAlerts(prev => [{ id: Date.now(), table: data.tableNum, type: 'READY', msg: 'ORDER READY FOR PICKUP' }, ...prev]);

                if (data.orderId) {
                    axios.get(`${API_BASE}/orders/${data.orderId}`).then(res => {
                        setNotification(res.data);
                        refreshData(mongoId); 
                    }).catch(e => refreshData(mongoId));
                }
                setTimeout(() => setNotification(null), 15000);
            });

            socket.on("new-waiter-call", (newCall) => {
                if ("vibrate" in navigator) navigator.vibrate(800);
                dingRef.current.play().catch(()=>{});
                setServiceCalls(prev => [newCall, ...prev]);
            });

            const interval = setInterval(() => refreshData(mongoId), 30000);
            return () => {
                socket.disconnect();
                clearInterval(interval);
            };
        }
    }, [mongoId]);

    const handleServe = async (orderId) => {
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try { 
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); 
            refreshData(mongoId);
            toast.success("Served Successfully!");
        } catch (e) { refreshData(mongoId); }
    };

    if (!mongoId && loading) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <div style={styles.callNotificationWrapper}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse-top">
                        <div style={styles.alertContent}>
                            <span style={styles.tableBadge}>T-{call.tableNumber}</span>
                            <span style={styles.alertMsg}>ASSISTANCE REQUIRED 🛎️</span>
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

            {notification && (
                <div style={styles.popupOverlay}>
                    <div style={styles.popupCard} className="slide-up">
                        <div style={styles.popupHeader}><FaConciergeBell color="#22c55e" size={24}/><h2 style={styles.popupTitle}>PICKUP NOW</h2></div>
                        <div style={styles.popupBody}>
                            <div style={styles.popupTable}>TABLE {notification.tableNum}</div>
                            <div style={styles.popupItems}>{notification.items?.map((item, i) => (<div key={i} style={styles.popupItemRow}>{item.quantity}x {item.name}</div>))}</div>
                        </div>
                        <button onClick={() => { handleServe(notification._id); setNotification(null); }} style={styles.popupBtn}>MARK DELIVERED</button>
                    </div>
                </div>
            )}

            <header style={styles.header}>
                <div style={styles.brand}><FaUserTie size={24} color="#f97316"/><div><h1 style={styles.title}>WAITER DASH</h1><span style={styles.sub}>{id?.toUpperCase()}</span></div></div>
                <button onClick={() => { 
                    dingRef.current.play().then(() => { dingRef.current.pause(); dingRef.current.currentTime = 0; }).catch(()=>{});
                    refreshData(mongoId); 
                }} style={styles.iconBtn}><FaSync/></button>
            </header>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY FOR DELIVERY ({readyOrders.length})</h3>
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}><FaTruckLoading size={30} style={{marginBottom: 10}}/><p>Waiting for Chef...</p></div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.tableBig}>TABLE {order.tableNum}</div>
                                <div style={styles.readyBadge}>READY</div>
                            </div>
                            
                            <div style={styles.items}>
                                {order.customerName && <p style={{margin: '0 0 10px 0', fontSize: '18px', fontWeight: 'bold'}}><span style={{color: '#f97316'}}>1x</span> {order.customerName}</p>}
                                {order.items?.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}x</span>
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* ✅ SERVICE HISTORY BOX */}
                            <div style={styles.historyBox}>
                                <div style={styles.historyTitle}><FaHistory size={10}/> SERVICE HISTORY</div>
                                <div style={styles.historyItem}><FaClock size={10}/> Order Placed: {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                <div style={styles.historyItem}><FaCheck size={10} color="#22c55e"/> Chef Finished Cooking</div>
                            </div>

                            <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                                <button onClick={() => handleServe(order._id)} style={styles.serveBtn}><FaCheck style={{marginRight: 8}}/> MARK SERVED</button>
                                <button onClick={() => handleDeleteOrder(order._id)} style={styles.deleteBtn}><FaTrash /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-top { animation: pulse-top-red 1s infinite alternate; } @keyframes pulse-top-red { from { background-color: #ef4444; } to { background-color: #dc2626; } } 
                .slide-up { animation: slideUp 0.3s ease-out; } @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
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
    iconBtn: { background:'#222', border:'none', color:'white', borderRadius:'8px', padding:'8px' },
    sectionTitle: { fontSize: '11px', color: '#f97316', fontWeight: 'bold', marginBottom: '15px', textTransform:'uppercase' },
    alertCard: { background: '#ef4444', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' },
    alertContent: { display:'flex', alignItems:'center', gap:'10px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'4px 8px', borderRadius:'6px' },
    alertMsg: { fontWeight:'bold', fontSize:'12px' },
    checkBtn: { width: '30px', height: '30px', borderRadius: '50%', border: 'none', background: 'white', color: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center' },
    card: { background: '#111', borderRadius: '16px', padding: '18px', border: '1px solid #222', marginBottom:'15px', boxShadow: '0 0 20px rgba(34, 197, 94, 0.1)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    tableBig: { fontSize: '28px', fontWeight: '900', color: 'white' },
    readyBadge: { background: '#22c55e', color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '8px' },
    itemRow: { display:'flex', gap:'10px', marginBottom: '5px' },
    qty: { color: '#f97316', fontWeight: 'bold' },
    name: { fontSize: '16px', color: '#eee' },
    historyBox: { background: '#181818', padding: '12px', borderRadius: '10px', marginTop: '15px', border: '1px solid #222' },
    historyTitle: { fontSize: '9px', fontWeight: '900', color: '#f97316', marginBottom: '8px', letterSpacing: '1px' },
    historyItem: { fontSize: '11px', color: '#888', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' },
    serveBtn: { flex: 1, padding: '15px', background: 'transparent', color: '#22c55e', border: '2px dashed #22c55e', borderRadius: '12px', fontWeight: '900', fontSize: '14px', cursor: 'pointer' },
    deleteBtn: { background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '12px', cursor: 'pointer' },
    popupOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    popupCard: { background: '#1a1a1a', borderRadius: '24px', width: '100%', maxWidth: '350px', padding: '20px', border: '2px solid #22c55e' },
    popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    popupTitle: { fontSize: '16px', fontWeight: '900', color: '#22c55e', margin: 0 },
    popupTable: { fontSize: '40px', fontWeight: '900', textAlign: 'center', margin: '10px 0' },
    popupItems: { background: '#0a0a0a', padding: '15px', borderRadius: '12px', marginBottom: '20px' },
    popupItemRow: { fontSize: '13px', color: '#888', marginBottom: '4px' },
    popupBtn: { width: '100%', background: '#22c55e', border: 'none', padding: '15px', borderRadius: '12px', color: 'white', fontWeight: '900' },
    empty: { textAlign:'center', marginTop:'40px', color:'#444', display:'flex', flexDirection:'column', alignItems:'center' }
};

export default WaiterDashboard;