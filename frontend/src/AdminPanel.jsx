import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import io from "socket.io-client";
import confetti from "canvas-confetti"; // Install: npm install canvas-confetti
// 🎨 Icons
import SetupWizard from "./components/SetupWizard";
// At the top of AdminPanel.jsx
import { generateMonthlyReport } from "./utils/ReportGenerator";

// Inside the Analytics Tab JSX
import { 
    FaPlus, FaTrash, FaHistory, FaChartBar, FaDownload, FaCog, 
    FaCreditCard, FaArrowLeft, FaUtensils, FaFire, FaLock, 
    FaUserShield, FaWallet, FaArrowUp, FaArrowDown, FaBoxOpen, FaBell, 
    FaCommentDots, FaUsersCog, FaImage, FaCheckCircle, FaCircle, FaCrown
} from "react-icons/fa";
 <button 
    onClick={() => generateMonthlyReport(restaurantName, historyData, expenses, dishes)}
    className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#FF9933] transition-all"
>
    <FaDownload /> Download Professional Report
</button>
// --- SUB-COMPONENT: SETUP WIZARD ---
const SetupWizard = ({ dishesCount, upiId, pushEnabled, onComplete }) => {
    const steps = [
        { id: 1, label: "Add your first 3 dishes", done: dishesCount >= 3, icon: <FaUtensils />, hint: "Head to the 'Menu' tab." },
        { id: 2, label: "Configure Payments", done: !!upiId, icon: <FaWallet />, hint: "Add your UPI ID in Settings." },
        { id: 3, label: "Enable Live Alerts", done: pushEnabled, icon: <FaBell />, hint: "Enable browser notifications." }
    ];

    const completed = steps.filter(s => s.done).length;
    const percent = Math.round((completed / steps.length) * 100);

    useEffect(() => {
        if (completed === 3) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FF9933', '#ffffff', '#00ff00'] });
        }
    }, [completed]);

    if (completed === 3) return (
        <div className="bg-green-500/10 border-2 border-green-500/20 p-6 rounded-[30px] mb-10 flex items-center justify-between animate-bounce">
            <div>
                <h2 className="text-xl font-black text-green-500 uppercase">Your Shop is Live! 🎉</h2>
                <p className="text-xs text-gray-400 font-bold uppercase">All systems operational & ready for customers.</p>
            </div>
            <FaCheckCircle className="text-4xl text-green-500" />
        </div>
    );

    return (
        <div className="bg-[#111] border border-gray-800 rounded-[40px] p-8 mb-10 shadow-2xl">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tighter">🚀 Setup Progress</h2>
                    <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Complete these steps to go live</p>
                </div>
                <span className="text-[#FF9933] font-black text-xs">{percent}% READY</span>
            </div>
            <div className="w-full bg-gray-900 h-1.5 rounded-full mb-8 overflow-hidden">
                <div className="bg-[#FF9933] h-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {steps.map(step => (
                    <div key={step.id} className={`p-4 rounded-2xl border flex items-center gap-3 ${step.done ? 'bg-green-500/5 border-green-500/10 opacity-50' : 'bg-white/5 border-white/5'}`}>
                        {step.done ? <FaCheckCircle className="text-green-500" /> : <FaCircle className="text-gray-700" />}
                        <div>
                            <p className="text-xs font-black uppercase tracking-tight">{step.label}</p>
                            {!step.done && <p className="text-[9px] text-gray-500">{step.hint}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminPanel = () => {
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("menu"); 
    const [loading, setLoading] = useState(true);
    const [restaurantName, setRestaurantName] = useState("Admin");
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [broadcast, setBroadcast] = useState(null);
    const [pushEnabled, setPushEnabled] = useState(Notification.permission === 'granted');

    // Auth & Subscription
    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    const userRole = localStorage.getItem("userRole") || "OWNER";
    const [trialEndsAt, setTrialEndsAt] = useState(null);
    const [isPro, setIsPro] = useState(false);

    // Data
    const [dishes, setDishes] = useState([]);
    const [inventoryList, setInventoryList] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [upiId, setUpiId] = useState(localStorage.getItem("restaurantUPI") || "");
    const [logo, setLogo] = useState(null);
    const [isUpiSaved, setIsUpiSaved] = useState(false);
    const [formData, setFormData] = useState({ name: "", price: "", category: "Starters" });
    const [staffForm, setStaffForm] = useState({ username: "", password: "", role: "CHEF" });

    // --- DATA SYNC ---
    const fetchData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            setLoading(true);
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const requests = [
                axios.get(`${API_BASE}/auth/restaurant/${ownerId}`, config),
                axios.get(`${API_BASE}/dishes?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/orders?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/orders/calls?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/inventory?restaurantId=${ownerId}`, config),
                axios.get(`${API_BASE}/expenses?restaurantId=${ownerId}`, config),
            ];
            if (userRole === "OWNER") requests.push(axios.get(`${API_BASE}/auth/staff/${ownerId}`, config));

            const [nameRes, dishRes, historyRes, assistRes, invRes, expRes, staffRes] = await Promise.all(requests);

            setRestaurantName(nameRes.data.username || "Owner");
            setTrialEndsAt(nameRes.data.trialEndsAt);
            setIsPro(nameRes.data.isPro);
            setDishes(dishRes.data || []);
            setHistoryData(historyRes.data || []);
            setInventoryList(invRes.data || []);
            setExpenses(expRes.data || []);
            if (staffRes) setStaffList(staffRes.data || []);

        } catch (error) {
            console.error("Portal Sync Error:", error);
            if (error.response?.status === 401) handleLogout();
        } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.emit("join-owner-room", ownerId);
        
        socket.on("waiter-call", (data) => {
            new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
            setActiveAlerts(prev => [...prev, { ...data, time: new Date().toLocaleTimeString() }]);
        });

        socket.on('new-broadcast', (data) => {
            setBroadcast(data);
            new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3").play();
        });

        return () => socket.disconnect();
    }, [ownerId]);

    // --- ACTIONS ---
    const handleLogout = () => { localStorage.clear(); navigate("/"); };

    const subscribeToPush = async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setPushEnabled(true);
            alert("🔔 Notifications Active!");
            // Note: In real production, send subscription object to backend here
        }
    };

    const handleAddDish = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/dishes`, { ...formData, owner: ownerId }, { headers: { Authorization: `Bearer ${token}` } });
            setFormData({ name: "", price: "", category: "Starters" });
            fetchData();
        } catch (e) { alert("Error saving dish."); }
    };

    const handleSaveUPI = () => {
        localStorage.setItem("restaurantUPI", upiId);
        setIsUpiSaved(true);
        setTimeout(() => setIsUpiSaved(false), 2000);
    };

    const calculateDaysLeft = (date) => {
        const diff = new Date(date) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const totalRevenue = historyData.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    if (loading) return <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white font-black animate-pulse">CONNECTING TO CLOUD...</div>;

    return (
        <div className="min-h-screen bg-[#0A0F18] text-white p-4 md:p-8 font-sans selection:bg-[#FF9933] selection:text-black">
            
            {/* 📢 BROADCAST BANNER */}
            {broadcast && (
                <div className="fixed top-0 left-0 w-full bg-blue-600 text-white p-3 z-[2000] flex justify-between items-center animate-pulse">
                    <p className="text-[10px] font-black uppercase tracking-widest mx-auto">📢 {broadcast.title}: {broadcast.message}</p>
                    <button onClick={() => setBroadcast(null)} className="mr-4 font-black">✕</button>
                </div>
            )}

            {/* 🛎️ WAITER ALERTS */}
            <div className="fixed top-20 right-6 z-[1000] space-y-4 w-80">
                {activeAlerts.map((alert, i) => (
                    <div key={i} className="bg-[#FF9933] text-black p-5 rounded-2xl shadow-2xl animate-bounce flex justify-between items-center border-4 border-white">
                        <div><p className="text-[10px] font-black uppercase">🛎️ Table {alert.tableNumber}</p><p className="font-black text-lg">{alert.type?.toUpperCase()}!</p></div>
                        <button onClick={() => setActiveAlerts(prev => prev.filter((_, idx) => idx !== i))} className="bg-black text-white px-3 py-1 rounded-lg font-bold text-xs">OK</button>
                    </div>
                ))}
            </div>

            <main className="max-w-6xl mx-auto">
                {/* --- HEADER --- */}
                <header className="flex flex-col md:flex-row justify-between items-center mb-10 pt-10 border-b border-gray-800 pb-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">{restaurantName}</h1>
                            {isPro ? (
                                <span className="bg-[#FF9933]/10 text-[#FF9933] border border-[#FF9933]/20 px-3 py-1 rounded-full text-[9px] font-black flex items-center gap-1"><FaCrown/> PRO</span>
                            ) : (
                                <span className="bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                    Trial: {calculateDaysLeft(trialEndsAt)} Days Left
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 text-[10px] font-black tracking-[4px] mt-2">Node v2.8 • Role: {userRole}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/chef"><button className="bg-white/5 px-8 py-3 rounded-2xl text-[10px] font-black transition hover:bg-white/10 uppercase tracking-widest border border-white/5">Kitchen Node</button></Link>
                        <button onClick={handleLogout} className="bg-red-600/10 text-red-500 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/10 hover:bg-red-600 hover:text-white transition">Logout</button>
                    </div>
                </header>
                       <main className="max-w-6xl mx-auto">
    {/* 🔥 THE WIZARD */}
    {userRole === "OWNER" && (
        <SetupWizard 
            dishesCount={dishes.length} 
            upiId={upiId} 
            pushEnabled={pushEnabled} 
        />
    )}

    {/* Rest of your tabs logic... */}
</main>
                {/* --- ONBOARDING WIZARD (Only for Owners) --- */}
                {userRole === "OWNER" && (
                    <SetupWizard 
                        dishesCount={dishes.length} 
                        upiId={upiId} 
                        pushEnabled={pushEnabled} 
                    />
                )}

                {/* --- NAVIGATION --- */}
                <nav className="flex flex-wrap gap-2 mb-10 bg-[#111] p-1.5 rounded-3xl border border-gray-800 shadow-2xl">
                    {['menu', 'inventory', 'history', 'staff', 'feedback', 'settings'].map(tab => {
                        if ((tab === 'history' || tab === 'staff') && userRole !== 'OWNER') return null;
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition ${activeTab === tab ? 'bg-[#FF9933] text-black shadow-xl scale-105' : 'text-gray-500 hover:text-white'}`}>
                                {tab}
                            </button>
                        )
                    })}
                </nav>

                {/* --- TAB CONTENT --- */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* MENU TAB */}
                    {activeTab === "menu" && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <section className="bg-[#111] p-10 rounded-[45px] border border-gray-800 shadow-2xl">
                                <h2 className="text-xl font-black mb-8 uppercase text-[#FF9933] flex items-center gap-3"><FaPlus /> Create Item</h2>
                                <form onSubmit={handleAddDish} className="space-y-5">
                                    <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Dish Name" className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#FF9933]" required />
                                    <div className="grid grid-cols-2 gap-5">
                                        <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Price ₹" className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#FF9933]" required />
                                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none">
                                            <option>Starters</option><option>Main Course</option><option>Dessert</option><option>Drinks</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="w-full bg-[#FF9933] text-black font-black py-6 rounded-3xl shadow-xl uppercase text-xs tracking-widest hover:scale-[1.02] transition">Publish to Menu</button>
                                </form>
                            </section>
                            <section className="bg-[#111] p-10 rounded-[45px] border border-gray-800 h-[600px] overflow-y-auto">
                                <h2 className="text-xl font-black mb-8 uppercase tracking-widest">Active Dishes ({dishes.length})</h2>
                                {dishes.map(dish => (
                                    <div key={dish._id} className="bg-black/50 p-5 rounded-3xl border border-gray-800 flex justify-between items-center mb-4 group hover:border-[#FF9933]/50 transition">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-700"><FaUtensils size={20}/></div>
                                            <div><p className="font-black text-white text-lg">{dish.name}</p><p className="text-[10px] text-[#FF9933] font-black uppercase tracking-widest">₹{dish.price}</p></div>
                                        </div>
                                        <button onClick={async () => { if(window.confirm("Delete?")) { await axios.delete(`${API_BASE}/dishes/${dish._id}`, {headers:{Authorization:`Bearer ${token}`}}); fetchData(); }}} className="text-gray-700 hover:text-red-500 p-3 bg-white/5 rounded-xl transition"><FaTrash /></button>
                                    </div>
                                ))}
                            </section>
                        </div>
                    )}

                    {/* ANALYTICS TAB */}
                    {activeTab === "history" && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#111] p-10 rounded-[45px] border border-gray-800"><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Revenue</p><p className="text-4xl font-black">₹{totalRevenue.toLocaleString()}</p></div>
                                <div className="bg-[#111] p-10 rounded-[45px] border border-gray-800"><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Costs</p><p className="text-4xl font-black text-red-500">₹{totalExpenses.toLocaleString()}</p></div>
                                <div className={`p-10 rounded-[45px] border ${netProfit >= 0 ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}><p className="text-gray-500 text-[10px] font-black uppercase mb-2">Net Profit</p><p className={`text-5xl font-black ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>₹{netProfit.toLocaleString()}</p></div>
                            </div>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === "settings" && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="bg-[#111] p-12 rounded-[50px] border border-gray-800 shadow-2xl">
                                <h2 className="text-2xl font-black mb-10 text-[#FF9933] flex items-center gap-4 uppercase tracking-tighter"><FaCog /> Merchant Config</h2>
                                
                                <div className="mb-10">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-4 block">Push Alerts (PWA)</label>
                                    <button onClick={subscribeToPush} className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${pushEnabled ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 'bg-[#FF9933] text-black'}`}>
                                        <FaBell /> {pushEnabled ? 'NOTIFICATIONS ACTIVE' : 'ENABLE ORDER NOTIFICATIONS'}
                                    </button>
                                </div>

                                <div className="mb-10">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] mb-4 block">Merchant UPI ID</label>
                                    <div className="flex gap-3">
                                        <input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="restaurant@okaxis" className="flex-1 bg-black border border-gray-800 p-5 rounded-2xl outline-none font-bold" />
                                        <button onClick={handleSaveUPI} className={`px-10 rounded-2xl font-black text-xs uppercase transition-all ${isUpiSaved ? 'bg-green-600 text-white' : 'bg-white text-black'}`}>{isUpiSaved ? 'SAVED' : 'SAVE'}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className="max-w-6xl mx-auto mt-20 text-center pb-20 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-[10px]">Smart Menu Cloud v2.8 • Secured by srinivas</p>
            </footer>
        </div>
    );
};

export default AdminPanel;