import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import jsPDF from 'jspdf';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, 
    FaTimes, FaPrint, FaCheck, FaFire, FaChartLine, 
    FaBullhorn, FaReceipt, FaPlus, FaQrcode, FaLink, FaFilePdf, FaSyncAlt
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const CATEGORY_LIST = ["Starters (Veg)", "Starters (Non-Veg)", "Main Course (Veg)", "Main Course (Non-Veg)", "Biryani", "Chinese", "Desserts", "Beverages", "Breakfast", "Snacks", "Add-ons"];

const RestaurantAdmin = () => {
    const { id } = useParams();
    // ⚠️ CHANGE TO YOUR LIVE SERVER URL
    const API_BASE = "https://smart-menu-app-production.up.railway.app/api";
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    
    const [activeTab, setActiveTab] = useState("orders");
    const [restaurantName, setRestaurantName] = useState(id);
    
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [mongoId, setMongoId] = useState(null); 
    
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [selectedTable, setSelectedTable] = useState(null);
    const [systemBroadcast, setSystemBroadcast] = useState("");
    
    // Tools State
    const [tableCount, setTableCount] = useState(15); 

    // Smart KOT Tracking (Local Storage)
    const [printedKOTs, setPrintedKOTs] = useState(() => {
        try { return JSON.parse(localStorage.getItem("printed_kots_log")) || []; } catch { return []; }
    });

    // --- SYNC DATA ---
    const refreshData = useCallback(async (manualId) => {
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes, sysRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/superadmin/system-status`)
            ]);
            
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            setSystemBroadcast(sysRes.data.message || "");
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

        const interval = setInterval(() => refreshData(), 5000); 
        return () => clearInterval(interval);
    }, [id, refreshData]);

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
            toast.success("Welcome Back!");
        } catch (err) { toast.error("Invalid Key"); }
    };

    // --- SMART PRINTING LOGIC ---

    const handlePrintKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;padding:10px;"><h3 style="text-align:center;margin:0;">KITCHEN TICKET</h3><p style="text-align:center;font-size:12px">Order #${order._id.slice(-4)}</p><hr/><h2 style="text-align:center;margin:10px 0;">TABLE ${order.tableNum}</h2><hr/><table style="width:100%;font-size:14px;font-weight:bold;">${order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;">x${i.quantity}</td></tr>`).join('')}</table><hr/><p style="text-align:center;">${new Date().toLocaleTimeString()}</p></body></html>`);
        win.document.close(); win.print(); win.close();

        const newPrintedList = [...printedKOTs, order._id];
        setPrintedKOTs(newPrintedList);
        localStorage.setItem("printed_kots_log", JSON.stringify(newPrintedList));
        toast.success("Sent to Kitchen");
    };

    const printBill = (tableNum, orders) => {
        const total = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const allItems = orders.flatMap(o => o.items);
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`<html><body style="font-family:monospace;width:280px;padding:10px;"><h2 style="text-align:center;margin:0;">${restaurantName.toUpperCase()}</h2><p style="text-align:center;">Thank you!</p><hr/><h3 style="text-align:center;">TABLE ${tableNum}</h3><hr/><table style="width:100%;text-align:left;"><tr><th>Item</th><th>Qty</th><th>Amt</th></tr>${allItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price*i.quantity}</td></tr>`).join('')}</table><hr/><h2 style="text-align:right;">TOTAL: ₹${total}</h2><hr/><p style="text-align:center;font-size:10px;">${new Date().toLocaleString()}</p></body></html>`);
        win.document.close(); win.print(); win.close();
    };

    const handleCompleteTable = async (tableNum, orders) => {
        if(!window.confirm(`Clear Table ${tableNum}?`)) return;
        try {
            await Promise.all(orders.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success("Table Cleared");
            setSelectedTable(null); 
            refreshData();
        } catch(e) { toast.error("Error closing"); }
    };

    // --- TOOLS: GENERATE QR PDF ---
    const generatePDF = () => {
        const doc = new jsPDF();
        let x = 10, y = 10;
        doc.setFontSize(20);
        doc.text("Scan to Order", 105, 10, null, null, "center");
        y += 20;

        for (let i = 1; i <= tableCount; i++) {
            if (y > 250) { doc.addPage(); y = 20; }
            // ⚠️ REPLACE THIS URL WITH YOUR VERCEL/NETLIFY LINK
            const url = `https://kovixa.com/menu/${id}?table=${i}`;
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
            doc.setFontSize(14);
            doc.text(`Table ${i}`, x + 15, y);
            doc.addImage(qrUrl, "PNG", x, y + 5, 50, 50);
            x += 60;
            if (x > 150) { x = 10; y += 70; }
        }
        doc.save(`${id}_QR_Codes.pdf`);
        toast.success("PDF Downloaded");
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Required fields missing");
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, price: parseFloat(newItem.price), image: newItem.image || "", 
                category: isCustomCategory ? newItem.category : newItem.category, restaurantId: mongoId, isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Added!");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    const handleDeleteDish = async (dishId) => {
        if (!window.confirm("Delete?")) return;
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.delete(`${API_BASE}/dishes/${dishId}`, { headers: { Authorization: `Bearer ${token}` } });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    // --- DATA CALCULATIONS ---
    const tableData = useMemo(() => {
        const map = {};
        for(let i = 1; i <= tableCount; i++) map[i] = { tableNum: i, orders: [], totalAmount: 0, status: 'Free' };
        inboxOrders.filter(o => o.status === 'Pending').forEach(order => {
            const tNum = parseInt(order.tableNum) || "Walk-In"; 
            if (tNum === "Walk-In") {
                // Handle Walk-Ins separately if needed, for now map to 0 or specific section
                if(!map["Walk-In"]) map["Walk-In"] = { tableNum: "Walk-In", orders: [], totalAmount: 0, status: 'Occupied' };
                map["Walk-In"].orders.push(order);
                map["Walk-In"].totalAmount += order.totalAmount;
            } else {
                if (!map[tNum]) map[tNum] = { tableNum: tNum, orders: [], totalAmount: 0, status: 'Free' };
                map[tNum].orders.push(order);
                map[tNum].totalAmount += order.totalAmount;
                map[tNum].status = 'Occupied';
            }
        });
        return map;
    }, [inboxOrders, tableCount]);

    const dailyStats = useMemo(() => {
        const today = new Date().toLocaleDateString();
        const todaysOrders = inboxOrders.filter(o => new Date(o.createdAt).toLocaleDateString() === today);
        const revenue = todaysOrders.reduce((acc, o) => acc + o.totalAmount, 0);
        return { revenue, count: todaysOrders.length };
    }, [inboxOrders]);

    if (isLoading) return <div className="admin-container flex-center"><div className="spin" style={{width:40,height:40,border:'4px solid #3b82f6',borderTopColor:'transparent',borderRadius:'50%'}}></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container flex-center">
            <style>{styles}</style>
            <div className="glass-card text-center" style={{width:'350px'}}>
                <FaStore size={50} color="#3b82f6" className="mb-20"/>
                <h1>OWNER LOGIN</h1>
                <form onSubmit={handleLogin} className="mt-25">
                    <input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/>
                    <button type="submit" className="btn-primary">LOGIN</button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="admin-container">
            <style>{styles}</style>
            
            {/* --- MODAL (POPUP) --- */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedTable.tableNum === "Walk-In" ? "WALK-IN / COUNTER" : `TABLE ${selectedTable.tableNum}`}</h2>
                            <button onClick={() => setSelectedTable(null)} className="btn-icon-close"><FaTimes/></button>
                        </div>
                        <div className="modal-body">
                            {selectedTable.orders.length === 0 ? <p className="muted text-center">No Active Orders</p> : 
                                selectedTable.orders.map((order) => {
                                    const isPrinted = printedKOTs.includes(order._id);
                                    return (
                                        <div key={order._id} className="order-item" style={{borderColor: isPrinted ? '#22c55e' : '#3b82f6'}}>
                                            <div className="order-meta">
                                                <span>#{order._id.slice(-4).toUpperCase()}</span>
                                                <span>{new Date(order.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            {order.items.map((item, i) => (
                                                <div key={i} className="order-row"><span>{item.name}</span><b>x{item.quantity}</b></div>
                                            ))}
                                            <div className="flex-end mt-10">
                                                {isPrinted ? 
                                                    <span className="success-text"><FaCheck /> KITCHEN NOTIFIED</span> : 
                                                    <button onClick={() => handlePrintKOT(order)} className="btn-sm"><FaPrint/> PRINT KOT</button>
                                                }
                                            </div>
                                        </div>
                                    );
                                })
                            }
                        </div>
                        {selectedTable.orders.length > 0 && (
                            <div className="modal-footer">
                                <div className="modal-footer-info"><span>TOTAL</span><span className="total-val">₹{selectedTable.totalAmount}</span></div>
                                <div className="modal-actions">
                                    <button onClick={() => printBill(selectedTable.tableNum, selectedTable.orders)} className="btn-action blue"><FaReceipt/> BILL</button>
                                    <button onClick={() => handleCompleteTable(selectedTable.tableNum, selectedTable.orders)} className="btn-action green"><FaCheck/> CLEAR</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- DASHBOARD HEADER --- */}
            <div className="max-w-wrapper">
                {systemBroadcast && <div className="broadcast-banner"><FaBullhorn /> <span>{systemBroadcast}</span></div>}
                
                <header className="app-header">
                    <div><h1 className="shop-title">{restaurantName}</h1><span className="badge-pro">LIVE DASHBOARD</span></div>
                    <button onClick={() => window.location.reload()} className="btn-glass"><FaSyncAlt/></button>
                </header>

                <div className="nav-grid">
                    <button onClick={() => setActiveTab("orders")} className={`nav-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire /> <span>Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils /> <span>Menu</span></button>
                    <button onClick={() => setActiveTab("tools")} className={`nav-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode /> <span>Tools</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine /> <span>Stats</span></button>
                </div>

                {/* --- 1. TABLES (LIVE) --- */}
                {activeTab === "orders" && (
                    <div className="table-grid">
                        {/* Render "Walk-In" Box First if exists */}
                        {tableData["Walk-In"] && (
                             <div onClick={() => setSelectedTable(tableData["Walk-In"])} 
                                  className="table-box occupied"
                                  style={{cursor: 'pointer', borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)'}}>
                                <div className="t-status" style={{color:'#f59e0b'}}>WALK-IN</div>
                                <div className="t-num" style={{fontSize:'24px'}}>Counter</div>
                                <div className="t-amount">₹{tableData["Walk-In"].totalAmount}</div>
                            </div>
                        )}

                        {/* Render Numeric Tables */}
                        {Object.values(tableData).filter(t => t.tableNum !== "Walk-In").map((table) => (
                            <div key={table.tableNum} onClick={() => table.status === 'Occupied' ? setSelectedTable(table) : null} 
                                 className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}
                                 style={{cursor: table.status === 'Occupied' ? 'pointer' : 'default'}}>
                                <div className="t-num">{table.tableNum}</div>
                                <div className="t-status">
                                    {table.status === 'Occupied' ? (
                                        <><span>Running</span><div className="t-amount">₹{table.totalAmount}</div></>
                                    ) : <span>Empty</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- 2. MENU --- */}
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 className="section-title"><FaPlus/> ADD ITEM</h3>
                            <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                            <div className="grid-2"><input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/><input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/></div>
                            <select className="input-dark" value={isCustomCategory?"custom":newItem.category} onChange={(e)=>{if(e.target.value==="custom"){setIsCustomCategory(true);setNewItem({...newItem,category:""});}else{setIsCustomCategory(false);setNewItem({...newItem,category:e.target.value});}}}>{CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}<option value="custom">+ Custom</option></select>
                            <button onClick={handleAddItem} className="btn-primary">SAVE</button>
                        </div>
                        <div className="glass-card h-600">
                             <h3 className="section-title">MENU ({dishes.length})</h3>
                             {dishes.map(dish => (<div key={dish._id} className="dish-item"><div><div className="fw-700">{dish.name}</div><div className="blue-text fw-bold">₹{dish.price}</div></div><button onClick={()=>handleDeleteDish(dish._id)} className="btn-icon-danger"><FaTrash/></button></div>))}
                        </div>
                    </div>
                )}

                {/* --- 3. TOOLS (QR & LINKS) --- */}
                {activeTab === "tools" && (
                    <div className="glass-card">
                        <h3 className="section-title"><FaQrcode/> QR GENERATOR</h3>
                        <div className="grid-2" style={{alignItems:'center'}}>
                            <input type="number" className="input-dark" style={{marginBottom:0}} value={tableCount} onChange={e=>setTableCount(e.target.value)} placeholder="Count"/>
                            <button onClick={generatePDF} className="btn-primary" style={{background:'#f59e0b', color:'black'}}><FaFilePdf/> DOWNLOAD PDF</button>
                        </div>
                        
                        <div style={{marginTop:30}}>
                            <h3 className="section-title"><FaLink/> TABLE LINKS</h3>
                            <div className="h-600">
                                {Array.from({length: tableCount}, (_, i) => i + 1).map(num => (
                                    <div key={num} className="dish-item">
                                        <div className="fw-700">Table {num}</div>
                                        <button onClick={() => {
                                            // ⚠️ REPLACE WITH YOUR REAL URL
                                            navigator.clipboard.writeText(`https://kovixa.com/menu/${id}?table=${num}`);
                                            toast.success("Link Copied");
                                        }} className="btn-glass" style={{fontSize:12}}>COPY LINK</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 4. STATS --- */}
                {activeTab === "revenue" && (
                    <div className="glass-card">
                        <h3 className="section-title"><FaChartLine/> TODAY'S REPORT</h3>
                        <div className="grid-2">
                            <div className="table-box occupied" style={{aspectRatio:'2/1'}}>
                                <div className="t-status">REVENUE</div>
                                <div className="t-num" style={{fontSize:32}}>₹{dailyStats.revenue}</div>
                            </div>
                            <div className="table-box free" style={{aspectRatio:'2/1'}}>
                                <div className="t-status">ORDERS</div>
                                <div className="t-num" style={{fontSize:32}}>{dailyStats.count}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <InstallButton /> 
        </div>
    );
};

const styles = `
.admin-container { min-height: 100vh; padding: 20px; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; padding-bottom: 90px; }
.max-w-wrapper { width: 100%; max-width: 100%; margin: 0 auto; }
@media (min-width: 1024px) { .max-w-wrapper { padding: 0 40px; } }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-end { display: flex; justify-content: flex-end; }
.text-center { text-align: center; }
.gap-12 { gap: 12px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.mt-10 { margin-top: 10px; }
.mt-25 { margin-top: 25px; }
.mb-20 { margin-bottom: 20px; }
.fw-700 { font-weight: 700; }
.blue-text { color: #3b82f6; }
.success-text { color: #22c55e; font-weight: bold; font-size: 12px; display: flex; align-items: center; gap: 5px; }
.muted { color: #64748b; }
.h-600 { max-height: 500px; overflow-y: auto; }

.app-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.shop-title { font-size: 24px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: bold; }

.nav-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 30px; }
.nav-btn { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748b; cursor: pointer; transition: 0.2s; font-size: 12px; }
.nav-btn.active { border-color: #3b82f6; color: #60a5fa; background: rgba(37, 99, 235, 0.1); }
.nav-btn svg { font-size: 20px; margin-bottom: 4px; }

/* --- BIG SCREEN GRID (Updated) --- */
.table-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* Increased from 130px to 180px */
    gap: 20px; 
}
.table-box { aspect-ratio: 1; border-radius: 18px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2px solid transparent; transition: 0.2s; }
.table-box.free { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: #34d399; }
.table-box.occupied { background: rgba(37, 99, 235, 0.15); border-color: #3b82f6; color: #60a5fa; box-shadow: 0 0 15px rgba(59, 130, 246, 0.2); }
.t-num { font-size: 48px; font-weight: 800; } /* Increased Font */
.t-status { font-size: 12px; font-weight: 600; text-align: center; }
.t-amount { font-size: 14px; color: white; margin-top: 2px; }

.input-dark { width: 100%; background: #0f172a; border: 1px solid #1e293b; padding: 14px; border-radius: 10px; color: white; margin-bottom: 15px; font-size: 16px; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 16px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 16px; }
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid #334155; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.glass-card { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; padding: 25px; margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 800; color: #94a3b8; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 8px; border-radius: 8px; cursor: pointer; }
.broadcast-banner { background: rgba(249, 115, 22, 0.1); border: 1px solid #f97316; color: #f97316; padding: 12px; border-radius: 10px; margin-bottom: 20px; font-weight: 700; display: flex; align-items: center; gap: 10px; font-size: 14px; }

.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
.qr-modal { 
    background: #0f172a; 
    width: 95%; 
    max-width: 650px; /* Increased Max Width */
    border-radius: 24px; 
    padding: 25px; 
    max-height: 85vh; 
    overflow-y: auto; 
    border: 1px solid #1e293b; 
    display: flex; flex-direction: column; 
}
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.btn-icon-close { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; }
.order-item { background: #1e293b; padding: 15px; border-radius: 12px; margin-bottom: 10px; border-left: 4px solid; }
.order-meta { display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 700; margin-bottom: 8px; }
.order-row { display: flex; justify-content: space-between; color: #e2e8f0; margin-bottom: 4px; font-size: 14px; }
.btn-sm { padding: 8px 12px; border-radius: 8px; color: white; border: none; font-weight: 700; font-size: 11px; cursor: pointer; background: #3b82f6; display: flex; align-items: center; gap: 6px; }
.modal-footer { margin-top: auto; border-top: 1px solid #334155; padding-top: 20px; }
.modal-footer-info { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 18px; margin-bottom: 15px; }
.total-val { color: #34d399; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-action { padding: 12px; border: none; border-radius: 10px; font-weight: 800; color: white; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; font-size: 13px; }
.btn-action.blue { background: #f59e0b; color: black; }
.btn-action.green { background: #10b981; }
`;

export default RestaurantAdmin;