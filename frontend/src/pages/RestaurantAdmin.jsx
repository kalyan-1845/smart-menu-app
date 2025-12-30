import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import { 
    FaPlus, FaTrash, FaUtensils, 
    FaBell, FaCheckCircle, FaCircle, FaCrown, FaSignOutAlt, FaRocket, FaUnlock, FaStore, FaExternalLinkAlt, FaCopy, FaImage
} from "react-icons/fa";

// --- STYLES (Mobile Optimized & Beautiful) ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
.admin-container { min-height: 100vh; padding: 20px; background: radial-gradient(circle at top center, #1a0f0a 0%, #050505 60%); color: white; font-family: 'Inter', sans-serif; }
.max-w-wrapper { max-width: 480px; margin: 0 auto; }
.admin-header { margin-bottom: 30px; }
.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.shop-title { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; }
.badge-pro { background: rgba(255, 153, 51, 0.15); color: #FF9933; border: 1px solid rgba(255, 153, 51, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; }
.btn-glass { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.btn-glass:hover { background: rgba(255, 255, 255, 0.1); }
.btn-primary { background: linear-gradient(135deg, #FF8800 0%, #FF5500 100%); border: none; color: white; width: 100%; padding: 16px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255, 85, 0, 0.4); transition: 0.2s; }
.btn-primary:active { transform: scale(0.98); }
.glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.nav-tabs { display: flex; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 16px; margin-bottom: 24px; }
.tab-btn { flex: 1; padding: 12px; background: transparent; border: none; color: #888; font-size: 11px; font-weight: 900; cursor: pointer; border-radius: 12px; text-transform: uppercase; transition: 0.3s; }
.tab-btn.active { background: rgba(255,255,255,0.1); color: #FF9933; }
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 12px; color: white; margin-bottom: 15px; outline: none; transition: 0.3s; }
.input-dark:focus { border-color: #FF9933; background: rgba(0,0,0,0.6); }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.dish-item:last-child { border-bottom: none; }
.toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; }
.toast-alert { background: #FF9933; color: black; padding: 15px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: slideDown 0.3s ease-out; }
@keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.lock-container { min-height: 100vh; background: #050505; display: flex; align-items: center; justify-content: center; padding: 20px; }
.lock-card { width: 100%; max-width: 350px; background: #111; padding: 40px; border-radius: 30px; border: 1px solid #222; text-align: center; }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #333; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 12px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; display: block; text-decoration: none; }
.action-btn { background: none; border: none; color: #888; cursor: pointer; padding: 5px; transition: 0.2s; }
.action-btn:hover { color: white; }
`;

const SetupWizard = ({ dishesCount, pushEnabled }) => {
    const steps = [
        { id: 1, label: "Add 3 dishes", done: dishesCount >= 3, hint: "Go to Menu tab" },
        { id: 2, label: "Enable Alerts", done: pushEnabled, hint: "Enable in Settings" }
    ];
    const completed = steps.filter(s => s.done).length;
    const percent = Math.round((completed / steps.length) * 100);

    useEffect(() => {
        if (completed === 2) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FF9933', '#ffffff'] });
    }, [completed]);

    return (
        <div className="glass-card" style={{ borderColor: completed === 2 ? '#22c55e' : 'rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}><FaRocket color="#FF9933" /> Setup Progress</h2>
                <span style={{ color: '#FF9933', fontWeight: 900, fontSize: '12px' }}>{percent}% READY</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: '#FF9933', transition: 'width 0.5s ease' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {steps.map(step => (
                    <div key={step.id} style={{ display: 'flex', gap: '8px', opacity: step.done ? 0.4 : 1 }}>
                        {step.done ? <FaCheckCircle color="#22c55e" /> : <FaCircle color="#333" />}
                        <div>
                            <p style={{ fontWeight: 900, fontSize: '10px', margin: 0, textTransform: 'uppercase' }}>{step.label}</p>
                            {!step.done && <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>{step.hint}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RestaurantAdmin = () => {
    const { id } = useParams(); // This grabs "kalyanresto1" from URL
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    // --- STATE ---
    const [publicMenuUrl, setPublicMenuUrl] = useState(`${window.location.origin}/menu/${id}`);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("menu");
    const [loading, setLoading] = useState(false);
    const [restaurantName, setRestaurantName] = useState(id);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [broadcast, setBroadcast] = useState(null);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
    const [trialEndsAt, setTrialEndsAt] = useState(null);
    const [isPro, setIsPro] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });

    // --- LOGIN HANDLER (FIXED TO UPDATE LINK) ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            
            // SAVE TOKEN
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            
            // UPDATE STATE
            setRestaurantName(res.data.restaurantName);
            setIsPro(res.data.isPro);
            setTrialEndsAt(res.data.trialEndsAt);
            setIsAuthenticated(true);
            
            // ✅ IMPORTANT FIX: Update the link to use the REAL ID (e.g. 65a...), not the username
            const correctLink = `${window.location.origin}/menu/${res.data._id}`;
            setPublicMenuUrl(correctLink);

            // Fetch dishes
            fetchData(res.data.token, res.data._id);
        } catch (err) { alert("❌ Invalid Password"); } finally { setAuthLoading(false); }
    };

    const fetchData = async (token, mongoId) => {
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${mongoId}`, config);
            setDishes(dishRes.data || []);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    // --- LIVE UPDATES ---
    useEffect(() => {
        if (isAuthenticated) {
            const mongoId = localStorage.getItem(`owner_id_${id}`);
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);

            socket.on("new-waiter-call", (data) => {
                new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
                setActiveAlerts(prev => [...prev, data]);
            });

            socket.on('new-broadcast', (data) => {
                setBroadcast(data);
                new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3").play().catch(() => {});
            });

            return () => socket.disconnect();
        }
    }, [isAuthenticated, id]);

    const requestNotificationPermission = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') setPushEnabled(true);
    };

    const handleLogout = () => { 
        setIsAuthenticated(false); 
        setPassword(""); 
        localStorage.removeItem(`owner_token_${id}`);
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem(`owner_token_${id}`);
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, { ...formData, owner: mongoId }, { headers: { Authorization: `Bearer ${token}` } });
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            fetchData(token, mongoId);
        } catch (e) { alert("Error saving dish."); }
    };

    const handleDeleteDish = async (dishId) => {
        if(!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData(token, mongoId);
        } catch (error) { alert("Delete failed."); }
    };

    const calculateDaysLeft = (date) => {
        if (!date) return 0;
        const diff = new Date(date) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicMenuUrl);
        alert("Link Copied! Use this link.");
    };

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{styles}</style>
            <div className="lock-container">
                <div className="lock-card">
                    <FaStore size={40} color="#f97316" style={{ marginBottom: '15px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: '900' }}>{id.toUpperCase()} ADMIN</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input 
                            type="password" placeholder="Password" 
                            value={password} onChange={e => setPassword(e.target.value)} 
                            className="input-dark" style={{ textAlign: 'center' }} 
                            autoComplete="current-password" 
                        />
                        <button type="submit" className="btn-primary" disabled={authLoading}>
                            {authLoading ? "Unlocking..." : <><FaUnlock /> Access Control</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            
            <div className="toast-container">
                {activeAlerts.map((alert, i) => (
                    <div key={i} className="toast-alert">
                        <div>
                            <p style={{ fontSize: '10px', fontWeight: 900, margin: 0 }}>🛎️ TABLE {alert.tableNumber}</p>
                            <p style={{ fontWeight: 900, fontSize: '16px', margin: 0 }}>{alert.type?.toUpperCase()}</p>
                        </div>
                        <button onClick={() => setActiveAlerts(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'black', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>DONE</button>
                    </div>
                ))}
            </div>

            <div className="max-w-wrapper">
                {broadcast && (
                    <div style={{ background: '#3b82f6', color: 'white', padding: '12px', textAlign: 'left', fontSize: '12px', borderRadius: '15px', marginBottom: '20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span>📢 <strong>{broadcast.title}</strong>: {broadcast.message}</span>
                        <button onClick={() => setBroadcast(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight:'bold' }}>✕</button>
                    </div>
                )}

                <header className="admin-header">
                    <div className="header-top">
                        <div>
                            <h1 className="shop-title">{restaurantName}</h1>
                            <div style={{ marginTop: '5px' }}>
                                {isPro ? <span className="badge-pro"><FaCrown /> PRO PLAN</span> : 
                                <span className="badge-pro" style={{ color: '#60a5fa', borderColor: '#60a5fa' }}>Trial: {calculateDaysLeft(trialEndsAt)} Days Left</span>}
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444' }}><FaSignOutAlt /></button>
                    </div>

                    <div className="menu-link-box">
                        <div style={{display:'flex', alignItems:'center', gap:'10px', overflow:'hidden'}}>
                            <div style={{background:'rgba(59,130,246,0.2)', padding:'8px', borderRadius:'8px', color:'#3b82f6'}}>
                                <FaUtensils size={14} />
                            </div>
                            <div style={{overflow:'hidden'}}>
                                <p style={{fontSize:'10px', color:'#888', margin:0, fontWeight:'bold'}}>CUSTOMER MENU LINK</p>
                                {/* THIS IS THE FIXED LINK */}
                                <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="link-text">{publicMenuUrl}</a>
                            </div>
                        </div>
                        <div style={{display:'flex', gap:'5px'}}>
                            <button onClick={copyToClipboard} className="action-btn"><FaCopy /></button>
                            <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="action-btn"><FaExternalLinkAlt /></a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to={`/${id}/chef`} target="_blank" style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="btn-glass" style={{ width: '100%', justifyContent: 'center' }}>
                                <FaUtensils /> Chef KDS
                            </button>
                        </Link>
                        <Link to={`/${id}/waiter`} target="_blank" style={{ flex: 1, textDecoration: 'none' }}>
                            <button className="btn-glass" style={{ width: '100%', justifyContent: 'center' }}>
                                <FaBell /> Waiter Desk
                            </button>
                        </Link>
                    </div>
                </header>

                <SetupWizard dishesCount={dishes.length} pushEnabled={pushEnabled} />

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu</button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>Setup</button>
                </nav>

                {activeTab === "menu" ? (
                    <div className="glass-card">
                        <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px' }}><FaPlus /> ADD ITEM</h2>
                        <form onSubmit={handleAddDish}>
                            <input className="input-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dish Name" required />
                            <input className="input-dark" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Image URL (e.g. https://...)" />
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price ₹" required />
                                <select className="input-dark" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Starters</option><option>Main Course</option><option>Fast Food</option><option>Dessert</option><option>Beverages</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary">Save Dish</button>
                        </form>
                        <div style={{ marginTop: '30px' }}>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#222', overflow: 'hidden' }}>
                                            {dish.image ? (
                                                <img src={dish.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FaUtensils color="#333" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '14px' }}>{dish.name}</p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#FF9933', fontWeight: 900 }}>₹{dish.price} • {dish.category.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="glass-card">
                        <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '10px' }}>Staff Alerts</h2>
                        <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>Enable notifications to receive Table Help requests on this device.</p>
                        <button onClick={requestNotificationPermission} className="btn-primary" style={{ background: pushEnabled ? 'rgba(34, 197, 94, 0.1)' : null, color: pushEnabled ? '#22c55e' : 'white', border: pushEnabled ? '1px solid #22c55e' : 'none', boxShadow: 'none' }}>
                            <FaBell /> {pushEnabled ? 'Alerts are ON' : 'Turn On Alerts'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantAdmin;