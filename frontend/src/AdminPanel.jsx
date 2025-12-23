import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import { generateMonthlyReport } from "./utils/ReportGenerator";
import "./AdminPanel.css"; 

// 🎨 Icons
import { 
    FaPlus, FaTrash, FaDownload, FaCog, FaUtensils, FaWallet, 
    FaBell, FaCheckCircle, FaCircle, FaCrown, FaSignOutAlt, FaRocket, FaImage
} from "react-icons/fa";

// --- SUB-COMPONENT: SETUP WIZARD ---
const SetupWizard = ({ dishesCount, upiId, pushEnabled }) => {
    const steps = [
        { id: 1, label: "Add 3 dishes", done: dishesCount >= 3, hint: "Go to Menu tab" },
        { id: 2, label: "Add UPI ID", done: !!upiId, hint: "Go to Settings" },
        { id: 3, label: "Enable Alerts", done: pushEnabled, hint: "Click Notification button" }
    ];

    const completed = steps.filter(s => s.done).length;
    const percent = Math.round((completed / steps.length) * 100);

    useEffect(() => {
        if (completed === 3) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FF9933', '#ffffff', '#00ff00'] });
        }
    }, [completed]);

    if (completed === 3) return (
        <div className="glass-card" style={{ borderColor: '#22c55e', background: 'rgba(34, 197, 94, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '20px', color: '#22c55e', margin: 0, fontWeight: 900, textTransform: 'uppercase' }}>Your Shop is Live! 🎉</h2>
                    <p style={{ fontSize: '12px', color: '#888', margin: 0, fontWeight: 700 }}>System operational.</p>
                </div>
                <FaCheckCircle size={32} color="#22c55e" />
            </div>
        </div>
    );

    return (
        <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FaRocket color="#FF9933" /> Setup Progress
                    </h2>
                    <p style={{ fontSize: '10px', color: '#666', fontWeight: 700, textTransform: 'uppercase' }}>Complete steps to go live</p>
                </div>
                <span style={{ color: '#FF9933', fontWeight: 900, fontSize: '12px' }}>{percent}% READY</span>
            </div>
            
            <div className="setup-progress-bar">
                <div className="setup-progress-fill" style={{ width: `${percent}%` }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {steps.map(step => (
                    <div key={step.id} className="step-row" style={{ opacity: step.done ? 0.5 : 1 }}>
                        {step.done ? <FaCheckCircle color="#22c55e" /> : <FaCircle color="#333" />}
                        <div>
                            <p style={{ fontWeight: 800, fontSize: '12px', margin: 0, textTransform: 'uppercase' }}>{step.label}</p>
                            {!step.done && <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>{step.hint}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const AdminPanel = () => {
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("menu"); 
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState("Admin");
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [broadcast, setBroadcast] = useState(null);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');

    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    const userRole = localStorage.getItem("userRole") || "OWNER";
    const [trialEndsAt, setTrialEndsAt] = useState(null);
    const [isPro, setIsPro] = useState(false);

    // Data State
    const [dishes, setDishes] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    
    // Settings State
    const [upiId, setUpiId] = useState(localStorage.getItem("restaurantUPI") || "");
    // 🟢 UPDATED FORM STATE: Added 'image'
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });

    // --- API SYNC ---
    const fetchData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const [nameRes, dishRes, historyRes, expRes] = await Promise.all([
                axios.get(`${API_BASE}/auth/restaurant/${ownerId}`, config),
                axios.get(`${API_BASE}/dishes?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/orders?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/expenses?restaurantId=${ownerId}`, config),
            ]);

            setRestaurantName(nameRes.data.username || "Owner");
            setTrialEndsAt(nameRes.data.trialEndsAt);
            setIsPro(nameRes.data.isPro);
            
            if (nameRes.data.upiId) {
                setUpiId(nameRes.data.upiId);
                localStorage.setItem("restaurantUPI", nameRes.data.upiId);
            }

            setDishes(dishRes.data || []);
            setHistoryData(Array.isArray(historyRes.data) ? historyRes.data : []); 
            setExpenses(expRes.data || []);

        } catch (error) {
            console.error("Portal Sync Error:", error);
            if (error.response?.status === 401) handleLogout();
        } finally { setLoading(false); }
    };

    // --- EFFECTS ---
    useEffect(() => {
        fetchData();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.emit("join-owner-room", ownerId);
        
        socket.on("waiter-call", (data) => {
            new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
            setActiveAlerts(prev => [...prev, { ...data, time: new Date().toLocaleTimeString() }]);
        });

        socket.on('new-broadcast', (data) => {
            setBroadcast(data);
            new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3").play();
        });

        return () => socket.disconnect();
    }, [ownerId]);

    // --- HANDLERS ---
    const handleLogout = () => { 
        localStorage.clear();
        navigate("/"); 
    };

    const subscribeToPush = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setPushEnabled(true);
            alert("🔔 Notifications Active!");
        }
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/dishes`, { ...formData, owner: ownerId }, { headers: { Authorization: `Bearer ${token}` } });
            // 🟢 RESET FORM INCLUDING IMAGE
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            fetchData();
        } catch (e) { alert("Error saving dish."); }
    };

    const handleDeleteDish = async (dishId) => {
        if(window.confirm("Delete this dish?")) { 
            try {
                await axios.delete(`${API_BASE}/dishes/${dishId}`, {headers:{Authorization:`Bearer ${token}`}}); 
                fetchData();
            } catch(e) { console.error(e); }
        }
    };

    const handleSaveUPI = async () => {
        localStorage.setItem("restaurantUPI", upiId);
        try {
            await axios.put(`${API_BASE}/auth/restaurant/${ownerId}`, 
                { upiId: upiId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("UPI ID Saved & Synced to Cloud! ☁️");
        } catch (e) {
            console.error(e);
            alert("UPI Saved locally (Cloud sync failed).");
        }
    };

    const calculateDaysLeft = (date) => {
        if (!date) return 0;
        const diff = new Date(date) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const totalRevenue = historyData.reduce((s, o) => s + (parseFloat(o.totalAmount) || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    if (loading) return <div className="admin-container" style={{display:'flex', justifyContent:'center', alignItems:'center'}}>LOADING CLOUD DATA...</div>;

    return (
        <div className="admin-container">
            
            {/* 1. BROADCAST BANNER */}
            {broadcast && (
                <div className="broadcast-banner">
                    <span>📢 {broadcast.title}: {broadcast.message}</span>
                    <button onClick={() => setBroadcast(null)} className="broadcast-close">✕</button>
                </div>
            )}

            {/* 2. LIVE ALERTS (TOASTS) */}
            <div className="toast-container">
                {activeAlerts.map((alert, i) => (
                    <div key={i} className="toast-alert">
                        <div>
                            <p style={{fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', margin:0}}>🛎️ Table {alert.tableNumber}</p>
                            <p style={{fontWeight: 900, fontSize: '16px', margin:0}}>{alert.type?.toUpperCase()}!</p>
                        </div>
                        <button onClick={() => setActiveAlerts(prev => prev.filter((_, idx) => idx !== i))} style={{background:'black', color:'white', border:'none', borderRadius:'5px', padding:'5px 10px', cursor:'pointer', fontWeight:'bold'}}>OK</button>
                    </div>
                ))}
            </div>

            <div className="max-w-wrapper">
                {/* 3. HEADER */}
                <header className="admin-header">
                    <div className="header-top">
                        <div>
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                <h1 className="shop-title">{restaurantName}</h1>
                                {isPro ? <span className="badge-pro"><FaCrown/> PRO</span> : 
                                    <span className="badge-pro" style={{color:'#60a5fa', borderColor:'#60a5fa'}}>
                                        Trial: {calculateDaysLeft(trialEndsAt)} Days
                                    </span>
                                }
                            </div>
                            <p style={{color:'#666', fontSize:'12px', fontWeight:700, marginTop:'5px', textTransform:'uppercase'}}>Node v2.8 • Role: {userRole}</p>
                        </div>
                    </div>
                    
                    <div className="header-actions">
                        <Link to="/chef" target="_blank">
                            <button className="btn-glass"><FaUtensils /> Kitchen Node</button>
                        </Link>
                        <button onClick={handleLogout} className="btn-glass" style={{borderColor:'rgba(239, 68, 68, 0.3)', color:'#ef4444'}}>
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </header>

                {/* 4. SETUP WIZARD */}
                {userRole === "OWNER" && (
                    <SetupWizard 
                        dishesCount={dishes.length} 
                        upiId={upiId} 
                        pushEnabled={pushEnabled} 
                    />
                )}

                {/* 5. NAVIGATION TABS */}
                <nav className="nav-tabs">
                    {['menu', 'history', 'settings'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
                            {tab}
                        </button>
                    ))}
                </nav>

                {/* 6. CONTENT AREA */}
                
                {/* --- TAB: MENU --- */}
                {activeTab === "menu" && (
                    <div className="menu-grid">
                        <div className="glass-card">
                            <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom:'20px', color: '#FF9933' }}><FaPlus /> Create Item</h2>
                            <form onSubmit={handleAddDish}>
                                <input 
                                    className="input-dark" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                    placeholder="Dish Name" 
                                    required 
                                />
                                
                                {/* 🟢 ADDED IMAGE INPUT */}
                                <div style={{position: 'relative'}}>
                                    <FaImage style={{position:'absolute', top: '15px', right: '15px', color: '#666'}}/>
                                    <input 
                                        className="input-dark" 
                                        value={formData.image} 
                                        onChange={e => setFormData({...formData, image: e.target.value})} 
                                        placeholder="Image URL (Optional)" 
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Price ₹" required />
                                    <select className="input-dark" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn-primary">Publish to Menu</button>
                            </form>
                        </div>
                        
                        <div className="glass-card">
                            <h2 style={{ fontSize: '18px', fontWeight: 900, textTransform: 'uppercase', marginBottom:'20px' }}>Active Dishes ({dishes.length})</h2>
                            <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                {dishes.map(dish => (
                                    <div key={dish._id} className="dish-item">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            {/* Show Image if available, else show Icon */}
                                            {dish.image ? 
                                                <img src={dish.image} alt="" style={{width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover'}} /> 
                                                : <FaUtensils color="#444" size={20} />
                                            }
                                            <div>
                                                <p style={{ fontWeight: 800, margin: 0, fontSize: '14px' }}>{dish.name}</p>
                                                <p style={{ margin: 0, fontSize: '11px', color: '#FF9933', fontWeight: 700, textTransform: 'uppercase' }}>₹{dish.price} • {dish.category}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteDish(dish._id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><FaTrash /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: HISTORY --- */}
                {activeTab === "history" && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', margin:0 }}>Business Analytics</h2>
                            <button onClick={() => generateMonthlyReport(restaurantName, historyData, expenses, dishes)} className="btn-download">
                                <FaDownload /> Download Report
                            </button>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Total Revenue</p>
                                <p className="stat-val">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="stat-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                                <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Total Costs</p>
                                <p className="stat-val text-red">₹{totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className="stat-card" style={{ borderColor: netProfit >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)', background: netProfit >= 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                                <p style={{ fontSize: '10px', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Net Profit</p>
                                <p className={`stat-val ${netProfit >= 0 ? 'text-green' : 'text-red'}`}>₹{netProfit.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === "settings" && (
                    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', marginBottom:'30px', color: '#FF9933', display:'flex', alignItems:'center', gap:'10px' }}><FaCog /> Configuration</h2>
                        
                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'block' }}>Push Alerts (PWA)</label>
                            <button onClick={subscribeToPush} className="btn-primary" style={{ background: pushEnabled ? 'rgba(34, 197, 94, 0.1)' : null, color: pushEnabled ? '#22c55e' : 'white', border: pushEnabled ? '1px solid #22c55e' : 'none' }}>
                                <FaBell /> {pushEnabled ? ' NOTIFICATIONS ACTIVE' : ' ENABLE ORDER NOTIFICATIONS'}
                            </button>
                        </div>

                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 900, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px', display: 'block' }}>Merchant UPI ID</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input className="input-dark" style={{ marginBottom: 0 }} value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="restaurant@okaxis" />
                                <button onClick={handleSaveUPI} className="btn-glass" style={{ background: 'white', color: 'black' }}>SAVE</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <footer style={{ marginTop: '50px', textAlign: 'center', opacity: 0.3, paddingBottom: '30px' }}>
                <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Smart Menu Cloud v2.8 • Secured System</p>
            </footer>
        </div>
    );
};

export default AdminPanel;