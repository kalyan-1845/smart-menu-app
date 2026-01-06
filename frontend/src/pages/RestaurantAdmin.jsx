import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";
// ✅ IMPORT DASHBOARDS
import ChefDashboard from "./ChefDashboard";
import WaiterDashboard from "./WaiterDashboard";

import { 
    FaTrash, FaUtensils, FaBell, FaCrown, FaSignOutAlt, FaStore, FaCopy, 
    FaDownload, FaQrcode, FaPlus, FaHistory, FaSpinner, FaLock, FaPrint, 
    FaCheck, FaFire, FaConciergeBell, FaRupeeSign, FaUserTie, FaCreditCard, FaMoneyBillWave
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
.nav-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
.tab-btn { padding: 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #888; font-size: 11px; font-weight: 900; cursor: pointer; border-radius: 18px; text-transform: uppercase; transition: 0.3s; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.tab-btn.active { background: rgba(255, 153, 51, 0.15); border: 1px solid #FF9933; color: #FF9933; }
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 14px; color: white; margin-bottom: 15px; outline: none; box-sizing: border-box; font-size: 16px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #444; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; text-decoration: none; }
.spin { animation: rotate 1s linear infinite; } @keyframes rotate { 100% { transform: rotate(360deg); } }
.order-card { background: #fff; color: #000; border-radius: 16px; padding: 15px; margin-bottom: 15px; }
.status-btn { padding: 8px 12px; border: none; border-radius: 8px; color: white; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.locked-btn { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 8px; border: none; }
.unlock-btn { background: #22c55e; color: white; cursor: pointer; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 8px; border: none; }
`;

const RestaurantAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
    const API_BASE = `${SERVER_URL}/api`;
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("orders");
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [isPro, setIsPro] = useState(false);
    const [mongoId, setMongoId] = useState(null); 
    const [bulkText, setBulkText] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });

    const autoCategory = (name) => {
        const n = name.toLowerCase();
        if (n.includes("juice") || n.includes("tea") || n.includes("coffee") || n.includes("drink")) return "Drinks";
        if (n.includes("cake") || n.includes("ice") || n.includes("sweet")) return "Dessert";
        if (n.includes("fry") || n.includes("tikka") || n.includes("starter")) return "Starters";
        return "Main Course"; 
    };

    const refreshData = useCallback(async (manualId) => {
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        if (!fetchId || fetchId === "undefined") return;

        try {
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`)
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            setIsLoading(false);
        } catch (e) { 
            console.error("Sync Error");
            setIsLoading(false);
        }
    }, [API_BASE, id, mongoId]);

    useEffect(() => {
        const init = async () => {
            const token = localStorage.getItem(`owner_token_${id}`);
            const savedId = localStorage.getItem(`owner_id_${id}`);
            if (token && savedId) {
                setMongoId(savedId);
                setIsAuthenticated(true);
                refreshData(savedId);
            } else {
                setIsLoading(false);
            }
        };
        init();
    }, [id, refreshData]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            setMongoId(res.data._id);
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
        window.location.reload();
    };

    const handleBulkInsert = async () => {
        const lines = bulkText.split("\n").filter(l => l.trim() !== "");
        const token = localStorage.getItem(`owner_token_${id}`);
        const activeId = localStorage.getItem(`owner_id_${id}`);

        if (!activeId) return toast.error("Shop ID not found. Login again.");
        if (!lines.length) return toast.error("Enter items first");

        setIsLoading(true);
        const t = toast.loading("Syncing Dishes...");

        try {
            for (const line of lines) {
                const [name, price, img] = line.split(",").map(item => item?.trim());
                if (name && price) {
                    await axios.post(`${API_BASE}/dishes`, {
                        name,
                        price: parseFloat(price),
                        image: img || "",
                        category: autoCategory(name),
                        restaurantId: activeId,
                        isAvailable: true 
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            toast.dismiss(t);
            toast.success("All Items Live!");
            setBulkText("");
            await refreshData(activeId);
        } catch (err) {
            toast.dismiss(t);
            toast.error("Failed to sync items");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        const activeId = localStorage.getItem(`owner_id_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            refreshData(activeId);
            toast.success("Dish Removed");
        } catch (err) { toast.error("Failed to delete"); }
    };

    const handleDownloadAndClear = async () => {
        if (inboxOrders.length === 0) return toast.error("No data to export");
        const doc = new jsPDF();
        const activeId = localStorage.getItem(`owner_id_${id}`);
        doc.text(`Sales Report - ${restaurantName}`, 14, 15);
        const tableData = inboxOrders.map((order, i) => [
            i + 1, order.tableNum, order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
            `Rs.${order.totalAmount}`, new Date(order.createdAt).toLocaleTimeString()
        ]);
        autoTable(doc, { startY: 30, head: [['#', 'Table', 'Items', 'Amount', 'Time']], body: tableData });
        doc.save(`Sales_${Date.now()}.pdf`);
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: activeId });
            setInboxOrders([]);
            toast.success("Report Saved & Inbox Cleared");
        } catch (err) { toast.error("Error clearing inbox"); }
    };

    // --- 🟢 ORDER LOGIC FOR "LIVE ORDERS" TAB ---
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Marked as ${newStatus}`);
            refreshData(); 
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const printReceipt = async (orderId) => {
        const element = document.getElementById(`receipt-${orderId}`);
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Order-${orderId.slice(-4)}.pdf`);
            toast.success("Receipt Printed");
        } catch (err) { toast.error("Print failed"); }
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

    if (isLoading) return <div className="admin-container"><div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}><FaSpinner className="spin" size={30} color="#FF9933"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container"><style>{styles}</style>
            <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '320px' }}>
                    <FaStore size={40} color="#FF9933" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: 900 }}>RESTRICTED AREA</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input type="password" placeholder="Access Key" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} autoFocus autoComplete="current-password" />
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

                {/* ✅ BIG WIDGET NAVIGATION */}
                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("orders")} className={`tab-btn ${activeTab === "orders" ? 'active' : ''}`}>
                        <FaFire size={20} />
                        Live Orders
                    </button>
                    
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>
                        <FaUtensils size={20} />
                        Menu Editor
                    </button>

                    <button onClick={() => setActiveTab("chef")} className={`tab-btn ${activeTab === "chef" ? 'active' : ''}`}>
                        <FaConciergeBell size={20} />
                        Kitchen Panel
                    </button>

                    <button onClick={() => setActiveTab("waiter")} className={`tab-btn ${activeTab === "waiter" ? 'active' : ''}`}>
                        <FaUserTie size={20} />
                        Waiter Panel
                    </button>

                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`} style={{gridColumn: 'span 2'}}>
                        <FaHistory size={20} />
                        Business Tools & Reports
                    </button>
                </nav>

                {/* --- RENDER CONTENT BASED ON TAB --- */}

                {/* 🟠 LIVE ORDERS TAB */}
                {activeTab === "orders" && (
                    <div style={{paddingBottom: 80}}>
                        {inboxOrders.length === 0 ? (
                            <div className="glass-card" style={{textAlign:'center', opacity:0.5}}>
                                <FaCheck size={40} style={{marginBottom:10}}/>
                                <p>All clear! No pending orders.</p>
                            </div>
                        ) : (
                            inboxOrders.map(order => {
                                const isLocked = !(order.status === 'Served' || order.status === 'Paid');
                                const isOnline = order.paymentMethod?.toLowerCase() === 'online';
                                return (
                                    <div key={order._id} className="order-card">
                                        {/* Hidden Receipt */}
                                        <div id={`receipt-${order._id}`} style={{marginBottom:10, padding:10, borderBottom:'1px dashed #ccc'}}>
                                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold'}}>
                                                <span>Table {order.tableNum}</span>
                                                <span style={{color:'#666'}}>{new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <div style={{margin:'5px 0', fontSize:'13px'}}>{order.customerName}</div>
                                            {order.items.map((it, i) => (
                                                <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'13px'}}>
                                                    <span>{it.quantity} x {it.name}</span>
                                                    <span>{it.price * it.quantity}</span>
                                                </div>
                                            ))}
                                            <div style={{display:'flex', justifyContent:'space-between', fontWeight:'900', marginTop:5}}>
                                                <span>Total</span>
                                                <span>₹{order.totalAmount}</span>
                                            </div>
                                        </div>

                                        <div style={{display:'flex', justifyContent:'space-between', fontWeight:'bold', marginBottom:10}}>
                                            <span>Table {order.tableNum}</span>
                                            <span style={{color: isOnline ? '#22c55e' : '#f97316', fontSize: 11, display:'flex', alignItems:'center', gap:4}}>
                                                {isOnline ? <><FaCreditCard/> PAID ONLINE</> : <><FaMoneyBillWave/> CASH</>}
                                            </span>
                                        </div>

                                        {/* Status Actions */}
                                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10}}>
                                            {order.status === 'Pending' && <button onClick={()=>updateOrderStatus(order._id, 'Cooking')} className="status-btn" style={{background:'#f59e0b'}}><FaFire/> Cook</button>}
                                            {order.status === 'Cooking' && <button onClick={()=>updateOrderStatus(order._id, 'Ready')} className="status-btn" style={{background:'#10b981'}}><FaConciergeBell/> Ready</button>}
                                            {order.status === 'Ready' && <button onClick={()=>updateOrderStatus(order._id, 'Served')} className="status-btn" style={{background:'#3b82f6'}}><FaCheck/> Serve</button>}
                                            {(order.status === 'Served' || order.status === 'Ready') && (
                                                <button onClick={()=>updateOrderStatus(order._id, 'Paid')} className="status-btn" style={{background:'#22c55e', gridColumn:'span 2', justifyContent:'center'}}>
                                                    <FaRupeeSign/> Mark Paid
                                                </button>
                                            )}
                                            {order.status === 'Paid' && <div style={{gridColumn:'span 2', textAlign:'center', color:'#22c55e', fontWeight:'bold', padding:5}}>PAID ✅</div>}
                                        </div>

                                        {/* Locked Receipt */}
                                        <button 
                                            onClick={() => printReceipt(order._id)} 
                                            disabled={isLocked} 
                                            className={isLocked ? 'locked-btn' : 'unlock-btn'}
                                        >
                                            {isLocked ? <><FaLock/> Receipt Locked</> : <><FaPrint/> Print Receipt</>}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* 🟠 MENU EDITOR TAB */}
                {activeTab === "menu" && (
                    <>
                        <div className="glass-card">
                            <h3 style={{fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '10px'}}><FaPlus /> BULK ADD DISHES</h3>
                            <p style={{fontSize: '10px', opacity: 0.5, marginBottom: '10px'}}>Format: Name, Price, ImageURL (One per line)</p>
                            <textarea 
                                className="input-dark" 
                                rows="6" 
                                placeholder="Paneer Tikka, 250, https://img.com/p.jpg&#10;Mango Lassi, 90, https://img.com/m.jpg"
                                value={bulkText}
                                onChange={e => setBulkText(e.target.value)}
                                style={{fontFamily: 'monospace', fontSize: '13px', color: '#22c55e'}}
                            />
                            <button onClick={handleBulkInsert} className="btn-primary">SYNC TO LIVE MENU</button>
                        </div>

                        <div className="glass-card">
                            <h3 style={{fontSize:'12px', fontWeight:900, marginBottom:'15px', opacity:0.6}}>LIVE ITEMS ({dishes.length})</h3>
                            {dishes.length === 0 && <p style={{textAlign:'center', opacity: 0.3, fontSize: '12px'}}>No dishes added yet.</p>}
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#111', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {dish.image ? <img src={dish.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} /> : <FaUtensils color="#222"/>}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '14px' }}>{dish.name}</p>
                                            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                                                <span style={{ fontSize: '10px', color: '#FF9933', fontWeight: 900 }}>₹{dish.price}</span>
                                                <span style={{ fontSize: '9px', background: '#222', padding:'2px 6px', borderRadius:'4px', color:'#888'}}>{dish.category}</span>
                                                {!dish.isAvailable && <span style={{fontSize:'9px', color:'#ef4444', fontWeight:'bold'}}>OFF STOCK</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{ color: '#ef4444' }}><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 🟠 CHEF & WAITER EMBEDDED PAGES (WITH AUTH BYPASS) */}
                {activeTab === "chef" && <ChefDashboard bypassAuth={true} providedMongoId={mongoId} />}
                {activeTab === "waiter" && <WaiterDashboard bypassAuth={true} providedMongoId={mongoId} />}

                {/* 🟠 SETTINGS TAB */}
                {activeTab === "settings" && (
                    <>
                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaHistory /> SALES & REPORTS</h2>
                            <button onClick={handleDownloadAndClear} className="btn-primary" style={{ background: '#22c55e' }}><FaDownload /> EXPORT PDF & CLEAR INBOX</button>
                        </div>

                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaQrcode /> QR GENERATOR</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({ ...qrRange, start: e.target.value })} placeholder="Start" />
                                <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({ ...qrRange, end: e.target.value })} placeholder="End" />
                            </div>
                            <button onClick={generatePrintableQRs} className="btn-primary"><FaQrcode /> PRINT STICKERS</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RestaurantAdmin;