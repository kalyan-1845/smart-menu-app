import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import io from "socket.io-client";
import confetti from "canvas-confetti";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import InstallButton from "../components/InstallButton";
import { 
    FaPlus, FaTrash, FaUtensils, FaLink,
    FaBell, FaCheckCircle, FaCircle, FaCrown, FaSignOutAlt, FaRocket, FaStore, FaExternalLinkAlt, FaCopy, FaInbox, FaDownload, FaQrcode, FaSpinner
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const RestaurantAdmin = () => {
    const { id } = useParams();
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("menu");
    const [restaurantName, setRestaurantName] = useState(id);
    const [isPro, setIsPro] = useState(false);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [hasNewOrder, setHasNewOrder] = useState(false); 
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", image: "" });
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });
    const [mongoId, setMongoId] = useState(localStorage.getItem(`owner_id_${id}`));

    // ✅ 1. AGGRESSIVE SYNC ENGINE (Prevents 404/500)
    const refreshData = useCallback(async (rId) => {
        if (!rId || rId === "undefined") return; // Safety check
        try {
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${rId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${rId}&t=${Date.now()}`)
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
        } catch (e) { 
            console.error("Dashboard Sync Error");
        }
    }, []);

    // ✅ 2. AUTHENTICATION & BOOTSTRAP
    useEffect(() => {
        const token = localStorage.getItem(`owner_token_${id}`);
        const savedId = localStorage.getItem(`owner_id_${id}`);
        if (token && savedId) {
            setIsAuthenticated(true);
            setMongoId(savedId);
            refreshData(savedId);
        }
    }, [id, refreshData]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthLoading(true);
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            const dbId = res.data._id;
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, dbId);
            setMongoId(dbId);
            setRestaurantName(res.data.restaurantName);
            setIsPro(res.data.isPro);
            setIsAuthenticated(true);
            refreshData(dbId);
            toast.success("Welcome Back!");
        } catch (err) { 
            toast.error("Invalid Key"); 
        } finally { 
            setAuthLoading(false); 
        }
    };

    // ✅ 3. REAL-TIME ENGINE (Socket + Background Polling)
    useEffect(() => {
        if (isAuthenticated && mongoId) {
            const socket = io(SERVER_URL, { query: { restaurantId: mongoId } });
            socket.emit("join-restaurant", mongoId);
            
            socket.on("new-order", () => {
                refreshData(mongoId);
                if (activeTab !== "inbox") setHasNewOrder(true); 
                toast("New Order Received!", { icon: '🔔' });
            });

            // 🛡️ Safety Net: Pull data every 10 seconds in case socket drops
            const backupSync = setInterval(() => refreshData(mongoId), 10000);

            return () => {
                socket.disconnect();
                clearInterval(backupSync);
            };
        }
    }, [isAuthenticated, mongoId, activeTab, refreshData]);

    const handleAddDish = async (e) => {
        e.preventDefault();
        if (!mongoId) return toast.error("Session Error. Re-login.");
        try {
            await axios.post(`${API_BASE}/dishes`, 
                { ...formData, restaurantId: mongoId }, 
                { headers: { Authorization: `Bearer ${localStorage.getItem(`owner_token_${id}`)}` } }
            );
            setFormData({ name: "", price: "", category: "Starters", image: "" });
            refreshData(mongoId);
            toast.success("Added to Menu");
        } catch (err) { toast.error("Failed to add dish"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this?")) return;
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem(`owner_token_${id}`)}` }
            });
            refreshData(mongoId);
        } catch (err) { toast.error("Delete failed"); }
    };

    const handleDownloadAndClear = async () => {
        if (inboxOrders.length === 0) return toast.error("Inbox Empty");
        const doc = new jsPDF();
        doc.text(`Sales Report - ${restaurantName}`, 14, 15);
        const tableData = inboxOrders.map((order, i) => [
            i + 1, order.tableNum, order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
            `Rs.${order.totalAmount}`, new Date(order.createdAt).toLocaleTimeString()
        ]);
        doc.autoTable({ startY: 30, head: [['#', 'Table', 'Items', 'Total', 'Time']], body: tableData });
        doc.save(`Report_${Date.now()}.pdf`);
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: mongoId });
            setInboxOrders([]);
            toast.success("Inbox Cleared");
        } catch (err) { toast.error("Clear Failed"); }
    };

    const generatePrintableQRs = () => {
        const printWindow = window.open('', '_blank');
        let html = '<div style="display:flex; flex-wrap:wrap; justify-content:center;">';
        for (let i = qrRange.start; i <= qrRange.end; i++) {
            const url = `${window.location.origin}/menu/${id}/${i}`;
            const qr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
            html += `
                <div style="margin:20px; padding:20px; border:2px solid #eee; border-radius:20px; text-align:center; width:220px; font-family:sans-serif;">
                    <h2 style="color:#f97316; margin-bottom:10px;">${restaurantName}</h2>
                    <img src="${qr}" width="180" />
                    <p style="font-size:20px; font-weight:bold; margin-top:10px;">TABLE ${i}</p>
                </div>`;
        }
        html += '</div>';
        printWindow.document.write(`<html><body onload="window.print()">${html}</body></html>`);
        printWindow.document.close();
    };

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{globalStyles}</style>
            <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '100%', maxWidth: '350px' }}>
                    <FaStore size={40} color="#f97316" style={{ marginBottom: '15px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: '900' }}>ADMIN ACCESS</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input type="password" placeholder="Key Code" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} autoFocus />
                        <button type="submit" className="btn-primary" disabled={authLoading}>
                            {authLoading ? <FaSpinner className="spin" /> : "UNLOCK SYSTEM"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{globalStyles}</style>
            <div className="max-w-wrapper">
                <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                    <div>
                        <h1 className="shop-title">{restaurantName}</h1>
                        <span className="badge-pro">{isPro ? "PRO ACCOUNT" : "FREE TRIAL"}</span>
                    </div>
                    <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                        <InstallButton />
                        <button onClick={() => {localStorage.clear(); window.location.reload();}} className="btn-glass" style={{color:'#ef4444'}}><FaSignOutAlt /></button>
                    </div>
                </header>

                <SetupWizard dishesCount={dishes.length} pushEnabled={pushEnabled} />

                <div className="menu-link-box">
                    <span className="link-text">{publicMenuUrl}</span>
                    <button onClick={() => {navigator.clipboard.writeText(publicMenuUrl); toast.success("Copied!");}} className="btn-glass" style={{padding:'10px'}}><FaCopy/></button>
                </div>

                <div style={{display:'flex', gap:'10px', marginBottom:'20px'}}>
                    <Link to={`/${id}/chef`} target="_blank" style={{flex:1}}><button className="btn-primary" style={{height:'50px'}}><FaUtensils/> CHEF</button></Link>
                    <Link to={`/${id}/waiter`} target="_blank" style={{flex:1}}><button className="btn-primary" style={{height:'50px', background:'#3b82f6'}}><FaBell/> WAITER</button></Link>
                </div>

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu</button>
                    <button onClick={() => {setActiveTab("inbox"); setHasNewOrder(false);}} className={`tab-btn ${activeTab === "inbox" ? 'active' : ''}`}>
                        Inbox {inboxOrders.length > 0 && <span className="count-badge">{inboxOrders.length}</span>}
                        {hasNewOrder && <div className="pulse-dot"></div>}
                    </button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>Tools</button>
                </nav>

                {activeTab === "menu" && (
                    <div className="glass-card animate-in">
                        <form onSubmit={handleAddDish}>
                            <input className="input-dark" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Item Name" required />
                            <input className="input-dark" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} placeholder="Image Link (Optional)" />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input className="input-dark" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Price" required />
                                <select className="input-dark" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                    <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary">PUBLISH DISH</button>
                        </form>
                        <div style={{ marginTop: '20px' }}>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{display:'flex', gap:'12px', alignItems:'center'}}>
                                        <img src={dish.image || "https://placehold.co/50"} style={{width:'40px', height:'40px', borderRadius:'8px'}} />
                                        <div>
                                            <p style={{fontWeight:900, fontSize:'14px'}}>{dish.name}</p>
                                            <p style={{fontSize:'10px', color:'#f97316'}}>₹{dish.price}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{color:'#ef4444'}}><FaTrash/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "inbox" && (
                    <div className="glass-card animate-in">
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                            <h2 style={{fontSize:'12px'}}>LIVE ORDERS</h2>
                            <button onClick={handleDownloadAndClear} className="btn-glass" style={{background:'#f97316', color:'black', border:'none'}}><FaDownload/> Save & Clear</button>
                        </div>
                        {inboxOrders.map(order => (
                            <div key={order._id} className="inbox-card">
                                <p style={{fontWeight:900, color:'#f97316'}}>TABLE {order.tableNum}</p>
                                <p style={{fontSize:'12px'}}>{order.items.map(i => `${i.name} x${i.quantity}`).join(", ")}</p>
                                <p style={{fontSize:'10px', fontWeight:900}}>TOTAL: ₹{order.totalAmount}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="glass-card">
                        <h2 style={{fontSize:'12px', marginBottom:'15px'}}>QR GENERATOR</h2>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'15px'}}>
                            <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({...qrRange, start: e.target.value})} />
                            <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({...qrRange, end: e.target.value})} />
                        </div>
                        <button onClick={generatePrintableQRs} className="btn-primary"><FaQrcode/> Print QR Sheet</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- STYLES ---
const globalStyles = `
.admin-container { min-height: 100vh; padding: 15px; background: #000; color: white; font-family: 'Inter', sans-serif; }
.max-w-wrapper { max-width: 450px; margin: 0 auto; }
.glass-card { background: #0a0a0a; border: 1px solid #111; padding: 20px; border-radius: 24px; margin-bottom: 15px; }
.btn-primary { background: #f97316; color: white; border: none; width: 100%; padding: 15px; border-radius: 14px; font-weight: 900; cursor: pointer; }
.input-dark { width: 100%; background: #000; border: 1px solid #222; padding: 14px; border-radius: 12px; color: white; margin-bottom: 10px; font-size: 16px; }
.nav-tabs { display: flex; gap: 5px; background: #0a0a0a; padding: 5px; border-radius: 16px; margin-bottom: 15px; }
.tab-btn { flex: 1; padding: 12px; background: transparent; border: none; color: #555; font-size: 11px; font-weight: 900; border-radius: 12px; }
.tab-btn.active { background: #111; color: #f97316; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #111; }
.inbox-card { background: #111; padding: 15px; border-radius: 16px; margin-bottom: 10px; border-left: 3px solid #f97316; }
.badge-pro { font-size: 8px; font-weight: 900; color: #f97316; letter-spacing: 1px; }
.count-badge { background: #f97316; color: black; padding: 2px 6px; border-radius: 8px; font-size: 9px; margin-left: 5px; }
.pulse-dot { width: 8px; height: 8px; background: #f97316; border-radius: 50%; animation: pulse 1.5s infinite; position: absolute; right: 10px; top: 10px; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default RestaurantAdmin;