import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton"; // ✅ Added Install Button
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

    const handleServe = async (orderId) => {
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        if ("vibrate" in navigator) navigator.vibrate(50);
        
        try { 
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" }); 
            toast.success("Served!");
        } catch (e) { 
            refreshData(mongoId); 
            toast.error("Update Failed");
        }
    };

    const resolveCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } 
        catch (e) { console.error("Sync error"); }
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
            const socket = io(SERVER_URL, { transports: ['websocket'], reconnection: true });
            socket.emit("join-restaurant", mongoId);

            socket.on("connect", () => setIsConnected(true));
            socket.on("disconnect", () => setIsConnected(false));

            socket.on("chef-ready-alert", (data) => {
                if ("vibrate" in navigator) navigator.vibrate([400, 100, 400]);
                dingRef.current.play().catch(()=>{});
                
                setSystemAlerts(prev => [{ id: Date.now(), table: data.tableNum, type: 'READY', msg: 'FOOD READY' }, ...prev]);

                axios.get(`${API_BASE}/orders/${data.orderId}`).then(res => {
                    setNotification(res.data);
                    setReadyOrders(prev => [res.data, ...prev.filter(o => o._id !== res.data._id)]);
                }).catch(() => refreshData(mongoId));

                // Auto-clear notification after 15s to keep UI clean
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
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <InstallButton /> {/* ✅ Integrated Install Button */}
                    <button onClick={() => refreshData(mongoId)} style={styles.iconBtn}><FaSync className={loading ? "spin" : ""}/></button>
                </div>
            </header>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>READY ORDERS ({readyOrders.length})</h3>
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}><FaTruckLoading size={30} style={{marginBottom: 10}}/><p>No pending pickups</p></div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.tableBig}>T-{order.tableNum}</div>
                                <div style={styles.readyBadge}>FOOD READY</div>
                            </div>
                            
                            <div style={styles.items}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}x</span>
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.actionGroup}>
                                <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>MARK SERVED</button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-top { animation: pulse-red 1s infinite alternate; } @keyframes pulse-red { from { background: #ef4444; opacity: 1; } to { background: #b91c1c; opacity: 0.9; } } 
                .slide-up { animation: slideUp 0.3s forwards; } @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "Inter, sans-serif" },
    callNotificationWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: '95%', maxWidth: '400px', display:'flex', flexDirection:'column', gap:'5px' },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom:'1px solid #1a1a1a', paddingBottom:'10px' },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    sub: { fontSize: '10px', color: '#444', fontWeight: 'bold' },
    iconBtn: { background:'#111', border:'1px solid #222', color:'white', borderRadius:'10px', padding:'10px' },
    sectionTitle: { fontSize: '10px', color: '#666', fontWeight: 'bold', marginBottom: '15px', tracking: '2px' },
    alertCard: { background: '#ef4444', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    alertContent: { display:'flex', alignItems:'center', gap:'12px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'6px 10px', borderRadius:'8px', fontSize: '14px' },
    alertMsg: { fontWeight:'bold', fontSize:'13px', letterSpacing: '0.5px' },
    checkBtn: { width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: 'white', color: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center' },
    card: { background: '#0a0a0a', borderRadius: '24px', padding: '20px', border: '1px solid #111', marginBottom:'12px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    tableBig: { fontSize: '28px', fontWeight: '900', color: 'white' },
    readyBadge: { background: '#22c55e', color: 'white', fontSize: '9px', fontWeight: '900', padding: '4px 10px', borderRadius: '6px' },
    items: { background: '#111', padding: '15px', borderRadius: '18px', marginBottom: '15px' },
    itemRow: { display:'flex', gap:'10px', marginBottom: '6px' },
    qty: { color: '#f97316', fontWeight: '900' },
    name: { fontSize: '15px', color: '#eee' },
    actionGroup: { display: 'flex', gap: '10px' },
    serveBtn: { flex: 1, height: '60px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '15px' },
    popupOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' },
    popupCard: { background: '#000', borderRadius: '35px', width: '100%', maxWidth: '350px', padding: '30px', border: '1px solid #22c55e', textAlign: 'center' },
    popupHeader: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' },
    popupTitle: { fontSize: '14px', fontWeight: '900', color: '#22c55e' },
    popupTable: { fontSize: '64px', fontWeight: '900', margin: '20px 0', color: 'white' },
    popupItems: { background: '#0a0a0a', padding: '20px', borderRadius: '20px', marginBottom: '25px', maxHeight: '120px', overflowY: 'auto' },
    popupItemRow: { fontSize: '14px', color: '#666', marginBottom: '5px' },
    popupBtn: { width: '100%', background: '#22c55e', border: 'none', padding: '20px', borderRadius: '20px', color: 'white', fontWeight: '900', fontSize: '16px' },
    empty: { textAlign:'center', marginTop:'100px', color:'#222' }
};

export default WaiterDashboard;