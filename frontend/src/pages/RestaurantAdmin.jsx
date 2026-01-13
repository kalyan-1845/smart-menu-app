import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, 
    FaQrcode, FaPlus, FaSpinner, FaPrint, 
    FaCheck, FaFire, FaChartLine, FaTimes, FaReceipt, FaFilePdf
} from "react-icons/fa";
import { toast } from "react-hot-toast";

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
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Tabs: 'orders', 'menu', 'tools', 'revenue'
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders");
    
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [mongoId, setMongoId] = useState(null); 
    
    // Menu Form
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    
    // Tools / QR Form
    const [qrCount, setQrCount] = useState(15); 
    
    // Modal
    const [selectedTable, setSelectedTable] = useState(null);

    // --- 1. PERSIST TAB STATE ---
    useEffect(() => {
        localStorage.setItem(`last_tab_${id}`, activeTab);
        setSearchParams({ tab: activeTab }, { replace: true });
    }, [activeTab, id, setSearchParams]);

    // --- 2. DATA FETCHING (POLLING) ---
    const refreshData = useCallback(async (manualId) => {
        if (!navigator.onLine) return; 
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Only fetch what we need based on tab to save data
            const promises = [axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config)];
            
            if (activeTab === "menu" || dishes.length === 0) {
                promises.push(axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config));
            }

            const results = await Promise.all(promises);
            setInboxOrders(results[0].data || []);
            
            if (results[1]) {
                setDishes(results[1].data || []);
            }
            
            setIsLoading(false);
        } catch (e) { 
            setIsLoading(false);
            if (e.response?.status === 401) setIsAuthenticated(false);
        }
    }, [API_BASE, id, mongoId, activeTab, dishes.length]);

    // Initial Load & Timer
    useEffect(() => {
        const token = localStorage.getItem(`owner_token_${id}`);
        const savedId = localStorage.getItem(`owner_id_${id}`);
        if (token && savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            refreshData(savedId);
        } else setIsLoading(false);

        // Auto-refresh every 15 seconds to keep Kitchen & Counter in sync
        const interval = setInterval(() => {
            if(isAuthenticated && navigator.onLine) refreshData();
        }, 15000); 
        return () => clearInterval(interval);
    }, [id, refreshData, isAuthenticated]);

    // --- 3. LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_BASE}/auth/login`, { username: id, password });
            localStorage.setItem(`owner_token_${id}`, res.data.token);
            localStorage.setItem(`owner_id_${id}`, res.data._id);
            setMongoId(res.data._id);
            setRestaurantName(res.data.restaurantName);
            setIsAuthenticated(true);
            refreshData(res.data._id);
            toast.success("Login Successful");
        } catch (err) { toast.error("Invalid Key"); }
    };

    // --- 4. TABLE LOGIC (Smart Grouping) ---
    const tableData = useMemo(() => {
        const map = {};
        // Default 1 to 20 tables (or based on orders)
        for(let i = 1; i <= 20; i++) {
            map[i] = { tableNum: i, orders: [], totalAmount: 0, status: 'Free' };
        }
        
        inboxOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').forEach(order => {
            const tNum = parseInt(order.tableNum);
            if (!map[tNum]) map[tNum] = { tableNum: tNum, orders: [], totalAmount: 0, status: 'Free' };
            map[tNum].orders.push(order);
            map[tNum].totalAmount += order.totalAmount;
            map[tNum].status = 'Occupied';
        });
        return map;
    }, [inboxOrders]);

    // --- 5. QR CODE GENERATOR (TOOLS) ---
    const generateQRPDF = () => {
        const doc = new jsPDF();
        let x = 20, y = 20;

        doc.setFontSize(22);
        doc.text(`QR Menus: ${restaurantName}`, 105, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.text("Scan to Order • No App Needed", 105, 22, { align: 'center' });
        
        y += 20;

        for (let i = 1; i <= qrCount; i++) {
            // ✅ THIS URL NEVER EXPIRES
            const permanentUrl = `${window.location.origin}/menu/${id}?table=${i}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(permanentUrl)}`;
            
            // Layout Logic for PDF (Grid)
            if (y > 250) { doc.addPage(); y = 20; }
            
            doc.setDrawColor(200);
            doc.rect(x - 5, y - 5, 50, 60); // Border
            
            doc.addImage(qrApiUrl, "PNG", x, y, 40, 40);
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(`Table ${i}`, x + 20, y + 50, { align: "center" });
            
            x += 60;
            if (x > 150) { x = 20; y += 70; }
        }
        doc.save(`${restaurantName}_QR_Codes.pdf`);
        toast.success("Downloading QR Codes...");
    };

    // --- 6. MENU ACTIONS ---
    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Name & Price Required");
        const finalCategory = isCustomCategory ? customCategory : newItem.category;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, price: parseFloat(newItem.price), image: newItem.image || "", 
                category: finalCategory, restaurantId: mongoId, isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Added to Menu");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" }); // Reset
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this item?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Deleted");
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    // --- 7. PRINTER FUNCTIONS ---
    
    // ✅ KITCHEN PRINTER (Big Table Number)
    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:5px;">
                <h3 style="text-align:center;margin:0;">KITCHEN TICKET</h3>
                <h1 style="text-align:center;font-size:40px;margin:5px 0;">TABLE ${order.tableNum}</h1>
                <hr/>
                <table style="width:100%;font-size:16px;font-weight:bold;">
                    ${order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">x${i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <p style="text-align:center;font-size:12px;">${new Date(order.createdAt).toLocaleTimeString()}</p>
            </body></html>
        `);
        win.document.close(); win.print(); win.close();
    };

    // ✅ COUNTER PRINTER (Full Consolidated Bill)
    const printBill = (tableNum, orders) => {
        const allItems = []; 
        let total = 0;
        // Merge multiple orders into one list
        orders.forEach(o => { 
            total += o.totalAmount; 
            o.items.forEach(i => allItems.push(i)); 
        });
        
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:5px;">
                <h2 style="text-align:center;margin:5px 0;">${restaurantName}</h2>
                <p style="text-align:center;">TAX INVOICE</p>
                <hr/>
                <p style="font-size:16px;"><b>Table: ${tableNum}</b></p>
                <table style="width:100%;font-size:12px;text-align:left;">
                    <tr style="border-bottom:1px dashed #000;"><th>Item</th><th>Qty</th><th>Amt</th></tr>
                    ${allItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price * i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <h2 style="text-align:right;margin:10px 0;">TOTAL: Rs. ${total}</h2>
                <p style="text-align:center;font-size:10px;">Thank You! Visit Again.</p>
            </body></html>
        `);
        win.document.close(); win.print(); win.close();
    };

    const handleCompleteTable = async (tableNum, orders) => {
        if(!window.confirm(`Clear Table ${tableNum}?`)) return;
        try {
            await Promise.all(orders.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success(`Table ${tableNum} Cleared`);
            setSelectedTable(null); refreshData();
        } catch(e) { toast.error("Error closing"); }
    };

    // --- UI RENDER ---
    if (isLoading) return <div className="admin-container"><div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{styles}</style>
            <div style={{height:'90vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <div className="glass-card" style={{textAlign:'center',width:'350px'}}>
                    <FaStore size={50} color="#3b82f6" style={{marginBottom:'20px'}}/>
                    <h1>OWNER LOGIN</h1>
                    <form onSubmit={handleLogin} style={{marginTop:'25px'}}>
                        <input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/>
                        <button type="submit" className="btn-primary">LOGIN</button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            <div className="max-w-wrapper">
                {/* Header */}
                <header className="app-header">
                    <div><h1 className="shop-title">{restaurantName}</h1><span className="badge-pro">PREMIUM ADMIN</span></div>
                    <button onClick={() => {localStorage.removeItem(`owner_token_${id}`); window.location.reload();}} className="btn-glass" style={{color:'#ef4444', borderColor:'#ef4444'}}><FaSignOutAlt/> LOGOUT</button>
                </header>

                {/* Navigation */}
                <div className="nav-grid">
                    <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={22} /> <span>Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={22} /> <span>Menu</span></button>
                    <button onClick={() => setActiveTab("tools")} className={`nav-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={22} /> <span>Tools</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={22} /> <span>Stats</span></button>
                </div>

                {/* TAB: TABLES */}
                {activeTab === "orders" && (
                    <div className="table-grid">
                        {Object.values(tableData).map((table) => (
                            <div key={table.tableNum} onClick={() => setSelectedTable(table)} className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}>
                                <div className="t-num">{table.tableNum}</div>
                                <div className="t-status">{table.status === 'Occupied' ? <><span>Occupied</span><div className="t-amount">₹{table.totalAmount}</div></> : <span>Available</span>}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB: MENU */}
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> ADD ITEM</h3>
                            <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                                <input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/>
                                <input className="input-dark" placeholder="Image URL (Optional)" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/>
                            </div>
                            <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>
                                {CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}
                                <option value="custom">+ Custom</option>
                            </select>
                            {isCustomCategory && <input className="input-dark" placeholder="Category Name" value={customCategory} onChange={e=>{setCustomCategory(e.target.value);setNewItem({...newItem,category:e.target.value})}}/>}
                            <button onClick={handleAddItem} className="btn-primary">SAVE ITEM</button>
                        </div>
                        <div className="glass-card scrollable">
                            <h3 className="section-title">ACTIVE DISHES</h3>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                                        <div style={{width:45,height:45,background:'#0f172a',borderRadius:10,overflow:'hidden'}}>
                                            {dish.image && <img src={dish.image} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>}
                                        </div>
                                        <div><div style={{fontWeight:700}}>{dish.name}</div><div style={{color:'#3b82f6',fontWeight:'bold'}}>₹{dish.price}</div></div>
                                    </div>
                                    <button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: TOOLS (QR GENERATOR) */}
                {activeTab === "tools" && (
                    <div className="glass-card" style={{textAlign:'center', maxWidth:'500px', margin:'0 auto'}}>
                        <FaQrcode size={60} color="#3b82f6" style={{marginBottom:20}} />
                        <h2>QR CODE GENERATOR</h2>
                        <p style={{color:'#94a3b8', marginBottom:20}}>Generate permanent QR codes for your tables. Download and print them.</p>
                        
                        <div style={{marginBottom:20}}>
                            <label style={{display:'block', marginBottom:10, color:'#94a3b8'}}>How many tables?</label>
                            <input type="number" className="input-dark" value={qrCount} onChange={e=>setQrCount(e.target.value)} style={{textAlign:'center', fontSize:20}} />
                        </div>
                        
                        <button onClick={generateQRPDF} className="btn-primary" style={{display:'flex', alignItems:'center', justifyContent:'center', gap:10}}>
                            <FaFilePdf size={20}/> DOWNLOAD PDF
                        </button>
                    </div>
                )}

                {/* TAB: REVENUE */}
                {activeTab === "revenue" && (
                    <div className="table-grid">
                        <div className="glass-card">
                            <h3 style={{color:'#94a3b8'}}>Active Orders Value</h3>
                            <h1 style={{color:'#3b82f6', fontSize:40}}>
                                ₹{Object.values(tableData).reduce((a, b) => a + b.totalAmount, 0)}
                            </h1>
                        </div>
                        <div className="glass-card">
                            <h3 style={{color:'#94a3b8'}}>Busy Tables</h3>
                            <h1 style={{color:'#10b981', fontSize:40}}>
                                {Object.values(tableData).filter(t => t.status === 'Occupied').length}
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>TABLE {selectedTable.tableNum}</h2><button onClick={() => setSelectedTable(null)} className="btn-icon-close"><FaTimes/></button></div>
                        <div className="modal-body">
                            {selectedTable.orders.length === 0 ? <p style={{textAlign:'center', color:'#666'}}>Empty Table</p> : 
                                selectedTable.orders.map((order) => (
                                    <div key={order._id} className="order-item">
                                        <div className="order-meta"><span>#{order._id.slice(-4)}</span><span>{new Date(order.createdAt).toLocaleTimeString()}</span></div>
                                        {order.items.map((item, i) => (<div key={i} className="order-row"><span>{item.name}</span><b>x{item.quantity}</b></div>))}
                                        {/* KOT BUTTON - For Kitchen Machine */}
                                        <div style={{marginTop:10,display:'flex',justifyContent:'flex-end'}}>
                                            <button onClick={() => printKOT(order)} className="btn-sm"><FaPrint/> KOT</button>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                        {selectedTable.orders.length > 0 && (
                            <div className="modal-footer">
                                <div className="modal-footer-info"><span>TOTAL</span><span className="total-val">₹{selectedTable.totalAmount}</span></div>
                                {/* ACTIONS - For Counter Machine */}
                                <div className="modal-actions">
                                    <button onClick={() => printBill(selectedTable.tableNum, selectedTable.orders)} className="btn-action blue"><FaReceipt/> BILL</button>
                                    <button onClick={() => handleCompleteTable(selectedTable.tableNum, selectedTable.orders)} className="btn-action green"><FaCheck/> CLEAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <InstallButton /> 
        </div>
    );
};

// --- STYLES ---
const styles = `
.admin-container { min-height: 100vh; padding: 20px; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 90px; }
.max-w-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }
@media (min-width: 1024px) { .max-w-wrapper { padding: 0 40px; } }

.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.shop-title { font-size: 26px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }

.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 14px; font-weight: 600; }
.nav-btn.active { border-color: #3b82f6; color: #60a5fa; background: rgba(37, 99, 235, 0.1); }

.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }
.table-box { aspect-ratio: 1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px solid transparent; transition: 0.2s; background: #1e293b; border: 1px solid #334155; }
.table-box.free { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399; }
.table-box.occupied { background: rgba(37, 99, 235, 0.15); border-color: #3b82f6; color: #60a5fa; }
.t-num { font-size: 32px; font-weight: 800; }
.t-status { font-size: 12px; margin-top: 5px; text-align: center; }
.t-amount { font-weight: 700; font-size: 16px; margin-top: 2px; }

.glass-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.menu-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 1024px) { .menu-layout { grid-template-columns: 350px 1fr; } }
.scrollable { max-height: 600px; overflow-y: auto; }

.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 14px; border-radius: 12px; color: white; margin-bottom: 15px; outline: none; transition: 0.2s; }
.input-dark:focus { border-color: #3b82f6; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 15px; border-radius: 14px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-primary:active { transform: scale(0.98); }
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid #334155; padding: 8px 16px; border-radius: 8px; color: #fff; cursor: pointer; display: flex; alignItems: center; gap: 8px; font-weight: 600; }

.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #334155; }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 10px; border-radius: 10px; cursor: pointer; }

.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(5px); }
.qr-modal { background: #0f172a; width: 95%; max-width: 500px; border-radius: 24px; padding: 0; max-height: 90vh; overflow-y: auto; border: 1px solid #334155; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.modal-header { padding: 20px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; background: #1e293b; }
.modal-body { padding: 20px; }
.order-item { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #334155; }
.order-meta { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; margin-bottom: 8px; }
.order-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.btn-sm { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-icon-close { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 20px; }

.modal-footer { padding: 20px; background: #1e293b; border-top: 1px solid #334155; }
.modal-footer-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: 700; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-action { padding: 14px; border: none; border-radius: 12px; font-weight: 700; color: white; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }
.total-val { color: #34d399; font-size: 20px; font-weight: 800; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default RestaurantAdmin;