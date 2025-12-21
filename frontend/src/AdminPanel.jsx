import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { generateMonthlyReport } from "./ReportGenerator"; 
// 🎨 Icons
import { FaPlus, FaTrash, FaHistory, FaChartBar, FaDownload, FaCog, FaCreditCard, FaArrowLeft, FaUtensils, FaFire, FaLock, FaUserShield } from "react-icons/fa";

/**
 * AdminPanel Component (Owner Portal)
 * Manages dishes, sales analytics, and restaurant settings.
 * Ensures data is private to the authenticated owner.
 */
const AdminPanel = () => {
    const navigate = useNavigate();

    // --- STATE DEFINITIONS ---
    const [activeTab, setActiveTab] = useState("menu"); 
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", description: "", image: "" });
    const [dishes, setDishes] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [restaurantName, setRestaurantName] = useState("Admin");
    const [loading, setLoading] = useState(true);
    
    // Auth derived from localStorage
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    const [upiId, setUpiId] = useState(localStorage.getItem("restaurantUPI") || "");
    const [isUpiSaved, setIsUpiSaved] = useState(false);

    // --- DATA FETCHING ---
    const fetchData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // 1. Fetch Restaurant Details (Private to Owner)
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`, config);
            setRestaurantName(nameRes.data.username || "Restaurant Owner");

            // 2. Fetch Menu Items
            const dishRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/dishes?restaurantId=${ownerId}`);
            setDishes(Array.isArray(dishRes.data) ? dishRes.data : []);

            // 3. Fetch Transaction History
            const historyRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders?restaurantId=${ownerId}`, config);
            setHistoryData(historyRes.data);

            // 4. Fetch Assistance Call Logs
            const assistRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/calls?restaurantId=${ownerId}`, config);
            const groupAnalytics = assistRes.data.reduce((acc, curr) => {
                acc[curr.tableNumber] = (acc[curr.tableNumber] || 0) + 1;
                return acc;
            }, {});
            setAnalytics(Object.entries(groupAnalytics).map(([table, count]) => ({ table, count })));

        } catch (error) {
            console.error("Admin Portal Sync Error:", error);
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- ANALYTICS HELPERS ---
    const getTopDishes = () => {
        const counts = {};
        historyData.forEach(order => {
            order.items.forEach(item => {
                counts[item.name] = (counts[item.name] || 0) + item.quantity;
            });
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    };

    const getCategoryRevenue = () => {
        const revenueMap = {};
        historyData.forEach(order => {
            order.items.forEach(item => {
                const cat = item.category || "Others"; 
                const amount = (item.price || 0) * (item.quantity || 1);
                revenueMap[cat] = (revenueMap[cat] || 0) + amount;
            });
        });
        return Object.entries(revenueMap).sort((a, b) => b[1] - a[1]);
    };

    // --- HANDLERS ---
    const handleLogout = () => { localStorage.clear(); navigate("/"); };
    const handleSaveUPI = () => { localStorage.setItem("restaurantUPI", upiId); setIsUpiSaved(true); setTimeout(() => setIsUpiSaved(false), 2000); };
    
    const handleAddDish = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/dishes", formData, { headers: { Authorization: `Bearer ${token}` } });
            alert("Dish added to your private menu!");
            setFormData({ name: "", price: "", category: "Starters", description: "", image: "" });
            fetchData();
        } catch (e) { alert("Error adding item. Please check your session."); }
    };

    const deleteDish = async (id) => {
        if(!window.confirm("Permanently remove this item?")) return;
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/dishes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchData();
        } catch (e) { alert("Delete failed."); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white">
            <div className="text-center font-black animate-pulse uppercase tracking-[4px]">
                <FaUserShield className="text-4xl mx-auto mb-4 text-[#FF9933]" />
                Verifying Owner Credentials...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0F18] text-white p-6 font-sans">
            
            {/* 1. SECURE OWNER HEADER */}
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 border-b border-gray-800 pb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#FF9933] uppercase tracking-tighter">{restaurantName} Owner Portal</h1>
                    <p className="text-gray-500 text-[10px] font-black tracking-[3px] uppercase mt-1">Private Business Dashboard</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/chef"><button className="bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2"><FaArrowLeft /> KITCHEN VIEW</button></Link>
                    <button onClick={handleLogout} className="bg-red-600/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition uppercase">Logout</button>
                </div>
            </header>

            {/* 2. NAVIGATION TABS */}
            <nav className="max-w-6xl mx-auto flex gap-2 mb-12 bg-[#181D2A] p-1.5 rounded-2xl border border-gray-800 shadow-2xl">
                <button onClick={() => setActiveTab("menu")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[2px] transition ${activeTab === 'menu' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Manage Menu</button>
                <button onClick={() => setActiveTab("history")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[2px] transition ${activeTab === 'history' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Sales Analytics</button>
                <button onClick={() => setActiveTab("settings")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-[2px] transition ${activeTab === 'settings' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Portal Settings</button>
            </nav>

            <main className="max-w-6xl mx-auto">
                {/* --- TAB: MENU MANAGEMENT --- */}
                {activeTab === "menu" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Add Dish Form */}
                        <section className="bg-[#181D2A] p-10 rounded-[40px] border border-gray-800 shadow-2xl h-fit">
                            <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-[#FF9933] flex items-center gap-3"><FaPlus /> Create Item</h2>
                            <form onSubmit={handleAddDish} className="space-y-5">
                                <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dish Name" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none focus:border-[#FF9933]" required />
                                <div className="grid grid-cols-2 gap-5">
                                    <input type="number" name="price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price ₹" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none" required />
                                    <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none">
                                        <option>Starters</option><option>Main Course</option><option>Pizza</option><option>Burger</option><option>Drinks</option><option>Dessert</option>
                                    </select>
                                </div>
                                <input name="image" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="Image URL" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none" />
                                <textarea name="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Dish description..." className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none" rows="3" />
                                <button className="w-full bg-[#FF9933] text-black font-black py-5 rounded-[20px] shadow-xl transition uppercase text-xs">Publish to Customer Menu</button>
                            </form>
                        </section>

                        {/* Current Dishes List */}
                        <section className="bg-[#181D2A] p-10 rounded-[40px] border border-gray-800 h-[650px] overflow-y-auto custom-scrollbar shadow-2xl">
                            <h2 className="text-xl font-black mb-8 uppercase tracking-widest flex justify-between">My Menu Items <span className="text-gray-500">[{dishes.length}]</span></h2>
                            <div className="space-y-4">
                                {dishes.map(dish => (
                                    <div key={dish._id} className="bg-gray-900/50 p-4 rounded-3xl border border-gray-800 flex justify-between items-center group">
                                        <div className="flex gap-4 items-center">
                                            {dish.image ? <img src={dish.image} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center"><FaUtensils className="text-gray-600"/></div>}
                                            <div>
                                                <p className="font-bold text-gray-200">{dish.name}</p>
                                                <p className="text-[10px] text-[#FF9933] font-black uppercase">₹{dish.price} • {dish.category}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteDish(dish._id)} className="text-gray-700 hover:text-red-500 p-3 transition"><FaTrash /></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- TAB: SALES ANALYTICS --- */}
                {activeTab === "history" && (
                    <div className="space-y-12">
                        {/* KPI SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="bg-[#181D2A] p-8 rounded-[35px] border border-gray-800 shadow-xl">
                                <p className="text-gray-500 text-[10px] font-black mb-2 uppercase tracking-widest">Gross Revenue</p>
                                <p className="text-4xl font-black text-white">₹{historyData.reduce((s,o)=>s+o.totalAmount, 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-[#181D2A] p-8 rounded-[35px] border border-gray-800 shadow-xl">
                                <p className="text-gray-500 text-[10px] font-black mb-2 uppercase tracking-widest">Orders</p>
                                <p className="text-4xl font-black text-[#FF9933]">{historyData.length}</p>
                            </div>
                            <button onClick={() => generateMonthlyReport(restaurantName, historyData, analytics)} className="bg-green-600 hover:bg-green-500 p-8 rounded-[35px] flex flex-col items-center justify-center gap-2 font-black transition-all shadow-xl group">
                                <FaDownload className="text-2xl group-hover:bounce" />
                                <span className="text-[10px] uppercase tracking-widest">Monthly PDF</span>
                            </button>
                        </div>

                        {/* POPULAR DISHES BAR CHART */}
                        <section className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black mb-10 uppercase tracking-widest text-[#FF9933] flex items-center gap-3"><FaFire /> Popular choices</h2>
                            <div className="space-y-6">
                                {getTopDishes().map(([name, count]) => (
                                    <div key={name} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase text-gray-400">
                                            <span>{name}</span>
                                            <span className="text-white">{count} Sold</span>
                                        </div>
                                        <div className="w-full bg-gray-900 h-3 rounded-full border border-gray-800 overflow-hidden">
                                            <div className="bg-gradient-to-r from-[#FF9933] to-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(count / Math.max(...getTopDishes().map(d => d[1]))) * 100}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* REVENUE BY CATEGORY CHART */}
                        <section className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black mb-10 uppercase tracking-[4px] text-green-500 flex items-center gap-3"><FaCreditCard /> Revenue Contribution</h2>
                            <div className="space-y-8">
                                {getCategoryRevenue().map(([category, amount]) => {
                                    const totalRev = historyData.reduce((s, o) => s + o.totalAmount, 0);
                                    const percent = totalRev > 0 ? ((amount / totalRev) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={category}>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-white font-bold text-lg">{category}</span>
                                                <div className="text-right">
                                                    <span className="text-[#FF9933] font-black text-lg block">₹{amount.toLocaleString()}</span>
                                                    <span className="text-gray-600 text-[10px] font-black uppercase">{percent}% contribution</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-gray-900 h-4 rounded-2xl overflow-hidden border border-gray-800 p-1">
                                                <div className="bg-gradient-to-r from-green-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* TRANSACTION LOG LIST */}
                        <section className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black mb-8 uppercase tracking-widest flex items-center gap-3"><FaChartBar /> Private Transaction Logs</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {historyData.map(order => (
                                    <div key={order._id} className="flex justify-between items-center p-6 bg-gray-900/50 rounded-3xl border border-gray-800 hover:border-gray-700 transition">
                                        <div>
                                            <p className="font-black text-white text-lg">Table {order.tableNumber}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()} • {new Date(order.createdAt).toLocaleTimeString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-[#FF9933]">₹{order.totalAmount}</p>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${order.status === 'SERVED' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>{order.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === "settings" && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-500">
                        <div className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-2xl font-black mb-10 text-[#FF9933] flex items-center gap-4"><FaCreditCard /> Checkout Options</h2>
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-3 block">Merchant UPI ID</label>
                                <div className="flex gap-3">
                                    <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. yourname@okaxis" className="flex-1 bg-gray-900 border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#FF9933] transition font-bold" />
                                    <button onClick={handleSaveUPI} className={`px-8 rounded-2xl font-black text-xs transition-all ${isUpiSaved ? 'bg-green-600 text-white' : 'bg-white text-black hover:bg-gray-200'}`}>{isUpiSaved ? 'SAVED' : 'SAVE'}</button>
                                </div>
                                <p className="text-[10px] text-gray-600 mt-4 leading-relaxed font-bold uppercase tracking-tight">Required for automated QR code payments on customer digital receipts.</p>
                            </div>
                        </div>

                        {/* Account Security (Visual Only for now) */}
                        <div className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black mb-6 uppercase tracking-widest flex items-center gap-3"><FaLock /> Account Security</h2>
                            <p className="text-xs font-bold text-gray-500 mb-6 uppercase">Manage your portal access password.</p>
                            <button className="w-full bg-gray-900 text-white border border-gray-800 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-gray-800 transition">REQUEST PASSWORD CHANGE</button>
                        </div>
                    </div>
                )}
            </main>

            <footer className="max-w-6xl mx-auto mt-20 text-center pb-20 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[5px]">Smart Menu Cloud Analytics v2.4 • Private Node</p>
            </footer>
        </div>
    );
};

export default AdminPanel;