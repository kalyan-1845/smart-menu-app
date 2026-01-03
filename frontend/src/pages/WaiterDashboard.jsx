import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton";
import { 
    FaUserTie, FaCheck, FaSpinner, FaSignOutAlt, 
    FaConciergeBell, FaTruckLoading, FaVolumeUp, FaVolumeMute, FaLock, FaBell, FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [orders, setOrders] = useState([]); // All orders
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); 
    const [isMuted, setIsMuted] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false); // Toggle for "Force Serve"

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // ✅ 1. SYNC ENGINE
    const forceSync = useCallback(async (rId) => {
        if (!rId || !isAuthenticated) return;
        try {
            const [orderRes, callRes] = await Promise.all([
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${rId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}&t=${Date.now()}`)
            ]);
            
            // Filter out already served/archived for the waiter's view
            const active = orderRes.data.filter(o => 
                !["served", "completed", "archived"].includes(o.status.toLowerCase())
            );
            
            // Check if there are NEW "Ready" orders to play sound
            const currentReadyCount = orders.filter(o => o.status?.toLowerCase() === "ready").length;
            const newReadyCount = active.filter(o => o.status?.toLowerCase() === "ready").length;

            if (newReadyCount > currentReadyCount && !isMuted) {
                dingRef.current.play().catch(() => {});
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            }
            
            setOrders(active);
            setServiceCalls(callRes.data || []);
            setLoading(false);
        } catch (e) { console.error("Waiter Sync Error"); }
    }, [orders, isMuted, isAuthenticated]);

    // ✅ 2. AUTHENTICATION & BOOTSTRAP
    const handleLogin = (e) => {
        if(e) e.preventDefault();
        if (password === "bitebox18") {
            setIsAuthenticated(true);
            localStorage.setItem(`waiter_auth_${id}`, "true");
            toast.success("Staff Terminal Active");
        } else { toast.error("Invalid Security Key"); }
    };

    useEffect(() => {
        const authStatus = localStorage.getItem(`waiter_auth_${id}`);
        if (authStatus === "true") setIsAuthenticated(true);
    }, [id]);

    useEffect(() => {
        if(!isAuthenticated) return;
        const init = async () => {
            try {
                const res = await axios.get(`${API_BASE}/auth/restaurant/${id}?t=${Date.now()}`); 
                if (res.data?._id) {
                    setMongoId(res.data._id);
                    forceSync(res.data._id);
                } else { setLoading(false); }
            } catch (e) { setLoading(false); }
        };
        init();
    }, [id, forceSync, isAuthenticated]);

    // ✅ 3. REAL-TIME SOCKETS
    useEffect(() => {
        if (!mongoId || !isAuthenticated) return;
        const socket = io(SERVER_URL, { transports: ['websocket'], query: { restaurantId: mongoId } });
        
        socket.on("connect", () => {
            socket.emit("join-restaurant", mongoId);
            forceSync(mongoId);
        });

        socket.on("chef-ready-alert", () => forceSync(mongoId));
        socket.on("new-order", () => forceSync(mongoId));
        
        socket.on("new-waiter-call", () => {
            if(!isMuted) dingRef.current.play().catch(()=>{});
            if ("vibrate" in navigator) navigator.vibrate(500);
            forceSync(mongoId);
        });

        const backupTimer = setInterval(() => forceSync(mongoId), 12000);
        return () => { socket.disconnect(); clearInterval(backupTimer); };
    }, [mongoId, forceSync, isAuthenticated, isMuted]);

    // ✅ 4. ACTION HANDLERS
    const handleServe = async (orderId) => {
        if ("vibrate" in navigator) navigator.vibrate(50);
        setOrders(prev => prev.filter(o => o._id !== orderId));
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" });
            toast.success("Served! Bill generated.", { icon: '🍽️' });
        } catch (e) { forceSync(mongoId); }
    };

    const resolveCall = async (callId) => {
        if ("vibrate" in navigator) navigator.vibrate(100);
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } catch (e) {}
    };

    // Filter logic for the UI
    const displayedOrders = showAllOrders 
        ? orders 
        : orders.filter(o => o.status?.toLowerCase() === "ready");

    if (!isAuthenticated) return (
        <div style={styles.lockOverlay}>
            <div style={styles.lockCard}>
                <FaLock size={40} color="#f97316" style={{marginBottom:'20px'}}/>
                <h1 style={styles.title}>WAITER LOGIN</h1>
                <form onSubmit={handleLogin} style={{width:'100%', marginTop:'20px'}}>
                    <input type="password" placeholder="PIN" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.lockInput} autoFocus />
                    <button type="submit" style={styles.lockBtn}>UNLOCK SYSTEM</button>
                </form>
            </div>
        </div>
    );

    if (loading) return <div style={styles.lockOverlay}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* 🛎️ FLOATING TABLE CALLS */}
            <div style={styles.callWrapper}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse-red">
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <span style={styles.tableBadge}>{call.tableNumber}</span>
                            <span style={{fontWeight:'900', fontSize:'13px'}}>CALLING FOR SERVICE</span>
                        </div>
                        <button onClick={() => resolveCall(call._id)} style={styles.attendBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            <header style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <FaUserTie size={18} color="#FF9933"/>
                    <h1 style={styles.title}>{id.toUpperCase()} STAFF</h1>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                        {isMuted ? <FaVolumeMute color="#ef4444"/> : <FaVolumeUp color="#22c55e"/>}
                    </button>
                    <button onClick={() => {localStorage.removeItem(`waiter_auth_${id}`); window.location.reload();}} style={{...styles.iconBtn, background:'#3b0a0a', border:'none'}}><FaSignOutAlt color="#ef4444"/></button>
                </div>
            </header>

            {/* Force Serve Toggle */}
            <div style={styles.toolbar}>
                <h3 style={styles.sectionLabel}>{showAllOrders ? "ALL ACTIVE TABLES" : "READY FOR PICKUP"}</h3>
                <button onClick={() => setShowAllOrders(!showAllOrders)} style={{...styles.toggleBtn, background: showAllOrders ? '#f97316' : '#111'}}>
                    {showAllOrders ? "View Only Ready" : "Force Serve Mode"}
                </button>
            </div>
            
            {displayedOrders.length === 0 ? (
                <div style={styles.emptyState}>
                    <FaTruckLoading size={50}/>
                    <p style={{fontWeight:'900', marginTop:'15px'}}>NO ORDERS TO SERVE</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {displayedOrders.map(order => (
                        <div key={order._id} style={{...styles.card, borderLeft: order.status === 'ready' ? '6px solid #22c55e' : '6px solid #eab308'}}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div style={styles.tableBig}>Table {order.tableNum}</div>
                                <div style={{...styles.readyBadge, background: order.status === 'ready' ? '#22c55e' : '#eab308'}}>
                                    {order.status.toUpperCase()}
                                </div>
                            </div>
                            <div style={styles.itemsBox}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={{color:'#FF9933', fontWeight:'900'}}>{item.quantity}×</span>
                                        <span>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>
                                <FaCheck /> MARK AS SERVED
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-red { animation: pulse-red 1s infinite alternate; } 
                @keyframes pulse-red { from { background: #ef4444; box-shadow: 0 0 10px #ef4444; } to { background: #b91c1c; box-shadow: 0 0 30px #ef4444; } } 
                * { -webkit-tap-highlight-color: transparent; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "'Inter', sans-serif" },
    lockOverlay: { height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    lockCard: { background: '#0a0a0a', border: '1px solid #111', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '350px' },
    lockInput: { width: '100%', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: 'white', fontSize: '20px', textAlign: 'center', outline: 'none', marginBottom: '15px' },
    lockBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900' },
    callWrapper: { position: 'sticky', top: '10px', zIndex: 1100, width: '100%', maxWidth: '400px', margin: '0 auto 15px auto', display:'flex', flexDirection:'column', gap:'8px' },
    alertCard: { padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.2)' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'8px 14px', borderRadius:'12px', fontSize: '18px' },
    attendBtn: { background:'white', color:'#000', border:'none', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom:'10px', borderBottom: '1px solid #111' },
    title: { margin: 0, fontSize: '16px', fontWeight: '900' },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    sectionLabel: { fontSize: '10px', color: '#555', fontWeight: '900', letterSpacing: '1px', margin: 0 },
    toggleBtn: { border: '1px solid #333', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '900' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' },
    card: { background: '#0a0a0a', borderRadius: '24px', padding: '20px', border: '1px solid #111' },
    tableBig: { fontSize: '22px', fontWeight: '900', color: '#FF9933' },
    readyBadge: { color: 'white', fontSize: '10px', fontWeight: '900', padding: '4px 10px', borderRadius: '12px' },
    itemsBox: { background: '#000', padding: '12px', borderRadius: '15px', margin: '15px 0' },
    itemRow: { display:'flex', gap:'10px', marginBottom:'5px', fontSize:'14px' },
    serveBtn: { width: '100%', padding: '16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
    iconBtn: { background:'#111', border:'1px solid #222', color:'white', borderRadius:'12px', padding:'10px', display:'flex', alignItems:'center' },
    emptyState: { textAlign:'center', marginTop:'100px', opacity:0.2 }
};

export default WaiterDashboard;