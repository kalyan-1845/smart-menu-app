import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaCrown, FaSignOutAlt, FaStore, FaCopy, 
    FaDownload, FaQrcode, FaPlus, FaSpinner, FaPrint, 
    FaCheck, FaFire, FaChartLine, FaWifi, FaSave, FaLink, FaTimes, FaReceipt, FaFileInvoiceDollar
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
    const [qrRange, setQrRange] = useState({ start: 1, end: 12 }); // Default 12 tables
    const [broadcastMessage, setBroadcastMessage] = useState("");
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
            const [dishRes, orderRes, settingsRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/superadmin/maintenance-status`) 
            ]);
            setDishes(dishRes.data || []);
            // Filter only active orders (not Completed/Cancelled) for the live view
            const activeOrders = (orderRes.data || []).filter(o => o.status !== 'Completed' && o.status !== 'Cancelled');
            setInboxOrders(activeOrders);
            
            if(settingsRes.data.message) setBroadcastMessage(settingsRes.data.message);
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
        }, 5000); // Fast sync for orders
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
            toast.success("Login Successful");
        } catch (err) { toast.error("Invalid Key"); }
    };

    const handleLogout = () => {
        localStorage.removeItem(`owner_token_${id}`);
        window.location.reload();
    };

    // --- DATA PROCESSING (GROUP BY TABLE) ---
    const tableData = useMemo(() => {
        const map = {};
        // Initialize grid based on range
        for(let i = parseInt(qrRange.start); i <= parseInt(qrRange.end); i++) {
            map[i] = { tableNum: i, orders: [], totalAmount: 0, status: 'Free' };
        }
        
        // Fill with active orders
        inboxOrders.forEach(order => {
            const tNum = parseInt(order.tableNum);
            if (!map[tNum]) map[tNum] = { tableNum: tNum, orders: [], totalAmount: 0, status: 'Free' };
            
            map[tNum].orders.push(order);
            map[tNum].totalAmount += order.totalAmount;
            map[tNum].status = 'Occupied';
        });
        return map;
    }, [inboxOrders, qrRange]);

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

    // --- PRINTING SYSTEM (STRICT FORMATS) ---

    // A) Print KOT (Kitchen) - Only Items, No Price
    const printKOT = (order) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html>
                <head><title>KOT</title></head>
                <body style="font-family: monospace; width: 280px; font-size: 14px;">
                    <div style="text-align:center; font-weight:bold;">${restaurantName.toUpperCase()}</div>
                    <div style="text-align:center;">KOT #${order._id.slice(-4).toUpperCase()}</div>
                    <div style="text-align:center;">TABLE: ${order.tableNum}</div>
                    <div style="text-align:center; font-size: 10px;">${new Date(order.createdAt).toLocaleString()}</div>
                    <hr/>
                    <table style="width:100%; text-align:left;">
                        <tr><th>Item</th><th style="text-align:right">Qty</th></tr>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td style="text-align:right; font-weight:bold;">${item.quantity}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <hr/>
                    <div style="text-align:center; font-weight:bold;">CHEF COPY</div>
                </body>
            </html>
        `);
        win.document.close();
        win.print();
        win.close();
    };

    // B) Print BILL (Customer) - Full Receipt
    const printBill = (tableNum, orders) => {
        // Aggregate all items from all orders for this table
        const allItems = [];
        let grandTotal = 0;
        
        orders.forEach(order => {
            grandTotal += order.totalAmount;
            order.items.forEach(item => {
                allItems.push(item);
            });
        });

        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html>
                <head><title>BILL</title></head>
                <body style="font-family: monospace; width: 280px; font-size: 14px;">
                    <div style="text-align:center; font-weight:bold; font-size: 16px;">${restaurantName.toUpperCase()}</div>
                    <div style="text-align:center;">TABLE: ${tableNum}</div>
                    <div style="text-align:center; font-size: 10px;">${new Date().toLocaleString()}</div>
                    <hr/>
                    <table style="width:100%; text-align:left;">
                        <tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th></tr>
                        ${allItems.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td style="text-align:center">${item.quantity}</td>
                                <td style="text-align:right">${item.price * item.quantity}</td>
                            </tr>
                        `).join('')}
                    </table>
                    <hr/>
                    <div style="display:flex; justify-content:space-between; font-weight:bold; font-size: 16px;">
                        <span>TOTAL:</span>
                        <span>Rs. ${grandTotal}</span>
                    </div>
                    <hr/>
                    <div style="text-align:center;">Thank you! Visit Again.</div>
                </body>
            </html>
        `);
        win.document.close();
        win.print();
        win.close();
    };

    const handleCompleteTable = async (tableNum, orders) => {
        if(!window.confirm(`Close Table ${tableNum}? This will clear the table.`)) return;
        
        try {
            // Mark all orders for this table as 'Completed'
            await Promise.all(orders.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success(`Table ${tableNum} Closed`);
            setSelectedTable(null); // Close modal
            refreshData();
        } catch(e) {
            toast.error("Error closing table");
        }
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

    // --- RENDER ---
    if (isLoading) return <div className="admin-container"><div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}><FaSpinner className="spin" size={30} color="#FF9933"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container"><style>{styles}</style>
            <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card" style={{ textAlign: 'center', width: '320px' }}>
                    <FaStore size={40} color="#FF9933" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '20px', fontWeight: 900 }}>OWNER LOGIN</h1>
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="input-dark" style={{ textAlign: 'center' }} autoFocus />
                        <button type="submit" className="btn-primary">LOGIN</button>
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
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h1 className="shop-title">{restaurantName}</h1>
                        <span className="badge-pro">OWNER DASHBOARD</span>
                    </div>
                    <button onClick={handleLogout} className="btn-glass" style={{ color: '#ef4444' }}><FaSignOutAlt /></button>
                </header>

                <div className="nav-grid-row-1">
                    <button onClick={() => setActiveTab("orders")} className={`nav-icon-btn ${activeTab === "orders" ? 'active' : ''}`}><FaFire size={20} /> <span className="nav-icon-label">Tables</span></button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-icon-btn ${activeTab === "menu" ? 'active' : ''}`}><FaUtensils size={20} /> <span className="nav-icon-label">Menu</span></button>
                    <button onClick={() => setActiveTab("tools")} className={`nav-icon-btn ${activeTab === "tools" ? 'active' : ''}`}><FaQrcode size={20} /> <span className="nav-icon-label">QR</span></button>
                    <button onClick={() => setActiveTab("revenue")} className={`nav-icon-btn ${activeTab === "revenue" ? 'active' : ''}`}><FaChartLine size={20} /> <span className="nav-icon-label">Stats</span></button>
                </div>

                {/* 🟢 TABLE GRID VIEW (ORDERS) */}
                {activeTab === "orders" && (
                    <div className="table-grid">
                        {Object.values(tableData).map((table) => (
                            <div 
                                key={table.tableNum} 
                                onClick={() => setSelectedTable(table)}
                                className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}
                            >
                                <div className="t-num">T-{table.tableNum}</div>
                                <div className="t-status">
                                    {table.status === 'Occupied' ? (
                                        <>
                                            <span style={{color: '#fff'}}>Occupied</span>
                                            <div className="t-amount">₹{table.totalAmount}</div>
                                            {table.orders.length > 0 && <span className="badge-new">NEW ORDER</span>}
                                        </>
                                    ) : (
                                        <span>Free</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 📝 MENU EDITOR */}
                {activeTab === "menu" && (
                    <div className="menu-layout">
                        <div className="glass-card">
                            <h3 style={{fontSize: '12px', fontWeight: 900, color: '#FF9933', marginBottom: '10px'}}><FaPlus /> ADD ITEM</h3>
                            <input className="input-dark" placeholder="Name" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
                            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                <input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} />
                                <input className="input-dark" placeholder="Image URL" value={newItem.image} onChange={e => setNewItem({...newItem, image: e.target.value})} />
                            </div>
                            <select className="input-dark" value={isCustomCategory ? "custom" : newItem.category} onChange={(e) => {
                                if(e.target.value === "custom") { setIsCustomCategory(true); setNewItem({...newItem, category: ""}); }
                                else { setIsCustomCategory(false); setNewItem({...newItem, category: e.target.value}); }
                            }}>
                                {CATEGORY_LIST.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                                <option value="custom">+ Custom</option>
                            </select>
                            {isCustomCategory && <input className="input-dark" placeholder="Category Name" value={customCategory} onChange={e => { setCustomCategory(e.target.value); setNewItem({...newItem, category: e.target.value}); }} />}
                            <button onClick={handleAddItem} className="btn-primary">SAVE</button>
                        </div>
                        <div className="glass-card">
                            <h3 style={{fontSize:'12px', fontWeight:900}}>MENU ITEMS ({dishes.length})</h3>
                            {dishes.map(dish => (
                                <div key={dish._id} className="dish-item">
                                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                        <div style={{width:40, height:40, background:'#111', borderRadius:8}}>{dish.image && <img src={dish.image} style={{width:'100%', height:'100%', objectFit:'cover', borderRadius:8}} alt=""/>}</div>
                                        <div><div style={{fontWeight:'bold'}}>{dish.name}</div><div style={{color:'#f97316', fontSize:12}}>₹{dish.price}</div></div>
                                    </div>
                                    <button onClick={() => handleDeleteDish(dish._id)} className="btn-glass" style={{color:'#ef4444'}}><FaTrash/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 🛠 TOOLS */}
                {activeTab === "tools" && (
                    <div className="glass-card">
                        <h2><FaQrcode/> SETUP TABLES</h2>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:15}}>
                            <input type="number" className="input-dark" value={qrRange.start} onChange={e => setQrRange({...qrRange, start: e.target.value})} placeholder="Start"/>
                            <input type="number" className="input-dark" value={qrRange.end} onChange={e => setQrRange({...qrRange, end: e.target.value})} placeholder="End"/>
                        </div>
                        <button onClick={generatePrintableQRs} className="btn-primary">PRINT QR CODES</button>
                        <hr style={{borderColor:'#333', margin:'20px 0'}}/>
                        <h3>Table Links</h3>
                        {Array.from({ length: (parseInt(qrRange.end) - parseInt(qrRange.start) + 1) }, (_, i) => parseInt(qrRange.start) + i).map(n => (
                            <div key={n} className="menu-link-box">
                                <span style={{fontSize:12}}>Table {n}</span>
                                <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/menu/${id}/${n}`); toast.success("Copied");}} className="btn-glass"><FaCopy/></button>
                            </div>
                        ))}
                    </div>
                )}

                {/* 📊 REVENUE */}
                {activeTab === "revenue" && (
                    <div className="glass-card">
                        <h2>STATS</h2>
                        <p style={{color:'#888'}}>This requires the Report API integration. Basic stats can be calculated from history.</p>
                    </div>
                )}
            </div>

            {/* 🛑 MODAL: TABLE DETAILS */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()} style={{width:'90%', maxWidth:'500px', textAlign:'left'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                            <h2 style={{margin:0, color:'#fff'}}>TABLE {selectedTable.tableNum}</h2>
                            <button onClick={() => setSelectedTable(null)} className="btn-glass"><FaTimes/></button>
                        </div>
                        
                        <div style={{maxHeight:'300px', overflowY:'auto', marginBottom:15}}>
                            {selectedTable.orders.length === 0 ? (
                                <p style={{textAlign:'center', color:'#666'}}>No active orders.</p>
                            ) : (
                                selectedTable.orders.map((order, idx) => (
                                    <div key={order._id} style={{background:'#111', padding:10, borderRadius:8, marginBottom:10, borderLeft:'4px solid #f97316'}}>
                                        <div style={{display:'flex', justifyContent:'space-between', fontSize:12, fontWeight:'bold', color:'#888', marginBottom:5}}>
                                            <span>KOT #{order._id.slice(-4).toUpperCase()}</span>
                                            <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        {order.items.map((item, i) => (
                                            <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:2}}>
                                                <span>{item.name} x{item.quantity}</span>
                                                {/* KOT VIEW DOESN'T NEED PRICE, BUT OWNER MIGHT WANT TO SEE IT */}
                                            </div>
                                        ))}
                                        <div style={{marginTop:8, display:'flex', justifyContent:'flex-end'}}>
                                            <button onClick={() => printKOT(order)} style={{background:'#333', color:'#fff', border:'none', padding:'5px 10px', borderRadius:5, fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', gap:5}}>
                                                <FaPrint/> PRINT KOT
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {selectedTable.orders.length > 0 && (
                            <>
                                <div style={{display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:'900', borderTop:'1px solid #333', paddingTop:15, marginBottom:15}}>
                                    <span>TOTAL BILL:</span>
                                    <span style={{color:'#22c55e'}}>₹{selectedTable.totalAmount}</span>
                                </div>

                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                                    <button onClick={() => printBill(selectedTable.tableNum, selectedTable.orders)} className="btn-primary" style={{background:'#3b82f6'}}>
                                        <FaReceipt/> PRINT BILL
                                    </button>
                                    <button onClick={() => handleCompleteTable(selectedTable.tableNum, selectedTable.orders)} className="btn-primary" style={{background:'#22c55e'}}>
                                        <FaCheck/> COMPLETE
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
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
.admin-container { min-height: 100vh; padding: 15px; background: #050505; color: white; font-family: 'Inter', sans-serif; padding-bottom: 80px; }
.max-w-wrapper { width: 100%; max-width: 800px; margin: 0 auto; }
.shop-title { font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; }
.badge-pro { background: #222; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; color: #888; }
.btn-glass { background: rgba(255,255,255,0.1); border: none; color: white; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn-primary { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border: none; color: white; width: 100%; padding: 15px; border-radius: 12px; font-weight: 900; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
.glass-card { background: #111; border: 1px solid #222; border-radius: 16px; padding: 20px; margin-bottom: 20px; }
.input-dark { width: 100%; background: #222; border: 1px solid #333; padding: 12px; border-radius: 8px; color: white; margin-bottom: 10px; box-sizing: border-box; }

/* NAV */
.nav-grid-row-1 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
.nav-icon-btn { background: #111; border: 1px solid #222; border-radius: 12px; height: 70px; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #666; cursor: pointer; }
.nav-icon-btn.active { background: rgba(249, 115, 22, 0.1); border-color: #f97316; color: #f97316; }
.nav-icon-label { font-size: 10px; font-weight: bold; margin-top: 5px; }

/* TABLE GRID */
.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 15px; }
.table-box { aspect-ratio: 1; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; border: 2px solid transparent; }
.table-box.free { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; color: #22c55e; }
.table-box.occupied { background: rgba(249, 115, 22, 0.1); border-color: #f97316; color: #f97316; animation: pulse 2s infinite; }
.t-num { font-size: 24px; font-weight: 900; }
.t-status { font-size: 10px; font-weight: bold; text-align: center; }
.t-amount { color: #fff; font-size: 14px; margin-top: 2px; }
.badge-new { background: red; color: white; padding: 2px 4px; border-radius: 4px; font-size: 8px; margin-top: 4px; display: inline-block; }

/* DISH LIST */
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #222; }
.menu-link-box { display: flex; justify-content: space-between; align-items: center; background: #222; padding: 10px; border-radius: 8px; margin-bottom: 8px; }

/* MODAL */
.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
.qr-modal { background: #000; border: 1px solid #333; padding: 25px; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }

@keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
`;

export default RestaurantAdmin;