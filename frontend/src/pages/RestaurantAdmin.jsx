import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Ensure this is installed: npm install jspdf-autotable
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, FaCopy, 
    FaQrcode, FaPlus, FaSpinner, FaPrint, 
    FaCheck, FaFire, FaChartLine, FaWifi, FaTimes, FaReceipt, FaFilePdf, FaRupeeSign
} from "react-icons/fa";
import { toast } from "react-hot-toast";

// --- 📋 PREDEFINED CATEGORIES ---
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
    const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
    const API_BASE = `${SERVER_URL}/api`;
    const publicMenuUrl = `${window.location.origin}/menu/${id}`;
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders");
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [isPro, setIsPro] = useState(false);
    const [mongoId, setMongoId] = useState(null); 
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 12 });
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    
    // Selected Table for Modal
    const [selectedTable, setSelectedTable] = useState(null);

    // --- SYNC LOGIC ---
    useEffect(() => {
        localStorage.setItem(`last_tab_${id}`, activeTab);
        setSearchParams({ tab: activeTab }, { replace: true });
    }, [activeTab, id, setSearchParams]);

    const refreshData = useCallback(async (manualId) => {
        if (!navigator.onLine) return; 
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId || fetchId === "undefined") return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config)
            ]);
            setDishes(dishRes.data || []);
            // Keep completed orders in memory for the stats tab, but filter for table view
            setInboxOrders(orderRes.data || []);
            setIsLoading(false);
        } catch (e) { 
            setIsLoading(false);
            if (e.response && e.response.status === 401) {
                localStorage.removeItem(`owner_token_${id}`);
                setIsAuthenticated(false);
            }
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
        }, 5000); 
        return () => clearInterval(interval);
    }, [id, refreshData, isAuthenticated]);

    // --- AUTH ---
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
            toast.success("Welcome Back!");
        } catch (err) { toast.error("Invalid Key"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`owner_token_${id}`);
        window.location.reload();
    };

    // --- DATA PROCESSING ---
    
    // 1. Grid View Data (Only Active Orders)
    const tableData = useMemo(() => {
        const map = {};
        for(let i = parseInt(qrRange.start); i <= parseInt(qrRange.end); i++) {
            map[i] = { tableNum: i, orders: [], totalAmount: 0, status: 'Free' };
        }
        
        // Filter only active orders for the live dashboard
        const activeOrders = inboxOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');

        activeOrders.forEach(order => {
            const tNum = parseInt(order.tableNum);
            if (!map[tNum]) map[tNum] = { tableNum: tNum, orders: [], totalAmount: 0, status: 'Free' };
            
            map[tNum].orders.push(order);
            map[tNum].totalAmount += order.totalAmount;
            map[tNum].status = 'Occupied';
        });
        return map;
    }, [inboxOrders, qrRange]);

    [cite_start]// 2. Revenue Stats (All Orders Today) [cite: 1]
    const dailyStats = useMemo(() => {
        const todayStr = new Date().toLocaleDateString();
        // Use all orders (including completed) for revenue calculation
        const todayOrders = inboxOrders.filter(o => 
            new Date(o.createdAt).toLocaleDateString() === todayStr && 
            o.status !== 'Cancelled'
        );

        const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        return {
            revenue: totalRevenue,
            count: todayOrders.length,
            orders: todayOrders
        };
    }, [inboxOrders]);

    // --- ACTIONS ---
    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Name & Price Required");
        const finalCategory = isCustomCategory ? customCategory : newItem.category;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, price: parseFloat(newItem.price), image: newItem.image || "", category: finalCategory, restaurantId: mongoId, isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Item Added");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    // --- REPORT EXPORT ---
    const handleDownloadPDF = () => {
        if (dailyStats.orders.length === 0) return toast.error("No orders today to export.");

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.setTextColor(41, 128, 185); // Blue color
        doc.text(restaurantName.toUpperCase(), 14, 15);
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Daily Sales Report - ${new Date().toLocaleDateString()}`, 14, 25);
        doc.text(`Total Revenue: Rs. ${dailyStats.revenue}`, 14, 32);

        [cite_start]// Table Data Preparation [cite: 2]
        const tableBody = dailyStats.orders.map((order, index) => {
            // Concatenate all items into one string for the "Items" column
            const itemsString = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
            
            return [
                index + 1, // #
                `Table ${order.tableNum}\n${itemsString}`, // Table & Items
                `Rs.${order.totalAmount}`, // Amt
                order.paymentMethod || 'Online', // Pay (Default to Online/Cash)
                new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) // Time
            ];
        });

        autoTable(doc, {
            head: [['#', 'Table / Items', 'Amt', 'Pay', 'Time']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, // Blue Header
            alternateRowStyles: { fillColor: [240, 248, 255] }, // Light blue rows
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 90 }, // Wide column for items
                2: { cellWidth: 25, halign: 'right' },
                3: { cellWidth: 25, halign: 'center' },
                4: { cellWidth: 25, halign: 'right' }
            }
        });

        doc.save(`Sales_${restaurantName}_${Date.now()}.pdf`);
        toast.success("PDF Report Downloaded");
    };

    // --- PRINTING ---
    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;font-size:14px;"><div style="text-align:center;font-weight:bold;">${restaurantName.toUpperCase()}</div><div style="text-align:center;">KOT #${order._id.slice(-4).toUpperCase()}</div><div style="text-align:center;">TABLE: ${order.tableNum}</div><hr/><table style="width:100%;text-align:left;"><tr><th>Item</th><th style="text-align:right">Qty</th></tr>${order.items.map(i=>`<tr><td>${i.name}</td><td style="text-align:right;font-weight:bold;">${i.quantity}</td></tr>`).join('')}</table><hr/><div style="text-align:center;font-weight:bold;">CHEF COPY</div></body></html>`);
        win.document.close(); win.print(); win.close();
    };

    const printBill = (tableNum, orders) => {
        let allItems=[]; let total=0;
        orders.forEach(o=>{ total+=o.totalAmount; o.items.forEach(i=>allItems.push(i)); });
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;font-size:14px;"><div style="text-align:center;font-weight:bold;font-size:16px;">${restaurantName.toUpperCase()}</div><div style="text-align:center;">TABLE: ${tableNum}</div><hr/><table style="width:100%;text-align:left;"><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr>${allItems.map(i=>`<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${i.price*i.quantity}</td></tr>`).join('')}</table><hr/><div style="display:flex;justify-content:space-between;font-weight:bold;font-size:16px;"><span>TOTAL:</span><span>Rs. ${total}</span></div><hr/><div style="text-align:center;">Thank You!</div></body></html>`);
        win.document.close(); win.print(); win.close();
    };

    const handleCompleteTable = async (tableNum, orders) => {
        if(!window.confirm(`Close Table ${tableNum}?`)) return;
        try {
            await Promise.all(orders.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success(`Table ${tableNum} Closed`);
            setSelectedTable(null); refreshData();
        } catch(e) { toast.error("Error closing"); }
    };

    const generatePrintableQRs = () => {
        const printWindow = window.open('', '_blank');
        const qrCodesHtml = [];
        for (let i = qrRange.start; i <= qrRange.end; i++) {
            const url = `${window.location.origin}/menu/${id}/${i}`;
            const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
            qrCodesHtml.push(`<div style="display:inline-block;margin:20px;padding:25px;border:4px solid #3b82f6;text-align:center;border-radius:30px;width:240px;font-family:sans-serif;"><h2 style="color:#3b82f6;margin:0;">${restaurantName.toUpperCase()}</h2><img src="${qrSrc}" width="200" style="margin:15px 0;"/><p style="font-weight:900;font-size:24px;margin:0;">TABLE ${i}</p></div>`);
        }
        if(printWindow) { printWindow.document.write(`<html><body onload="window.print()">${qrCodesHtml.join('')}</body></html>`); printWindow.document.close(); }
    };

    if (isLoading) return <div className="admin-container"><div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container"><style>{styles}</style>
            <div style={{height:'90vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="glass-card" style={{textAlign:'center',width:'350px'}}>
                    <FaStore size={50} color="#3b82f6" style={{marginBottom:'20px'}}/>
                    <h1 style={{fontSize:'24px',fontWeight:900}}>OWNER PORTAL</h1>
                    <form onSubmit={handleLogin} style={{marginTop:'25px'}}>
                        <input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/>
                        <button type="submit" className="btn-primary">SECURE LOGIN</button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            {!isOnline && <div className="offline-banner"><FaWifi /> NO INTERNET</div>}
            
            <div className="max-w-wrapper">
                <header className="app-header">
                    <div>
                        <h1 className="shop-title">{restaurantName}</h1>
                        <span className="badge-pro">PREMIUM DASHBOARD</span>
                    </div>
                    <button onClick={handleLogout} className="btn-glass" style={{color:'#ef4444'}}><FaSignOutAlt/></button>
                </header>

                <div className="nav-grid">
                    <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={22} /> <span>Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={22} /> <span>Menu</span></button>
                    <button onClick={() => setActiveTab("tools")} className={`nav-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={22} /> <span>Tools</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={22} /> <span>Stats</span></button>
                </div>

                {/* 🟢 TABLE GRID */}
                {activeTab === "orders" && (
                    <div className="table-grid">
                        {Object.values(tableData).map((table) => (
                            <div key={table.tableNum} onClick={() => setSelectedTable(table)} className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}>
                                <div className="t-num">{table.tableNum}</div>
                                <div className="t-status">
                                    {table.status === 'Occupied' ? (
                                        <>
                                            <span style={{opacity:0.8}}>Occupied</span>
                                            <div className="t-amount">₹{table.totalAmount}</div>
                                            {table.orders.length > 0 && <span className="badge-new">ACTIVE</span>}
                                        </>
                                    ) : <span>Available</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 📝 MENU EDITOR */}
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> QUICK ADD</h3>
                            <input className="input-dark" placeholder="Item Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                <input type="number" className="input-dark" placeholder="Price (₹)" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/>
                                <input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/>
                            </div>
                            <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>
                                {CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}
                                <option value="custom">+ Custom</option>
                            </select>
                            {isCustomCategory && <input className="input-dark" placeholder="Category Name" value={customCategory} onChange={e=>{setCustomCategory(e.target.value);setNewItem({...newItem,category:e.target.value})}}/>}
                            <button onClick={handleAddItem} className="btn-primary">ADD TO MENU</button>
                        </div>
                        <div className="glass-card">
                            <h3 className="section-title">ACTIVE MENU ({dishes.length})</h3>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                                        <div style={{width:45,height:45,background:'#0f172a',borderRadius:10,overflow:'hidden'}}>{dish.image && <img src={dish.image} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>}</div>
                                        <div><div style={{fontWeight:700}}>{dish.name}</div><div style={{color:'#3b82f6',fontSize:13,fontWeight:'bold'}}>₹{dish.price}</div></div>
                                    </div>
                                    <button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🛠 TOOLS */}
                {activeTab === "tools" && (
                    <div className="glass-card">
                        <h2 className="section-title"><FaQrcode/> TABLE MANAGEMENT</h2>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:15}}>
                            <input type="number" className="input-dark" value={qrRange.start} onChange={e=>setQrRange({...qrRange,start:e.target.value})} placeholder="Start Table"/>
                            <input type="number" className="input-dark" value={qrRange.end} onChange={e=>setQrRange({...qrRange,end:e.target.value})} placeholder="End Table"/>
                        </div>
                        <button onClick={generatePrintableQRs} className="btn-primary">GENERATE QR CODES</button>
                        <hr className="divider"/>
                        <h3>Quick Links</h3>
                        {Array.from({length:(parseInt(qrRange.end)-parseInt(qrRange.start)+1)},(_,i)=>parseInt(qrRange.start)+i).map(n=>(
                            <div key={n} className="menu-link-box">
                                <span style={{fontSize:13,fontWeight:'bold'}}>Table {n}</span>
                                <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/menu/${id}/${n}`);toast.success("Copied");}} className="btn-glass"><FaCopy/></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 📊 REVENUE & STATS */}
                {activeTab === "revenue" && (
                    <div className="glass-card">
                        <h2 className="section-title"><FaChartLine/> DAILY SNAPSHOT</h2>
                        
                        <div className="stats-container">
                            <div className="stat-card blue">
                                <div className="label">TODAY'S REVENUE</div>
                                <div className="value">₹{dailyStats.revenue}</div>
                            </div>
                            <div className="stat-card dark">
                                <div className="label">TOTAL ORDERS</div>
                                <div className="value">{dailyStats.count}</div>
                            </div>
                        </div>

                        <button onClick={handleDownloadPDF} className="btn-primary" style={{marginTop:20, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                            <FaFilePdf size={18}/> DOWNLOAD DAILY REPORT
                        </button>

                        <div style={{marginTop: 20, fontSize: 12, color: '#94a3b8', textAlign: 'center'}}>
                            Exports a detailed PDF with Table #, Items, Amount & Time.
                        </div>
                    </div>
                )}
            </div>

            {/* 🛑 MODAL: TABLE DETAILS */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>TABLE {selectedTable.tableNum}</h2>
                            <button onClick={() => setSelectedTable(null)} className="btn-icon-close"><FaTimes/></button>
                        </div>
                        
                        <div className="modal-body">
                            {selectedTable.orders.length === 0 ? (
                                <p style={{textAlign:'center',color:'#94a3b8',padding:20}}>Table is currently empty.</p>
                            ) : (
                                selectedTable.orders.map((order) => (
                                    <div key={order._id} className="order-item">
                                        <div className="order-meta">
                                            <span>#{order._id.slice(-4).toUpperCase()}</span>
                                            <span>{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        {order.items.map((item, i) => (
                                            <div key={i} className="order-row">
                                                <span>{item.name}</span>
                                                <b>x{item.quantity}</b>
                                            </div>
                                        ))}
                                        <div style={{marginTop:10,display:'flex',justifyContent:'flex-end'}}>
                                            <button onClick={() => printKOT(order)} className="btn-sm"><FaPrint/> KOT</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedTable.orders.length > 0 && (
                            <>
                                <div className="modal-footer-info">
                                    <span>TOTAL BILL</span>
                                    <span className="total-val">₹{selectedTable.totalAmount}</span>
                                </div>

                                <div className="modal-actions">
                                    <button onClick={() => printBill(selectedTable.tableNum, selectedTable.orders)} className="btn-action blue">
                                        <FaReceipt/> BILL
                                    </button>
                                    <button onClick={() => handleCompleteTable(selectedTable.tableNum, selectedTable.orders)} className="btn-action green">
                                        <FaCheck/> CLOSE TABLE
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <InstallButton /> 
        </div>
    );
};

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');

.admin-container { 
    min-height: 100vh; 
    padding: 20px; 
    background: radial-gradient(circle at top center, #1e293b 0%, #020617 100%); 
    color: white; 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    padding-bottom: 90px;
}
.max-w-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }

/* Header */
.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
.shop-title { font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-transform: uppercase; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; }

/* Buttons & Inputs */
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; padding: 10px 14px; border-radius: 12px; cursor: pointer; transition: 0.2s; }
.btn-glass:hover { background: rgba(255,255,255,0.1); }
.btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border: none; color: white; width: 100%; padding: 16px; border-radius: 14px; font-weight: 700; font-size: 15px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: transform 0.2s; }
.btn-primary:active { transform: scale(0.98); }
.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 12px; color: white; margin-bottom: 15px; font-size: 15px; transition: border-color 0.2s; }
.input-dark:focus { border-color: #3b82f6; outline: none; }

/* Cards */
.glass-card { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 24px; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
.section-title { font-size: 13px; fontWeight: 800; color: #94a3b8; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; text-transform: uppercase; letter-spacing: 1px; }
.divider { border: 0; border-top: 1px solid rgba(255,255,255,0.05); margin: 20px 0; }

/* Navigation */
.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: all 0.2s; }
.nav-btn span { font-size: 11px; font-weight: 700; margin-top: 6px; }
.nav-btn.active { background: rgba(37, 99, 235, 0.15); border-color: #3b82f6; color: #60a5fa; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15); }

/* Table Grid */
.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 16px; }
.table-box { aspect-ratio: 1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; position: relative; overflow: hidden; }
.table-box.free { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399; }
.table-box.occupied { background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1)); border-color: #3b82f6; color: #60a5fa; }
.t-num { font-size: 32px; font-weight: 800; z-index: 1; }
.t-status { font-size: 11px; font-weight: 600; text-align: center; margin-top: 4px; z-index: 1; }
.t-amount { color: #fff; font-size: 15px; font-weight: 700; margin-top: 2px; }
.badge-new { position: absolute; top: 10px; right: 10px; background: #ef4444; color: white; width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 10px #ef4444; }

/* Menu Items */
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.menu-link-box { display: flex; justify-content: space-between; align-items: center; background: #0f172a; padding: 12px 16px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #1e293b; }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }

/* Stats & Reports */
.stats-container { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.stat-card { padding: 20px; border-radius: 18px; text-align: center; }
.stat-card.blue { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
.stat-card.dark { background: #0f172a; border: 1px solid #1e293b; }
.stat-card .label { font-size: 11px; font-weight: 700; opacity: 0.8; margin-bottom: 5px; color: #e2e8f0; }
.stat-card .value { font-size: 24px; font-weight: 800; color: white; }

/* Modal */
.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px; }
.qr-modal { background: #0f172a; border: 1px solid #334155; width: 100%; max-width: 450px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); display: flex; flex-direction: column; max-height: 85vh; }
.modal-header { padding: 20px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-header h2 { margin: 0; font-size: 20px; color: white; }
.btn-icon-close { background: transparent; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.order-item { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid #3b82f6; }
.order-meta { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
.order-row { display: flex; justify-content: space-between; font-size: 14px; color: #e2e8f0; margin-bottom: 4px; }
.btn-sm { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; }
.modal-footer-info { padding: 20px; background: #1e293b; display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 16px; border-top: 1px solid #334155; }
.total-val { color: #34d399; font-size: 20px; }
.modal-actions { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #0f172a; border-radius: 0 0 24px 24px; }
.btn-action { padding: 14px; border: none; border-radius: 12px; font-weight: 700; color: white; cursor: pointer; display: flex; justify-content: center; gap: 8px; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }

@media (min-width: 1024px) {
    .nav-grid { gap: 20px; }
    .table-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 24px; }
    .t-num { font-size: 42px; }
    .t-amount { font-size: 18px; }
    .menu-layout { display: grid; grid-template-columns: 350px 1fr; gap: 30px; align-items: start; }
}
`;

export default RestaurantAdmin;