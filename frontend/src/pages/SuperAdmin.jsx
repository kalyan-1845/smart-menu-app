import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaTrash, FaSearch, FaStore, FaSignOutAlt, FaChartLine, FaUtensils, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

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
    
    // --- 1. SECURE AUTHENTICATION ---
    useEffect(() => {
        const checkAuth = () => {
            const isSuperAdmin = sessionStorage.getItem("isSuperAdmin");
            if (!isSuperAdmin) {
                const user = prompt("Super Admin Username:");
                const pass = prompt("Super Admin Password:");
                if (user === "srinivas" && pass === "srividya") {
                    sessionStorage.setItem("isSuperAdmin", "true");
                    loadDashboardData();
                } else {
                    alert("Access Denied");
                    navigate("/");
                }
            } else {
                loadDashboardData();
            }
        };
        checkAuth();
    }, [navigate]);

    const loadDashboardData = async () => {
        setLoading(true);
        await Promise.all([fetchRestaurants(), fetchGlobalStats()]);
        setLoading(false);
        setIsLive(true);
    };

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
                activeNow: Math.floor(Math.random() * 20) + 5 // Simulating active sessions
            }));
        } catch (e) { console.error("Stats Error:", e); }
    };
     // Add to SuperAdmin.jsx
const sendBroadcast = async () => {
    const title = prompt("Announcement Title:");
    const message = prompt("Message to all owners:");
    if (!title || !message) return;

    try {
        await axios.post(`${API_URL}/api/broadcast/send`, 
            { title, message, type: 'ALERT' },
            { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }}
        );
        alert("Blast Sent to All Restaurants!");
    } catch (e) {
        alert("Failed to send blast.");
    }
};
    // --- 3. REAL-TIME SOCKET LISTENER ---
    useEffect(() => {
        if (isLive) {
            const socket = io(API_URL);

            // Listen for any new order placed across the entire SaaS platform
            socket.on("new-order", () => {
                alertSound.current.play().catch(() => {}); // Play sound
                fetchGlobalStats(); // Update the order count counter
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
                    <FaStore color="#f97316" /> SaaS Control Center
                </h1>
                <div style={styles.headerRight}>
                    <div style={styles.liveIndicator}>
                        <div style={styles.pulseDot}></div> LIVE MONITORING
                    </div>
                    <button onClick={() => { sessionStorage.clear(); navigate("/"); }} style={styles.logoutBtn}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>
              
            {/* --- ANALYTICS CARDS --- */}
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
                        <p style={styles.statLabel}>Traffic Velocity</p>
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
                        <p style={styles.centerText}>Establishing secure connection...</p>
                    ) : filteredRestaurants.map(r => (
                        <div key={r._id} style={styles.item}>
                            <div>
                                <h3 style={styles.itemName}>{r.restaurantName}</h3>
                                <div style={styles.itemSub}>Owner: <span style={{color: '#f97316'}}>{r.username}</span></div>
                            </div>
                            <button onClick={() => handleDelete(r._id)} style={styles.delBtn}>
                                <FaTrash />
                            </button>
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
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #1a1a1a", paddingBottom: "20px" },
    headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
    liveIndicator: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: '900', color: '#555', letterSpacing: '1px' },
    pulseDot: { width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', animation: 'pulse 2s infinite' },
    logo: { fontSize: '22px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 },
    logoutBtn: { background: "#1a1a1a", border: "1px solid #333", color: "white", padding: "10px 20px", borderRadius: "10px", cursor: "pointer", display: 'flex', alignItems: 'center', gap: '8px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' },
    statLabel: { margin: 0, fontSize: '11px', color: '#555', fontWeight: 'bold', textTransform: 'uppercase' },
    statValue: { margin: 0, fontSize: '24px', fontWeight: '900' },
    mainContent: { maxWidth: "900px", margin: "0 auto" },
    searchWrapper: { position: 'relative', marginBottom: '25px' },
    searchIcon: { position: 'absolute', left: '18px', top: '16px', color: '#444' },
    searchInput: { width: '100%', padding: '15px 15px 15px 50px', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '15px' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    item: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '18px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { margin: 0, fontSize: '17px', fontWeight: '700' },
    itemSub: { fontSize: '12px', color: '#444', fontWeight: 'bold' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
    centerText: { textAlign: 'center', color: '#444', marginTop: '40px' },
    emptyState: { textAlign: "center", color: "#333", padding: "60px", fontSize: '14px' }
};

export default SuperAdmin;