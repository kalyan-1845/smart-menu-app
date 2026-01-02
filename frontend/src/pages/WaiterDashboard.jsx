import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton";
import { 
    FaUserTie, FaCheck, FaSpinner, FaSync, FaTimes, 
    FaConciergeBell, FaTruckLoading, FaVolumeUp, FaVolumeMute, FaLock, FaSignOutAlt
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const [isAuthenticated, setIsAuthenticated] = useState(false); // ✅ LOCK STATE
    const [password, setPassword] = useState("");
    const [readyOrders, setReadyOrders] = useState([]);
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); 
    const [isMuted, setIsMuted] = useState(false);
    const [notification, setNotification] = useState(null);

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // ✅ 1. PASSWORD CHECK LOGIC
    const handleLogin = (e) => {
        if(e) e.preventDefault();
        if (password === "bitebox18") {
            setIsAuthenticated(true);
            localStorage.setItem(`waiter_auth_${id}`, "true");
            toast.success("Access Granted");
        } else {
            toast.error("Invalid Security Key");
        }
    };

    // ✅ 2. AUTH PERSISTENCE (Checks if already logged in)
    useEffect(() => {
        const authStatus = localStorage.getItem(`waiter_auth_${id}`);
        if (authStatus === "true") {
            setIsAuthenticated(true);
        }
    }, [id]);

    const forceSync = useCallback(async (rId) => {
        if (!rId || !isAuthenticated) return;
        try {
            const [orderRes, callRes] = await Promise.all([
                axios.get(`${API_BASE}/orders?restaurantId=${rId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${rId}&t=${Date.now()}`)
            ]);
            const pickupReady = orderRes.data.filter(o => o.status?.toLowerCase() === "ready");
            if (pickupReady.length > readyOrders.length && !isMuted) {
                dingRef.current.play().catch(() => {});
            }
            setReadyOrders(pickupReady);
            setServiceCalls(callRes.data || []);
            setLoading(false);
        } catch (e) { console.error("Sync Failed"); }
    }, [readyOrders.length, isMuted, isAuthenticated]);

    useEffect(() => {
        if(!isAuthenticated) return; // Stop data fetch if locked
        const init = async () => {
            try {
                const res = await axios.get(`${API_BASE}/auth/restaurant/${id}`); 
                if (res.data?._id) {
                    setMongoId(res.data._id);
                    forceSync(res.data._id);
                }
            } catch (e) { setLoading(false); }
        };
        init();
    }, [id, forceSync, isAuthenticated]);

    useEffect(() => {
        if (!mongoId || !isAuthenticated) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            reconnection: true,
            query: { restaurantId: mongoId }
        });

        socket.on("connect", () => {
            socket.emit("join-restaurant", mongoId);
            forceSync(mongoId);
        });

        socket.on("chef-ready-alert", () => forceSync(mongoId));
        socket.on("new-waiter-call", () => forceSync(mongoId));

        const handleActivity = () => {
            if (document.visibilityState === 'visible') forceSync(mongoId);
        };
        window.addEventListener("focus", handleActivity);
        document.addEventListener("visibilitychange", handleActivity);

        const aggressiveTimer = setInterval(() => forceSync(mongoId), 8000);

        return () => {
            socket.disconnect();
            window.removeEventListener("focus", handleActivity);
            document.removeEventListener("visibilitychange", handleActivity);
            clearInterval(aggressiveTimer);
        };
    }, [mongoId, forceSync, isAuthenticated]);

    const handleServe = async (orderId) => {
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" });
            toast.success("Served!");
        } catch (e) { forceSync(mongoId); }
    };

    const resolveCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { await axios.delete(`${API_BASE}/orders/calls/${callId}`); } catch (e) {}
    };

    const handleLogout = () => {
        localStorage.removeItem(`waiter_auth_${id}`);
        setIsAuthenticated(false);
        window.location.reload();
    };

    // 🔒 RENDER LOCK SCREEN IF NOT AUTHENTICATED
    if (!isAuthenticated) {
        return (
            <div style={styles.lockOverlay}>
                <div style={styles.lockCard}>
                    <FaLock size={40} color="#f97316" style={{marginBottom:'20px'}}/>
                    <h1 style={{fontSize:'20px', fontWeight:'900', marginBottom:'10px'}}>WAITER TERMINAL</h1>
                    <p style={{fontSize:'12px', color:'#555', marginBottom:'25px'}}>RESTRICTED ACCESS</p>
                    <form onSubmit={handleLogin} style={{width:'100%'}}>
                        <input 
                            type="password" 
                            placeholder="Enter Security Key" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.lockInput}
                            autoFocus
                        />
                        <button type="submit" style={styles.lockBtn}>UNLOCK DASHBOARD</button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <div style={styles.callNotificationWrapper}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse-top">
                        <div style={styles.alertContent}>
                            <span style={styles.tableBadge}>T-{call.tableNumber}</span>
                            <span style={styles.alertMsg}>TABLE CALLING! 🛎️</span>
                        </div>
                        <button onClick={() => resolveCall(call._id)} style={styles.checkBtn}><FaCheck/></button>
                    </div>
                ))}
            </div>

            {readyOrders.length > 0 && !notification && (
                <div style={styles.miniAlert} onClick={() => forceSync(mongoId)}>
                    <FaConciergeBell /> {readyOrders.length} ORDERS READY IN KITCHEN
                </div>
            )}

            <header style={styles.header}>
                <div style={styles.brand}><FaUserTie size={22} color="#f97316"/><div><h1 style={styles.title}>WAITER PRO</h1><span style={styles.sub}>{id?.toUpperCase()}</span></div></div>
                <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                    <button onClick={() => {
                        setIsMuted(!isMuted);
                        dingRef.current.play().then(() => dingRef.current.pause()); 
                    }} style={styles.iconBtn}>
                        {isMuted ? <FaVolumeMute color="#ef4444"/> : <FaVolumeUp color="#22c55e"/>}
                    </button>
                    <InstallButton />
                    <button onClick={handleLogout} style={styles.logoutBtn}><FaSignOutAlt/></button>
                </div>
            </header>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>PICKUP QUEUE</h3>
                {readyOrders.length === 0 ? (
                    <div style={styles.empty}>
                        <FaTruckLoading size={40} style={{opacity:0.1, marginBottom: '10px'}}/>
                        <p>Waiting for Chef...</p>
                    </div>
                ) : (
                    readyOrders.map(order => (
                        <div key={order._id} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div style={styles.tableBig}>TABLE {order.tableNum}</div>
                                <div style={styles.readyBadge}>PICKUP</div>
                            </div>
                            <div style={styles.items}>
                                {order.items?.map((item, i) => (
                                    <div key={i} style={styles.itemRow}>
                                        <span style={styles.qty}>{item.quantity}x</span>
                                        <span style={styles.name}>{item.name}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>MARK SERVED</button>
                        </div>
                    ))
                )}
            </div>

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-top { animation: pulse-red 1s infinite alternate; } @keyframes pulse-red { from { background: #ef4444; } to { background: #991b1b; } } 
                * { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' },
    lockOverlay: { height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    lockCard: { background: '#0a0a0a', border: '1px solid #111', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '350px' },
    lockInput: { width: '100%', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '12px', color: 'white', fontSize: '18px', textAlign: 'center', outline: 'none', marginBottom: '15px' },
    lockBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', cursor: 'pointer' },
    callNotificationWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: '95%', maxWidth: '400px', display:'flex', flexDirection:'column', gap:'8px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom:'10px', borderBottom: '1px solid #111' },
    brand: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    sub: { fontSize: '9px', color: '#444', fontWeight: '900', textTransform: 'uppercase' },
    iconBtn: { background:'#111', border:'1px solid #222', color:'white', borderRadius:'12px', padding:'12px', display:'flex', alignItems:'center' },
    logoutBtn: { background:'#3b0a0a', border:'none', color:'#ef4444', borderRadius:'12px', padding:'12px' },
    sectionTitle: { fontSize: '10px', color: '#555', fontWeight: '900', marginBottom: '15px', letterSpacing:'1px' },
    alertCard: { background: '#ef4444', padding: '16px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' },
    alertContent: { display:'flex', alignItems:'center', gap:'12px' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'6px 12px', borderRadius:'10px', fontSize: '16px' },
    alertMsg: { fontWeight:'900', fontSize:'13px' },
    checkBtn: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', background: 'white', color: '#ef4444', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' },
    card: { background: '#0a0a0a', borderRadius: '28px', padding: '24px', border: '1px solid #111', marginBottom:'15px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    tableBig: { fontSize: '28px', fontWeight: '900' },
    readyBadge: { background: '#22c55e', color: 'white', fontSize: '10px', fontWeight: '900', padding: '5px 12px', borderRadius: '8px' },
    items: { background: '#111', padding: '15px', borderRadius: '18px', marginBottom: '20px' },
    itemRow: { display:'flex', gap:'12px', marginBottom: '8px' },
    qty: { color: '#f97316', fontWeight: '900' },
    name: { fontSize: '15px', color: '#ddd', fontWeight: '500' },
    serveBtn: { width: '100%', height: '60px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '16px' },
    miniAlert: { position:'fixed', bottom:'20px', left:'50%', transform:'translateX(-50%)', background:'#FF9933', color:'black', padding:'10px 20px', borderRadius:'30px', fontWeight:'900', fontSize:'12px', display:'flex', alignItems:'center', gap:'10px', zIndex:1000, boxShadow:'0 10px 20px rgba(0,0,0,0.5)' },
    empty: { textAlign:'center', marginTop:'100px', color:'#222' }
};

export default WaiterDashboard;