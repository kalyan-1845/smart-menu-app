import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from 'jspdf';
import InstallButton from "../components/InstallButton";

import { 
    FaTrash, FaUtensils, FaSignOutAlt, FaStore, 
    FaPlus, FaSpinner, FaPrint, FaBullhorn,
    FaCheck, FaFire, FaChartLine, FaTimes, FaReceipt, FaBoxOpen, FaQrcode, FaFilePdf, FaExclamationTriangle
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const CATEGORY_LIST = ["Starters (Veg)", "Starters (Non-Veg)", "Main Course (Veg)", "Main Course (Non-Veg)", "Biryani", "Chinese", "Desserts", "Beverages", "Breakfast", "Snacks", "Add-ons"];

const RestaurantAdmin = () => {
    const { id } = useParams();
    const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
    const API_BASE = `${SERVER_URL}/api`;
    
    // --- STATE ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [password, setPassword] = useState("");
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Default Tab: "tables" (The Grid)
    const [activeTab, setActiveTab] = useState("tables");
    
    const [restaurantName, setRestaurantName] = useState(id);
    const [dishes, setDishes] = useState([]);
    const [inboxOrders, setInboxOrders] = useState([]);
    const [inventory, setInventory] = useState([]); 
    const [mongoId, setMongoId] = useState(null); 
    
    // Forms
    const [newItem, setNewItem] = useState({ name: "", price: "", image: "", category: "Starters (Veg)" });
    const [newStockItem, setNewStockItem] = useState({ itemName: "", currentStock: "", unit: "kg", lowStockThreshold: 5 });
    const [qrCount, setQrCount] = useState(15); // Default generate 15 tables
    
    // UI Helpers
    const [selectedTable, setSelectedTable] = useState(null);
    const [systemBroadcast, setSystemBroadcast] = useState("");
    const [isMaintenance, setIsMaintenance] = useState(false);

    // --- 1. DATA SYNC ---
    const refreshData = useCallback(async (manualId) => {
        const fetchId = manualId || mongoId || localStorage.getItem(`owner_id_${id}`);
        const token = localStorage.getItem(`owner_token_${id}`); 
        if (!fetchId) return;

        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [dishRes, orderRes, invRes, sysRes] = await Promise.all([
                axios.get(`${API_BASE}/dishes?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/orders/inbox?restaurantId=${fetchId}&t=${Date.now()}`, config),
                axios.get(`${API_BASE}/inventory?restaurantId=${fetchId}`, config),
                axios.get(`${API_BASE}/superadmin/system-status`) 
            ]);
            
            setDishes(dishRes.data || []);
            setInboxOrders(orderRes.data || []);
            setInventory(invRes.data || []);
            setSystemBroadcast(sysRes.data.message || "");
            setIsMaintenance(sysRes.data.maintenance || false);
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

    // --- 2. AUTH HANDLER ---
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

    // --- 3. SMART MERGE LOGIC (KOT vs BILL) ---
    const groupedTables = useMemo(() => {
        const tables = {};
        // Initialize tables 1 to 20
        for(let i = 1; i <= 20; i++) {
            tables[i] = { tableNum: i, status: 'Free', totalAmount: 0, orderBatches: [], allItems: [] };
        }

        // Merge active orders
        inboxOrders.forEach(order => {
            if (order.status !== 'Completed' && order.status !== 'Cancelled') {
                const tNum = parseInt(order.tableNum);
                
                if (tables[tNum]) {
                    tables[tNum].status = 'Occupied';
                    tables[tNum].totalAmount += order.totalAmount;
                    
                    // 1. Store separate batches (For KOT Printing)
                    tables[tNum].orderBatches.push(order); 
                    
                    // 2. Store merged items (For Final Bill Printing)
                    tables[tNum].allItems.push(...order.items); 
                }
            }
        });

        return tables;
    }, [inboxOrders]);

    // --- 4. PRINTING LOGIC ---
    
    // ✅ KOT Printer (Prints ONLY the specific batch items)
    const printKOT = (orderBatch) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html>
                <body style="font-family:monospace;width:280px;padding:10px;">
                    <h3 style="text-align:center;margin:0;">KOT - KITCHEN</h3>
                    <hr/>
                    <p style="font-size:16px;"><b>TABLE: ${orderBatch.tableNum}</b></p>
                    <p>Time: ${new Date(orderBatch.createdAt).toLocaleTimeString()}</p>
                    <hr/>
                    <table style="width:100%;font-size:14px;">
                        ${orderBatch.items.map(i => `<tr><td>${i.name}</td><td style="text-align:right;"><b>x${i.quantity}</b></td></tr>`).join('')}
                    </table>
                    <hr/>
                    <p style="text-align:center;font-size:10px;">..cut here..</p>
                </body>
            </html>
        `);
        win.document.close(); win.print(); win.close();
    };

    // ✅ Bill Printer (Prints EVERYTHING ordered at that table)
    const printBill = (table) => {
        const win = window.open('', '', 'width=300,height=600');
        win.document.write(`
            <html>
                <body style="font-family:monospace;width:280px;padding:10px;">
                    <h2 style="text-align:center;margin:0;">${restaurantName}</h2>
                    <p style="text-align:center;">*** TAX INVOICE ***</p>
                    <hr/>
                    <p style="font-size:16px;"><b>TABLE: ${table.tableNum}</b></p>
                    <table style="width:100%;text-align:left;">
                        <tr><th>Item</th><th>Qty</th><th>Amt</th></tr>
                        ${table.allItems.map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>${i.price * i.quantity}</td></tr>`).join('')}
                    </table>
                    <hr/>
                    <h2 style="text-align:right;">TOTAL: ₹${table.totalAmount}</h2>
                    <hr/>
                    <p style="text-align:center;">Thank You! Visit Again.</p>
                </body>
            </html>
        `);
        win.document.close(); win.print(); win.close();
    };

    // --- 5. ACTIONS ---
    const handleCompleteTable = async (table) => {
        if(!window.confirm(`Clear Table ${table.tableNum}? This will remove all items.`)) return;
        try {
            // Mark ALL batches for this table as Completed
            await Promise.all(table.orderBatches.map(o => axios.put(`${API_BASE}/orders/${o._id}/status`, { status: 'Completed' })));
            toast.success(`Table ${table.tableNum} Cleared`);
            setSelectedTable(null); 
            refreshData();
        } catch(e) { toast.error("Error closing table"); }
    };

    const generateQRPDF = () => {
        const doc = new jsPDF();
        let x = 10, y = 10;

        doc.setFontSize(20);
        doc.text(`QR Codes for ${restaurantName}`, 10, 10);
        y += 20;

        for (let i = 1; i <= qrCount; i++) {
            // URL Format: domain.com/menu/restaurantId?table=1
            const url = `${window.location.origin}/menu/${id}?table=${i}`;
            const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;
            
            if (y > 250) { doc.addPage(); y = 20; }
            
            doc.setFontSize(14);
            doc.text(`Table ${i}`, x, y);
            doc.addImage(qrImg, "PNG", x, y + 5, 40, 40);
            
            x += 60;
            if (x > 150) { x = 10; y += 60; }
        }
        doc.save(`${restaurantName}_Table_QRs.pdf`);
    };

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.price) return toast.error("Name & Price Required");
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/dishes`, {
                name: newItem.name, price: parseFloat(newItem.price), image: newItem.image || "", 
                category: newItem.category, restaurantId: mongoId, isAvailable: true 
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Item Added");
            setNewItem({ name: "", price: "", image: "", category: "Starters (Veg)" });
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    const handleAddInventory = async () => {
        if (!newStockItem.itemName || !newStockItem.currentStock) return toast.error("Fill fields");
        const token = localStorage.getItem(`owner_token_${id}`);
        try {
            await axios.post(`${API_BASE}/inventory`, { ...newStockItem, restaurantId: mongoId }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Stock Added");
            refreshData(mongoId);
        } catch (err) { toast.error("Failed"); }
    };

    // --- 6. STATS CALCULATION ---
    const stats = useMemo(() => {
        const activeRev = Object.values(groupedTables).reduce((acc, t) => acc + t.totalAmount, 0);
        return {
            activeRevenue: activeRev,
            activeTablesCount: Object.values(groupedTables).filter(t => t.status === 'Occupied').length
        };
    }, [groupedTables]);


    // --- VIEWS ---
    if (isMaintenance) return (
        <div style={styles.maintenanceScreen}>
            <FaExclamationTriangle size={80} color="#f97316"/>
            <h1>SYSTEM MAINTENANCE</h1>
            <p>We will be back online shortly.</p>
        </div>
    );

    if (isLoading) return <div className="admin-container"><div className="flex-center" style={{height:'80vh'}}><FaSpinner className="spin" size={40} color="#3b82f6"/></div></div>;

    if (!isAuthenticated) return (
        <div className="admin-container">
            <style>{globalStyles}</style>
            <div className="flex-center" style={{height:'90vh'}}>
                <div className="glass-card text-center" style={{width:'350px'}}>
                    <FaStore size={50} color="#3b82f6" className="mb-20"/>
                    <h1>ADMIN LOGIN</h1>
                    <form onSubmit={handleLogin} className="mt-25">
                        <input type="password" placeholder="Access Key" value={password} onChange={e=>setPassword(e.target.value)} className="input-dark" autoFocus/>
                        <button type="submit" className="btn-primary">LOGIN</button>
                    </form>
                </div>
            </div>
        </div>
    );

    return (
        <div className="admin-wrapper">
            <style>{globalStyles}</style>
            
            {/* SIDEBAR */}
            <div className="admin-sidebar">
                <div className="brand-header">
                    <h1 className="shop-title">{restaurantName}</h1>
                    <span className="badge-pro">ADMIN PRO</span>
                </div>

                <div className="nav-menu">
                    <button onClick={() => setActiveTab("tables")} className={`nav-item ${activeTab === "tables" ? 'active' : ''}`}>
                        <FaFire /> <span>Live Tables</span>
                    </button>
                    <button onClick={() => setActiveTab("menu")} className={`nav-item ${activeTab === "menu" ? 'active' : ''}`}>
                        <FaUtensils /> <span>Menu Setup</span>
                    </button>
                    <button onClick={() => setActiveTab("inventory")} className={`nav-item ${activeTab === "inventory" ? 'active' : ''}`}>
                        <FaBoxOpen /> <span>Inventory</span>
                    </button>
                    <button onClick={() => setActiveTab("qr")} className={`nav-item ${activeTab === "qr" ? 'active' : ''}`}>
                        <FaQrcode /> <span>QR Generator</span>
                    </button>
                    <button onClick={() => setActiveTab("stats")} className={`nav-item ${activeTab === "stats" ? 'active' : ''}`}>
                        <FaChartLine /> <span>Reports</span>
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={() => {localStorage.removeItem(`owner_token_${id}`); window.location.reload();}} className="btn-glass danger full-width">
                        <FaSignOutAlt/> LOGOUT
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="admin-content">
                {systemBroadcast && <div className="broadcast-banner"><FaBullhorn /> <span>BROADCAST: {systemBroadcast}</span></div>}

                {/* TAB: TABLES (THE GRID) */}
                {activeTab === "tables" && (
                    <div className="content-scroll">
                        <div className="table-grid">
                            {Object.values(groupedTables).map((table) => (
                                <div key={table.tableNum} onClick={() => setSelectedTable(table)} className={`table-box ${table.status === 'Occupied' ? 'occupied' : 'free'}`}>
                                    <div className="t-header">
                                        <span className="t-num">{table.tableNum}</span>
                                        <span className={`status-dot ${table.status === 'Occupied' ? 'red' : 'green'}`}></span>
                                    </div>
                                    <div className="t-body">
                                        {table.status === 'Occupied' ? (
                                            <>
                                                <div className="t-amount">₹{table.totalAmount}</div>
                                                <div className="t-orders">{table.orderBatches.length} Orders Merged</div>
                                            </>
                                        ) : (
                                            <span className="t-label">Available</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: MENU SETUP */}
                {activeTab === "menu" && (
                    <div className="content-scroll">
                        <div className="split-layout">
                            <div className="glass-card">
                                <h3 className="section-title"><FaPlus/> ADD ITEM</h3>
                                <input className="input-dark" placeholder="Item Name" value={newItem.name} onChange={e=>setNewItem({...newItem,name:e.target.value})}/>
                                <div className="grid-2">
                                    <input type="number" className="input-dark" placeholder="Price" value={newItem.price} onChange={e=>setNewItem({...newItem,price:e.target.value})}/>
                                    <input className="input-dark" placeholder="Image URL (Optional)" value={newItem.image} onChange={e=>setNewItem({...newItem,image:e.target.value})}/>
                                </div>
                                <select className="input-dark" value={newItem.category} onChange={e=>setNewItem({...newItem,category:e.target.value})}>
                                    {CATEGORY_LIST.map((cat,i)=><option key={i} value={cat}>{cat}</option>)}
                                </select>
                                <button onClick={handleAddItem} className="btn-primary">SAVE TO MENU</button>
                            </div>
                            <div className="glass-card scrollable-card">
                                <h3 className="section-title">MENU ITEMS</h3>
                                {dishes.map(dish => (
                                    <div key={dish._id} className="dish-item">
                                        <div className="flex gap-12">
                                            <div className="fw-700">{dish.name}</div>
                                            <div className="blue-text fw-bold">₹{dish.price}</div>
                                        </div>
                                        <button onClick={async()=>{
                                            if(window.confirm("Delete?")) {
                                                await axios.delete(`${API_BASE}/dishes/${dish._id}`, { headers: { Authorization: `Bearer ${localStorage.getItem('owner_token_'+id)}` } });
                                                refreshData();
                                            }
                                        }} className="btn-icon-danger"><FaTrash/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: INVENTORY */}
                {activeTab === "inventory" && (
                    <div className="content-scroll">
                        <div className="split-layout">
                            <div className="glass-card">
                                <h3 className="section-title"><FaPlus/> STOCK IN</h3>
                                <input className="input-dark" placeholder="Item (e.g. Chicken)" value={newStockItem.itemName} onChange={e=>setNewStockItem({...newStockItem, itemName: e.target.value})}/>
                                <div className="grid-2">
                                    <input type="number" className="input-dark" placeholder="Qty" value={newStockItem.currentStock} onChange={e=>setNewStockItem({...newStockItem, currentStock: e.target.value})}/>
                                    <select className="input-dark" value={newStockItem.unit} onChange={e=>setNewStockItem({...newStockItem, unit: e.target.value})}>
                                        <option value="kg">kg</option><option value="liters">liters</option><option value="pcs">pcs</option>
                                    </select>
                                </div>
                                <button onClick={handleAddInventory} className="btn-primary">ADD STOCK</button>
                            </div>
                            <div className="glass-card scrollable-card">
                                <h3 className="section-title">CURRENT STOCK</h3>
                                {inventory.map(item => (
                                    <div key={item._id} className="dish-item">
                                        <div className="fw-700">{item.itemName} ({item.currentStock} {item.unit})</div>
                                        <button onClick={async () => {
                                            const newVal = prompt("Update Stock", item.currentStock);
                                            if(newVal) {
                                                await axios.put(`${API_BASE}/inventory/${item._id}`, { currentStock: newVal }, { headers: { Authorization: `Bearer ${localStorage.getItem('owner_token_'+id)}` } });
                                                refreshData();
                                            }
                                        }} className="btn-glass">EDIT</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: QR GENERATOR */}
                {activeTab === "qr" && (
                    <div className="content-scroll">
                         <div className="glass-card text-center" style={{maxWidth:'500px', margin:'0 auto'}}>
                            <FaQrcode size={60} color="#3b82f6" className="mb-20"/>
                            <h2>GENERATE TABLE QR CODES</h2>
                            <p className="muted mb-20">Download a PDF with unique QR codes for each table.</p>
                            
                            <label className="muted">How many tables?</label>
                            <input type="number" className="input-dark" value={qrCount} onChange={e=>setQrCount(e.target.value)} />
                            
                            <button onClick={generateQRPDF} className="btn-primary">
                                <FaFilePdf/> DOWNLOAD PDF
                            </button>
                         </div>
                    </div>
                )}

                {/* TAB: STATS */}
                {activeTab === "stats" && (
                    <div className="content-scroll">
                        <div className="table-grid">
                            <div className="glass-card">
                                <h3>Active Revenue</h3>
                                <h1 className="blue-text">₹{stats.activeRevenue}</h1>
                            </div>
                            <div className="glass-card">
                                <h3>Busy Tables</h3>
                                <h1 className="blue-text">{stats.activeTablesCount}</h1>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL (SMART BILLING) --- */}
            {selectedTable && (
                <div className="qr-overlay" onClick={() => setSelectedTable(null)}>
                    <div className="qr-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>TABLE {selectedTable.tableNum}</h2>
                            <button onClick={() => setSelectedTable(null)} className="btn-icon-close"><FaTimes/></button>
                        </div>
                        
                        <div className="modal-body">
                            {selectedTable.status === 'Free' ? (
                                <p className="muted text-center">Table is Empty.</p>
                            ) : (
                                <>
                                    {/* LIST OF BATCHES (For KOT Printing) */}
                                    {selectedTable.orderBatches.map((batch, index) => (
                                        <div key={batch._id} className="order-item">
                                            <div className="order-meta">
                                                <span>Order #{index + 1} ({new Date(batch.createdAt).toLocaleTimeString()})</span>
                                                {/* ✅ BUTTON 1: PRINT KOT (Only this batch) */}
                                                <button onClick={() => printKOT(batch)} className="btn-sm"><FaPrint/> KOT</button>
                                            </div>
                                            {batch.items.map((item, i) => (
                                                <div key={i} className="order-row">
                                                    <span>{item.name}</span>
                                                    <b>x{item.quantity}</b>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {selectedTable.status === 'Occupied' && (
                            <div className="modal-footer">
                                <div className="modal-footer-info">
                                    <span>TOTAL BILL</span>
                                    <span className="total-val">₹{selectedTable.totalAmount}</span>
                                </div>
                                <div className="modal-actions">
                                    {/* ✅ BUTTON 2: PRINT BILL (Full Total) */}
                                    <button onClick={() => printBill(selectedTable)} className="btn-action blue"><FaReceipt/> PRINT BILL</button>
                                    
                                    {/* ✅ BUTTON 3: CLEAR TABLE (Finish) */}
                                    <button onClick={() => handleCompleteTable(selectedTable)} className="btn-action green"><FaCheck/> CLEAR TABLE</button>
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

const styles = {
    maintenanceScreen: { height: '100vh', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'white', padding: 40, fontFamily: 'Plus Jakarta Sans, sans-serif' }
};

// --- OPTIMIZED CSS (Full Screen, Midnight Theme) ---
const globalStyles = `
html, body, #root { height: 100dvh; width: 100vw; margin: 0; padding: 0; overflow: hidden; background: #020617; }
.admin-container { height: 100dvh; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }
.admin-wrapper { display: grid; grid-template-columns: 260px 1fr; height: 100dvh; width: 100vw; background: #020617; color: white; font-family: 'Plus Jakarta Sans', sans-serif; overflow: hidden; }

.admin-sidebar { background: #0f172a; border-right: 1px solid #1e293b; display: flex; flex-direction: column; padding: 20px; z-index: 10; }
.brand-header { margin-bottom: 40px; }
.shop-title { font-size: 24px; font-weight: 800; background: linear-gradient(to right, #60a5fa, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 5px 0; }
.badge-pro { background: rgba(59, 130, 246, 0.1); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; letter-spacing: 1px; }

.nav-menu { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.nav-item { display: flex; alignItems: center; gap: 12px; padding: 14px 16px; background: transparent; border: 1px solid transparent; border-radius: 12px; color: #64748b; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: left; }
.nav-item:hover { background: rgba(255,255,255,0.02); color: #fff; }
.nav-item.active { background: #1e293b; color: #3b82f6; border-color: #334155; }
.nav-footer { margin-top: auto; }

.admin-content { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; position: relative; padding: 0; }
.content-scroll { padding: 30px; overflow-y: auto; height: 100%; scrollbar-width: thin; scrollbar-color: #334155 #0f172a; padding-bottom: 100px; }

@media (max-width: 1024px) {
    .admin-wrapper { grid-template-columns: 80px 1fr; }
    .shop-title, .badge-pro, .nav-item span { display: none; }
    .nav-item { justify-content: center; padding: 15px; }
}
@media (max-width: 768px) {
    .admin-wrapper { display: flex; flex-direction: column; }
    .admin-sidebar { flex-direction: row; height: 70px; width: 100%; align-items: center; justify-content: space-between; border-right: none; border-bottom: 1px solid #1e293b; flex-shrink: 0; }
    .nav-menu { flex-direction: row; overflow-x: auto; gap: 5px; flex: 1; padding: 0 10px; }
    .nav-item { height: auto; padding: 10px; white-space: nowrap; }
    .admin-content { height: calc(100dvh - 70px); }
    .brand-header, .nav-footer { display: none; }
}

.table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 15px; }
.table-box { aspect-ratio: 1.2; background: #1e293b; border-radius: 20px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s; border: 1px solid #334155; position: relative; overflow: hidden; }
.table-box:hover { transform: translateY(-3px); }
.table-box.free { background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.2); }
.table-box.occupied { background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3); }

.t-header { display: flex; justify-content: space-between; align-items: center; }
.t-num { font-size: 28px; font-weight: 800; color: #fff; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; }
.status-dot.green { background: #10b981; box-shadow: 0 0 10px #10b981; }
.status-dot.red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

.t-orders { font-size: 12px; color: #94a3b8; }
.t-amount { font-size: 20px; font-weight: 700; color: #60a5fa; }
.t-label { color: #10b981; font-weight: 600; font-size: 13px; }

.split-layout { display: grid; grid-template-columns: 350px 1fr; gap: 30px; height: 100%; }
@media (max-width: 1200px) { .split-layout { grid-template-columns: 1fr; } }
.glass-card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 25px; margin-bottom: 20px; }
.scrollable-card { overflow-y: auto; max-height: calc(100dvh - 100px); }

.input-dark { width: 100%; background: #0f172a; border: 1px solid #334155; padding: 14px; border-radius: 10px; color: white; margin-bottom: 12px; font-size: 14px; }
.btn-primary { background: #3b82f6; border: none; color: white; width: 100%; padding: 16px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
.btn-glass { background: rgba(255,255,255,0.05); border: 1px solid #334155; color: #cbd5e1; padding: 10px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; }
.btn-glass.danger { color: #f87171; border-color: rgba(248, 113, 113, 0.3); }
.full-width { width: 100%; }

.section-title { margin-top: 0; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; font-size: 16px; color: #94a3b8; letter-spacing: 1px; }
.dish-item { display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #334155; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.qr-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.qr-modal { background: #1e293b; width: 95%; max-width: 500px; border-radius: 24px; padding: 0; border: 1px solid #475569; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
.modal-header { padding: 20px; background: #0f172a; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
.modal-body { padding: 20px; max-height: 50vh; overflow-y: auto; }
.order-item { background: #0f172a; padding: 15px; border-radius: 12px; margin-bottom: 12px; border: 1px solid #334155; }
.order-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; color: #94a3b8; font-size: 12px; }
.order-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
.modal-footer { padding: 20px; background: #0f172a; border-top: 1px solid #334155; }
.modal-footer-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; font-weight: 700; color: #94a3b8; }
.total-val { font-size: 24px; color: #fff; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.btn-action { padding: 14px; border: none; border-radius: 10px; font-weight: 700; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-action.blue { background: #3b82f6; }
.btn-action.green { background: #10b981; }
.btn-sm { background: #334155; color: #cbd5e1; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; }
.btn-icon-close { background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 18px; }
.broadcast-banner { background: rgba(245, 158, 11, 0.1); color: #f59e0b; padding: 12px 20px; border-bottom: 1px solid rgba(245, 158, 11, 0.2); display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 13px; }
.fw-700 { font-weight: 700; }
.blue-text { color: #60a5fa; }
.muted { color: #64748b; }
.btn-icon-danger { background: rgba(239, 68, 68, 0.1); color: #f87171; border: none; padding: 10px; border-radius: 8px; cursor: pointer; transition: 0.2s; }
.flex { display: flex; align-items: center; }
.gap-12 { gap: 12px; }
`;

export default RestaurantAdmin;