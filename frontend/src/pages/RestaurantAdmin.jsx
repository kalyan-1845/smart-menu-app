import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import InstallButton from "../components/InstallButton"; // ✅ Added Install
import { 
    FaPlus, FaTrash, FaUtensils, FaLink,
    FaBell, FaCheckCircle, FaCircle, FaCrown, FaSignOutAlt, FaRocket, FaStore, FaExternalLinkAlt, FaCopy, FaInbox, FaDownload, FaQrcode
} from "react-icons/fa";

// --- STYLES (Optimized for Speed & Mobile) ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
.admin-container { min-height: 100vh; padding: 15px; background: radial-gradient(circle at top center, #1a0f0a 0%, #050505 60%); color: white; font-family: 'Inter', sans-serif; -webkit-tap-highlight-color: transparent; }
.max-w-wrapper { max-width: 480px; margin: 0 auto; }
.shop-title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; color: white; }
.badge-pro { background: rgba(255, 153, 51, 0.15); color: #FF9933; border: 1px solid rgba(255, 153, 51, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; }
.btn-glass { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.btn-primary { background: linear-gradient(135deg, #FF8800 0%, #FF5500 100%); border: none; color: white; width: 100%; padding: 18px; border-radius: 18px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255, 85, 0, 0.4); touch-action: manipulation; }
.glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border-radius: 28px; padding: 22px; margin-bottom: 20px; }
.nav-tabs { display: flex; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 18px; margin-bottom: 20px; }
.tab-btn { flex: 1; padding: 14px; background: transparent; border: none; color: #666; font-size: 11px; font-weight: 900; cursor: pointer; border-radius: 14px; text-transform: uppercase; transition: 0.3s; }
.tab-btn.active { background: rgba(255,255,255,0.1); color: #FF9933; }
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 14px; color: white; margin-bottom: 15px; outline: none; box-sizing: border-box; font-size: 16px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.inbox-card { background: rgba(255, 255, 255, 0.05); padding: 18px; border-radius: 20px; margin-bottom: 12px; border-left: 4px solid #FF9933; }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #444; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; text-decoration: none; }
.pulse-dot { position: absolute; top: 10px; right: 10px; width: 10px; height: 10px; background: #FF9933; border-radius: 50%; animation: pulse-ring 1.5s infinite; }
@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(255, 153, 51, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 153, 51, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 153, 51, 0); } }
`;

// --- SETUP WIZARD COMPONENT ---
const SetupWizard = ({ dishesCount, pushEnabled }) => {
    const steps = [
        { id: 1, label: "Add 3 dishes", done: dishesCount >= 3 },
        { id: 2, label: "Live Alerts", done: pushEnabled }
    ];
    const completed = steps.filter(s => s.done).length;
    const percent = Math.round((completed / steps.length) * 100);

    useEffect(() => {
        if (completed === 2) confetti({ particleCount: 100, spread: 60, origin: { y: 0.8 }, colors: ['#FF9933', '#ffffff'] });
    }, [completed]);

    return (
        <div className="glass-card" style={{ border: completed === 2 ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h2 style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', color: '#666' }}><FaRocket /> Setup Progress</h2>
                <span style={{ color: '#FF9933', fontWeight: 900, fontSize: '12px' }}>{percent}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#111', borderRadius: '10px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: '#FF9933', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {steps.map(step => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step.done ? 0.4 : 1 }}>
                        {step.done ? <FaCheckCircle color="#22c55e" size={12}/> : <FaCircle color="#222" size={12}/>}
                        <span style={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase' }}>{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
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
    const [hasNewOrder, setHasNewOrder] = useState(false); 
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });

    const refreshData = useCallback(async (mongoId) => {
        try {
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${mongoId}`),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${mongoId}`)
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
        } catch (e) { console.error("Sync Failed", e); }
    }, [API_BASE]);

    useEffect(() => {
        const ghostToken = localStorage.getItem(`owner_token_${id}`);
        const ghostId = localStorage.getItem(`owner_id_${id}`);
        if (ghostToken && ghostId) {
            setIsAuthenticated(true);
            refreshData(ghostId);
        }
    }, [id, refreshData]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            setRestaurantName(res.data.restaurantName);
            setIsPro(res.data.isPro);
            setIsAuthenticated(true);
            refreshData(res.data._id);
        } catch (err) { alert("❌ Incorrect Password"); } finally { setAuthLoading(false); }
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        const mongoId = localStorage.getItem(`owner_id_${id}`); 
        try {
            await axios.post(`${API_BASE}/dishes`, 
                { ...formData, restaurantId: mongoId }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem(`owner_token_${id}`)}` } }
            );
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            refreshData(mongoId);
            alert("✅ Added to Menu");
        } catch (err) { alert("Error adding dish"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this?")) return;
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem(`owner_token_${id}`)}` }
            });
            refreshData(mongoId);
        } catch (err) { alert("Delete failed"); }
    };

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
        doc.save(`Orders_${Date.now()}.pdf`);
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: mongoId });
            setInboxOrders([]);
            alert("Database Cleared & Saved");
        } catch (err) { alert("Error clearing database."); }
    };

    const generatePrintableQRs = () => {
        const printWindow = window.open('', '_blank');
        const qrCodesHtml = [];
        for (let i = qrRange.start; i <= qrRange.end; i++) {
            const url = `${window.location.origin}/menu/${id}/${i}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
            qrCodesHtml.push(`
                <div style="display:inline-block; margin:25px; padding:25px; border:2px solid #000; text-align:center; font-family:Inter,sans-serif; border-radius:25px; width:260px;">
                    <h2 style="margin:0 0 15px 0; color:#FF9933; font-size:20px; font-weight:900;">${restaurantName.toUpperCase()}</h2>
                    <img src="${qrSrc}" width="220" height="220" />
                    <p style="margin:15px 0 0 0; font-weight:900; font-size:24px;">TABLE ${i}</p>
                    <p style="margin:5px 0 0 0; font-size:10px; color:#666;">SCAN TO ORDER</p>
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
        window.location.reload();
    };

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{styles}</style>
            <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '100%', maxWidth: '340px' }}>
                    <FaStore size={45} color="#FF9933" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '22px', fontWeight: 900 }}>{id.toUpperCase()} ACCESS</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '25px' }}>
                        <input type="password" placeholder="Unique Access Key" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} autoFocus />
                        <button type="submit" className="btn-primary" disabled={authLoading}>{authLoading ? "AUTHENTICATING..." : "ENTER DASHBOARD"}</button>
                    </form>
                    <p style={{fontSize: '11px', color: '#444', marginTop: '20px', fontWeight: 'bold'}}>AUTHORISED PERSONNEL ONLY</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            
            <div className="max-w-wrapper">
                <header>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                        <div>
                            <h1 className="shop-title">{restaurantName}</h1>
                            {isPro ? <span className="badge-pro"><FaCrown /> PRO</span> : <span className="badge-pro" style={{ color: '#60a5fa', borderColor: '#60a5fa' }}>Trial</span>}
                        </div>
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            {/* 🚀 Install Button Integrated */}
                            <InstallButton />
                            <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444', padding: '12px' }}><FaSignOutAlt /></button>
                        </div>
                    </div>
                    
                    <div className="menu-link-box">
                        <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="link-text">{publicMenuUrl}</a>
                        <div style={{display:'flex', gap:'8px'}}>
                            <button onClick={() => { navigator.clipboard.writeText(publicMenuUrl); alert("Copied!"); }} className="btn-glass" style={{padding:'10px'}}><FaCopy /></button>
                            <a href={publicMenuUrl} target="_blank" rel="noreferrer" className="btn-glass" style={{padding:'10px'}}><FaExternalLinkAlt /></a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '25px' }}>
                        <Link to={`/${id}/chef`} target="_blank" style={{flex:1}}><button className="btn-glass" style={{width:'100%', height: '50px'}}><FaUtensils /> KITCHEN</button></Link>
                        <Link to={`/${id}/waiter`} target="_blank" style={{flex:1}}><button className="btn-glass" style={{width:'100%', height: '50px'}}><FaBell /> WAITER</button></Link>
                    </div>
                </header>

                <SetupWizard dishesCount={dishes.length} pushEnabled={pushEnabled} />

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu</button>
                    <button onClick={() => { setActiveTab("inbox"); setHasNewOrder(false); }} className={`tab-btn ${activeTab === "inbox" ? 'active' : ''}`}>
                        Inbox {inboxOrders.length > 0 && <span style={{background:'#FF9933', color:'black', padding:'2px 6px', borderRadius:'10px'}}>{inboxOrders.length}</span>}
                        {hasNewOrder && <div className="pulse-dot"></div>}
                    </button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>QR Code</button>
                </nav>

                {activeTab === "menu" && (
                    <div className="glass-card animate-in fade-in duration-500">
                        <h2 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '20px', color: '#666' }}><FaPlus /> ADD NEW ITEM</h2>
                        <form onSubmit={handleAddDish}>
                            <input className="input-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Item Name (e.g. Pizza)" required />
                            <input className="input-dark" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Image URL (optional)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price ₹" required />
                                <select className="input-dark" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary">PUBLISH TO MENU</button>
                        </form>

                        <div style={{ marginTop: '35px' }}>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <img src={dish.image || "https://placehold.co/100x100/111/orange?text=Food"} alt="" style={{ width: '45px', height: '45px', borderRadius: '12px', objectFit: 'cover' }} />
                                        <div>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '13px' }}>{dish.name}</p>
                                            <p style={{ margin: 0, fontSize: '10px', color: '#FF9933', fontWeight: 900 }}>₹{dish.price} • {dish.category.toUpperCase()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{padding:'10px', color:'#ef4444'}}><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "inbox" && (
                    <div className="glass-card animate-in slide-in-from-bottom duration-500">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
                            <h2 style={{fontSize:'13px', fontWeight:900, color:'#666'}}><FaInbox /> RECENT ORDERS</h2>
                            <button onClick={handleDownloadAndClear} className="btn-glass" style={{background:'#FF9933', color:'black', border:'none'}}><FaDownload /> PDF & Reset</button>
                        </div>
                        {inboxOrders.length === 0 ? <div style={{textAlign:'center', padding:'40px', color:'#444'}}><FaInbox size={30}/><p>Inbox is clean</p></div> : 
                            inboxOrders.map(order => (
                                <div key={order._id} className="inbox-card">
                                    <p style={{fontWeight:900, color:'#FF9933', margin:0, fontSize: '14px'}}>TABLE {order.tableNum}</p>
                                    <p style={{fontSize:'12px', margin:'8px 0', color: '#bbb'}}>{order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
                                    <p style={{fontSize:'11px', fontWeight:900}}>TOTAL: Rs.{order.totalAmount}</p>
                                </div>
                            ))
                        }
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="glass-card">
                        <h2 style={{ fontSize: '13px', fontWeight: 900, marginBottom: '20px', color: '#666' }}><FaQrcode /> QR SYSTEM</h2>
                        <p style={{fontSize: '11px', color: '#888', marginBottom: '20px'}}>Generate QR codes for your tables. Each QR is unique to the table number.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                            <div>
                                <label style={{fontSize:'10px', fontWeight:900, color:'#555', marginLeft:'5px'}}>START TABLE</label>
                                <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({...qrRange, start: parseInt(e.target.value) || 1})} />
                            </div>
                            <div>
                                <label style={{fontSize:'10px', fontWeight:900, color:'#555', marginLeft:'5px'}}>END TABLE</label>
                                <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({...qrRange, end: parseInt(e.target.value) || 1})} />
                            </div>
                        </div>
                        <button onClick={generatePrintableQRs} className="btn-primary">GENERATE PRINTABLE SHEET</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantAdmin;