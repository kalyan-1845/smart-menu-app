import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Link, useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Added for Receipt Generation
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";
import { 
    FaTrash, FaUtensils, FaBell, FaCheckCircle, FaCircle, FaCrown, 
    FaSignOutAlt, FaRocket, FaStore, FaCopy, 
    FaDownload, FaQrcode, FaPlus, FaHistory, FaSpinner, FaImage,
    FaConciergeBell, FaFire, FaRupeeSign, FaLock, FaPrint, FaCheck // Added Icons
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
.inbox-card { background: rgba(255, 255, 255, 0.05); padding: 18px; border-radius: 20px; margin-bottom: 12px; border-left: 4px solid #FF9933; }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #444; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; text-decoration: none; }
.spin { animation: rotate 1s linear infinite; } @keyframes rotate { 100% { transform: rotate(360deg); } }
/* ADDED STYLES FOR ORDER CARDS */
.order-card { background: #fff; color: #000; border-radius: 16px; padding: 15px; margin-bottom: 15px; }
.status-btn { padding: 8px 12px; border: none; border-radius: 8px; color: white; font-weight: bold; font-size: 11px; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.locked-btn { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 8px; border: none; }
.unlock-btn { background: #22c55e; color: white; cursor: pointer; width: 100%; padding: 10px; border-radius: 8px; font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 8px; border: none; }
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
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [activeTab, setActiveTab] = useState("orders"); // ✅ Changed default to Orders for quick access
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [isPro, setIsPro] = useState(false);
    const [mongoId, setMongoId] = useState(null); 
    const [bulkText, setBulkText] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });

    const autoCategory = (name) => {
        const n = name.toLowerCase();
        if (n.includes("juice") || n.includes("tea") || n.includes("coffee") || n.includes("drink") || n.includes("water") || n.includes("shake") || n.includes("lassi") || n.includes("soda")) return "Drinks";
        if (n.includes("cake") || n.includes("ice") || n.includes("sweet") || n.includes("pudding") || n.includes("jamun") || n.includes("halwa")) return "Dessert";
        if (n.includes("fry") || n.includes("tikka") || n.includes("kabab") || n.includes("soup") || n.includes("starter") || n.includes("manchurian") || n.includes("65")) return "Starters";
        return "Main Course"; 
    };

    // ✅ REFRESH ENGINE: Direct fetch bypasses state lag
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

    // ✅ FIXED BULK INSERTER: Uses local variables to prevent state loss
    const handleBulkInsert = async () => {
        const lines = bulkText.split("\n").filter(l => l.trim() !== "");
        const token = localStorage.getItem(`owner_token_${id}`);
        const activeId = localStorage.getItem(`owner_id_${id}`); // Get ID directly from storage

        if (!activeId || activeId === "undefined") {
            return toast.error("Critical: Shop ID not found. Please logout & login again.");
        }
        
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
                        restaurantId: activeId, // Use the direct ID variable
                        isAvailable: true 
                    }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            toast.dismiss(t);
            toast.success("All Items Live!");
            setBulkText("");
            await refreshData(activeId); // Force the list to update immediately
        } catch (err) {
            toast.dismiss(t);
            toast.error("Failed to sync some items");
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

    // --- 🟢 NEW: ORDER STATUS & RECEIPT LOCK LOGIC ---
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
            toast.success(`Marked as ${newStatus}`);
            refreshData(); // Refresh list to show status change
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
                    {/* ✅ ADDED ORDERS TAB */}
                    <button onClick={() => setActiveTab("orders")} className={`tab-btn ${activeTab === "orders" ? 'active' : ''}`}>Live Orders</button>
                    <button onClick={() => setActiveTab("menu")} className={`tab-btn ${activeTab === "menu" ? 'active' : ''}`}>Menu Editor</button>
                    <button onClick={() => setActiveTab("settings")} className={`tab-btn ${activeTab === "settings" ? 'active' : ''}`}>Tools</button>
                </nav>

                {/* ✅ ORDERS TAB CONTENT WITH LOCK LOGIC */}
                {activeTab === "orders" && (
                    <div style={{paddingBottom: 80}}>
                        {inboxOrders.length === 0 ? (
                            <div className="glass-card" style={{textAlign:'center', opacity:0.5}}>
                                <FaCheckCircle size={40} style={{marginBottom:10}}/>
                                <p>All clear! No pending orders.</p>
                            </div>
                        ) : (
                            inboxOrders.map(order => {
                                const isLocked = !(order.status === 'Served' || order.status === 'Paid');
                                return (
                                    <div key={order._id} className="order-card">
                                        {/* HIDDEN RECEIPT CONTENT */}
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

                                        {/* STATUS BUTTONS */}
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

                                        {/* 🔒 LOCKED RECEIPT BUTTON */}
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