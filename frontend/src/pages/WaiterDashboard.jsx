import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import io from "socket.io-client";
import InstallButton from "../components/InstallButton";
import { 
    FaUserTie, FaCheck, FaSpinner, FaSignOutAlt, 
    FaConciergeBell, FaTruckLoading, FaVolumeUp, FaVolumeMute, FaLock, FaBell
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const styles = {
    container: { minHeight: "100vh", background: "radial-gradient(circle at top center, #1a0f0a 0%, #050505 60%)", color: "white", padding: "15px", fontFamily: "'Inter', sans-serif" },
    lockOverlay: { height: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    lockCard: { background: '#0a0a0a', border: '1px solid #111', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', width: '100%', maxWidth: '350px' },
    lockInput: { width: '100%', background: '#000', border: '1px solid #222', padding: '15px', borderRadius: '15px', color: 'white', fontSize: '20px', textAlign: 'center', outline: 'none', marginBottom: '15px' },
    lockBtn: { width: '100%', background: 'linear-gradient(135deg, #FF8800 0%, #FF5500 100%)', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' },
    callWrapper: { position: 'fixed', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 1100, width: '95%', maxWidth: '400px', display:'flex', flexDirection:'column', gap:'8px' },
    alertCard: { background: '#ef4444', padding: '16px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' },
    tableBadge: { background:'white', color:'#ef4444', fontWeight:'900', padding:'8px 14px', borderRadius:'12px', fontSize: '18px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom:'15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    title: { margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-1px' },
    card: { background: 'rgba(255,255,255,0.03)', borderRadius: '28px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom:'15px', backdropFilter: 'blur(10px)' },
    tableBig: { fontSize: '24px', fontWeight: '900', color: '#FF9933' },
    readyBadge: { background: '#22c55e', color: 'white', fontSize: '10px', fontWeight: '900', padding: '5px 12px', borderRadius: '20px' },
    itemsBox: { background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '20px', margin: '15px 0' },
    serveBtn: { width: '100%', padding: '18px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize: '15px', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' },
    iconBtn: { background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'white', borderRadius:'14px', padding:'12px', display:'flex', alignItems:'center' }
};

const WaiterDashboard = () => {
    const { id } = useParams(); 
    const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
    const API_BASE = `${SERVER_URL}/api`;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [readyOrders, setReadyOrders] = useState([]);
    const [serviceCalls, setServiceCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mongoId, setMongoId] = useState(null); 
    const [isMuted, setIsMuted] = useState(false);

    const dingRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    // ✅ 1. AGGRESSIVE SYNC ENGINE
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
        } catch (e) { 
            console.error("Waiter Sync Failed"); 
        }
    }, [readyOrders.length, isMuted, isAuthenticated, API_BASE]);

    // ✅ 2. AUTH & BOOTSTRAP (FIXED: Added Cache Buster for ID Fetch)
    const handleLogin = (e) => {
        if(e) e.preventDefault();
        // Updated Master PIN for Waiter terminals
        if (password === "bitebox18") {
            setIsAuthenticated(true);
            localStorage.setItem(`waiter_auth_${id}`, "true");
            toast.success("Access Granted");
        } else { 
            toast.error("Invalid Security Key"); 
        }
    };

    useEffect(() => {
        const authStatus = localStorage.getItem(`waiter_auth_${id}`);
        if (authStatus === "true") setIsAuthenticated(true);
    }, [id]);

    useEffect(() => {
        if(!isAuthenticated) return;
        const init = async () => {
            try {
                // 🔥 FIX: Using Cache Buster (?t=) ensures we bypass the 404 if the restaurant was recently created
                const res = await axios.get(`${API_BASE}/auth/restaurant/${id}?t=${Date.now()}`); 
                if (res.data?._id) {
                    setMongoId(res.data._id);
                    forceSync(res.data._id);
                } else {
                    toast.error("Restaurant Data Not Found.");
                    setLoading(false);
                }
            } catch (e) { 
                setLoading(false); 
                toast.error(`Terminal Error: Could not find '${id}'`);
            }
        };
        init();
    }, [id, forceSync, isAuthenticated, API_BASE]);

    // ✅ 3. SOCKETS (REAL-TIME ENGINE)
    useEffect(() => {
        if (!mongoId || !isAuthenticated) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket'],
            query: { restaurantId: mongoId }
        });

        socket.on("connect", () => {
            socket.emit("join-restaurant", mongoId);
            forceSync(mongoId);
        });

        // Listen for Chef status changes
        socket.on("chef-ready-alert", () => forceSync(mongoId));
        socket.on("order-updated", () => forceSync(mongoId));

        // Listen for Customer Table Calls
        socket.on("new-waiter-call", () => {
            if(!isMuted) dingRef.current.play().catch(()=>{});
            forceSync(mongoId);
        });

        const backupTimer = setInterval(() => forceSync(mongoId), 15000);
        return () => {
            socket.disconnect();
            clearInterval(backupTimer);
        };
    }, [mongoId, forceSync, isAuthenticated, isMuted, SERVER_URL]);

    const handleServe = async (orderId) => {
        // Optimistic UI update
        setReadyOrders(prev => prev.filter(o => o._id !== orderId));
        try {
            await axios.put(`${API_BASE}/orders/${orderId}`, { status: "Served" });
            toast.success("Table Served!");
        } catch (e) { 
            forceSync(mongoId); 
            toast.error("Cloud update failed");
        }
    };

    const resolveCall = async (callId) => {
        setServiceCalls(prev => prev.filter(c => c._id !== callId));
        try { 
            await axios.delete(`${API_BASE}/orders/calls/${callId}`); 
        } catch (e) {}
    };

    if (!isAuthenticated) return (
        <div style={styles.lockOverlay}>
            <div style={styles.lockCard}>
                <FaLock size={40} color="#f97316" style={{marginBottom:'20px'}}/>
                <h1 style={styles.title}>WAITER TERMINAL</h1>
                <form onSubmit={handleLogin} style={{width:'100%', marginTop:'20px'}}>
                    <input 
                        type="password" 
                        placeholder="SECURITY PIN" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        style={styles.lockInput} 
                        autoFocus 
                    />
                    <button type="submit" style={styles.lockBtn}>UNLOCK SYSTEM</button>
                </form>
            </div>
        </div>
    );

    if (loading) return <div style={{...styles.lockOverlay}}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* 🛎️ ALERT POPUPS (Table Calls) */}
            <div style={styles.callWrapper}>
                {serviceCalls.map(call => (
                    <div key={call._id} style={styles.alertCard} className="pulse-red">
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <span style={styles.tableBadge}>{call.tableNumber}</span>
                            <span style={{fontWeight:'900', fontSize:'13px'}}>CALLING FOR HELP!</span>
                        </div>
                        <button onClick={() => resolveCall(call._id)} style={{background:'white', color:'#ef4444', border:'none', borderRadius:'50%', width:'40px', height:'40px', cursor:'pointer'}}><FaCheck/></button>
                    </div>
                ))}
            </div>

            <header style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <FaUserTie size={20} color="#FF9933"/>
                    <h1 style={styles.title}>{id.toUpperCase()}</h1>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                    <button onClick={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
                        {isMuted ? <FaVolumeMute color="#ef4444"/> : <FaVolumeUp color="#22c55e"/>}
                    </button>
                    <InstallButton />
                    <button onClick={() => {localStorage.removeItem(`waiter_auth_${id}`); window.location.reload();}} style={{...styles.iconBtn, background:'#3b0a0a', border:'none'}}><FaSignOutAlt color="#ef4444"/></button>
                </div>
            </header>

            <h3 style={{fontSize:'10px', color:'#555', fontWeight:'900', marginBottom:'15px', letterSpacing:'1px'}}>PICKUP QUEUE</h3>
            
            {readyOrders.length === 0 ? (
                <div style={{textAlign:'center', marginTop:'80px', opacity:0.2}}>
                    <FaTruckLoading size={50}/>
                    <p style={{fontWeight:'900', marginTop:'15px'}}>KITCHEN IS CLEAR</p>
                </div>
            ) : (
                readyOrders.map(order => (
                    <div key={order._id} style={styles.card}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div style={styles.tableBig}>TABLE {order.tableNum}</div>
                            <div style={styles.readyBadge}>READY</div>
                        </div>
                        <div style={styles.itemsBox}>
                            {order.items?.map((item, i) => (
                                <div key={i} style={{display:'flex', gap:'10px', marginBottom:'5px', fontSize:'15px'}}>
                                    <span style={{color:'#FF9933', fontWeight:'900'}}>{item.quantity}x</span>
                                    <span>{item.name}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleServe(order._id)} style={styles.serveBtn}>MARK AS SERVED</button>
                    </div>
                ))
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } 
                .pulse-red { animation: pulse-red 1s infinite alternate; } @keyframes pulse-red { from { box-shadow: 0 0 10px #ef4444; } to { box-shadow: 0 0 30px #ef4444; } } 
                * { -webkit-tap-highlight-color: transparent; }
            `}</style>
        </div>
    );
};

export default WaiterDashboard;