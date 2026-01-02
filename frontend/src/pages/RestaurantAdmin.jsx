import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import SalesSummary from "./components/SalesSummary"; 
import { 
    FaPlus, FaTrash, FaUtensils, 
    FaBell, FaCheckCircle, FaCircle, FaCrown, FaSignOutAlt, FaRocket, FaStore, FaExternalLinkAlt, FaCopy, FaInbox, FaDownload, FaQrcode
} from "react-icons/fa";

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
.admin-container { min-height: 100vh; padding: 20px; background: radial-gradient(circle at top center, #1a0f0a 0%, #050505 60%); color: white; font-family: 'Inter', sans-serif; }
.max-w-wrapper { max-width: 480px; margin: 0 auto; }
.admin-header { margin-bottom: 30px; }
.header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.shop-title { font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; color: white; }
.badge-pro { background: rgba(255, 153, 51, 0.15); color: #FF9933; border: 1px solid rgba(255, 153, 51, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; }
.btn-glass { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.btn-glass:hover { background: rgba(255, 255, 255, 0.1); }
.btn-primary { background: linear-gradient(135deg, #FF8800 0%, #FF5500 100%); border: none; color: white; width: 100%; padding: 16px; border-radius: 16px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255, 85, 0, 0.4); transition: 0.2s; }
.btn-primary:active { transform: scale(0.98); }
.glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.nav-tabs { display: flex; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 16px; margin-bottom: 24px; }
.tab-btn { flex: 1; padding: 12px; background: transparent; border: none; color: #888; font-size: 11px; font-weight: 900; cursor: pointer; border-radius: 12px; text-transform: uppercase; transition: 0.3s; position: relative; }
.tab-btn.active { background: rgba(255,255,255,0.1); color: #FF9933; }
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 14px; border-radius: 12px; color: white; margin-bottom: 15px; outline: none; transition: 0.3s; }
.input-dark:focus { border-color: #FF9933; background: rgba(0,0,0,0.6); }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.inbox-card { background: rgba(255, 255, 255, 0.05); padding: 15px; border-radius: 15px; margin-bottom: 10px; border-left: 4px solid #FF9933; }
.toast-container { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); width: 90%; max-width: 400px; z-index: 1000; display: flex; flex-direction: column; gap: 10px; }
.toast-alert { background: #FF9933; color: black; padding: 15px; border-radius: 15px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #333; padding: 15px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 12px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; display: block; text-decoration: none; }
.action-btn { background: none; border: none; color: #888; cursor: pointer; padding: 5px; transition: 0.2s; }
.pulse-dot { position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; background: #FF9933; border-radius: 50%; box-shadow: 0 0 0 rgba(255, 153, 51, 0.4); animation: pulse-ring 1.5s infinite; }
@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(255, 153, 51, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 153, 51, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 153, 51, 0); } }
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
    const { id } = useParams();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("menu");
    const [restaurantName, setRestaurantName] = useState(id);
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');
    const [isPro, setIsPro] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [ownerEmail, setOwnerEmail] = useState("");
    const [hasNewOrder, setHasNewOrder] = useState(false); 
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });

    const fetchInbox = async () => {
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        if (!mongoId || mongoId === "undefined" || mongoId === "null") return;
        try {
            const res = await axios.get(`${API_BASE}/orders/inbox`, {
                params: { restaurantId: mongoId }
            });
            setInboxOrders(res.data);
        } catch (err) { console.error("Inbox Rejection Check:", err.response?.data || err.message); }
    };

    useEffect(() => {
        const checkGhostSession = () => {
            const ghostToken = localStorage.getItem(`owner_token_${id}`);
            const ghostId = localStorage.getItem(`owner_id_${id}`);
            if (ghostToken && ghostId && ghostId !== "undefined") {
                setIsAuthenticated(true);
                fetchData(ghostToken, ghostId);
                fetchInbox();
            }
        };
        checkGhostSession();
    }, [id]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            setRestaurantName(res.data.restaurantName);
            setIsPro(res.data.isPro);
            setOwnerEmail(res.data.email || "");
            setIsAuthenticated(true);
            fetchData(res.data.token, res.data._id);
            fetchInbox();
        } catch (err) { alert("❌ Invalid Password"); } finally { setAuthLoading(false); }
    };

    const fetchData = async (token, mongoId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const dishRes = await axios.get(`${API_BASE}/dishes?restaurantId=${mongoId}`, config);
            setDishes(dishRes.data || []);
        } catch (error) { console.error(error); }
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem(`owner_token_${id}`);
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, { ...formData, owner: mongoId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            fetchData(token, mongoId);
            alert("Dish Added Successfully!");
        } catch (err) { alert("Error adding dish"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(token, mongoId);
        } catch (err) { alert("Delete failed"); }
    };

    useEffect(() => {
        if (isAuthenticated) {
            const mongoId = localStorage.getItem(`owner_id_${id}`);
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("join-restaurant", mongoId);
            
            socket.on("new-order", () => {
                fetchInbox();
                if (activeTab !== "inbox") setHasNewOrder(true); 
            });
            
            socket.on("new-waiter-call", (data) => {
                new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
                setActiveAlerts(prev => [...prev, data]);
            });

            socket.on("global-broadcast", (data) => {
                alert(`📢 ADMIN BROADCAST: ${data.title}\n\n${data.message}`);
            });

            const interval = setInterval(fetchInbox, 15000);
            return () => { socket.disconnect(); clearInterval(interval); };
        }
    }, [isAuthenticated, id, activeTab]);

    const handleDownloadAndClear = async () => {
        if (inboxOrders.length === 0) return alert("Inbox is empty!");
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        const doc = new jsPDF();
        doc.text(`Receipt Summary - ${restaurantName}`, 14, 15);
        const tableData = inboxOrders.map((order, i) => [
            i + 1, order.tableNum, order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
            `Rs.${order.totalAmount}`, new Date(order.createdAt).toLocaleTimeString()
        ]);
        doc.autoTable({ startY: 30, head: [['#', 'Table', 'Items', 'Total', 'Time']], body: tableData });
        doc.save(`Receipts_${Date.now()}.pdf`);
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: mongoId });
            setInboxOrders([]);
            alert("Inbox Cleared!");
        } catch (err) { alert("Error clearing database."); }
    };

    const generatePrintableQRs = () => {
        const printWindow = window.open('', '_blank');
        const qrCodesHtml = [];
        for (let i = qrRange.start; i <= qrRange.end; i++) {
            const url = `${window.location.origin}/menu/${id}/${i}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            qrCodesHtml.push(`
                <div style="display:inline-block; margin:20px; padding:20px; border:2px dashed #ccc; text-align:center; font-family:sans-serif; border-radius:15px; width:220px;">
                    <h2 style="margin:0 0 10px 0; color:#FF9933; font-size:18px;">${restaurantName.toUpperCase()}</h2>
                    <img src="${qrSrc}" width="180" height="180" />
                    <p style="margin:10px 0 0 0; font-weight:bold; font-size:20px;">TABLE ${i}</p>
                </div>
            `);
        }
        printWindow.document.write(`<html><body onload="window.print()">${qrCodesHtml.join('')}</body></html>`);
        printWindow.document.close();
    };

    const handleLogout = () => { 
        setIsAuthenticated(false); 
        localStorage.removeItem(`owner_token_${id}`); 
        localStorage.removeItem(`owner_id_${id}`);
    };

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{styles}</style>
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '320px' }}>
                    <FaStore size={40} color="#f97316" style={{ marginBottom: '15px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: '900' }}>{id.toUpperCase()} ADMIN</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} />
                        <button type="submit" className="btn-primary" disabled={authLoading}>{authLoading ? "Unlocking..." : "Access Control"}</button>
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
                            <p style={{ fontSize: '10px', fontWeight: 900 }}>🛎️ TABLE {alert.tableNumber}</p>
                            <p style={{ fontWeight: 900, fontSize: '16px' }}>{alert.type?.toUpperCase()}</p>
                        </div>
                        <button onClick={() => setActiveAlerts(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'black', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px' }}>DONE</button>
                    </div>
                ))}
            </div>

            <div className="max-w-wrapper">
                <header className="admin-header">
                    <div className="header-top">
                        <div>
                            <h1 className="shop-title">{restaurantName}</h1>
                            <div>
                                {isPro ? <span className="badge-pro"><FaCrown /> PRO PLAN</span> : <span className="badge-pro" style={{ color: '#60a5fa', borderColor: '#60a5fa' }}>Trial Plan</span>}
                            </div>
                        </div>
                        <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444' }}><FaSignOutAlt /></button>
                    </div>
                    
                    <div className="menu-link-box">
                        <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="link-text">{publicMenuUrl}</a>
                        <div style={{display:'flex', gap:'5px'}}>
                            <button onClick={() => { navigator.clipboard.writeText(publicMenuUrl); alert("Copied!"); }} className="action-btn"><FaCopy /></button>
                            <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="action-btn"><FaExternalLinkAlt /></a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Link to={`/${id}/chef`} target="_blank" style={{flex:1}}><button className="btn-glass" style={{width:'100%'}}><FaUtensils /> Chef</button></Link>
                        <Link to={`/${id}/waiter`} target="_blank" style={{flex:1}}><button className="btn-glass" style={{width:'100%'}}><FaBell /> Waiter</button></Link>
                    </div>
                </header>

                <SetupWizard dishesCount={dishes.length} pushEnabled={pushEnabled} />

                {isPro && <SalesSummary restaurants={[{ restaurantName, totalRevenue: inboxOrders.reduce((sum, o) => sum + o.totalAmount, 0) }]} />}

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu</button>
                    <button onClick={() => { setActiveTab("inbox"); setHasNewOrder(false); }} className={`tab-btn ${activeTab === "inbox" ? 'active' : ''}`}>
                        Inbox 
                        {inboxOrders.length > 0 && <span style={{background:'#FF9933', color:'black', padding:'2px 6px', borderRadius:'10px', marginLeft:'5px'}}>{inboxOrders.length}</span>}
                        {hasNewOrder && <div className="pulse-dot"></div>}
                    </button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>Setup</button>
                </nav>

                {activeTab === "inbox" && (
                    <div className="glass-card">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                            <h2 style={{fontSize:'14px', fontWeight:900}}><FaInbox color="#FF9933"/> NEW ORDERS</h2>
                            <button onClick={handleDownloadAndClear} className="btn-glass" style={{background:'#FF9933', color:'black', border:'none'}}><FaDownload /> PDF & Clear</button>
                        </div>
                        {inboxOrders.length === 0 ? <p style={{textAlign:'center', padding:'20px'}}>Inbox Empty</p> : 
                            inboxOrders.map(order => (
                                <div key={order._id} className="inbox-card">
                                    <p style={{fontWeight:900, color:'#FF9933', margin:0}}>TABLE {order.tableNum}</p>
                                    <p style={{fontSize:'12px', margin:'5px 0'}}>{order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
                                    <p style={{fontSize:'11px', fontWeight:900}}>Total: Rs.{order.totalAmount}</p>
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === "menu" && (
                    <div className="glass-card">
                        <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px' }}><FaPlus /> ADD ITEM</h2>
                        <form onSubmit={handleAddDish}>
                            <input className="input-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dish Name" required />
                            <input className="input-dark" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Image URL (http://...)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price ₹" required />
                                <select className="input-dark" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary">Save Dish</button>
                        </form>
                        <div style={{ marginTop: '30px' }}>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: '#222', overflow: 'hidden' }}>
                                            {dish.image ? <img src={dish.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <FaUtensils color="#333" style={{margin:'15px'}}/>}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '14px' }}>{dish.name}</p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#FF9933', fontWeight: 900 }}>₹{dish.price} • {dish.category.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="action-btn"><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <>
                        <div className="glass-card">
                            <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '20px' }}>
                                <FaQrcode color="#FF9933" /> Bulk QR Generator
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: 900, display: 'block', marginBottom: '5px' }}>START TABLE</label>
                                    <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({...qrRange, start: parseInt(e.target.value) || 1})} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '10px', color: '#666', fontWeight: 900, display: 'block', marginBottom: '5px' }}>END TABLE</label>
                                    <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({...qrRange, end: parseInt(e.target.value) || 1})} />
                                </div>
                            </div>
                            <button onClick={generatePrintableQRs} className="btn-primary">Generate & Print QRs</button>
                        </div>

                        <div className="glass-card">
                            <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '10px' }}>
                                <FaBell color="#FF9933" /> Nightly Reports
                            </h2>
                            <p style={{ fontSize: '11px', color: '#888', marginBottom: '15px' }}>
                                Receive a sales summary every night at 11:59 PM.
                            </p>
                            <input 
                                className="input-dark" 
                                placeholder="your@email.com" 
                                defaultValue={ownerEmail}
                                onBlur={async (e) => {
                                    const email = e.target.value;
                                    const mongoId = localStorage.getItem(`owner_id_${id}`);
                                    if(email && mongoId) {
                                        try {
                                            await axios.put(`${API_BASE}/auth/update-email`, { restaurantId: mongoId, email });
                                            alert("Email updated!");
                                        } catch (err) { alert("Error updating email."); }
                                    }
                                }}
                            />
                        </div>

                        <div className="glass-card">
                            <h2 style={{ fontSize: '14px', fontWeight: 900, marginBottom: '10px' }}>Staff Alerts</h2>
                            <button onClick={() => Notification.requestPermission()} className="btn-primary">Enable Push Alerts</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RestaurantAdmin;