import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { 
    FaTrash, FaSearch, FaSignOutAlt, FaChartLine, 
    FaUsers, FaBroadcastTower, FaPowerOff, FaShieldAlt,
    FaUserSecret, FaClock, FaSpinner, FaExclamationTriangle, FaCircle, FaMoneyBillWave, FaTools, FaCrown
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RevenueStats from '../components/RevenueStats'; // Ensure this matches your filename
import InstallButton from "../components/InstallButton";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [stats, setStats] = useState({ totalOrders: 0, activeNow: 0 });
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [broadcastMsg, setBroadcastMsg] = useState("");

    // ✅ SCOPING FIX: Move the styles object INSIDE the component
    const styles = {
        container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "'Inter', sans-serif" },
        header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
        logo: { fontSize: '14px', fontWeight: '900' },
        maintBtn: { border: '1px solid #222', color: 'white', padding: '8px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', display:'flex', alignItems:'center', gap:'8px' },
        logoutBtn: { background: "#ef4444", border: "none", color: "white", padding: "8px 15px", borderRadius: "8px", fontWeight:'900', fontSize:'10px', marginLeft:'10px' },
        metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' },
        metricCard: { background: '#0a0a0a', border: '1px solid #111', padding: '15px', borderRadius: '15px' },
        metricLabel: { margin: 0, fontSize: '8px', color: '#444', fontWeight: '900' },
        metricValue: { margin: 0, fontSize: '16px', fontWeight: '900', marginTop: '5px' },
        broadcastBox: { display: 'flex', gap: '10px', marginBottom: '20px', background: '#0a0a0a', padding: '10px', borderRadius: '15px', border: '1px solid #111' },
        broadcastInput: { flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '13px' },
        broadcastBtn: { background: '#f97316', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '10px', fontWeight: '900', fontSize: '10px', display:'flex', alignItems:'center', gap: '5px' },
        searchWrapper: { position: 'relative', marginBottom: '15px' },
        searchIcon: { position: 'absolute', left: '15px', top: '15px', color: '#444' },
        searchInput: { width: '100%', padding: '15px 15px 15px 45px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', color: 'white', outline: 'none' },
        list: { display: 'flex', flexDirection: 'column', gap: '8px' },
        item: { background: '#0a0a0a', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        itemName: { margin: 0, fontSize: '14px', fontWeight: '800' },
        metaRow: { display:'flex', gap:'15px', marginTop: '4px', alignItems:'center' },
        metaItem: { fontSize: '10px', color: '#444', fontWeight:'700' },
        detailsToggle: { background: 'none', border: 'none', color: '#3b82f6', fontSize: '10px', fontWeight:'900', padding: 0 },
        actionGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
        modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
        modalCard: { background: '#000', borderRadius: '25px', width: '90%', maxWidth: '400px', padding: '25px', border: '1px solid #222' },
        modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
        closeBtn: { background: 'none', border: 'none', color: 'white', fontSize: '24px' },
        infoBox: { background: '#0a0a0a', padding: '15px', borderRadius: '15px', fontSize: '13px', lineHeight: '2' },
        modalActionBtn: { flex: 1, color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: '900', fontSize: '11px' },
        centerText: { textAlign: 'center', color: '#444', marginTop: '40px', fontWeight:'900' }
    };

    const forceSync = useCallback(async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const [ownerRes, statsRes, maintRes] = await Promise.all([
                axios.get(`${API_URL}/api/superadmin/all-owners?t=${Date.now()}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/api/orders/all-count?t=${Date.now()}`),
                axios.get(`${API_URL}/api/superadmin/maintenance-status`)
            ]);
            setRestaurants(ownerRes.data);
            setIsMaintenance(maintRes.data.enabled);
            setStats(prev => ({
                ...prev,
                totalOrders: statsRes.data.count || 0,
                activeNow: Math.floor(Math.random() * 10) + 5 
            }));
        } catch (error) {
            console.error("Sync Failure");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        forceSync();
        const ticker = setInterval(forceSync, 30000);
        return () => clearInterval(ticker);
    }, [forceSync]);

    const healthMetrics = useMemo(() => {
        const proUsers = restaurants.filter(r => r.isPro);
        const trialUsers = restaurants.filter(r => !r.isPro);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const churned = restaurants.filter(r => !r.isPro && new Date(r.trialEndsAt) < sevenDaysAgo).length;

        return {
            mrr: proUsers.length * 999,
            activePro: proUsers.length,
            trialing: trialUsers.length,
            churnRate: restaurants.length > 0 ? ((churned / restaurants.length) * 100).toFixed(1) : 0
        };
    }, [restaurants]);

    const handleBroadcast = async () => {
        if (!broadcastMsg) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/broadcast`, { message: broadcastMsg }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            alert("Broadcast sent!");
            setBroadcastMsg("");
        } catch (e) { alert("Broadcast failed."); }
    };

    const toggleMaintenance = async () => {
        const confirm = window.confirm("Toggle Maintenance Mode?");
        if (!confirm) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/toggle-maintenance`, { enabled: !isMaintenance }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            setIsMaintenance(!isMaintenance);
        } catch (e) { alert("Action failed."); }
    };

    const handlePermanentDelete = async (ownerId, name) => {
        const confirm = window.prompt(`Type "PURGE" to destroy ${name}:`);
        if (confirm !== "PURGE") return;
        try {
            await axios.delete(`${API_URL}/api/superadmin/delete-owner/${ownerId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            setRestaurants(prev => prev.filter(r => r._id !== ownerId));
            setSelectedClient(null);
        } catch (err) { alert("Delete failed."); }
    };

    const handleManualUpgrade = async (ownerId) => {
        try {
            await axios.put(`${API_URL}/api/superadmin/manual-upgrade/${ownerId}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            alert("Account Upgraded!");
            forceSync();
            setSelectedClient(null);
        } catch (err) { alert("Upgrade failed."); }
    };

    const filteredRestaurants = useMemo(() => {
        const low = searchTerm.toLowerCase();
        return restaurants.filter(r => 
            r.restaurantName?.toLowerCase().includes(low) || r.username?.toLowerCase().includes(low)
        );
    }, [restaurants, searchTerm]);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.logo}><FaShieldAlt color="#f97316" /> CONTROL CENTER</h1>
                <div style={styles.headerRight}>
                    <button onClick={toggleMaintenance} style={{...styles.maintBtn, background: isMaintenance ? '#ef4444' : '#111'}}>
                        <FaTools /> {isMaintenance ? "SYSTEM OFF" : "SYSTEM LIVE"}
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate("/super-login"); }} style={styles.logoutBtn}>EXIT</button>
                </div>
            </header>

            <RevenueStats restaurants={restaurants} />

            <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>MRR (RECURRING)</p>
                    <h2 style={{...styles.metricValue, color:'#22c55e'}}>₹{healthMetrics.mrr.toLocaleString()}</h2>
                </div>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>CHURN (7D)</p>
                    <h2 style={{...styles.metricValue, color:'#ef4444'}}>{healthMetrics.churnRate}%</h2>
                </div>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>ACTIVE PRO</p>
                    <h2 style={styles.metricValue}>{healthMetrics.activePro}</h2>
                </div>
            </div>

            <div style={styles.broadcastBox}>
                <input style={styles.broadcastInput} placeholder="Global Broadcast..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                <button onClick={handleBroadcast} style={styles.broadcastBtn}><FaBroadcastTower /> SEND</button>
            </div>

            <div style={styles.searchWrapper}>
                <FaSearch style={styles.searchIcon} />
                <input placeholder="Search Network..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
            </div>

            <div style={styles.list}>
                {loading ? <div style={styles.centerText}><FaSpinner className="spin"/> SYNCING...</div> : 
                    filteredRestaurants.map(r => (
                        <div key={r._id} style={{...styles.item, borderLeft: `6px solid ${r.isPro ? '#f97316' : '#444'}`}}>
                            <div style={{ flex: 1 }}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <h3 style={styles.itemName}>{r.restaurantName}</h3>
                                    {r.isPro && <FaCrown color="#f97316" size={12}/>}
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaItem}><FaClock/> {new Date(r.createdAt).toLocaleDateString()}</span>
                                    <button onClick={() => setSelectedClient(r)} style={styles.detailsToggle}>SURVEILLANCE</button>
                                </div>
                            </div>
                            <div style={styles.actionGroup}>
                                <button onClick={() => setSelectedClient(r)} title="Cash Update"><FaMoneyBillWave color="#22c55e" size={18} /></button>
                                <button onClick={() => handlePermanentDelete(r._id, r.restaurantName)} title="Delete"><FaTrash color="#ef4444" size={16} /></button>
                            </div>
                        </div>
                    ))
                }
            </div>

            {selectedClient && (
                <div style={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
                    <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2>Manage: {selectedClient.username}</h2>
                            <button onClick={() => setSelectedClient(null)} style={styles.closeBtn}>×</button>
                        </div>
                        <div style={styles.infoBox}>
                            <p><strong>Total Revenue:</strong> ₹{selectedClient.totalRevenue || 0}</p>
                            <p><strong>Plan:</strong> {selectedClient.isPro ? 'PREMIUM' : 'TRIAL'}</p>
                        </div>
                        <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                            <button onClick={() => handleManualUpgrade(selectedClient._id)} style={{...styles.modalActionBtn, background:'#22c55e'}}>UPGRADE (PAID CASH)</button>
                            <button onClick={() => handlePermanentDelete(selectedClient._id, selectedClient.restaurantName)} style={{...styles.modalActionBtn, background:'#ef4444'}}>PURGE</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default SuperAdmin;