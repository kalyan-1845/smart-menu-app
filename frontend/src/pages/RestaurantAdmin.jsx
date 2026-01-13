import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, FaCopy, 
    FaQrcode, FaPlus, FaSpinner, FaPrint, FaBullhorn,
    FaCheck, FaFire, FaChartLine, FaWifi, FaTimes, FaReceipt, FaFilePdf, FaBoxOpen, FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const CATEGORY_LIST = ["Starters (Veg)", "Starters (Non-Veg)", "Main Course (Veg)", "Main Course (Non-Veg)", "Biryani", "Chinese", "Desserts", "Beverages", "Breakfast", "Snacks", "Add-ons"];

const RestaurantAdmin = () => {
    const { id } = useParams();
    // ✅ FIXED: Using the new working domain
    const SERVER_URL = "https://kovixa-backend-v99.up.railway.app";
    const API_BASE = `${SERVER_URL}/api`;
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || localStorage.getItem(`last_tab_${id}`) || "orders");
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [inventory, setInventory] = useState([]); 
    const [mongoId, setMongoId] = useState(null); 
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [newStockItem, setNewStockItem] = useState({ itemName: "", currentStock: "", unit: "kg", lowStockThreshold: 5 });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [customCategory, setCustomCategory] = useState("");
    const [qrRange, setQrRange] = useState({ start: 1, end: 12 });
    const [selectedTable, setSelectedTable] = useState(null);

    // --- 📶 OFFLINE & SYSTEM STATE ---
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [systemBroadcast, setSystemBroadcast] = useState("");
    const [isMaintenance, setIsMaintenance] = useState(false);

    // Monitor Network Status
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); toast.success("Back Online! Syncing..."); refreshData(); };
        const handleOffline = () => { setIsOnline(false); toast.error("Offline Mode: Data may be outdated."); };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
    }, []);

    // --- SYNC DATA (With Offline Cache) ---
    const refreshData = useCallback(async (manualId) => {
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        // 🛡️ OFFLINE CACHE LOGIC: If offline, load from LocalStorage immediately
        if (!navigator.onLine) {
            const cachedOrders = localStorage.getItem(`offline_orders_${fetchId}`);
            const cachedDishes = localStorage.getItem(`offline_dishes_${fetchId}`);
            if (cachedOrders) setInboxOrders(JSON.parse(cachedOrders));
            if (cachedDishes) setDishes(JSON.parse(cachedDishes));
            setIsLoading(false);
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes, invRes, sysRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/inventory?restaurantId=${fetchId}`, config),
                axios.get(`${API_BASE}/superadmin/system-status`) 
            ]);
            
            // Update State
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            setInventory(invRes.data || []);
            setSystemBroadcast(sysRes.data.message || "");
            setIsMaintenance(sysRes.data.maintenance || false);

            // ✅ Save to Offline Cache
            localStorage.setItem(`offline_orders_${fetchId}`, JSON.stringify(orderRes.data));
            localStorage.setItem(`offline_dishes_${fetchId}`, JSON.stringify(dishRes.data));

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

        const sysInterval = setInterval(() => refreshData(), 30000); 
        return () => clearInterval(sysInterval);
    }, [id, refreshData]);

    // --- ACTIONS ---
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

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Name & Price Required");
        const finalCategory = isCustomCategory ? customCategory : newItem.category;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, price: parseFloat(newItem.price), image: newItem.image || "", 
                category: finalCategory, restaurantId: mongoId, isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Item Added");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed to add item"); }
    };

    const handleAddInventory = async () => {
        if (!newStockItem.itemName || !newStockItem.currentStock) return toast.error("Fill all fields");
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/inventory`, { ...newStockItem, restaurantId: mongoId }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Stock Added");
            setNewStockItem({ itemName: "", currentStock: "", unit: "kg", lowStockThreshold: 5 });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed to add stock"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete this dish?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Dish Deleted");
            refreshData(mongoId);
        } catch (err) { toast.error("Delete Failed"); }
    };

    // --- RENDER LOGIC ---
    const tableData = useMemo(() => {
        const map = {};
        for(let i = parseInt(qrRange.start); i <= parseInt(qrRange.end); i++) {
            map[i] = { tableNum: i, orders: [], totalAmount: 0, status: 'Free' };
        }
        inboxOrders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').forEach(order => {
            const tNum = parseInt(order.tableNum);
            if (map[tNum]) {
                map[tNum].orders.push(order);
                map[tNum].totalAmount += order.totalAmount;
                map[tNum].status = 'Occupied';
            }
        });
        return map;
    }, [inboxOrders, qrRange]);

    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;padding:10px;"><h3 style="text-align:center;margin:0;">${restaurantName}</h3><p style="text-align:center;margin:5px 0;">KITCHEN ORDER</p><hr/><p>Table: <b>${order.tableNum}</b></p><hr/><table style="width:100%;">${order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">x${i.quantity}</td></tr>`).join('')}</table><hr/><p style="text-align:center;font-size:10px;">${new Date().toLocaleTimeString()}</p></body></html>`);
        win.document.close(); win.print(); win.close();
    };

    const printBill = (tableNum, orders) => {
        const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;padding:10px;"><h2 style="text-align:center;margin:0;">${restaurantName}</h2><hr/><p>Table: ${tableNum}</p><hr/><table style="width:100%;text-align:left;"><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${orders.flatMap(o => o.items).map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price*i.quantity}</td></tr>`).join('')}</table><hr/><h3>Total: ₹${total}</h3><hr/><p style="text-align:center;">Visit Again!</p></body></html>`);
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

    // --- SCREENS ---
    if (isMaintenance) return (
        <div style={styles.maintenanceScreen}>
            <FaExclamationTriangle size={80} color="#f97316"/>
            <h1>SYSTEM MAINTENANCE</h1>
            <p>CEO has initiated a system update. We will be back online shortly.</p>
        </div>
    );

    if (isLoading) return <div className="admin-container"><div className="flex-center" style={{height:'80vh'}}><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{globalStyles}</style>
            <div className="flex-center" style={{height:'90vh'}}><div className="glass-card text-center" style={{width:'350px'}}><FaStore size={50} color="#3b82f6" className="mb-20"/><h1>ADMIN LOGIN</h1><form onSubmit={handleLogin} className="mt-25"><input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/><button type="submit" className="btn-primary">LOGIN</button></form></div></div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{globalStyles}</style>
            <div className="max-w-wrapper">
                
                {/* 📶 OFFLINE BANNER */}
                {!isOnline && (
                    <div className="offline-banner">
                        <FaWifi /> <span>OFFLINE MODE: Using stored data. Printing still works.</span>
                    </div>
                )}

                {/* 📢 GLOBAL BROADCAST BAR */}
                {systemBroadcast && (
                    <div className="broadcast-banner">
                        <FaBullhorn /> <span>CEO BROADCAST: {systemBroadcast}</span>
                    </div>
                )}

                <header className="app-header">
                    <div><h1 className="shop-title">{restaurantName}</h1><span className="badge-pro">PREMIUM ADMIN</span></div>
                    <button onClick={() => {localStorage.removeItem(`owner_token_${id}`); window.location.reload();}} className="btn-glass danger"><FaSignOutAlt/></button>
                </header>

                <div className="nav-grid">
                    <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire /> <span>Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils /> <span>Menu</span></button>
                    <button onClick={() => setActiveTab("inventory")} className={`nav-btn ${activeTab === "inventory" ? 'active' : ''}`}><FaBoxOpen /> <span>Stock</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine /> <span>Stats</span></button>
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

                {activeTab === "inventory" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> ADD RAW MATERIAL</h3>
                            <input className="input-dark" placeholder="Item Name (e.g. Chicken)" value={newStockItem.itemName} onChange={e=>setNewStockItem({...newStockItem, itemName: e.target.value})}/>
                            <div className="grid-2">
                                <input type="number" className="input-dark" placeholder="Stock Qty" value={newStockItem.currentStock} onChange={e=>setNewStockItem({...newStockItem, currentStock: e.target.value})}/>
                                <select className="input-dark" value={newStockItem.unit} onChange={e=>setNewStockItem({...newStockItem, unit: e.target.value})}>
                                    <option value="kg">kg</option><option value="liters">liters</option><option value="pcs">pcs</option><option value="gms">gms</option>
                                </select>
                            </div>
                            <button onClick={handleAddInventory} className="btn-primary">SAVE STOCK</button>
                        </div>
                        <div className="glass-card">
                            <h3 className="section-title">CURRENT INVENTORY</h3>
                            {inventory.length === 0 ? <p className="muted">No stock data.</p> : inventory.map(item => (
                                <div key={item._id} className="dish-item">
                                    <div>
                                        <div className="fw-700">{item.itemName}</div>
                                        <div className={`stock-label ${item.currentStock <= item.lowStockThreshold ? 'low' : ''}`}>
                                            {item.currentStock <= item.lowStockThreshold && <FaExclamationTriangle/>} {item.currentStock} {item.unit} left
                                        </div>
                                    </div>
                                    <button onClick={async () => {
                                        const newVal = prompt("Update Stock for " + item.itemName, item.currentStock);
                                        if (newVal) {
                                            await axios.put(`${API_BASE}/inventory/${item._id}`, { currentStock: newVal }, { headers: { Authorization: `Bearer ${localStorage.getItem('owner_token_' + id)}` } });
                                            refreshData();
                                        }
                                    }} className="btn-glass">UPDATE</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> ADD FOOD</h3>
                            <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                            <div className="grid-2"><input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/><input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/></div>
                            <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>{CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}<option value="custom">+ Custom</option></select>
                            <button onClick={handleAddItem} className="btn-primary">SAVE ITEM</button>
                        </div>
                        <div className="glass-card h-600">
                             <h3 className="section-title">ACTIVE DISHES</h3>
                            {dishes.map(dish => (<div key={dish._id} className="dish-item"><div className="flex gap-12"><div className="img-box">{dish.image && <img src={dish.image} alt=""/>}</div><div><div className="fw-700">{dish.name}</div><div className="blue-text fw-bold">₹{dish.price}</div></div></div><button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button></div>))}
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
                                    <div className="flex-end mt-10"><button onClick={() => printKOT(order)} className="btn-sm"><FaPrint/> PRINT KOT</button></div>
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

const styles = {
    maintenanceScreen: { height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: 40, fontFamily: 'Plus Jakarta Sans, sans-serif' }
};

const globalStyles = `
.admin-container { min-height: 100vh; padding: 20px; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 90px; }
.max-w-wrapper { width: 100%; max-width: 100%; margin: 0 auto; }
@media (min-width: 1024px) { .max-w-wrapper { padding: 0 60px; } }

/* Offline & Broadcast Banners */
.broadcast-banner, .offline-banner {
    background: rgba(249, 115, 22, 0.1); border: 1px solid #f97316; color: #f97316; 
    padding: 15px; border-radius: 12px; margin-bottom: 20px; font-size: 14px; 
    font-weight: 800; display: flex; align-items: center; gap: 12px;
}
.offline-banner { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; color: #ef4444; animation: flash 1.5s infinite; }
@keyframes flash { 50% { opacity: 0.6; } }

.flex { display: flex; align-items: center; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-end { display: flex; justify-content: flex-end; }
.gap-12 { gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mb-20 { margin-bottom: 20px; }
.mt-25 { margin-top: 25px; }
.mt-10 { margin-top: 10px; }
.fw-700 { font-weight: 700; }
.blue-text { color: #3b82f6; }
.muted { color: #64748b; }
.h-600 { max-height: 600px; overflow-y: auto; }

.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.shop-title { font-size: 30px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 10px; border-radius: 20px; font-size: 11px; }

.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 16px; }
.nav-btn.active { border-color: #3b82f6; color: #60a5fa; background: rgba(37, 99, 235, 0.1); }

.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 25px; }
.table-box { aspect-ratio: 1; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px solid transparent; transition: 0.2s; }
.table-box.free { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #34d399; }
.table-box.occupied { background: rgba(37, 99, 235, 0.15); border-color: #3b82f6; color: #60a5fa; }
.t-num { font-size: 48px; font-weight: 800; }

.glass-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 24px; padding: 30px; margin-bottom: 24px; }
.menu-layout { display: grid; grid-template-columns: 1fr; gap: 30px; }
@media (min-width: 1024px) { .menu-layout { grid-template-columns: 400px 1fr; } }

.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 16px; border-radius: 12px; color: white; margin-bottom: 15px; font-size: 16px; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 18px; border-radius: 14px; font-weight: 700; cursor: pointer; font-size: 16px; }
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid #334155; color: white; padding: 8px 15px; border-radius: 10px; cursor: pointer; }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 10px; border-radius: 10px; cursor: pointer; }

.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.img-box { width: 50px; height: 50px; background: #0f172a; border-radius: 10px; overflow: hidden; }
.img-box img { width: 100%; height: 100%; object-fit: cover; }
.stock-label { font-size: 13px; color: #10b981; }
.stock-label.low { color: #f59e0b; font-weight: bold; }

.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
.qr-modal { background: #0f172a; width: 95%; max-width: 600px; border-radius: 30px; padding: 30px; max-height: 90vh; overflow-y: auto; border: 1px solid #1e293b; }
.order-item { background: #1e293b; padding: 20px; border-radius: 16px; margin-bottom: 15px; border-left: 5px solid #3b82f6; }
.btn-sm { background: #334155; color: white; border: none; padding: 8px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
.btn-action { padding: 16px; border: none; border-radius: 14px; font-weight: 700; color: white; cursor: pointer; width: 100%; font-size: 15px; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }
.total-val { color: #34d399; font-size: 28px; font-weight: 800; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default RestaurantAdmin;