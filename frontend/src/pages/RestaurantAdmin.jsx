import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, FaCopy, 
    FaQrcode, FaPlus, FaSpinner, FaPrint, 
    FaCheck, FaFire, FaChartLine, FaWifi, FaTimes, FaReceipt, FaFilePdf, FaRupeeSign
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
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders");
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [mongoId, setMongoId] = useState(null); 
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 12 });
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [selectedTable, setSelectedTable] = useState(null);

    useEffect(() => {
        localStorage.setItem(`last_tab_${id}`, activeTab);
        setSearchParams({ tab: activeTab }, { replace: true });
    }, [activeTab, id, setSearchParams]);

    const refreshData = useCallback(async (manualId) => {
        if (!navigator.onLine) return; 
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config)
            ]);
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            setIsLoading(false);
        } catch (e) { 
            setIsLoading(false);
            if (e.response?.status === 401) setIsAuthenticated(false);
        }
    }, [API_BASE, id, mongoId]);

    useEffect(() => {
        const token = localStorage.getItem(`owner_token_${id}`);
        const savedId = localStorage.getItem(`owner_id_${id}`);
        if (token && savedId) {
            setMongoId(savedId);
            setIsAuthenticated(true);
            refreshData(savedId);
        } else setIsLoading(false);

        const interval = setInterval(() => {
            if(isAuthenticated && navigator.onLine) refreshData();
        }, 5000); 
        return () => clearInterval(interval);
    }, [id, refreshData, isAuthenticated]);

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

    const tableData = useMemo(() => {
        const map = {};
        for(let i = parseInt(qrRange.start); i <= parseInt(qrRange.end); i++) {
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
    }, [inboxOrders, qrRange]);

    const dailyStats = useMemo(() => {
        const todayStr = new Date().toLocaleDateString();
        const todayOrders = inboxOrders.filter(o => new Date(o.createdAt).toLocaleDateString() === todayStr && o.status !== 'Cancelled');
        return { revenue: todayOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0), count: todayOrders.length, orders: todayOrders };
    }, [inboxOrders]);

    // --- PRINTER FUNCTIONS ---
    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:10px;">
                <h3 style="text-align:center;">${restaurantName} (KITCHEN)</h3>
                <p>Table: ${order.tableNum} | KOT: #${order._id.slice(-4)}</p>
                <hr/>
                <table style="width:100%;">
                    ${order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">x${i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <p style="text-align:center;">Time: ${new Date(order.createdAt).toLocaleTimeString()}</p>
            </body></html>
        `);
        win.document.close(); win.print(); win.close();
    };

    const printBill = (tableNum, orders) => {
        const allItems = []; let total = 0;
        orders.forEach(o => { total += o.totalAmount; o.items.forEach(i => allItems.push(i)); });
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html><body style="font-family:monospace;width:280px;padding:10px;">
                <h2 style="text-align:center;">${restaurantName}</h2>
                <p>Table: ${tableNum} | Date: ${new Date().toLocaleDateString()}</p>
                <hr/>
                <table style="width:100%;">
                    <tr><th>Item</th><th>Qty</th><th>Price</th></tr>
                    ${allItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price * i.quantity}</td></tr>`).join('')}
                </table>
                <hr/>
                <h3 style="display:flex;justify-content:space-between;"><span>TOTAL:</span> <span>Rs. ${total}</span></h3>
                <p style="text-align:center;">Thank You! Visit Again.</p>
            </body></html>
        `);
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

    if (isLoading) return <div className="admin-container"><div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center'}}><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container"><style>{styles}</style>
            <div style={{height:'90vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="glass-card" style={{textAlign:'center',width:'350px'}}><FaStore size={50} color="#3b82f6" style={{marginBottom:'20px'}}/><h1>OWNER LOGIN</h1><form onSubmit={handleLogin} style={{marginTop:'25px'}}><input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/><button type="submit" className="btn-primary">LOGIN</button></form></div></div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            <div className="max-w-wrapper">
                <header className="app-header">
                    <div><h1 className="shop-title">{restaurantName}</h1><span className="badge-pro">PREMIUM ADMIN</span></div>
                    <button onClick={() => {localStorage.removeItem(`owner_token_${id}`); window.location.reload();}} className="btn-glass" style={{color:'#ef4444'}}><FaSignOutAlt/></button>
                </header>

                <div className="nav-grid">
                    <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={22} /> <span>Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={22} /> <span>Menu</span></button>
                    <button onClick={() => setActiveTab("tools")} className={`nav-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={22} /> <span>Tools</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={22} /> <span>Stats</span></button>
                </div>

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

                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> ADD FOOD</h3>
                            <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/><input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/></div>
                            <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>{CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}<option value="custom">+ Custom</option></select>
                            <button onClick={handleAddItem} className="btn-primary">SAVE ITEM</button>
                        </div>
                        <div className="glass-card">
                            {dishes.map(dish => (<div key={dish._id} className="dish-item"><div style={{display:'flex',gap:12,alignItems:'center'}}><div style={{width:45,height:45,background:'#0f172a',borderRadius:10,overflow:'hidden'}}>{dish.image && <img src={dish.image} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>}</div><div><div style={{fontWeight:700}}>{dish.name}</div><div style={{color:'#3b82f6',fontWeight:'bold'}}>₹{dish.price}</div></div></div><button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button></div>))}
                        </div>
                    </div>
                )}
            </div>

            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>TABLE {selectedTable.tableNum}</h2><button onClick={() => setSelectedTable(null)} className="btn-icon-close"><FaTimes/></button></div>
                        <div className="modal-body">
                            {selectedTable.orders.map((order) => (
                                <div key={order._id} className="order-item">
                                    <div className="order-meta"><span>#{order._id.slice(-4)}</span><span>{new Date(order.createdAt).toLocaleTimeString()}</span></div>
                                    {order.items.map((item, i) => (<div key={i} className="order-row"><span>{item.name}</span><b>x{item.quantity}</b></div>))}
                                    <div style={{marginTop:10,display:'flex',justifyContent:'flex-end'}}><button onClick={() => printKOT(order)} className="btn-sm"><FaPrint/> PRINT KOT</button></div>
                                </div>
                            ))}
                        </div>
                        {selectedTable.orders.length > 0 && (
                            <div className="modal-footer">
                                <div className="modal-footer-info"><span>BILL TOTAL</span><span className="total-val">₹{selectedTable.totalAmount}</span></div>
                                <div className="modal-actions"><button onClick={() => printBill(selectedTable.tableNum, selectedTable.orders)} className="btn-action blue"><FaReceipt/> PRINT BILL</button><button onClick={() => handleCompleteTable(selectedTable.tableNum, selectedTable.orders)} className="btn-action green"><FaCheck/> CLOSE TABLE</button></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <InstallButton /> 
        </div>
    );
};

const styles = `
.admin-container { min-height: 100vh; padding: 20px; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 90px; }
.max-w-wrapper { width: 100%; max-width: 100%; margin: 0 auto; }
@media (min-width: 1024px) { .max-w-wrapper { padding: 0 40px; } }

.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.shop-title { font-size: 26px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 10px; border-radius: 20px; font-size: 11px; }

.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 30px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; }
.nav-btn.active { border-color: #3b82f6; color: #60a5fa; background: rgba(37, 99, 235, 0.1); }

.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 20px; }
.table-box { aspect-ratio: 1; border-radius: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
.table-box.free { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399; }
.table-box.occupied { background: rgba(37, 99, 235, 0.15); border-color: #3b82f6; color: #60a5fa; }
.t-num { font-size: 32px; font-weight: 800; }

.glass-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
.menu-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 1024px) { .menu-layout { grid-template-columns: 350px 1fr; } }

.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 14px; border-radius: 12px; color: white; margin-bottom: 15px; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 15px; border-radius: 14px; font-weight: 700; cursor: pointer; }

.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(5px); }
.qr-modal { background: #0f172a; width: 95%; max-width: 500px; border-radius: 24px; padding: 20px; max-height: 90vh; overflow-y: auto; }
.order-item { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid #3b82f6; }
.btn-sm { background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; }
.btn-action { padding: 14px; border: none; border-radius: 12px; font-weight: 700; color: white; cursor: pointer; width: 100%; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px; }
.total-val { color: #34d399; font-size: 20px; font-weight: 800; }
`;

export default RestaurantAdmin;