import React, { useEffect, useState } from "react";
import axios from "axios";
// 🎨 Icon Suite
import { 
    FaCrown, FaCalendarPlus, FaUserShield, FaStore, FaTrash, 
    FaBan, FaCheckCircle, FaChartLine, FaMoneyBillWave, FaUsers,
    FaHistory, FaFileInvoiceDollar, FaTimes, FaArrowRight,
    FaBullhorn, FaEnvelope, FaComments
} from "react-icons/fa";

const SuperAdmin = () => {
    // --- 1. STATE MANAGEMENT ---
    const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'support', 'broadcast'
    const [owners, setOwners] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Payment History Sidebar States
    const [showLogs, setShowLogs] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState([]);
    const [selectedShopName, setSelectedShopName] = useState("");

    // Support Ticket States
    const [tickets, setTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyText, setReplyText] = useState("");

    // Broadcast States
    const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", type: "UPDATE" });

    // Login Inputs
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");

    // 🔒 Master Credentials
    const ADMIN_USERNAME = "srinivas";
    const ADMIN_PASSWORD = "srividya"; 

    // --- 2. INITIALIZATION & EFFECTS ---
    useEffect(() => {
        if (isAuthenticated) {
            if (activeTab === "dashboard") fetchOwners();
            if (activeTab === "support") fetchTickets();
        }
    }, [isAuthenticated, activeTab]);

    // --- 3. CORE FUNCTIONS ---

    const handleLogin = (e) => {
        e.preventDefault();
        if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert("❌ Invalid Admin Credentials. Access Denied.");
        }
    };

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await axios.get("https://smart-menu-backend-5ge7.onrender.com/api/auth/admin/all-owners");
            setOwners(res.data);
        } catch (error) {
            console.error("SuperAdmin Fetch Error", error);
            setOwners([]);
        } finally {
            setLoading(false);
        }
    };

    // --- SUPPORT FUNCTIONS ---
    const fetchTickets = async () => {
        try {
            const res = await axios.get("https://smart-menu-backend-5ge7.onrender.com/api/support/all");
            setTickets(res.data);
        } catch (error) {
            console.error("Error fetching tickets", error);
        }
    };

    const sendReply = async (ticketId) => {
        if(!replyText.trim()) return;
        try {
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/support/reply/${ticketId}`, 
                { text: replyText, sender: 'SUPERADMIN' }
            );
            setReplyText("");
            fetchTickets(); // Refresh list
            // Update active ticket locally to see immediate change
            const updatedTicket = tickets.find(t => t._id === ticketId);
            if(updatedTicket) setActiveTicket({...updatedTicket, messages: [...updatedTicket.messages, { text: replyText, sender: 'SUPERADMIN' }]});
        } catch (error) {
            alert("Failed to send reply");
        }
    };

    // --- BROADCAST FUNCTIONS ---
    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/broadcast/send", broadcastForm);
            alert("📢 Broadcast Sent to all Owners!");
            setBroadcastForm({ title: "", message: "", type: "UPDATE" });
        } catch (e) { alert("Broadcast failed."); }
    };

    // --- FINANCIAL & OWNER ACTIONS ---
    const fetchShopLogs = async (id, name) => {
        try {
            const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/admin/payments/${id}`);
            setSelectedLogs(res.data);
            setSelectedShopName(name);
            setShowLogs(true);
        } catch (e) {
            alert("Could not retrieve transaction history.");
        }
    };

    const updateSubscription = async (id, data, username) => {
        try {
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/auth/admin/update-subscription/${id}`, data);
            alert(`✅ Subscription & Ledger updated for ${username}`);
            fetchOwners(); 
        } catch (error) {
            alert("❌ Subscription update failed.");
        }
    };

    const toggleStatus = async (id, currentStatus, username) => {
        const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
        if (!window.confirm(`Change status for ${username} to ${newStatus}?`)) return;
        try {
            await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/auth/admin/update-status/${id}`, { status: newStatus });
            fetchOwners();
        } catch (e) { alert("Status update failed."); }
    };

    const handleDelete = async (id, username) => {
        if (!window.confirm(`⚠️ PERMANENTLY DELETE '${username}'? This cannot be undone.`)) return;
        try {
            await axios.delete(`https://smart-menu-backend-5ge7.onrender.com/api/auth/admin/delete-owner/${id}`);
            fetchOwners();
        } catch (e) { alert("Delete failed."); }
    };

    // --- CALCULATIONS ---
    const totalShops = owners.length;
    const proShops = owners.filter(o => o.isPro).length;
    const betaShops = totalShops - proShops;
    const mrr = proShops * 999; 
    
    const getDaysLeft = (date) => {
        const diff = new Date(date) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    // --- 4. RENDER: LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans">
                <div className="w-full max-w-sm bg-[#111] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
                    <div className="text-center mb-10">
                        <FaUserShield className="text-6xl mx-auto text-red-600 mb-4 animate-pulse" />
                        <h1 className="text-3xl font-black uppercase tracking-tighter">Master Node</h1>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Platform Control Hub</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input type="text" placeholder="Admin ID" className="bg-black border border-gray-700 p-5 rounded-2xl w-full outline-none focus:border-red-600 transition-all font-bold" onChange={(e) => setUsernameInput(e.target.value)} value={usernameInput} required />
                        <input type="password" placeholder="Pass Key" className="bg-black border border-gray-700 p-5 rounded-2xl w-full outline-none focus:border-red-600 transition-all font-bold" onChange={(e) => setPasswordInput(e.target.value)} value={passwordInput} required />
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl uppercase tracking-widest transition-all shadow-xl">Decrypt Access 🔓</button>
                    </form>
                </div>
            </div>
        );
    }

    // --- 5. RENDER: MAIN DASHBOARD ---
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans relative overflow-x-hidden">
            
            {/* 👑 HEADER & NAVIGATION */}
            <header className="mb-10 border-b border-gray-800 pb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-white">👑 Network Registry</h1>
                        <p className="text-gray-500 mt-1 font-bold uppercase text-[10px] flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Live Database Synchronization Active
                        </p>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="bg-white/5 border border-white/10 text-gray-400 px-8 py-3 rounded-2xl font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-all shadow-xl">Lock Console 🔒</button>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab("dashboard")} className={`px-6 py-3 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === "dashboard" ? "bg-[#FF9933] text-black" : "bg-gray-900 text-gray-500 hover:bg-gray-800"}`}>
                        <FaStore className="inline mb-1 mr-2"/> Dashboard
                    </button>
                    <button onClick={() => setActiveTab("support")} className={`px-6 py-3 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === "support" ? "bg-[#FF9933] text-black" : "bg-gray-900 text-gray-500 hover:bg-gray-800"}`}>
                        <FaComments className="inline mb-1 mr-2"/> Support Tickets
                    </button>
                    <button onClick={() => setActiveTab("broadcast")} className={`px-6 py-3 rounded-xl font-bold uppercase text-xs transition-all ${activeTab === "broadcast" ? "bg-[#FF9933] text-black" : "bg-gray-900 text-gray-500 hover:bg-gray-800"}`}>
                        <FaBullhorn className="inline mb-1 mr-2"/> Broadcast
                    </button>
                </div>
            </header>

            {/* 📜 PAYMENT HISTORY SIDEBAR (Slide-over) */}
            {showLogs && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex justify-end transition-all">
                    <div className="w-full max-w-md bg-[#0D1117] h-screen p-8 border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black text-[#FF9933]">Payment Ledger</h2>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{selectedShopName}</p>
                            </div>
                            <button onClick={() => setShowLogs(false)} className="bg-white/5 p-4 rounded-full text-white hover:bg-red-600 transition-all"><FaTimes /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                            {selectedLogs.length === 0 ? (
                                <div className="text-center py-20 opacity-20"><FaFileInvoiceDollar size={50} className="mx-auto mb-4"/><p className="font-black uppercase">No records</p></div>
                            ) : (
                                selectedLogs.map((log, i) => (
                                    <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition">
                                        <div>
                                            <p className="text-xl font-black text-green-500">₹{log.amount}</p>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(log.paidAt).toLocaleDateString()} • {log.method}</p>
                                        </div>
                                        <span className="bg-[#FF9933]/10 text-[#FF9933] px-3 py-1 rounded-full text-[9px] font-black uppercase">+{log.monthsPaid} Mo</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ======================= TAB CONTENT ======================= */}

            {/* 1. DASHBOARD TAB */}
            {activeTab === "dashboard" && (
                <>
                    {/* STATS CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-[#111] p-8 rounded-[45px] border border-green-500/20 shadow-2xl relative overflow-hidden group">
                            <FaMoneyBillWave className="absolute -right-4 -top-4 text-green-500/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                            <p className="text-green-500 text-[10px] font-black uppercase tracking-[3px] mb-2 flex items-center gap-2"><FaChartLine /> Total Revenue (MRR)</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">₹{mrr.toLocaleString()}</h2>
                            <p className="text-gray-600 text-[9px] font-bold mt-4 uppercase tracking-widest italic">From {proShops} Active Subscriptions</p>
                        </div>

                        <div className="bg-[#111] p-8 rounded-[45px] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                            <FaUsers className="absolute -right-4 -top-4 text-blue-500/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[3px] mb-2">Network Capacity</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">{totalShops}</h2>
                            <p className="text-gray-600 text-[9px] font-bold mt-4 uppercase tracking-widest">Connected Client Nodes</p>
                        </div>

                        <div className="bg-[#111] p-8 rounded-[45px] border border-orange-500/20 shadow-2xl relative overflow-hidden group">
                            <FaHistory className="absolute -right-4 -top-4 text-orange-500/10 group-hover:scale-110 transition-transform duration-500" size={120} />
                            <p className="text-[#FF9933] text-[10px] font-black uppercase tracking-[3px] mb-2">Trial Conversions</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter">{betaShops}</h2>
                            <p className="text-gray-600 text-[9px] font-bold mt-4 uppercase tracking-widest">Active Beta/Testing Users</p>
                        </div>
                    </div>

                    {/* OWNER TABLE */}
                    <div className="overflow-x-auto bg-[#0a0a0a] rounded-[50px] border border-gray-800 shadow-2xl mb-20">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-900/50 text-gray-500 text-[10px] uppercase tracking-[3px]">
                                    <th className="p-10">Client / Brand</th>
                                    <th className="p-10 text-center">Plan Tier</th>
                                    <th className="p-10 text-center">Time-to-Expiry</th>
                                    <th className="p-10 text-right">Admin Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-40 text-center font-black animate-pulse text-gray-700 tracking-widest">FETCHING ENCRYPTED DATA NODES...</td></tr>
                                ) : (
                                    owners.map((owner) => (
                                        <tr key={owner._id} className="hover:bg-gray-900/20 transition-all group">
                                            <td className="p-10">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-3xl flex items-center justify-center font-black shadow-2xl shadow-red-600/20 group-hover:scale-110 transition-transform"><FaStore size={24}/></div>
                                                    <div>
                                                        <p className="font-bold text-2xl group-hover:text-red-500 transition-colors">{owner.restaurantName || "Unnamed Shop"}</p>
                                                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">UUID: {owner._id.slice(-8).toUpperCase()} • @{owner.username}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            <td className="p-10 text-center">
                                                <div className={`inline-flex items-center gap-3 px-6 py-2.5 rounded-full border-2 ${owner.isPro ? 'bg-orange-500/10 border-orange-500/40 text-[#FF9933]' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                                                    <FaCrown className={owner.isPro ? 'animate-bounce' : 'opacity-20'} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest">{owner.isPro ? "PRO LICENSE" : "BETA TESTING"}</span>
                                                </div>
                                            </td>

                                            <td className="p-10 text-center">
                                                <p className={`text-2xl font-black ${getDaysLeft(owner.trialEndsAt) < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                                    {getDaysLeft(owner.trialEndsAt)} Days
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase mt-1">Exp: {new Date(owner.trialEndsAt).toLocaleDateString()}</p>
                                            </td>

                                            <td className="p-10 text-right flex justify-end gap-3 items-center">
                                                {/* Actions */}
                                                <button onClick={() => fetchShopLogs(owner._id, owner.restaurantName)} className="p-4 bg-purple-600/10 text-purple-500 rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-lg" title="Financial History"><FaFileInvoiceDollar size={18}/></button>
                                                <button onClick={() => updateSubscription(owner._id, { addMonths: 1 }, owner.username)} className="p-4 bg-blue-600/10 text-blue-500 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-lg" title="Add 1 Month License"><FaCalendarPlus size={18}/></button>
                                                <button onClick={() => updateSubscription(owner._id, { isPro: !owner.isPro }, owner.username)} className={`px-5 py-3 rounded-2xl font-black text-[11px] uppercase transition-all shadow-xl ${owner.isPro ? 'bg-orange-500 text-black' : 'bg-gray-800 text-white hover:bg-gray-700'}`}>
                                                    {owner.isPro ? "Revoke Pro" : "Enable Pro 💎"}
                                                </button>
                                                <button onClick={() => toggleStatus(owner._id, owner.status || "Active", owner.username)} className="p-4 bg-white/5 text-gray-500 rounded-2xl hover:bg-gray-800 transition-all">
                                                    {owner.status === "Blocked" ? <FaCheckCircle className="text-green-500"/> : <FaBan/>}
                                                </button>
                                                <button onClick={() => handleDelete(owner._id, owner.username)} className="p-4 bg-red-600/10 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all"><FaTrash/></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* 2. SUPPORT TAB */}
            {activeTab === "support" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {/* Ticket List */}
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        <h3 className="text-gray-500 font-black uppercase text-xs mb-4">Open Tickets</h3>
                        {tickets.length === 0 && <p className="text-gray-700 font-bold">No active tickets.</p>}
                        {tickets.map(t => (
                            <div key={t._id} onClick={() => setActiveTicket(t)} className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeTicket?._id === t._id ? 'bg-[#FF9933] text-black border-[#FF9933]' : 'bg-[#111] border-gray-800 hover:border-gray-600'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-black uppercase text-[10px] tracking-widest opacity-80">{t.restaurantName}</p>
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full ${t.status === 'Open' ? 'bg-green-500 text-black' : 'bg-gray-700 text-white'}`}>{t.status}</span>
                                </div>
                                <p className="font-bold text-lg leading-tight">{t.subject}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chat Area */}
                    <div className="md:col-span-2 bg-[#111] rounded-[40px] border border-gray-800 p-8 h-[600px] flex flex-col relative">
                        {activeTicket ? (
                            <>
                                <div className="border-b border-gray-800 pb-4 mb-4">
                                    <h2 className="text-xl font-black">{activeTicket.subject}</h2>
                                    <p className="text-gray-500 text-xs">Ticket ID: {activeTicket._id}</p>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
                                    {activeTicket.messages.map((m, i) => (
                                        <div key={i} className={`max-w-[80%] p-4 rounded-2xl ${m.sender === 'SUPERADMIN' ? 'ml-auto bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}>
                                            <p className="text-xs font-bold mb-1 opacity-50">{m.sender === 'SUPERADMIN' ? 'You' : 'Client'}</p>
                                            <p className="text-sm">{m.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input 
                                        value={replyText} 
                                        onChange={e => setReplyText(e.target.value)} 
                                        className="flex-1 bg-black border border-gray-800 p-4 rounded-xl outline-none text-white focus:border-[#FF9933]" 
                                        placeholder="Type your reply here..." 
                                    />
                                    <button onClick={() => sendReply(activeTicket._id)} className="bg-[#FF9933] text-black px-6 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-white transition-colors">
                                        SEND <FaArrowRight className="inline ml-1"/>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full opacity-20">
                                <FaComments size={80} className="mb-4"/>
                                <p className="font-black uppercase tracking-widest">Select a ticket to view messages</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. BROADCAST TAB */}
            {activeTab === "broadcast" && (
                <div className="flex justify-center mb-20">
                    <div className="w-full max-w-2xl bg-[#111] p-10 rounded-[40px] border border-gray-800 shadow-2xl">
                        <h2 className="text-2xl font-black text-[#FF9933] mb-8 uppercase flex items-center gap-3">
                            <FaBullhorn /> System Wide Broadcast
                        </h2>
                        <form onSubmit={handleBroadcast} className="space-y-6">
                            <div>
                                <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Announcement Title</label>
                                <input 
                                    placeholder="e.g. Critical Security Update" 
                                    className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none text-white focus:border-[#FF9933] transition-colors"
                                    value={broadcastForm.title}
                                    onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Message Body</label>
                                <textarea 
                                    placeholder="Type your message to all restaurant owners..." 
                                    className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none h-40 text-white focus:border-[#FF9933] transition-colors resize-none"
                                    value={broadcastForm.message}
                                    onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-gray-500 text-xs font-bold uppercase mb-2">Alert Type</label>
                                <select 
                                    className="w-full bg-black border border-gray-800 p-5 rounded-2xl outline-none text-white focus:border-[#FF9933]"
                                    value={broadcastForm.type}
                                    onChange={e => setBroadcastForm({...broadcastForm, type: e.target.value})}
                                >
                                    <option value="UPDATE">Software Update</option>
                                    <option value="MAINTENANCE">Scheduled Maintenance</option>
                                    <option value="PROMO">Special Offer / Tip</option>
                                    <option value="ALERT">Critical Alert</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-[#FF9933] text-black font-black py-5 rounded-2xl uppercase tracking-widest hover:bg-white transition-all shadow-xl">
                                SEND ANNOUNCEMENT 🚀
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <footer className="text-center opacity-20 pb-20">
                <p className="text-[10px] font-black uppercase tracking-[10px]">Smart Menu Network Core v2.8 • Secured by srinivas</p>
            </footer>
        </div>
    );
};

export default SuperAdmin;