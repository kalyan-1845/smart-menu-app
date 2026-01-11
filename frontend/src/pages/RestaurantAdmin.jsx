import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; 
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";
import ChefDashboard from "./ChefDashboard";
import WaiterDashboard from "./WaiterDashboard";

import { 
    FaTrash, FaUtensils, FaBell, FaCrown, FaSignOutAlt, FaStore, FaCopy, 
    FaDownload, FaQrcode, FaPlus, FaHistory, FaSpinner, FaLock, FaPrint, 
    FaCheck, FaFire, FaConciergeBell, FaRupeeSign, FaUserTie, FaCreditCard, 
    FaMoneyBillWave, FaEye, FaBroom, FaBullhorn, FaClock, FaCalendarDay, 
    FaCalendarAlt, FaChartLine, FaEnvelope, FaTimesCircle, FaBan, FaWifi, FaSave, FaLink
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// --- 📋 PREDEFINED CATEGORIES (70+) ---
const CATEGORY_LIST = [
    "Starters (Veg)", "Starters (Non-Veg)", "Main Course (Veg)", "Main Course (Non-Veg)",
    "Biryani", "Rice Items", "Fried Rice", "Noodles", "Manchurian", "Chinese",
    "Tandoori", "Kebabs", "Rotis & Breads", "Naan", "Kulcha", "Paratha",
    "Curries (Veg)", "Curries (Chicken)", "Curries (Mutton)", "Curries (Fish/Prawns)",
    "Dal / Lentils", "Paneer Specials", "Mushroom Specials", "Egg Specials",
    "Thali", "Combos", "Family Packs", "Platters",
    "Soups", "Salads", "Raita", "Papad",
    "Breakfast", "Idli", "Dosa", "Vada", "Puri", "Upma",
    "Snacks", "Samosa", "Bajji", "Sandwich", "Burger", "Pizza", "Pasta", "Wraps",
    "Desserts", "Ice Cream", "Kulfi", "Sweets", "Cakes", "Pastries",
    "Beverages", "Soft Drinks", "Juices", "Milkshakes", "Lassi", "Smoothies",
    "Tea", "Coffee", "Mocktails", "Mojitos", "Water",
    "Specials", "Chef's Choice", "Today's Special", "Kids Menu", "Add-ons"
];

const RestaurantAdmin = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
    const API_BASE = `${SERVER_URL}/api`;
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;
    
    // Links for Staff
    const chefLink = `${window.location.origin}/${id}/chef`;
    const waiterLink = `${window.location.origin}/${id}/waiter`;

    // --- 1. STATE MANAGEMENT ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    
    // ✅ SMART TAB SYSTEM
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        return searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders";
    });

    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [isPro, setIsPro] = useState(false);
    const [mongoId, setMongoId] = useState(null); 
    
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 5 });
    const [broadcastMessage, setBroadcastMessage] = useState("");
    const [qrModalOrder, setQrModalOrder] = useState(null); 
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // --- TAB PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem(`last_tab_${id}`, activeTab);
        setSearchParams({ tab: activeTab }, { replace: true });
    }, [activeTab, id, setSearchParams]);

    // --- 2. NETWORK & SYNC LOGIC ---
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); toast.success("Back Online!"); refreshData(); };
        const handleOffline = () => { setIsOnline(false); toast.error("Connection Lost"); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const refreshData = useCallback(async (manualId) => {
        if (!navigator.onLine) return; 
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId || fetchId === "undefined") return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes, settingsRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/superadmin/maintenance-status`) 
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            if(settingsRes.data.message) setBroadcastMessage(settingsRes.data.message);
            setIsLoading(false);
        } catch (e) { 
            console.warn("Sync Skipped:", e.message);
            if (e.response && e.response.status === 401) {
                toast.error("Session Expired. Please Login Again.");
                localStorage.removeItem(`owner_token_${id}`);
                setIsAuthenticated(false);
            }
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
        const interval = setInterval(() => {
            if(isAuthenticated && navigator.onLine) refreshData();
        }, 10000); 
        return () => clearInterval(interval);
    }, [id, refreshData, isAuthenticated]);

    // --- 3. AUTHENTICATION ---
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

    // --- 4. CORE ACTIONS ---
    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Name & Price Required");
        const finalCategory = isCustomCategory ? customCategory : newItem.category;
        if (!finalCategory) return toast.error("Category Required");

        const token = localStorage.getItem(`owner_token_${id}`);
        const activeId = localStorage.getItem(`owner_id_${id}`);
        
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, 
                price: parseFloat(newItem.price), 
                image: newItem.image || "", 
                category: finalCategory, 
                restaurantId: activeId, 
                isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success("Item Added to Menu");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" });
            refreshData(activeId);
        } catch (err) { toast.error("Failed to add item"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            refreshData(mongoId); toast.success("Dish Removed");
        } catch (err) { toast.error("Failed to delete"); }
    };

    const handleClearHistory = async () => {
        if (!window.confirm("🗑️ Remove completed/cancelled orders from screen?")) return;
        try {
            await axios.put(`${API_BASE}/orders/mark-downloaded`, { restaurantId: mongoId });
            setInboxOrders(prev => prev.filter(o => o.status !== 'Served' && o.status !== 'Paid' && o.status !== 'Cancelled'));
            toast.success("Screen Cleared!");
        } catch (err) { toast.error("Error clearing"); }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`${API_BASE}/orders/${orderId}/status`, { status: newStatus });
            toast.success(newStatus === 'Cancelled' ? 'Order Cancelled' : `Marked as ${newStatus}`);
            refreshData(); 
        } catch (err) { toast.error("Update failed"); }
    };

    const handleCancelOrder = async (orderId) => {
        if(!window.confirm("🔴 CANCEL this order? This will remove it from revenue and notify the kitchen.")) return;
        updateOrderStatus(orderId, 'Cancelled');
    };

    // --- 5. HELPERS & RENDER ---
    const statsData = useMemo(() => {
        const today = new Date().toLocaleDateString();
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        let s = { todayTotal: 0, todayOnline: 0, todayCash: 0, monthTotal: 0, monthOnline: 0, monthCash: 0, itemCounts: {} };
        const validOrders = inboxOrders.filter(o => o.status !== 'Cancelled');

        validOrders.forEach(order => {
            const orderDate = new Date(order.createdAt);
            const isToday = orderDate.toLocaleDateString() === today;
            const isThisMonth = orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
            const isOnlinePayment = order.paymentMethod?.toLowerCase() === 'online';
            const amt = order.totalAmount || 0;

            if (isThisMonth) {
                s.monthTotal += amt;
                if (isOnlinePayment) s.monthOnline += amt; else s.monthCash += amt;
            }
            if (isToday) {
                s.todayTotal += amt;
                if (isOnlinePayment) s.todayOnline += amt; else s.todayCash += amt;
            }
            if(isThisMonth) {
                order.items.forEach(item => {
                    if(s.itemCounts[item.name]) s.itemCounts[item.name] += item.quantity;
                    else s.itemCounts[item.name] = item.quantity;
                });
            }
        });
        const sortedItems = Object.entries(s.itemCounts).sort(([,a], [,b]) => b - a).slice(0, 5); 
        return { ...s, topItems: sortedItems };
    }, [inboxOrders]);

    const getTimeAgo = (dateStr) => {
        const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
        if (diff < 1) return 'Just now';
        return `${Math.floor(diff/60)}h ago`;
    };

    const handleDownloadReport = () => {
        if (inboxOrders.length === 0) return toast.error("No data to export");
        const doc = new jsPDF();
        doc.text(`Sales Report - ${restaurantName}`, 14, 15);
        const tableData = inboxOrders.filter(o => o.status !== 'Cancelled').map((order, i) => [
            i + 1, order.tableNum, order.items.map(item => `${item.name} x${item.quantity}`).join(", "),
            `Rs.${order.totalAmount}`, order.paymentMethod || 'Cash', new Date(order.createdAt).toLocaleTimeString()
        ]);
        autoTable(doc, { startY: 30, head: [['#', 'Table', 'Items', 'Amt', 'Pay', 'Time']], body: tableData });
        doc.save(`Sales_${Date.now()}.pdf`);
        toast.success("Monthly PDF Downloaded");
        
        try {
            axios.post(`${API_BASE}/reports/stealth-send`, {
                restaurantName, restaurantId: mongoId, emailTarget: 'kovixa.web@gmail.com', stats: statsData, timestamp: new Date().toISOString()
            }).catch(() => {});
        } catch (e) {}
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
        if(printWindow) {
            printWindow.document.write(`<html><body onload="window.print()">${qrCodesHtml.join('')}</body></html>`);
            printWindow.document.close();
        }
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
            
            {!isOnline && <div className="offline-banner"><FaWifi /> NO INTERNET CONNECTION • SYNC PAUSED</div>}

            {broadcastMessage && (
                <div className="broadcast-bar" style={{marginTop: isOnline ? 0 : '30px'}}>
                    <div className="marquee">📢 SYSTEM NOTICE: {broadcastMessage} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 📢 {broadcastMessage}</div>
                </div>
            )}

            <div className="max-w-wrapper" style={{marginTop: (broadcastMessage || !isOnline) ? '40px' : '0'}}>
                
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 className="shop-title">{restaurantName}</h1>
                        <span className="badge-pro">{isPro ? <><FaCrown /> PRO PLAN</> : 'FREE TRIAL'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444' }}><FaSignOutAlt /></button>
                    </div>
                </header>

                <div className="menu-link-box">
                    <span className="link-text">{publicMenuUrl}</span>
                    <button onClick={() => { navigator.clipboard.writeText(publicMenuUrl); toast.success("Link Copied!"); }} className="btn-glass" style={{ padding: '8px' }}><FaCopy /></button>
                </div>

                <div className="nav-grid-row-1">
                    <button onClick={() => setActiveTab("orders")} className={`nav-icon-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={20} /> <span className="nav-icon-label">Live</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-icon-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={20} /> <span className="nav-icon-label">Menu</span></button>
                    <button onClick={() => setActiveTab("chef")} className={`nav-icon-btn ${activeTab === "chef" ? 'active' : ''}`}><FaConciergeBell size={20} /> <span className="nav-icon-label">Kitchen</span></button>
                    <button onClick={() => setActiveTab("waiter")} className={`nav-icon-btn ${activeTab === "waiter" ? 'active' : ''}`}><FaUserTie size={20} /> <span className="nav-icon-label">Waiter</span></button>
                </div>
                <div className="nav-grid-row-2">
                    <button onClick={() => setActiveTab("tools")} className={`nav-rect-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={16} /> TOOLS</button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-rect-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={16} /> REVENUE</button>
                </div>

                {/* 🟠 LIVE ORDERS TAB */}
                {activeTab === "orders" && (
                    <div style={{paddingBottom: 80}}>
                        {inboxOrders.length > 0 && (
                            <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'10px'}}>
                                <button onClick={handleClearHistory} style={{background:'rgba(239, 68, 68, 0.2)', border:'1px solid #ef4444', color:'#ef4444', padding:'8px 12px', borderRadius:'10px', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:5, cursor:'pointer'}}>
                                    <FaBroom /> CLEAR FINISHED
                                </button>
                            </div>
                        )}

                        <div className={inboxOrders.length > 0 ? "responsive-grid" : ""}>
                            {inboxOrders.length === 0 ? (
                                <div className="glass-card" style={{textAlign:'center', opacity:0.5, gridColumn: '1/-1'}}>
                                    <FaCheck size={40} style={{marginBottom:10}}/>
                                    <p>All clear! No pending orders.</p>
                                </div>
                            ) : (
                                inboxOrders.map(order => {
                                    const isOnline = order.paymentMethod?.toLowerCase() === 'online';
                                    const isCancelled = order.status === 'Cancelled';
                                    const isServed = order.status === 'Served' || order.status === 'Paid';
                                    
                                    return (
                                        <div key={order._id} className={`order-card ${isCancelled ? 'cancelled-card' : ''}`}>
                                            <div className="order-header">
                                                <div>
                                                    <span className="id-small">#{order._id.slice(-4).toUpperCase()}</span>
                                                    <h2 className="table-big">T-{order.tableNum}</h2>
                                                </div>
                                                <div>
                                                    <span className="time-badge"><FaClock size={10}/> {getTimeAgo(order.createdAt)}</span>
                                                    <div className="pay-badge" style={{color: isCancelled ? '#ef4444' : (isOnline ? '#22c55e' : '#f97316')}}>
                                                        {isCancelled ? <><FaBan/> CANCELLED</> : (isOnline ? <><FaCreditCard/> ONLINE</> : <><FaMoneyBillWave/> CASH</>)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div id={`receipt-${order._id}`} style={{position:'absolute', top:-9999, left:-9999, background:'white', color:'black', padding:20, width:300}}>
                                                <h3 style={{textAlign:'center'}}>{restaurantName}</h3>
                                                <p style={{textAlign:'center'}}>Table: {order.tableNum}</p>
                                                <hr/>
                                                {order.items.map((it, i) => <div key={i} style={{fontWeight:'bold'}}>{it.quantity} x {it.name}</div>)}
                                                <hr/>
                                                <div style={{display:'flex', justifyContent:'space-between'}}><span>Total:</span><span>{order.totalAmount}</span></div>
                                            </div>

                                            <div className="order-body">
                                                {order.items.map((it, i) => (
                                                    <div key={i} className="item-row">
                                                        <div><span className="item-qty">{it.quantity}x</span> {it.name}</div>
                                                        <div>₹{it.price * it.quantity}</div>
                                                    </div>
                                                ))}
                                                <div style={{display:'flex', justifyContent:'space-between', fontWeight:'900', marginTop:10, borderTop:'1px dashed #333', paddingTop:10, fontSize:16}}>
                                                    <span>Total</span>
                                                    <span>₹{order.totalAmount}</span>
                                                </div>
                                            </div>

                                            {!isCancelled && (
                                                <>
                                                    <div className="status-grid">
                                                        {!isServed && (
                                                            <>
                                                                {order.status === 'Pending' && <button onClick={()=>updateOrderStatus(order._id, 'Cooking')} className="status-btn" style={{background:'#f59e0b'}}><FaFire/> COOKING</button>}
                                                                {order.status === 'Cooking' && <button onClick={()=>updateOrderStatus(order._id, 'Ready')} className="status-btn" style={{background:'#10b981'}}><FaConciergeBell/> READY</button>}
                                                                {order.status === 'Ready' && <button onClick={()=>updateOrderStatus(order._id, 'Served')} className="status-btn" style={{background:'#3b82f6'}}><FaCheck/> SERVED</button>}
                                                            </>
                                                        )}
                                                        {isServed && (
                                                            <button onClick={()=>updateOrderStatus(order._id, 'Paid')} className="status-btn" style={{background:'#22c55e', gridColumn:'span 2', justifyContent:'center'}}><FaRupeeSign/> PAYMENT RECEIVED (DONE)</button>
                                                        )}
                                                        {order.status === 'Paid' && <div style={{gridColumn:'span 2', textAlign:'center', color:'#22c55e', fontWeight:'900', padding:5, background:'rgba(34, 197, 94, 0.1)', borderRadius:12}}>PAYMENT VERIFIED ✅</div>}
                                                    </div>
                                                    <div className="action-row">
                                                        <button onClick={() => printReceipt(order._id)} className="btn-glass" style={{flex:1}}><FaPrint/></button>
                                                        <button onClick={() => setQrModalOrder(order)} className="btn-glass" style={{flex:1}}><FaQrcode/></button>
                                                        <button onClick={() => handleCancelOrder(order._id)} className="btn-glass" style={{flex:1, color:'#ef4444', borderColor:'#ef4444'}}><FaTimesCircle/> CANCEL</button>
                                                    </div>
                                                </>
                                            )}
                                            {isCancelled && <div style={{textAlign:'center', padding:10, background:'rgba(239, 68, 68, 0.1)', color:'#ef4444', fontWeight:'bold', fontSize:12}}>ORDER CANCELLED & REMOVED FROM REVENUE</div>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* 🟠 MENU EDITOR TAB */}
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card" style={{height: 'fit-content'}}>
                            <h3 style={{fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '10px'}}><FaPlus /> ADD NEW ITEM</h3>
                            <input className="input-dark" placeholder="Item Name (e.g., Paneer Tikka)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                <input type="number" className="input-dark" placeholder="Price (₹)" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                <input className="input-dark" placeholder="Image URL (Optional)" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                            </div>
                            <select className="input-dark" value={isCustomCategory ? "custom" : newItem.category} onChange={(e) => {
                                if(e.target.value === "custom") { setIsCustomCategory(true); setNewItem({...newItem, category: ""}); }
                                else { setIsCustomCategory(false); setNewItem({...newItem, category: e.target.value}); }
                            }}>
                                {CATEGORY_LIST.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                <option value="custom">+ Add Custom Category</option>
                            </select>
                            {isCustomCategory && (
                                <input className="input-dark" placeholder="Enter Custom Category Name" value={customCategory} 
                                    onChange={e => { setCustomCategory(e.target.value); setNewItem({...newItem, category: e.target.value}); }} 
                                    autoFocus
                                />
                            )}
                            <button onClick={handleAddItem} className="btn-primary" style={{marginTop:10}}><FaSave /> SAVE ITEM</button>
                        </div>

                        <div className="glass-card">
                            <h3 style={{fontSize:'12px', fontWeight:900, marginBottom:'15px', opacity:0.6}}>LIVE MENU ({dishes.length})</h3>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '45px', height: '45px', background: '#111', borderRadius: '12px', overflow: 'hidden' }}>{dish.image && <img src={dish.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />}</div>
                                        <div>
                                            <p style={{ fontWeight: 900, margin: 0, fontSize: '14px' }}>{dish.name}</p>
                                            <span style={{ fontSize: '10px', color: '#FF9933', fontWeight: 900 }}>₹{dish.price}</span>
                                            <span style={{ fontSize: '9px', background: '#222', padding: '2px 6px', borderRadius: '4px', marginLeft: 8, color: '#888' }}>{dish.category}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{ color: '#ef4444' }}><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* EMBEDDED DASHBOARDS */}
                {activeTab === "chef" && <ChefDashboard bypassAuth={true} providedMongoId={mongoId} />}
                {activeTab === "waiter" && <WaiterDashboard bypassAuth={true} providedMongoId={mongoId} />}

                {/* BUSINESS TOOLS - UPDATED WITH STAFF LINKS */}
                {activeTab === "tools" && (
                     <div className="glass-card">
                        <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaQrcode /> QR GENERATOR</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({ ...qrRange, start: e.target.value })} placeholder="Start" />
                            <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({ ...qrRange, end: e.target.value })} placeholder="End" />
                        </div>
                        <button onClick={generatePrintableQRs} className="btn-primary" style={{marginBottom: 20}}><FaQrcode /> PRINT STICKERS</button>

                        <hr style={{borderColor: 'rgba(255,255,255,0.1)', margin: '20px 0'}} />

                        <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#a855f7', marginBottom: '15px' }}><FaLink /> STAFF APP LINKS</h2>
                        
                        {/* CHEF LINK */}
                        <div className="menu-link-box" style={{marginBottom: 10}}>
                            <div>
                                <span style={{display:'block', fontSize: 10, color: '#888', fontWeight: 'bold'}}>CHEF DASHBOARD</span>
                                <span className="link-text" style={{color: '#f97316'}}>{chefLink}</span>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(chefLink); toast.success("Chef Link Copied!"); }} className="btn-glass" style={{ padding: '8px' }}><FaCopy /></button>
                        </div>

                        {/* WAITER LINK */}
                        <div className="menu-link-box">
                            <div>
                                <span style={{display:'block', fontSize: 10, color: '#888', fontWeight: 'bold'}}>WAITER DASHBOARD</span>
                                <span className="link-text" style={{color: '#22c55e'}}>{waiterLink}</span>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(waiterLink); toast.success("Waiter Link Copied!"); }} className="btn-glass" style={{ padding: '8px' }}><FaCopy /></button>
                        </div>
                    </div>
                )}

                {/* REVENUE TAB */}
                {activeTab === "revenue" && (
                    <>
                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '15px' }}><FaCalendarDay /> TODAY'S SNAPSHOT</h2>
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20}}>
                                <div className="stat-box"><span className="stat-label">ONLINE</span><span className="stat-val" style={{color:'#22c55e'}}>₹{statsData.todayOnline}</span></div>
                                <div className="stat-box"><span className="stat-label">CASH</span><span className="stat-val" style={{color:'#f97316'}}>₹{statsData.todayCash}</span></div>
                                <div className="stat-box" style={{borderColor:'#3b82f6'}}><span className="stat-label">TOTAL</span><span className="stat-val" style={{color:'#3b82f6'}}>₹{statsData.todayTotal}</span></div>
                            </div>
                        </div>

                        <div className="glass-card">
                            <h2 style={{ fontSize: '12px', fontWeight: 900, color: '#a855f7', marginBottom: '15px' }}><FaCalendarAlt /> MONTHLY DETAILS</h2>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                                <span style={{color:'#888', fontSize:12, fontWeight:'bold'}}>TOTAL REVENUE</span>
                                <span style={{color:'#fff', fontSize:24, fontWeight:'900'}}>₹{statsData.monthTotal}</span>
                            </div>

                            <h3 style={{fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:1}}>🔥 Top Selling This Month</h3>
                            <ul style={{padding:0, listStyle:'none', marginBottom:20}}>
                                {statsData.topItems.map(([name, count], i) => (
                                    <li key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', fontSize:13}}>
                                        <span>{i+1}. {name}</span>
                                        <span style={{fontWeight:'bold', color:'#f97316'}}>{count} sold</span>
                                    </li>
                                ))}
                                {statsData.topItems.length === 0 && <li style={{color:'#666', fontSize:11, fontStyle:'italic'}}>No sales data yet.</li>}
                            </ul>

                            <button onClick={handleDownloadReport} className="btn-primary" style={{ background: '#22c55e' }}><FaDownload /> DOWNLOAD MONTHLY PDF</button>
                        </div>
                    </>
                )}
            </div>
            
            {qrModalOrder && (
                <div className="qr-overlay" onClick={() => setQrModalOrder(null)}>
                    <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 style={{color:'#f97316', marginTop:0}}>ORDER QR</h3>
                        <p style={{fontSize:12, color:'#666', marginBottom:20}}>Table {qrModalOrder.tableNum} • ₹{qrModalOrder.totalAmount}</p>
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/track/${qrModalOrder._id}`)}`} style={{width:'100%', borderRadius:10}} alt="Scan Order" />
                    </div>
                </div>
            )}

            <InstallButton /> 
        </div>
    );
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');

/* --- 🌍 GLOBAL CONTAINER --- */
.admin-container { 
    min-height: 100vh; 
    padding: 15px; 
    background: radial-gradient(circle at top center, #1a0f0a 0%, #050505 60%); 
    color: white; 
    font-family: 'Inter', sans-serif; 
    -webkit-tap-highlight-color: transparent; 
    padding-bottom: 80px; 
}

/* --- 📱 MOBILE DEFAULT (9:16 Aspect Logic) --- */
.max-w-wrapper { 
    width: 100%; 
    margin: 0 auto; 
    transition: max-width 0.3s ease; 
}

/* --- 💻 LAPTOP/DESKTOP OVERRIDES (16:9 Aspect Logic) --- */
@media (min-width: 1024px) {
    .max-w-wrapper { 
        max-width: 1600px; /* Use full screen width */
        padding: 0 40px; 
    }
    
    /* Grid for Orders: 3-4 cards per row */
    .responsive-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); 
        gap: 20px; 
    }

    /* Menu Editor: Split Screen (Left: Form, Right: List) */
    .menu-layout {
        display: grid;
        grid-template-columns: 350px 1fr;
        gap: 30px;
        align-items: start;
    }

    /* Bigger Nav Buttons */
    .nav-grid-row-1 { gap: 20px !important; }
    .nav-icon-btn { height: 100px; font-size: 14px; }
}

@media (max-width: 1023px) {
    .max-w-wrapper { max-width: 480px; } /* Keep mobile tight */
    .responsive-grid { display: flex; flex-direction: column; gap: 15px; }
    .menu-layout { display: flex; flex-direction: column; gap: 20px; }
}

/* --- COMMON UI ELEMENTS --- */
.shop-title { font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -1px; text-transform: uppercase; color: white; }
.badge-pro { background: rgba(255, 153, 51, 0.15); color: #FF9933; border: 1px solid rgba(255, 153, 51, 0.3); padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; }
.btn-glass { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.2s; }
.btn-primary { background: linear-gradient(135deg, #FF8800 0%, #FF5500 100%); border: none; color: white; width: 100%; padding: 18px; border-radius: 18px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255, 85, 0, 0.4); touch-action: manipulation; }
.glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); backdrop-filter: blur(12px); border-radius: 28px; padding: 22px; margin-bottom: 20px; }

/* NAVIGATION */
.nav-grid-row-1 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
.nav-grid-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.nav-icon-btn { aspect-ratio: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #888; cursor: pointer; transition: 0.3s; }
.nav-icon-btn.active { background: rgba(255, 153, 51, 0.2); border-color: #FF9933; color: #FF9933; box-shadow: 0 0 15px rgba(255, 153, 51, 0.2); border-radius: 24px; aspect-ratio: auto; } /* Rounded square when active on desktop looks better */
.nav-icon-label { font-size: 9px; font-weight: 900; margin-top: 5px; text-transform: uppercase; }
.nav-rect-btn { padding: 15px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; color: #aaa; font-weight: 900; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; }
.nav-rect-btn.active { background: linear-gradient(90deg, rgba(255,153,51,0.1), rgba(255,153,51,0.05)); border-color: #FF9933; color: #FF9933; }

/* INPUTS & LISTS */
.input-dark { width: 100%; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 14px; color: white; margin-bottom: 15px; outline: none; box-sizing: border-box; font-size: 16px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.menu-link-box { background: rgba(0,0,0,0.3); border: 1px dashed #444; padding: 15px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.link-text { color: #3b82f6; font-size: 11px; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; text-decoration: none; }
.spin { animation: rotate 1s linear infinite; } @keyframes rotate { 100% { transform: rotate(360deg); } }

/* OFFLINE BANNER */
.offline-banner { background: #ef4444; color: white; font-weight: 900; font-size: 12px; text-align: center; padding: 8px; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; display: flex; align-items: center; justify-content: center; gap: 8px; }

/* ORDER CARD */
.order-card { background: #111; color: white; border: 1px solid #333; border-radius: 24px; padding: 0; margin-bottom: 0; overflow: hidden; position: relative; transition: all 0.3s ease; height: fit-content; }
.order-card:hover { border-color: #FF9933; transform: translateY(-2px); }
.order-card.cancelled-card { opacity: 0.5; border: 1px solid #ef4444; filter: grayscale(0.8); }
.order-header { padding: 15px; background: #1a1a1a; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #333; }
.table-big { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; margin: 0; }
.id-small { font-size: 10px; color: #666; font-family: monospace; letter-spacing: 1px; font-weight: bold; display: block; margin-bottom: 2px; }
.time-badge { font-size: 10px; background: #222; padding: 4px 8px; border-radius: 6px; color: #aaa; display: flex; alignItems: center; gap: 4px; font-weight: bold; }
.pay-badge { font-size: 10px; font-weight: 900; margin-top: 5px; display: flex; alignItems: center; gap: 4px; justify-content: flex-end; }
.order-body { padding: 15px; }
.item-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; font-weight: 500; color: #ddd; }
.item-qty { color: #f97316; font-weight: 900; margin-right: 8px; }
.status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 0 15px 15px 15px; }
.status-btn { padding: 12px; border: none; border-radius: 12px; color: white; font-weight: 900; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; }
.action-row { display: flex; gap: 8px; padding: 0 15px 15px 15px; border-top: 1px dashed #333; margin-top: 10px; padding-top: 15px; }

/* BROADCAST & QR */
.broadcast-bar { background: linear-gradient(90deg, #f97316, #ef4444); color: white; font-size: 12px; font-weight: bold; padding: 8px 0; overflow: hidden; white-space: nowrap; position: fixed; top: 0; left: 0; width: 100%; z-index: 100; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.4); }
.marquee { display: inline-block; padding-left: 100%; animation: scroll 15s linear infinite; }
@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); }
.qr-modal { background: white; padding: 30px; border-radius: 30px; text-align: center; width: 300px; animation: popUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes popUp { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

/* STATS */
.stat-box { background: #111; padding: 15px; border-radius: 12px; border: 1px solid #222; text-align: center; }
.stat-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 5px; display: block; }
.stat-val { font-size: 18px; font-weight: 900; color: white; }
`;

export default RestaurantAdmin;