import React, { useEffect, useState } from "react";
import axios from "axios";

const SuperAdmin = () => {
    // --- STATE MANAGEMENT ---
    const [owners, setOwners] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Login Inputs
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");

    // 🔒 Master Credentials (As requested)
    const ADMIN_USERNAME = "srinivas";
    const ADMIN_PASSWORD = "srividya"; 

    // --- ACCESS CONTROL ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            fetchOwners();
        } else {
            alert("❌ Invalid Admin Credentials. Access Denied.");
        }
    };

    // --- DATA FETCHING ---
    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/admin/all-owners");
            setOwners(res.data);
        } catch (error) {
            console.error("Error fetching owners:", error);
            setOwners([]);
        } finally {
            setLoading(false);
        }
    };

    // --- SUBSCRIPTION MANAGEMENT ---
    const toggleStatus = async (id, currentStatus, username) => {
        const newStatus = currentStatus === "Active" ? "Blocked" : "Active";
        const confirmChange = window.confirm(`Change status for ${username} to ${newStatus}?`);
        
        if (!confirmChange) return;

        try {
            await axios.put(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/admin/update-status/${id}`, { status: newStatus });
            alert(`✅ ${username} is now ${newStatus}`);
            fetchOwners(); // Refresh list
        } catch (error) {
            alert("❌ Error: Could not update status.");
        }
    };

    const handleDelete = async (id, username) => {
        const confirmDelete = window.confirm(
            `⚠️ DANGER ZONE: REVOKE ACCESS?\n\nThis will permanently DELETE '${username}' and all their data.`
        );

        if (!confirmDelete) return;

        try {
            await axios.delete(`http://mongodb+srv://prsnlkalyan_db_user:vasudev1972@cluster0.phbbtix.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/api/auth/admin/delete-owner/${id}`);
            alert(`✅ Data purged for ${username}`);
            fetchOwners();
        } catch (error) {
            alert("❌ Error: Could not delete user.");
        }
    };

    // --- RENDER: LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-sm bg-gray-900 p-8 rounded-3xl border border-gray-800 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-3">🛡️</div>
                        <h1 className="text-3xl font-black text-red-600 uppercase tracking-widest">Master Admin</h1>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Authorized Personnel Only</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
                            <input 
                                type="text" 
                                className="bg-black border border-gray-700 p-4 rounded-xl text-white outline-none w-full mt-1 focus:border-red-600 transition-all"
                                onChange={(e) => setUsernameInput(e.target.value)}
                                value={usernameInput}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <input 
                                type="password" 
                                className="bg-black border border-gray-700 p-4 rounded-xl text-white outline-none w-full mt-1 focus:border-red-600 transition-all"
                                onChange={(e) => setPasswordInput(e.target.value)}
                                value={passwordInput}
                                required
                            />
                        </div>

                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all mt-4">
                            Verify Identity 🔓
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // --- RENDER: MAIN DASHBOARD ---
    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
            <header className="mb-12 border-b border-gray-800 pb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase tracking-tighter">👑 Platform Registry</h1>
                    <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">
                        Monitoring {owners.length} Live Restaurant Subscriptions
                    </p>
                </div>
                <button onClick={() => setIsAuthenticated(false)} className="bg-red-600/10 border border-red-600/30 text-red-500 hover:bg-red-600 px-6 py-2 rounded-full font-black text-xs uppercase transition-all">
                    Lock Registry 🔒
                </button>
            </header>

            <div className="overflow-x-auto bg-[#0a0a0a] rounded-3xl border border-gray-800 shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900/50 border-b border-gray-800 text-gray-500 text-[10px] uppercase tracking-widest">
                            <th className="p-6">Restaurant Owner</th>
                            <th className="p-6">Subscription Status</th>
                            <th className="p-6">License ID</th>
                            <th className="p-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {owners.map((owner) => (
                            <tr key={owner._id} className="hover:bg-gray-900/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center font-black text-lg">
                                            {owner.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xl text-white group-hover:text-red-500 transition-colors">{owner.username}</span>
                                            <span className="text-[10px] text-gray-600 uppercase font-bold">Joined: {new Date(owner.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                        owner.status === "Active" 
                                        ? "bg-green-600/10 border-green-600/30 text-green-500" 
                                        : "bg-red-600/10 border-red-600/30 text-red-500"
                                    }`}>
                                        ● {owner.status || "Active"}
                                    </span>
                                </td>
                                <td className="p-6 font-mono text-xs text-blue-400">{owner._id}</td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <button 
                                        onClick={() => toggleStatus(owner._id, owner.status || "Active", owner.username)}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all"
                                    >
                                        {owner.status === "Blocked" ? "Unblock ✅" : "Block 🚫"}
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(owner._id, owner.username)}
                                        className="bg-red-600/10 border border-red-600/20 text-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase transition-all"
                                    >
                                        Purge 🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SuperAdmin;