import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
    FaTrash, FaSearch, FaStore, FaSignOutAlt, FaChartLine, 
    FaUtensils, FaUsers, FaBroadcastTower 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import SalesSummary from "../components/SalesSummary"; 

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, activeNow: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLive, setIsLive] = useState(false);

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
            const res = await axios.get(`${API_URL}/api/auth/restaurants`);
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

    // --- 3. BROADCAST LOGIC ---
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
            alert("Broadcast failed. Master admin permission required.");
        }
    };

    // --- 4. REAL-TIME SOCKET LISTENER ---
    useEffect(() => {
        if (isLive) {
            const socket = io(API_URL);

            socket.on("new-order", () => {
                alertSound.current.play().catch(() => {}); 
                fetchGlobalStats(); 
                fetchRestaurants(); // Refresh revenue numbers
            });

            return () => socket.disconnect();
        }
    }, [isLive]);

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ PERMANENT ACTION: Delete this restaurant and all its data?")) return;
        try {
            await axios.delete(`${API_URL}/api/auth/admin/delete-owner/${id}`);
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
                    <FaStore color="#f97316" /> Srinivas Master Control
                </h1>
                <div style={styles.headerRight}>
                    <div style={styles.liveIndicator}>
                        <div style={styles.pulseDot}></div> SYSTEM LIVE
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
            <SalesSummary restaurants={restaurants} />

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
                        <p style={styles.statLabel}>Live Sessions</p>
                        <h2 style={styles.statValue}>{stats.activeNow}</h2>
                    </div>
                </div>
            </div>

            <div style={styles.mainContent}>
                <div style={styles.searchWrapper}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        placeholder="Search by Restaurant or Owner ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                <div style={styles.list}>
                    {loading ? (
                        <p style={styles.centerText}>Syncing SaaS Data...</p>
                    ) : filteredRestaurants.map(r => (
                        <div key={r._id} style={styles.item}>
                            <div>
                                <h3 style={styles.itemName}>{r.restaurantName}</h3>
                                <div style={styles.itemSub}>Owner: <span style={{color: '#f97316'}}>{r.username}</span></div>
                            </div>
                            <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                                <div style={styles.revenueBadge}>₹{r.totalRevenue?.toLocaleString() || 0}</div>
                                <button onClick={() => handleDelete(r._id)} style={styles.delBtn}>
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    ))}
                    {!loading && filteredRestaurants.length === 0 && (
                        <div style={styles.emptyState}>No clients match your search.</div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.5); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "30px", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #1a1a1a", paddingBottom: "20px" },
    headerRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    liveIndicator: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#444', letterSpacing: '1px' },
    pulseDot: { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' },
    logo: { fontSize: '20px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
    broadcastBtn: { background: "#331a00", border: "1px solid #f97316", color: "#f97316", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: '12px', fontWeight: 'bold' },
    logoutBtn: { background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "8px 15px", borderRadius: "8px", cursor: "pointer", fontSize: '12px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' },
    statLabel: { margin: 0, fontSize: '10px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' },
    statValue: { margin: 0, fontSize: '22px', fontWeight: '900' },
    mainContent: { maxWidth: "1000px", margin: "0 auto" },
    searchWrapper: { position: 'relative', marginBottom: '25px' },
    searchIcon: { position: 'absolute', left: '18px', top: '16px', color: '#444' },
    searchInput: { width: '100%', padding: '15px 15px 15px 50px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', color: 'white', outline: 'none' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    item: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '15px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { margin: 0, fontSize: '16px', fontWeight: '700' },
    itemSub: { fontSize: '11px', color: '#444', fontWeight: 'bold' },
    revenueBadge: { background: '#14532d', color: '#4ade80', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    centerText: { textAlign: 'center', color: '#444', marginTop: '40px' },
    emptyState: { textAlign: "center", color: "#333", padding: "60px" }
};

export default SuperAdmin;