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
    
    // Tabs
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders");
    
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [mongoId, setMongoId] = useState(null); 
    
    // Forms
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
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
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
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

        const interval = setInterval(() => {
            if(isAuthenticated) refreshData();
        }, 5000); // Poll every 5 seconds for faster updates
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

    // --- 4. TABLE LOGIC ---
    const tableData = useMemo(() => {
        const map = {};
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

    // --- 5. QR PDF ---
    const generateQRPDF = () => {
        const doc = new jsPDF();
        let x = 15, y = 20;

        doc.setFontSize(22);
        doc.text(restaurantName.toUpperCase(), 105, 15, { align: 'center' });
        
        y += 10;

        for (let i = 1; i <= qrCount; i++) {
            const permanentUrl = `${window.location.origin}/menu/${id}?table=${i}`;
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(permanentUrl)}`;
            
            if (y > 260) { doc.addPage(); y = 20; }
            
            doc.setDrawColor(200);
            doc.rect(x, y, 50, 60); 
            doc.addImage(qrApiUrl, "PNG", x + 5, y + 5, 40, 40);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(`T - ${i}`, x + 25, y + 55, { align: "center" });
            
            x += 60;
            if (x > 150) { x = 15; y += 70; }
        }
        doc.save(`${restaurantName}_Tables.pdf`);
        toast.success("PDF Downloaded");
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
            toast.success("Added");
            setNewItem({ ...newItem, name: "", price: "" }); 
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Deleted");
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    // --- 7. PRINTER & CLEAR ---
    
    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        if (!win) return toast.error("Allow Popups!");
        
        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:5px;">
                <div style="text-align:center;font-weight:bold;border-bottom:2px solid black;">KITCHEN ORDER</div>
                <h1 style="text-align:center;font-size:50px;margin:5px 0;">T-${order.tableNum}</h1>
                <hr/>
                <table style="width:100%;font-size:18px;font-weight:bold;">
                    ${order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">x${i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <div style="text-align:center;font-size:12px;">${new Date(order.createdAt).toLocaleTimeString()}</div>
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); win.close(); }, 500);
    };

    const printBill = (tableNum, orders) => {
        const allItems = []; 
        let total = 0;
        orders.forEach(o => { 
            total += o.totalAmount; 
            o.items.forEach(i => allItems.push(i)); 
        });
        
        const win = window.open('', '', 'width=300,height=600');
        if (!win) return toast.error("Allow Popups!");

        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:5px;">
                <h2 style="text-align:center;margin:0;">${restaurantName}</h2>
                <div style="text-align:center;font-size:12px;">Payment Receipt</div>
                <hr/>
                <div style="font-size:16px;"><b>Table: ${tableNum}</b></div>
                <div style="font-size:12px;">Date: ${new Date().toLocaleDateString()}</div>
                <hr/>
                <table style="width:100%;font-size:12px;text-align:left;">
                    <tr style="border-bottom:1px dashed #000;"><th>Item</th><th>Qty</th><th>Amt</th></tr>
                    ${allItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price * i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <h2 style="text-align:right;margin:10px 0;">Total: ₹${total}</h2>
                <div style="text-align:center;font-size:10px;">Thank You!</div>
            </body></html>
        `);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); win.close(); }, 500);
    };

    const handleCompleteTable = async (tableNum, orders) => {
        if(!window.confirm(`Clear Table ${tableNum}?`)) return;
        try {
            await Promise.all(orders.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success(`Table ${tableNum} Cleared`);
            setSelectedTable(null); 
            refreshData();
        } catch(e) { toast.error("Error closing"); }
    };

    // --- RENDER ---
    if (isLoading) return <div className="admin-container"><div className="center-box"><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{styles}</style>
            <div className="center-box" style={{height:'90vh'}}>
                <div className="glass-card" style={{width:'350px', textAlign:'center'}}>
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
                
                {/* 🏗️ STICKY HEADER - Always Visible */}
                <div className="sticky-header">
                    <header className="app-header">
                        <div><h1 className="shop-title">{restaurantName}</h1><span className="badge-pro">ADMIN</span></div>
                        <button onClick={() => {localStorage.removeItem(`owner_token_${id}`); window.location.reload();}} className="btn-glass danger"><FaSignOutAlt/> LOGOUT</button>
                    </header>

                    {/* TABS */}
                    <div className="nav-grid">
                        <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={24} /> <span>Tables</span></button>
                        <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={24} /> <span>Menu</span></button>
                        <button onClick={() => setActiveTab("tools")} className={`nav-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={24} /> <span>QR</span></button>
                        <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={24} /> <span>Stats</span></button>
                    </div>
                </div>

                {/* 📜 SCROLLABLE CONTENT */}
                <div className="content-area">
                    {activeTab === "orders" && (
                        <div className="table-grid">
                            {Object.values(tableData).map((table) => (
                                <div key={table.tableNum} onClick={() => setSelectedTable(table)} className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}>
                                    <div className="t-num">{table.tableNum}</div>
                                    <div className="t-status">
                                        {table.status === 'Occupied' ? (
                                            <>
                                                <div className="t-amt">₹{table.totalAmount}</div>
                                                {table.orders.length > 0 && <span className="badge-new">{table.orders.length}</span>}
                                            </>
                                        ) : "Empty"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "menu" && (
                        <div className="menu-layout">
                            <div className="glass-card">
                                <h3 className="section-title"><FaPlus/> ADD ITEM</h3>
                                <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                                <div className="grid-2">
                                    <input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/>
                                    <input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/>
                                </div>
                                <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>
                                    {CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}
                                    <option value="custom">+ Custom</option>
                                </select>
                                {isCustomCategory && <input className="input-dark" placeholder="Category" value={customCategory} onChange={e=>{setCustomCategory(e.target.value);setNewItem({...newItem,category:e.target.value})}}/>}
                                <button onClick={handleAddItem} className="btn-primary">SAVE</button>
                            </div>
                            <div className="glass-card">
                                <h3 className="section-title">MENU ({dishes.length})</h3>
                                {dishes.map(dish => (
                                    <div key={dish._id} className="dish-item">
                                        <div style={{display:'flex',gap:12,alignItems:'center'}}>
                                            <img src={dish.image || "https://placehold.co/50"} style={{width:40,height:40,borderRadius:8,objectFit:'cover'}} alt=""/>
                                            <div><div style={{fontWeight:700}}>{dish.name}</div><div style={{color:'#3b82f6'}}>₹{dish.price}</div></div>
                                        </div>
                                        <button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === "tools" && (
                        <div className="center-box">
                            <div className="glass-card" style={{width:'100%', maxWidth:'400px', textAlign:'center'}}>
                                <FaQrcode size={60} color="#3b82f6" style={{marginBottom:20}}/>
                                <h2>QR GENERATOR</h2>
                                <p style={{color:'#94a3b8', marginBottom:20}}>Generate permanent table codes.</p>
                                <label style={{color:'#94a3b8', display:'block', marginBottom:10}}>Table Count:</label>
                                <input type="number" className="input-dark" style={{textAlign:'center', fontSize:20}} value={qrCount} onChange={e=>setQrCount(e.target.value)}/>
                                <button onClick={generateQRPDF} className="btn-primary"><FaFilePdf/> DOWNLOAD PDF</button>
                            </div>
                        </div>
                    )}

                    {activeTab === "revenue" && (
                        <div className="grid-2">
                            <div className="glass-card center-text">
                                <h3>Active Revenue</h3>
                                <h1 style={{color:'#3b82f6', fontSize:36}}>₹{Object.values(tableData).reduce((a, b) => a + b.totalAmount, 0)}</h1>
                            </div>
                            <div className="glass-card center-text">
                                <h3>Active Tables</h3>
                                <h1 style={{color:'#10b981', fontSize:36}}>{Object.values(tableData).filter(t => t.status === 'Occupied').length}</h1>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>TABLE {selectedTable.tableNum}</h2>
                            <button onClick={() => setSelectedTable(null)} className="close-btn"><FaTimes/></button>
                        </div>
                        <div className="modal-body">
                            {selectedTable.orders.length === 0 ? <p className="empty-msg">No Orders Yet</p> : 
                                selectedTable.orders.map((order) => (
                                    <div key={order._id} className="order-card">
                                        <div className="order-header">
                                            <span>KOT: #{order._id.slice(-4).toUpperCase()}</span>
                                            <button onClick={() => printKOT(order)} className="btn-sm"><FaPrint/> KOT</button>
                                        </div>
                                        {order.items.map((item, i) => (
                                            <div key={i} className="order-row">
                                                <span>{item.name}</span>
                                                <b>x{item.quantity}</b>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            }
                        </div>
                        {selectedTable.orders.length > 0 && (
                            <div className="modal-footer">
                                <div className="footer-row"><span>Total:</span> <span className="total-val">₹{selectedTable.totalAmount}</span></div>
                                <div className="footer-actions">
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

// --- CSS (NATIVE SCROLLING FIX) ---
const styles = `
/* 1. Global Container - Allows native scroll */
.admin-container { 
    min-height: 100vh; 
    padding: 15px; 
    background: #020617; 
    color: white; 
    font-family: 'Plus Jakarta Sans', sans-serif; 
    padding-bottom: 80px; 
    box-sizing: border-box;
}

.max-w-wrapper { width: 100%; max-width: 1200px; margin: 0 auto; }

/* 2. Sticky Header (Keeps Nav visible) */
.sticky-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: #020617; /* Matches background to hide content behind */
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.shop-title { font-size: 22px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; border: 1px solid rgba(59, 130, 246, 0.2); margin-left: 8px;}

/* 3. Navigation Buttons */
.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
.nav-btn span { font-size: 10px; margin-top: 4px; font-weight: 600; }
.nav-btn.active { border-color: #3b82f6; color: #60a5fa; background: rgba(37, 99, 235, 0.1); }

/* 4. Table Grid (Mobile: 2 cols, Laptop: 5 cols) */
.table-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 20px; }
@media (min-width: 768px) { .table-grid { grid-template-columns: repeat(5, 1fr); gap: 15px; } }

.menu-layout { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 20px; }
@media (min-width: 1024px) { .menu-layout { grid-template-columns: 350px 1fr; } }

.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Components */
.table-box { aspect-ratio: 1.1; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 1px solid #334155; background: #1e293b; position: relative; }
.table-box.occupied { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
.t-num { font-size: 26px; font-weight: 800; }
.t-status { font-size: 11px; text-align: center; margin-top: 2px; color: #94a3b8; }
.t-amt { font-weight: 700; color: #fff; font-size: 14px; }
.badge-new { position: absolute; top: 8px; right: 8px; background: #ef4444; color: white; width: 18px; height: 18px; border-radius: 50%; font-size: 10px; display: flex; alignItems: center; justifyContent: center; font-weight: bold; }

.glass-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 20px; margin-bottom: 15px; }
.section-title { font-size: 12px; font-weight: 800; color: #94a3b8; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 12px; border-radius: 10px; color: white; margin-bottom: 10px; font-size: 14px; box-sizing: border-box; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 14px; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid #334155; padding: 8px 12px; border-radius: 8px; color: #fff; cursor: pointer; font-size: 12px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
.btn-glass.danger { color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

/* Modal */
.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); padding: 15px; }
.qr-modal { background: #0f172a; width: 100%; max-width: 450px; border-radius: 24px; display: flex; flex-direction: column; max-height: 85vh; border: 1px solid #334155; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.modal-header { padding: 20px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.order-card { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #334155; }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; font-size: 12px; color: #94a3b8; font-weight: 700; }
.order-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 14px; }
.btn-sm { background: #3b82f6; border: none; padding: 4px 10px; border-radius: 6px; color: white; font-size: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; }
.modal-footer { padding: 20px; background: #1e293b; border-top: 1px solid #334155; }
.footer-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: 700; font-size: 16px; }
.total-val { color: #3b82f6; font-size: 20px; }
.footer-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.btn-action { padding: 12px; border: none; border-radius: 10px; font-weight: 700; color: white; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 6px; font-size: 13px; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }

.center-box { display: flex; align-items: center; justify-content: center; height: 100%; }
.center-text { text-align: center; }
.empty-msg { text-align: center; color: #64748b; margin-top: 20px; }
.close-btn { background: transparent; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default RestaurantAdmin;