import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
    FaTrash, FaSearch, FaSignOutAlt, FaBroadcastTower, FaShieldAlt,
    FaClock, FaSpinner, FaTools, FaCrown, FaMoneyBillWave, FaChartBar
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
    const navigate = useNavigate();
    const [restaurants, setRestaurants] = useState([]);
    const [globalOrderCount, setGlobalOrderCount] = useState(0);
    const [isMaintenance, setIsMaintenance] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClient, setSelectedClient] = useState(null);
    const [broadcastMsg, setBroadcastMsg] = useState("");

    // ✅ FORCE SYNC: Fetches all critical SaaS data at once
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
            setGlobalOrderCount(statsRes.data.count || 0);
            setIsMaintenance(maintRes.data.enabled);
        } catch (error) {
            console.error("Master Sync Failure");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        forceSync();
        const ticker = setInterval(forceSync, 30000); // Auto-refresh every 30s
        return () => clearInterval(ticker);
    }, [forceSync]);

    // 📊 SaaS Health Intelligence
    const metrics = useMemo(() => {
        const totalMRR = restaurants.filter(r => r.isPro).length * 999;
        return {
            mrr: totalMRR,
            proCount: restaurants.filter(r => r.isPro).length,
            trialCount: restaurants.filter(r => !r.isPro).length
        };
    }, [restaurants]);

    const handleBroadcast = async () => {
        if (!broadcastMsg) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/broadcast`, { message: broadcastMsg }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Global Message Broadcasted!");
            setBroadcastMsg("");
        } catch (e) { toast.error("Broadcast failed."); }
    };

    const toggleMaintenance = async () => {
        const confirm = window.confirm("Toggle Global Maintenance Mode?");
        if (!confirm) return;
        try {
            await axios.post(`${API_URL}/api/superadmin/toggle-maintenance`, { enabled: !isMaintenance }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            setIsMaintenance(!isMaintenance);
            toast.success("System Status Updated");
        } catch (e) { toast.error("Action failed."); }
    };

    const handleManualUpgrade = async (ownerId) => {
        try {
            await axios.put(`${API_URL}/api/superadmin/manual-upgrade/${ownerId}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` }
            });
            toast.success("Account Promoted to PRO");
            forceSync();
            setSelectedClient(null);
        } catch (err) { toast.error("Upgrade failed."); }
    };

    const filteredList = restaurants.filter(r => 
        r.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.logo}><FaShieldAlt color="#f97316" /> SaaS MASTER</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={toggleMaintenance} style={{...styles.maintBtn, background: isMaintenance ? '#ef4444' : '#111'}}>
                        <FaTools /> {isMaintenance ? "OFFLINE" : "LIVE"}
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate("/super-login"); }} style={styles.logoutBtn}><FaSignOutAlt/></button>
                </div>
            </header>

            {/* 📈 REAL-TIME GLOBAL METRICS */}
            <div style={styles.metricsGrid}>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>TOTAL NETWORK ORDERS</p>
                    <h2 style={styles.metricValue}>{globalOrderCount.toLocaleString()}</h2>
                </div>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>EST. MRR</p>
                    <h2 style={{...styles.metricValue, color:'#22c55e'}}>₹{metrics.mrr.toLocaleString()}</h2>
                </div>
                <div style={styles.metricCard}>
                    <p style={styles.metricLabel}>PRO / TRIAL</p>
                    <h2 style={styles.metricValue}>{metrics.proCount} / {metrics.trialCount}</h2>
                </div>
            </div>

            <div style={styles.broadcastBox}>
                <input style={styles.broadcastInput} placeholder="Push notification to all staff..." value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} />
                <button onClick={handleBroadcast} style={styles.broadcastBtn}><FaBroadcastTower /></button>
            </div>

            <div style={styles.searchWrapper}>
                <FaSearch style={styles.searchIcon} />
                <input placeholder="Search restaurants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={styles.searchInput} />
            </div>

            <div style={styles.list}>
                {loading ? <div style={styles.centerText}><FaSpinner className="spin"/> SYNCING NODES...</div> : 
                    filteredList.map(r => (
                        <div key={r._id} style={{...styles.item, borderLeft: `4px solid ${r.isPro ? '#f97316' : '#333'}`}}>
                            <div style={{ flex: 1 }}>
                                <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                    <span style={styles.itemName}>{r.restaurantName}</span>
                                    {r.isPro && <FaCrown color="#f97316" size={10}/>}
                                </div>
                                <div style={styles.metaRow}>
                                    <span style={styles.metaItem}><FaClock/> {new Date(r.createdAt).toLocaleDateString()}</span>
                                    <span style={styles.metaItem}><FaChartBar/> ₹{r.totalRevenue || 0}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedClient(r)} style={styles.actionBtn}><FaMoneyBillWave color="#22c55e" /></button>
                        </div>
                    ))
                }
            </div>

            {/* 🛠️ CLIENT MANAGEMENT MODAL */}
            {selectedClient && (
                <div style={styles.modalOverlay} onClick={() => setSelectedClient(null)}>
                    <div style={styles.modalCard} onClick={e => e.stopPropagation()}>
                        <h2 style={{marginBottom:'10px'}}>Manage {selectedClient.username}</h2>
                        <div style={styles.infoBox}>
                            <p>Current Revenue: <b>₹{selectedClient.totalRevenue || 0}</b></p>
                            <p>Status: <b>{selectedClient.isPro ? 'PREMIUM' : 'FREE TRIAL'}</b></p>
                        </div>
                        <div style={{display:'flex', gap:'10px', marginTop:'20px'}}>
                            <button onClick={() => handleManualUpgrade(selectedClient._id)} style={{...styles.modalActionBtn, background:'#22c55e'}}>UPGRADE TO PRO</button>
                            <button onClick={() => setSelectedClient(null)} style={{...styles.modalActionBtn, background:'#333'}}>CLOSE</button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "15px", fontFamily: "'Inter', sans-serif" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" },
    logo: { fontSize: '12px', fontWeight: '900', letterSpacing:'1px' },
    maintBtn: { border: '1px solid #222', color: 'white', padding: '10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', display:'flex', alignItems:'center', gap:'8px', cursor:'pointer' },
    logoutBtn: { background: "#ef4444", border: "none", color: "white", padding: '10px', borderRadius: "12px" },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' },
    metricCard: { background: '#0a0a0a', border: '1px solid #111', padding: '12px', borderRadius: '16px' },
    metricLabel: { margin: 0, fontSize: '7px', color: '#444', fontWeight: '900' },
    metricValue: { margin: 0, fontSize: '14px', fontWeight: '900', marginTop: '4px' },
    broadcastBox: { display: 'flex', gap: '10px', marginBottom: '20px', background: '#0a0a0a', padding: '8px', borderRadius: '15px', border: '1px solid #111' },
    broadcastInput: { flex: 1, background: 'transparent', border: 'none', color: 'white', outline: 'none', fontSize: '12px', paddingLeft:'10px' },
    broadcastBtn: { background: '#f97316', border: 'none', color: 'white', padding: '10px 15px', borderRadius: '10px' },
    searchWrapper: { position: 'relative', marginBottom: '20px' },
    searchIcon: { position: 'absolute', left: '15px', top: '15px', color: '#444' },
    searchInput: { width: '100%', padding: '15px 15px 15px 40px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '14px', color: 'white', outline: 'none' },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    item: { background: '#0a0a0a', padding: '15px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border:'1px solid #111' },
    itemName: { fontSize: '13px', fontWeight: '800' },
    metaRow: { display:'flex', gap:'12px', marginTop: '4px' },
    metaItem: { fontSize: '9px', color: '#444', fontWeight:'700', display:'flex', alignItems:'center', gap:'4px' },
    actionBtn: { background: 'none', border: 'none', padding: '10px', cursor:'pointer' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter:'blur(10px)' },
    modalCard: { background: '#0a0a0a', borderRadius: '28px', width: '90%', maxWidth: '350px', padding: '25px', border: '1px solid #222' },
    infoBox: { background: '#000', padding: '15px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.8' },
    modalActionBtn: { flex: 1, color: 'white', border: 'none', padding: '15px', borderRadius: '14px', fontWeight: '900', fontSize: '11px' },
    centerText: { textAlign: 'center', color: '#333', marginTop: '50px', fontWeight:'900', fontSize:'12px' }
};

export default SuperAdmin;