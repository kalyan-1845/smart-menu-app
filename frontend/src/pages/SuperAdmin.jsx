import React, { useState, useEffect } from "react";
import { 
    FaCrown, FaStore, FaSync, FaSignOutAlt, FaTimes, FaPlus, 
    FaChartLine, FaEnvelope, FaBan, FaCheckCircle, FaShoppingCart, FaKey, FaTrash
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// ✅ 1. UPDATE THIS URL TO YOUR BACKEND
const API_BASE = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [liveOrders, setLiveOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Broadcast State
    const [broadcastMsg, setBroadcastMsg] = useState({ title: "", message: "" });

    // --- INITIAL LOAD ---
    useEffect(() => {
        // Auth Check from your SuperLogin
        const isAuth = localStorage.getItem("superAdminAuth"); 
        if (!isAuth) navigate("/superlogin");
        
        fetchData();

        // 🔌 Socket Connection
        const socket = io(API_BASE);
        socket.emit("join-super-admin");
        socket.on("global-new-order", (order) => {
            setLiveOrders(prev => [order, ...prev].slice(0, 8)); // Keep last 8 orders
        });

        return () => socket.disconnect();
    }, [navigate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // ✅ UPDATED: Call the backend route I created in File 1
            const token = localStorage.getItem("owner_token_ceo") || "temp_token"; 
            const res = await axios.get(`${API_BASE}/api/superadmin/restaurants`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRestaurants(res.data);
        } catch (error) { 
            console.error("Sync Failed"); 
        }
        setLoading(false);
    };

    const sendBroadcast = async () => {
        try {
            const token = localStorage.getItem("owner_token_ceo");
            await axios.post(`${API_BASE}/api/superadmin/broadcast`, broadcastMsg, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("📢 Broadcast Sent!");
            setBroadcastMsg({title: "", message: ""});
        } catch (err) { alert("Broadcast Failed"); }
    };

    return (
        <div className="ceo-layout">
            <style>{cssStyles}</style>
            
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo"><FaCrown color="#f97316"/> CEO PANEL</div>
                <nav>
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={()=>setActiveTab('overview')}>
                        <FaStore/> Network
                    </button>
                    {/* ✅ LINK TO YOUR REQUESTED URL */}
                    <button onClick={() => navigate('/superresturant')}>
                        <FaPlus/> Onboard New
                    </button>
                    <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={()=>setActiveTab('broadcast')}>
                        <FaEnvelope/> Broadcast
                    </button>
                </nav>
                
                <div className="live-box">
                    <h4><FaShoppingCart/> Live Orders</h4>
                    {liveOrders.length === 0 && <small>Waiting for orders...</small>}
                    {liveOrders.map((o, i) => (
                        <div key={i} className="live-item">
                            <span>{o.restaurantName}</span>
                            <b>₹{o.totalAmount}</b>
                        </div>
                    ))}
                </div>

                <button className="logout" onClick={() => { localStorage.removeItem("superAdminAuth"); navigate("/"); }}>
                    <FaSignOutAlt/> Logout
                </button>
            </aside>

            {/* MAIN AREA */}
            <main className="main-content">
                <header>
                    <h1>{activeTab === 'overview' ? 'Partner Network' : 'System Alert'}</h1>
                    <button onClick={fetchData} className="sync-btn">
                        <FaSync className={loading ? 'spin':''}/> Sync
                    </button>
                </header>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <>
                        <div className="stats-row">
                            <div className="stat-card">
                                <h3>₹{restaurants.reduce((a,b)=>a+(b.totalRevenue||0),0).toLocaleString()}</h3>
                                <p>Total Revenue</p>
                            </div>
                            <div className="stat-card">
                                <h3>{restaurants.length}</h3>
                                <p>Total Partners</p>
                            </div>
                            <div className="stat-card">
                                <h3>{restaurants.filter(r=>r.isActive).length}</h3>
                                <p>Online Now</p>
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table className="dark-table">
                                <thead>
                                    <tr>
                                        <th>Restaurant Name</th>
                                        <th>Status</th>
                                        <th>Days Left</th>
                                        <th>Revenue</th>
                                        <th>Controls</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {restaurants.map(res => (
                                        <tr key={res._id}>
                                            <td>
                                                <strong>{res.restaurantName}</strong>
                                                <br/><small style={{color:'#666'}}>{res.username}</small>
                                            </td>
                                            <td>
                                                <span className={`pill ${res.isActive ? 'active' : 'blocked'}`}>
                                                    {res.isActive ? 'ACTIVE' : 'LOCKED'}
                                                </span>
                                            </td>
                                            <td>{res.daysLeft} Days</td>
                                            <td className="money">₹{res.totalRevenue?.toLocaleString()}</td>
                                            <td>
                                                <button className="manage-btn" onClick={()=>setSelectedId(res._id)}>
                                                    Manage
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* BROADCAST TAB */}
                {activeTab === 'broadcast' && (
                    <div className="form-container">
                        <h2>📢 System-Wide Alert</h2>
                        <label>Title</label>
                        <input value={broadcastMsg.title} onChange={e=>setBroadcastMsg({...broadcastMsg, title:e.target.value})} />
                        <label>Message</label>
                        <textarea value={broadcastMsg.message} onChange={e=>setBroadcastMsg({...broadcastMsg, message:e.target.value})} rows="4"/>
                        <button onClick={sendBroadcast} className="save-btn" style={{background:'#eab308', color:'black'}}>Send Alert</button>
                    </div>
                )}
            </main>

            {/* GHOST MODE MODAL */}
            {selectedId && <GhostModal id={selectedId} onClose={()=>{setSelectedId(null); fetchData();}} />}
        </div>
    );
};

// --- GHOST MODE (MANAGE) MODAL ---
const GhostModal = ({ id, onClose }) => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem("owner_token_ceo");
            // ✅ Calls File 1 Route
            const res = await axios.get(`${API_BASE}/api/superadmin/restaurant/${id}/deep-dive`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        };
        load();
    }, [id]);

    const run = async (action, value) => {
        const token = localStorage.getItem("owner_token_ceo");
        const url = `${API_BASE}/api/superadmin/restaurant/${id}`;
        try {
            if(action === 'STATUS') await axios.put(`${url}/status`, { isActive: value }, { headers: { Authorization: `Bearer ${token}` } });
            if(action === 'EXTEND') await axios.put(`${url}/subscription`, {}, { headers: { Authorization: `Bearer ${token}` } });
            
            if(action === 'PASSWORD') {
                const newPass = prompt("Enter New Password:");
                if(newPass) await axios.put(`${url}/password`, { password: newPass }, { headers: { Authorization: `Bearer ${token}` } });
            }
            if(action === 'DELETE') {
                if(confirm("⚠ PERMANENTLY DELETE THIS RESTAURANT?")) {
                    await axios.delete(`${url}`, { headers: { Authorization: `Bearer ${token}` } });
                    onClose();
                }
            }

            if(action !== 'DELETE') alert("Action Successful");
            if(action === 'STATUS') onClose(); 
        } catch(e) { alert("Action Failed"); }
    };

    if(!data) return <div className="modal-bg">Loading Data...</div>;

    return (
        <div className="modal-bg">
            <div className="modal">
                <div className="m-header">
                    <h2>{data.identity.restaurantName}</h2>
                    <FaTimes onClick={onClose} style={{cursor:'pointer'}}/>
                </div>
                
                <div className="m-stats">
                    <div className="box"><span>Total Sales</span><strong>₹{data.stats.totalRevenue}</strong></div>
                    <div className="box"><span>Total Orders</span><strong>{data.stats.totalOrders}</strong></div>
                </div>

                <div className="m-actions">
                    <p>SUBSCRIPTION & ACCESS:</p>
                    {data.identity.isActive ? (
                        <button className="btn-red" onClick={()=>run('STATUS', false)}>
                            <FaBan/> DISABLE & LOCK
                        </button>
                    ) : (
                        <button className="btn-green" onClick={()=>run('STATUS', true)}>
                            <FaCheckCircle/> ENABLE & UNLOCK
                        </button>
                    )}
                    
                    <button className="btn-blue" onClick={()=>run('EXTEND')}>
                        <FaSync/> ADD 30 DAYS VALIDITY
                    </button>

                    <p style={{marginTop:'15px'}}>DANGER ZONE:</p>
                    <div style={{display:'flex', gap:'10px'}}>
                        <button className="btn-grey" onClick={()=>run('PASSWORD')}>
                            <FaKey/> RESET PASSWORD
                        </button>
                        <button className="btn-red" style={{background:'#450a0a'}} onClick={()=>run('DELETE')}>
                            <FaTrash/> DELETE PARTNER
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- STYLES ---
const cssStyles = `
    .ceo-layout { display: flex; height: 100vh; background: #050505; color: white; font-family: 'Inter', sans-serif; }
    
    /* SIDEBAR */
    .sidebar { width: 260px; background: #0a0a0a; border-right: 1px solid #111; padding: 25px; display: flex; flex-direction: column; }
    .logo { font-size: 20px; font-weight: 800; color: white; margin-bottom: 40px; }
    .sidebar nav button { width: 100%; background: none; border: none; color: #666; padding: 12px; text-align: left; cursor: pointer; border-radius: 8px; font-weight: 700; display: flex; gap: 10px; align-items: center; margin-bottom: 5px; }
    .sidebar nav button.active { background: #1a1a1a; color: #f97316; }
    
    .live-box { margin-top: auto; border-top: 1px solid #222; padding-top: 20px; margin-bottom: 20px; }
    .live-box h4 { font-size: 12px; color: #f97316; margin-bottom: 10px; }
    .live-item { font-size: 11px; padding: 6px 0; border-bottom: 1px solid #111; display: flex; justify-content: space-between; color: #aaa; }
    
    .logout { background: #1a0505; color: #ef4444; border: 1px solid #330505; padding: 12px; border-radius: 8px; cursor: pointer; width: 100%; }

    /* CONTENT */
    .main-content { flex: 1; padding: 40px; overflow-y: auto; background: radial-gradient(circle at top right, #110a05 0%, #000 50%); }
    header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    h1 { margin: 0; font-size: 24px; }
    
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #111; padding: 25px; border-radius: 12px; border: 1px solid #222; }
    .stat-card h3 { margin: 0; font-size: 28px; color: #f97316; }
    .stat-card p { margin: 5px 0 0; font-size: 12px; color: #666; text-transform: uppercase; }

    /* TABLE */
    .table-wrapper { background: #111; border-radius: 12px; border: 1px solid #222; overflow: hidden; }
    .dark-table { width: 100%; border-collapse: collapse; }
    .dark-table th { text-align: left; padding: 15px; color: #555; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #222; }
    .dark-table td { padding: 15px; border-bottom: 1px solid #1a1a1a; color: #ddd; font-size: 13px; }
    .pill { padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; }
    .pill.active { background: #064e3b; color: #10b981; }
    .pill.blocked { background: #450a0a; color: #ef4444; }
    .money { font-family: monospace; color: #10b981; font-size: 14px; }
    .manage-btn { background: #222; border: 1px solid #333; color: #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: bold; }

    /* FORM */
    .form-container { max-width: 500px; background: #111; padding: 30px; border-radius: 12px; border: 1px solid #222; }
    .form-container label { font-size: 11px; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase; }
    .form-container input, .form-container textarea { width: 100%; background: black; border: 1px solid #333; padding: 12px; color: white; border-radius: 6px; margin-bottom: 20px; outline: none; }
    .save-btn { width: 100%; background: #f97316; border: none; padding: 15px; border-radius: 8px; font-weight: 800; cursor: pointer; }

    /* MODAL */
    .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(5px); }
    .modal { background: #0a0a0a; width: 450px; padding: 30px; border-radius: 16px; border: 1px solid #333; box-shadow: 0 20px 50px black; }
    .m-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #222; padding-bottom: 20px; margin-bottom: 20px; }
    .m-stats { display: flex; gap: 15px; margin-bottom: 25px; }
    .box { flex: 1; background: #111; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #222; }
    .box span { font-size: 10px; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase; }
    .box strong { font-size: 24px; color: white; }
    
    .m-actions { display: flex; flex-direction: column; gap: 10px; }
    .m-actions p { font-size: 10px; color: #666; margin: 0 0 5px 0; font-weight: bold; }
    .btn-red { background: #450a0a; color: #ef4444; border: 1px solid #ef4444; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-green { background: #064e3b; color: #10b981; border: 1px solid #10b981; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-blue { background: #172554; color: #60a5fa; border: 1px solid #1e40af; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-grey { background: #222; color: #ccc; border: 1px solid #333; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; }
    
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default SuperAdmin;