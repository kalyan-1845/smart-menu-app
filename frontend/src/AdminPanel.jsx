import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { generateMonthlyReport } from "./ReportGenerator"; 
// 🎨 Icons
import { 
    FaPlus, FaTrash, FaHistory, FaChartBar, FaDownload, FaCog, 
    FaCreditCard, FaArrowLeft, FaUtensils, FaFire, FaLock, 
    FaUserShield, FaWallet, FaArrowUp, FaArrowDown, FaBoxOpen
} from "react-icons/fa";

const AdminPanel = () => {
    const navigate = useNavigate();

    // --- 1. STATE DEFINITIONS ---
    const [activeTab, setActiveTab] = useState("menu"); 
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState("Admin");

    // Menu/Dish States
    const [dishes, setDishes] = useState([]);
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters", description: "", image: "" });
    
    // Inventory & Recipe Builder States
    const [inventoryList, setInventoryList] = useState([]);
    const [recipeItems, setRecipeItems] = useState([]); // [{ ingredientId, quantityNeeded, name }]

    // Sales & Expense States
    const [historyData, setHistoryData] = useState([]);
    const [analytics, setAnalytics] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [expenseForm, setExpenseForm] = useState({ title: "", amount: "", category: "Raw Materials" });

    // Auth & Settings
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    const [upiId, setUpiId] = useState(localStorage.getItem("restaurantUPI") || "");
    const [isUpiSaved, setIsUpiSaved] = useState(false);

    // --- 2. DATA SYNCHRONIZATION ---
    const fetchData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

            // Concurrent data fetching
            const [nameRes, dishRes, historyRes, assistRes, expRes, invRes] = await Promise.all([
                axios.get(`${API_BASE}/auth/restaurant/${ownerId}`, config),
                axios.get(`${API_BASE}/dishes?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/orders?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/expenses?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/inventory?restaurantId=${ownerId}`, config)
            ]);

            setRestaurantName(nameRes.data.username || "Owner");
            setDishes(Array.isArray(dishRes.data) ? dishRes.data : []);
            setHistoryData(historyRes.data);
            setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
            setInventoryList(Array.isArray(invRes.data) ? invRes.data : []);

            // Process Assistance Calls for heatmap
            const groupAnalytics = assistRes.data.reduce((acc, curr) => {
                acc[curr.tableNumber] = (acc[curr.tableNumber] || 0) + 1;
                return acc;
            }, {});
            setAnalytics(Object.entries(groupAnalytics).map(([table, count]) => ({ table, count })));

        } catch (error) {
            console.error("Portal Sync Error:", error);
            if (error.response?.status === 401) handleLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // --- 3. BUSINESS LOGIC (Calculations) ---
    const totalRevenue = historyData.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const getTopDishes = () => {
        const counts = {};
        historyData.forEach(order => order.items.forEach(item => {
            counts[item.name] = (counts[item.name] || 0) + item.quantity;
        }));
        return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    };

    const getCategoryRevenue = () => {
        const revenueMap = {};
        historyData.forEach(order => order.items.forEach(item => {
            const cat = item.category || "Others"; 
            revenueMap[cat] = (revenueMap[cat] || 0) + (item.price * item.quantity);
        }));
        return Object.entries(revenueMap).sort((a, b) => b[1] - a[1]);
    };

    // --- 4. ACTION HANDLERS ---
    const handleLogout = () => { localStorage.clear(); navigate("/"); };

    const handleAddDish = async (e) => {
        e.preventDefault();
        const payload = { ...formData, recipe: recipeItems, owner: ownerId };
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/dishes", payload, { headers: { Authorization: `Bearer ${token}` } });
            alert("Dish & Recipe Published!");
            setFormData({ name: "", price: "", category: "Starters", description: "", image: "" });
            setRecipeItems([]);
            fetchData();
        } catch (e) { alert("Error saving dish."); }
    };

    const handleLogExpense = async (e) => {
        e.preventDefault();
        if(!expenseForm.title || !expenseForm.amount) return alert("Fill title and amount");
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/expenses", { ...expenseForm, owner: ownerId }, { headers: { Authorization: `Bearer ${token}` } });
            setExpenseForm({ title: "", amount: "", category: "Raw Materials" });
            fetchData();
        } catch (e) { alert("Expense failed to log."); }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white">
            <div className="text-center font-black animate-pulse uppercase tracking-[4px]">
                <FaUserShield className="text-4xl mx-auto mb-4 text-[#FF9933]" /> Verifying Owner Connection...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0A0F18] text-white p-6 font-sans">
            
            {/* --- HEADER --- */}
            <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 border-b border-gray-800 pb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#FF9933] tracking-tighter uppercase">{restaurantName} Portal</h1>
                    <p className="text-gray-500 text-[10px] font-black tracking-[4px] mt-1">Smart System Active</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/chef"><button className="bg-gray-800 hover:bg-gray-700 px-6 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2"><FaArrowLeft /> KITCHEN</button></Link>
                    <button onClick={handleLogout} className="bg-red-600/10 text-red-500 border border-red-500/20 px-6 py-2.5 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition">LOGOUT</button>
                </div>
            </header>

            {/* --- TABS --- */}
            <nav className="max-w-6xl mx-auto flex gap-2 mb-10 bg-[#181D2A] p-1.5 rounded-2xl border border-gray-800 shadow-2xl">
                <button onClick={() => setActiveTab("menu")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase transition ${activeTab === 'menu' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Menu & Recipe</button>
                <button onClick={() => setActiveTab("history")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase transition ${activeTab === 'history' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Analytics & Profit</button>
                <button onClick={() => setActiveTab("settings")} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase transition ${activeTab === 'settings' ? 'bg-[#FF9933] text-black shadow-lg' : 'text-gray-500'}`}>Settings</button>
            </nav>

            <main className="max-w-6xl mx-auto">
                {/* --- TAB: MANAGE MENU --- */}
                {activeTab === "menu" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Form with Recipe Builder */}
                        <section className="bg-[#181D2A] p-10 rounded-[40px] border border-gray-800 shadow-2xl h-fit">
                            <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-[#FF9933] flex items-center gap-3"><FaPlus /> New Dish</h2>
                            <form onSubmit={handleAddDish} className="space-y-5">
                                <input name="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Dish Name" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none" required />
                                <div className="grid grid-cols-2 gap-5">
                                    <input type="number" name="price" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="Price ₹" className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none" required />
                                    <select name="category" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-900 border border-gray-800 p-4 rounded-2xl outline-none">
                                        <option>Starters</option><option>Main Course</option><option>Pizza</option><option>Burger</option><option>Drinks</option><option>Dessert</option>
                                    </select>
                                </div>
                                
                                {/* 🥙 INVENTORY LINKING UI */}
                                <div className="mt-6 border-t border-gray-800 pt-6">
                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Recipe Ingredients (Stock Control)</h3>
                                    <div className="flex gap-2 mb-4">
                                        <select id="ingSel" className="flex-1 bg-gray-900 border border-gray-800 p-3 rounded-xl outline-none text-xs">
                                            <option value="">Select Stock...</option>
                                            {inventoryList.map(i => <option key={i._id} value={JSON.stringify(i)}>{i.itemName} ({i.unit})</option>)}
                                        </select>
                                        <input type="number" id="ingQty" placeholder="Qty" className="w-20 bg-gray-900 border border-gray-800 p-3 rounded-xl outline-none text-xs" />
                                        <button type="button" onClick={() => {
                                            const item = JSON.parse(document.getElementById('ingSel').value);
                                            const qty = document.getElementById('ingQty').value;
                                            if(item && qty) setRecipeItems([...recipeItems, { ingredientId: item._id, quantityNeeded: parseFloat(qty), name: item.itemName }]);
                                        }} className="bg-gray-800 p-3 rounded-xl"><FaPlus /></button>
                                    </div>
                                    <div className="space-y-2">
                                        {recipeItems.map((r, i) => (
                                            <div key={i} className="flex justify-between bg-black/40 p-3 rounded-xl border border-gray-800 text-[10px] font-bold">
                                                <span>{r.name}</span> <span>{r.quantityNeeded} needed</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-[#FF9933] text-black font-black py-5 rounded-[20px] shadow-xl uppercase text-xs">Sync Dish & Recipe</button>
                            </form>
                        </section>

                        <section className="bg-[#181D2A] p-10 rounded-[40px] border border-gray-800 h-[700px] overflow-y-auto shadow-2xl">
                             <h2 className="text-xl font-black mb-8 uppercase tracking-widest">Active Menu <span className="text-gray-600">({dishes.length})</span></h2>
                             <div className="space-y-4">
                                {dishes.map(dish => (
                                    <div key={dish._id} className="bg-gray-900/50 p-4 rounded-3xl border border-gray-800 flex justify-between items-center group hover:bg-gray-900 transition">
                                        <div className="flex gap-4 items-center">
                                            {dish.image ? <img src={dish.image} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-gray-600"><FaUtensils/></div>}
                                            <div><p className="font-bold text-gray-200">{dish.name}</p><p className="text-[10px] text-[#FF9933] font-black uppercase tracking-tighter">₹{dish.price}</p></div>
                                        </div>
                                        <button onClick={() => deleteDish(dish._id)} className="text-gray-700 hover:text-red-500 p-3 transition"><FaTrash /></button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- TAB: ANALYTICS & PROFIT --- */}
                {activeTab === "history" && (
                    <div className="space-y-12">
                         {/* 💰 FINANCIALS */}
                         <section className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom duration-700">
                            <div className="bg-[#111827] p-8 rounded-[35px] border border-gray-800 shadow-xl">
                                <p className="text-gray-500 text-[10px] font-black mb-2 uppercase flex items-center gap-2"><FaArrowUp className="text-green-500"/> Revenue</p>
                                <p className="text-3xl font-black">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-[#111827] p-8 rounded-[35px] border border-gray-800 shadow-xl">
                                <p className="text-gray-500 text-[10px] font-black mb-2 uppercase flex items-center gap-2"><FaArrowDown className="text-red-500"/> Costs</p>
                                <p className="text-3xl font-black">₹{totalExpenses.toLocaleString()}</p>
                            </div>
                            <div className={`p-8 rounded-[35px] border shadow-2xl ${netProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <p className="text-gray-500 text-[10px] font-black mb-2 uppercase">Net Profit</p>
                                <p className={`text-4xl font-black ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>₹{netProfit.toLocaleString()}</p>
                            </div>
                            <button onClick={() => generateMonthlyReport(restaurantName, historyData, analytics)} className="bg-green-600 hover:bg-green-700 p-8 rounded-[35px] flex flex-col items-center justify-center gap-2 font-black transition shadow-xl group">
                                <FaDownload className="text-2xl group-hover:bounce" /> <span className="text-[10px] uppercase">Export Report</span>
                            </button>
                        </section>

                        {/* 📊 EXPENSE ENTRY */}
                        <section className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-xl font-black mb-8 uppercase tracking-widest text-red-500 flex items-center gap-3"><FaWallet /> Log New Expense</h2>
                            <form onSubmit={handleLogExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input placeholder="Title (e.g. Rent)" className="bg-gray-900 border border-gray-800 p-5 rounded-2xl outline-none font-bold" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} />
                                <input type="number" placeholder="Amount ₹" className="bg-gray-900 border border-gray-800 p-5 rounded-2xl outline-none font-bold" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: parseFloat(e.target.value) || 0})} />
                                <select className="bg-gray-900 border border-gray-800 p-5 rounded-2xl outline-none font-bold" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                    <option>Raw Materials</option><option>Salaries</option><option>Rent</option><option>Utilities</option><option>Marketing</option>
                                </select>
                                <button type="submit" className="bg-red-600 text-white font-black rounded-2xl tracking-widest text-xs uppercase">Add to Books</button>
                            </form>
                        </section>

                        {/* 📊 CATEGORY REVENUE CHART */}
                        <section className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl mt-10">
                            <h2 className="text-xl font-black mb-10 uppercase tracking-[4px] text-green-500 flex items-center gap-3">
                                <FaCreditCard /> Revenue Contribution
                            </h2>
                            <div className="space-y-8">
                                {getCategoryRevenue().map(([category, amount]) => {
                                    const percentage = totalRevenue > 0 ? ((amount / totalRevenue) * 100).toFixed(1) : 0;
                                    return (
                                        <div key={category} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <div><span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Category</span><span className="text-white font-bold text-lg">{category}</span></div>
                                                <div className="text-right"><span className="text-[#FF9933] font-black text-lg">₹{amount.toLocaleString()}</span><span className="text-gray-600 text-[10px] font-black block">{percentage}% Contribution</span></div>
                                            </div>
                                            <div className="w-full bg-gray-900 h-4 rounded-2xl overflow-hidden border border-gray-800 p-1">
                                                <div className="bg-gradient-to-r from-green-600 to-emerald-400 h-full rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* TRANSACTION LOGS... */}
                    </div>
                )}

                {/* --- TAB: SETTINGS --- */}
                {activeTab === "settings" && (
                    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in duration-500">
                        <div className="bg-[#181D2A] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                            <h2 className="text-2xl font-black mb-10 text-[#FF9933] flex items-center gap-4"><FaCreditCard /> Merchant UPI</h2>
                            <div className="flex gap-3">
                                <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="restaurant@okaxis" className="flex-1 bg-gray-900 border border-gray-800 p-5 rounded-2xl outline-none font-bold" />
                                <button onClick={handleSaveUPI} className={`px-8 rounded-2xl font-black text-xs uppercase ${isUpiSaved ? 'bg-green-600 text-white' : 'bg-white text-black'}`}>{isUpiSaved ? 'SAVED' : 'SAVE'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="max-w-6xl mx-auto mt-20 text-center pb-20 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[5px]">Smart Menu Cloud Node v2.6 • Private & Secured</p>
            </footer>
        </div>
    );
};

export default AdminPanel;