import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";
import { 
    FaTrash, FaUtensils, FaBell, FaCheckCircle, FaCircle, FaCrown, 
    FaSignOutAlt, FaRocket, FaStore, FaCopy, 
    FaDownload, FaQrcode, FaPlus, FaHistory
} from "react-icons/fa";
import { toast } from "react-hot-toast";

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
.tab-btn { flex: 1; padding: 14px; background: transparent; border: none; color: #666; font-size: 11px; font-weight: 900; cursor: pointer; border-radius: 14px; text-transform: uppercase; transition: 0.3s; position: relative; }
.tab-btn.active { background: rgba(255,255,255,0.1); color: #FF9933; }
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 14px; color: white; margin-bottom: 15px; outline: none; box-sizing: border-box; font-size: 16px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #444; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; text-decoration: none; }
`;

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
                <h2 style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#666', letterSpacing: '1px' }}><FaRocket /> Setup Progress</h2>
                <span style={{ color: '#FF9933', fontWeight: 900, fontSize: '12px' }}>{percent}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#111', borderRadius: '10px', marginBottom: '15px', overflow: 'hidden' }}>
                <div style={{ width: `${percent}%`, height: '100%', background: '#FF9933', transition: 'width 0.8s ease-in-out' }}></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {steps.map(step => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: step.done ? 0.4 : 1 }}>
                        {step.done ? <FaCheckCircle color="#22c55e" size={12}/> : <FaCircle color="#222" size={12}/>}
                        <span style={{ fontWeight: 900, fontSize: '9px', textTransform: 'uppercase' }}>{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RestaurantAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
    const API_BASE = `${SERVER_URL}/api`;
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("menu");
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [isPro, setIsPro] = useState(false);
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });

    // ✅ REFRESH ENGINE
    const refreshData = useCallback(async (mongoId) => {
        if (!mongoId || mongoId === "undefined") return;
        try {
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${mongoId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${mongoId}&t=${Date.now()}`)
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
        } catch (e) { 
            console.error("Sync Error");
            if (e.response?.status === 401) handleLogout();
        }
    }, [API_BASE]);

    useEffect(() => {
        const token = localStorage.getItem(`owner_token_${id}`);
        const savedId = localStorage.getItem(`owner_id_${id}`);
        if (token && savedId) {
            setIsAuthenticated(true);
            refreshData(savedId);
        }
    }, [id, refreshData]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            setRestaurantName(res.data.restaurantName);
            setIsPro(res.data.isPro);
            setIsAuthenticated(true);
            refreshData(res.data._id);
            toast.success("Dashboard Unlocked");
        } catch (err) { toast.error("Invalid Key"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`owner_token_${id}`);
        localStorage.removeItem(`owner_id_${id}`);
        setIsAuthenticated(false);
        navigate("/login");
    };

    // ✅ ADD DISH (Fixes 401 error)
    const handleAddDish = async (e) => {
        e.preventDefault();
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`);

        if (!token) {
            toast.error("Session expired. Please login again.");
            return handleLogout();
        }

        try {
            await axios.post(
                `${API_BASE}/dishes`, 
                { ...formData, restaurantId: mongoId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            refreshData(mongoId);
            toast.success("Dish Added");
        } catch (err) { 
            if (err.response?.status === 401) {
                toast.error("Session expired");
                handleLogout();
            } else {
                toast.error("Error adding dish");
            }
        }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const mongoId = localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refreshData(mongoId);
            toast.success("Dish Removed");
        } catch (err) { toast.error("Failed"); }
    };

    const handleDownloadAndClear = async () => {
        if (inboxOrders.length === 0) return toast.error("No data to export");
        const doc = new jsPDF();
        doc.text(`Sales Report - ${restaurantName}`, 14, 15);
        const tableData = inboxOrders.map((order, i) => [
            i + 1, 
            order.tableNum, 
            order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
            `Rs.${order.totalAmount}`, 
            new Date(order.createdAt).toLocaleTimeString()
        ]);
        autoTable(doc, { startY: 30, head: [['#', 'Table', 'Items', 'Amount', 'Time']], body: tableData });
        doc.save(`Sales_${Date.now()}.pdf`);
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: localStorage.getItem(`owner_id_${id}`) });
            setInboxOrders([]);
            toast.success("Report Saved & Inbox Cleared");
        } catch (err) { toast.error("Error clearing inbox"); }
    };

    const generatePrintableQRs = () => {
        const printWindow = window.open('', '_blank');
        const qrCodesHtml = [];
        for (let i = qrRange.start; i <= qrRange.end; i++) {
            const url = `${window.location.origin}/menu/${id}/${i}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
            qrCodesHtml.push(`
                <div style="display:inline-block; margin:20px; padding:25px; border:2px solid #000; text-align:center; border-radius:30px; width:240px; font-family:sans-serif;">
                    <h2 style="color:#FF9933; margin:0;">${restaurantName.toUpperCase()}</h2>
                    <img src="${qrSrc}" width="200" style="margin:15px 0;" />
                    <p style="font-weight:900; font-size:24px; margin:0;">TABLE ${i}</p>
                </div>
            `);
        }
        printWindow.document.write(`<html><body onload="window.print()">${qrCodesHtml.join('')}</body></html>`);
        printWindow.document.close();
    };

    if (!isAuthenticated) return (
        <div className="admin-container"><style>{styles}</style>
            <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '320px' }}>
                    <FaStore size={40} color="#FF9933" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: 900 }}>RESTRICTED AREA</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input type="password" placeholder="Access Key" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} autoFocus />
                        <button type="submit" className="btn-primary">AUTHENTICATE</button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            <div className="max-w-wrapper">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 className="shop-title">{restaurantName}</h1>
                        <span className="badge-pro">{isPro ? <><FaCrown /> PRO PLAN</> : 'FREE TRIAL'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <InstallButton />
                        <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444' }}><FaSignOutAlt /></button>
                    </div>
                </header>

                <div className="menu-link-box">
                    <span className="link-text">{publicMenuUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(publicMenuUrl); toast.success("Link Copied!"); }} className="btn-glass" style={{ padding: '8px' }}><FaCopy /></button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <Link to={`/${id}/chef`} target="_blank" style={{ flex: 1 }}><button className="btn-glass" style={{ width: '100%', height: '50px' }}><FaUtensils /> KITCHEN</button></Link>
                    <Link to={`/${id}/waiter`} target="_blank" style={{ flex: 1 }}><button className="btn-glass" style={{ width: '100%', height: '50px' }}><FaBell /> WAITER</button></Link>
                </div>

                <SetupWizard dishesCount={dishes.length} pushEnabled={Notification.permission === 'granted'} />

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu Editor</button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>Business Tools</button>
                </nav>

                {activeTab === "menu" && (
                    <div className="glass-card">
                        <form onSubmit={handleAddDish}>
                            <input className="input-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dish Name" required />
                            <input className="input-dark" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Image URL (Direct Link)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price (₹)" required />
                                <select className="input-dark" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary"><FaPlus /> SAVE TO MENU</button>
                        </form>
                        <div style={{ marginTop: '20px' }}>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#111', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {dish.image ? <img src={dish.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <FaUtensils color="#333"/>}
                                        </div>
                                        <div><p style={{ fontWeight: 900, margin: 0, fontSize: '13px' }}>{dish.name}</p><p style={{ margin: 0, fontSize: '10px', color: '#FF9933' }}>₹{dish.price}</p></div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{ color: '#ef4444' }}><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <>
                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaHistory /> RECENT SALES ({inboxOrders.length})</h2>
                            <p style={{ fontSize: '11px', color: '#666', marginBottom: '15px' }}>Download your orders into a PDF before clearing the inbox.</p>
                            <button onClick={handleDownloadAndClear} className="btn-primary" style={{ background: '#22c55e', color: 'white' }}><FaDownload /> GENERATE SALES REPORT</button>
                        </div>

                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaQrcode /> QR CODE GENERATOR</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{fontSize:'9px', color:'#666', marginLeft:'5px'}}>START TABLE</label>
                                    <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({ ...qrRange, start: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{fontSize:'9px', color:'#666', marginLeft:'5px'}}>END TABLE</label>
                                    <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({ ...qrRange, end: e.target.value })} />
                                </div>
                            </div>
                            <button onClick={generatePrintableQRs} className="btn-primary"><FaQrcode /> PRINT TABLE STICKERS</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RestaurantAdmin;