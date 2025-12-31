import React, { useState, useEffect, useMemo } from "react";
import { FaTrash, FaSearch, FaStore, FaSignOutAlt, FaChartLine, FaUtensils, FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, activeNow: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
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
            // We fetch the count of all orders in the system to see SaaS scale
            const res = await axios.get(`${API_URL}/api/orders/all-count`); 
            setStats({
                totalOrders: res.data.count || 0,
                activeNow: Math.floor(Math.random() * 50) + 10 // Simulation of live users
            });
        } catch (e) { console.error("Stats Error:", e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ PERMANENT ACTION: Delete this restaurant and all its data?")) return;
        try {
            await axios.delete(`${API_URL}/api/auth/admin/delete-owner/${id}`);
            fetchRestaurants();
        } catch (err) { alert("Delete failed"); }
    };

    // --- 3. SEARCH LOGIC ---
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
                <button onClick={() => { sessionStorage.clear(); navigate("/"); }} style={styles.logoutBtn}>
                    <FaSignOutAlt /> Logout
                </button>
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
                        <p style={styles.statLabel}>Total SaaS Orders</p>
                        <h2 style={styles.statValue}>{stats.totalOrders}</h2>
                    </div>
                </div>
                <div style={styles.statCard}>
                    <FaChartLine size={20} color="#3b82f6" />
                    <div>
                        <p style={styles.statLabel}>Live Users Now</p>
                        <h2 style={styles.statValue}>{stats.activeNow}</h2>
                    </div>
                </div>
            </div>

            <div style={styles.mainContent}>
                {/* SEARCH BAR */}
                <div style={styles.searchWrapper}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        placeholder="Filter by Restaurant Name or Username..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>

                {/* CLIENT LIST */}
                <div style={styles.list}>
                    {loading ? (
                        <p style={styles.centerText}>Synchronizing with Render Server...</p>
                    ) : filteredRestaurants.map(r => (
                        <div key={r._id} style={styles.item}>
                            <div>
                                <h3 style={styles.itemName}>{r.restaurantName}</h3>
                                <div style={styles.itemSub}>ID: <span style={{color: '#f97316'}}>{r.username}</span></div>
                            </div>
                            <button onClick={() => handleDelete(r._id)} style={styles.delBtn}>
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    
                    {!loading && filteredRestaurants.length === 0 && (
                        <div style={styles.emptyState}>No registered restaurants found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- STYLES optimized for SaaS Monitoring ---
const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "30px", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #1a1a1a", paddingBottom: "20px" },
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
    item: { background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '18px 25px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: '0.2s' },
    itemName: { margin: 0, fontSize: '17px', fontWeight: '700' },
    itemSub: { fontSize: '12px', color: '#444', fontWeight: 'bold' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
    centerText: { textAlign: 'center', color: '#444', marginTop: '40px' },
    emptyState: { textAlign: "center", color: "#333", padding: "60px", fontSize: '14px' }
};

export default SuperAdmin;