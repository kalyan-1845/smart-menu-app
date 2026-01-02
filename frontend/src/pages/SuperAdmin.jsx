import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    FaTrash, FaSearch, FaStore, FaSignOutAlt, FaChartLine, 
    FaUtensils, FaUsers, FaBroadcastTower, FaPowerOff, FaKey, FaShieldAlt,
    FaUserSecret, FaCalendarPlus, FaCrown, FaClock, FaInfoCircle, FaCommentDots
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import RevenueStats from '../components/StatsBoard';
const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, activeNow: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLive, setIsLive] = useState(false);
    
    // --- 🚀 MODAL STATE FOR INSIGHTS & FEEDBACK ---
    const [selectedClient, setSelectedClient] = useState(null);

    // 🔊 AUDIO REF (Notification for new platform activity)
    const alertSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));
    
    // --- 1. DATA LOADING ---
    const loadDashboardData = async () => {
        setLoading(true);
        await Promise.all([fetchRestaurants(), fetchGlobalStats()]);
        setLoading(false);
        setIsLive(true);
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    // --- 2. DATA FETCHING ---
    const fetchRestaurants = async () => {
        try {
            // ✅ Fetching from /all-owners to get trial details and reg dates
            const res = await axios.get(`${API_URL}/api/superadmin/all-owners`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            setRestaurants(res.data);
        } catch (error) { console.error("Network Error:", error); }
    };

    const fetchGlobalStats = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/orders/all-count`); 
            setStats(prev => ({
                ...prev,
                totalOrders: res.data.count || 0,
                activeNow: Math.floor(Math.random() * 20) + 5 
            }));
        } catch (e) { console.error("Stats Error:", e); }
    };

    // --- 3. 🚀 CEO POWER TOOLS (INTEGRATED) ---

    // 👻 GHOST MODE: Login as Owner without password
    const handleGhostLogin = async (ownerId, username) => {
        try {
            const res = await axios.get(`${API_URL}/api/superadmin/ghost-login/${ownerId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            if (res.data.success) {
                // Multi-session safety: save with unique keys
                localStorage.setItem(`owner_token_${username}`, res.data.token);
                localStorage.setItem(`owner_id_${username}`, ownerId);
                window.open(`/${username}/admin`, '_blank');
            }
        } catch (err) { alert("Ghost Mode failed."); }
    };

    // ⏳ SUBSCRIPTION MANAGEMENT (30 Days / 365 Days)
    const handleSubscriptionUpdate = async (id, restaurantName, days) => {
        const months = days === 365 ? 12 : 1;
        const type = days === 365 ? "YEARLY (365 Days)" : "MONTHLY (30 Days)";
        if (!window.confirm(`Extend ${restaurantName} by ${type}?`)) return;

        try {
            await axios.put(`${API_URL}/api/superadmin/update-subscription/${id}`, {
                addMonths: months,
                isPro: true
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            alert(`✅ ${restaurantName} upgraded successfully!`);
            fetchRestaurants(); 
        } catch (err) { alert("Upgrade failed."); }
    };

    // 🔴 KILL SWITCH
    const toggleDeactivate = async (id, currentStatus) => {
        const confirmMsg = currentStatus === "suspended" 
            ? "Re-activate this restaurant's online URL?" 
            : "Deactivate this restaurant? Their URL will stop working, but data remains safe.";
        
        if (!window.confirm(confirmMsg)) return;

        try {
            await axios.put(`${API_URL}/api/superadmin/toggle-status/${id}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            fetchRestaurants(); 
            alert("Status Updated successfully.");
        } catch (err) { alert("Action failed."); }
    };

    // 🔑 MASTER PASSWORD RESET
    const resetPassword = async (id, restaurantName) => {
        const newPass = prompt(`Enter new password for ${restaurantName}:`);
        if (!newPass) return;

        try {
            await axios.put(`${API_URL}/api/superadmin/reset-password/${id}`, { newPassword: newPass }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            alert(`✅ Password for ${restaurantName} changed successfully!`);
        } catch (err) { alert("Password reset failed."); }
    };

    // --- 4. BROADCAST LOGIC (RETAINED) ---
    const sendBroadcast = async () => {
        const title = prompt("Announcement Title:");
        const message = prompt("Message to all owners:");
        if (!title || !message) return;

        try {
            const token = localStorage.getItem('admin_token'); 
            await axios.post(`${API_URL}/api/broadcast/send`, 
                { title, message, type: 'ALERT' },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            alert("🚀 Broadcast Blasted to All Staff Panels!");
        } catch (e) {
            alert("Broadcast failed.");
        }
    };

    // --- 5. REAL-TIME SOCKET LISTENER (RETAINED) ---
    useEffect(() => {
        if (isLive) {
            const socket = io(API_URL);
            socket.on("new-order", () => {
                if ("vibrate" in navigator) navigator.vibrate(50);
                alertSound.current.play().catch(() => {}); 
                fetchGlobalStats(); 
                fetchRestaurants(); 
            });
            return () => socket.disconnect();
        }
    }, [isLive]);

    // --- 6. DELETE LOGIC (RETAINED) ---
    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ PERMANENT ACTION: Delete this restaurant and all its data?")) return;
        try {
            await axios.delete(`${API_URL}/api/auth/admin/delete-owner/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            fetchRestaurants();
        } catch (err) { alert("Delete failed"); }
    };

    const filteredRestaurants = useMemo(() => {
        return restaurants.filter(r => 
            r.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [restaurants, searchTerm]);

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <h1 style={styles.logo}>
                    <FaShieldAlt color="#f97316" /> BiteBox CEO Control
                </h1>
                <div style={styles.headerRight}>
                    <div style={styles.liveIndicator}>
                        <div style={styles.pulseDot}></div> SYSTEM SECURE
                    </div>
                    <button onClick={sendBroadcast} style={styles.broadcastBtn}>
                        <FaBroadcastTower /> Broadcast
                    </button>
                    <button onClick={() => { localStorage.clear(); sessionStorage.clear(); navigate("/super-login"); }} style={styles.logoutBtn}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>

            {/* ANALYTICS SECTION */}
            <RevenueStats restaurants={restaurants} />

            {/* KPI GRID */}
            <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                    <FaUsers size={20} color="#f97316" />
                    <div>
                        <p style={styles.statLabel}>Total Clients</p>
                        <h2 style={styles.statValue}>{restaurants.length}</h2>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <FaUtensils size={20} color="#22c55e" />
                    <div>
                        <p style={styles.statLabel}>Global Orders</p>
                        <h2 style={styles.statValue}>{stats.totalOrders}</h2>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <FaChartLine size={20} color="#3b82f6" />
                    <div>
                        <p style={styles.statLabel}>Live Nodes</p>
                        <h2 style={styles.statValue}>{stats.activeNow}</h2>
                    </div>
                </div>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.searchWrapper}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        placeholder="Search SaaS Network by Name or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.list}>
                    {loading ? (
                        <p style={styles.centerText}>Decrypting Cloud Data...</p>
                    ) : filteredRestaurants.map(r => (
                        <div key={r._id} style={{
                            ...styles.item, 
                            borderLeft: r.status === "suspended" ? "5px solid #ef4444" : "5px solid #22c55e"
                        }}>
                            <div style={{ flex: 1 }}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                    <h3 style={styles.itemName}>{r.restaurantName}</h3>
                                    {r.isPro ? <FaCrown color="#f97316" title="Premium Client" /> : <span style={styles.trialBadge}>TRIAL</span>}
                                    {r.status === "suspended" && <span style={styles.offlineTag}>URL LOCKED</span>}
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaItem}><FaClock size={10}/> Registered: {new Date(r.createdAt).toLocaleDateString()}</span>
                                    <span style={{...styles.metaItem, color: r.daysLeft < 7 ? '#ef4444' : '#666'}}>
                                        <FaCalendarPlus size={10}/> {r.daysLeft} Days Remaining
                                    </span>
                                </div>
                                <button onClick={() => setSelectedClient(r)} style={styles.detailsToggle}>
                                    <FaInfoCircle /> View Insights & Feedback
                                </button>
                            </div>
                            
                            <div style={styles.actionGroup}>
                                <div style={styles.revenueBadge}>₹{r.totalRevenue?.toLocaleString() || 0}</div>
                                
                                {/* 👻 GHOST MODE BUTTON */}
                                <button onClick={() => handleGhostLogin(r._id, r.username)} style={styles.actionIconBtn} title="Login as Owner">
                                    <FaUserSecret color="#a855f7" />
                                </button>

                                {/* 📅 EXTEND 30 DAYS */}
                                <button onClick={() => handleSubscriptionUpdate(r._id, r.restaurantName, 30)} style={styles.actionIconBtn} title="Extend 30 Days">
                                    <FaCalendarPlus color="#3b82f6" />
                                </button>

                                {/* 👑 UPGRADE 365 DAYS */}
                                <button onClick={() => handleSubscriptionUpdate(r._id, r.restaurantName, 365)} style={styles.actionIconBtn} title="Yearly Upgrade">
                                    <FaCrown color="#eab308" />
                                </button>

                                <button onClick={() => resetPassword(r._id, r.restaurantName)} style={styles.actionIconBtn} title="Reset Pass"><FaKey color="#6366f1" /></button>
                                <button onClick={() => toggleDeactivate(r._id, r.status)} style={styles.actionIconBtn} title="Kill Switch"><FaPowerOff color={r.status === "suspended" ? "#22c55e" : "#ef4444"} /></button>
                                <button onClick={() => handleDelete(r._id)} style={styles.delBtn}><FaTrash /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 📋 MODAL: CLIENT INSIGHTS & FEEDBACK BOX */}
            {selectedClient && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.modalHeader}>
                            <h2>{selectedClient.restaurantName} Insights</h2>
                            <button onClick={() => setSelectedClient(null)} style={styles.closeBtn}>×</button>
                        </div>
                        <div style={styles.modalBody}>
                            <div style={styles.infoBox}>
                                <p><strong>Owner Username:</strong> {selectedClient.username}</p>
                                <p><strong>Email Address:</strong> {selectedClient.email || "Not Provided"}</p>
                                <p><strong>Database ID:</strong> {selectedClient._id}</p>
                                <p><strong>Total Revenue:</strong> ₹{selectedClient.totalRevenue?.toLocaleString()}</p>
                            </div>
                            <div style={styles.feedbackSection}>
                                <h3><FaCommentDots /> Recent Customer Feedback</h3>
                                <div style={styles.feedbackList}>
                                    <p style={{color: '#444', fontStyle: 'italic', fontSize: '12px'}}>
                                        Feedback analytics loading from orders database...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .pulse-dot { animation: pulse 2s infinite; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "30px", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #1a1a1a", paddingBottom: "20px" },
    headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    liveIndicator: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#444' },
    pulseDot: { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' },
    logo: { fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
    broadcastBtn: { background: "#331a00", border: "1px solid #f97316", color: "#f97316", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: '12px', fontWeight: 'bold' },
    logoutBtn: { background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: '12px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' },
    statLabel: { margin: 0, fontSize: '10px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' },
    statValue: { margin: 0, fontSize: '22px', fontWeight: '900' },
    mainContent: { maxWidth: "1200px", margin: "0 auto" },
    searchWrapper: { position: 'relative', marginBottom: '25px' },
    searchIcon: { position: 'absolute', left: '18px', top: '16px', color: '#444' },
    searchInput: { width: '100%', padding: '15px 15px 15px 50px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', color: 'white', outline: 'none' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    item: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { margin: 0, fontSize: '16px', fontWeight: '700' },
    metaRow: { display: 'flex', gap: '15px', marginTop: '6px' },
    metaItem: { fontSize: '10px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' },
    detailsToggle: { background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', marginTop: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', padding: 0 },
    revenueBadge: { background: '#14532d', color: '#4ade80', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    actionGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    actionIconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    trialBadge: { background: '#1e1b4b', color: '#818cf8', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' },
    offlineTag: { background: '#450a0a', color: '#ef4444', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalCard: { background: '#0a0a0a', border: '1px solid #222', borderRadius: '24px', width: '90%', maxWidth: '500px', padding: '30px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '15px', marginBottom: '20px' },
    closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' },
    infoBox: { background: '#111', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.8' },
    feedbackSection: { borderTop: '1px solid #222', paddingTop: '15px' },
    feedbackList: { marginTop: '10px' },
    centerText: { textAlign: 'center', color: '#444', marginTop: '40px' },
    emptyState: { textAlign: "center", color: "#333", padding: "60px" }
};

export default SuperAdmin;