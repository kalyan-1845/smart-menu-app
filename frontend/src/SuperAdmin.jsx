import React, { useEffect, useState } from "react";
import axios from "axios";
import { 
    FaUserShield, FaStore, FaChartLine, FaUsers, FaCrown, FaBullhorn, 
    FaComments, FaMoneyBillWave 
} from "react-icons/fa";

// --- INLINE CSS STYLES ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');

/* --- GLOBAL & LOGIN --- */
.register-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Inter', sans-serif;
  color: #fff;
  background: radial-gradient(circle at 50% -10%, #5e2615 0%, #1a0a05 40%, #050505 100%);
  padding: 20px;
}

/* --- GLASS CARD (Used for Login & Create Form) --- */
.register-card {
  width: 100%;
  max-width: 450px;
  padding: 40px 30px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
  position: relative;
  overflow: hidden;
  margin: 0 auto; 
}

.register-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.5), transparent);
}

/* --- TYPOGRAPHY --- */
.title { font-size: 28px; font-weight: 700; text-align: center; margin: 10px 0 5px; letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
.subtitle { color: #a1a1aa; text-align: center; font-size: 14px; margin-bottom: 30px; font-weight: 400; }
.rocket-icon { font-size: 30px; display: block; text-align: center; margin-bottom: 10px; filter: drop-shadow(0 0 15px rgba(249, 115, 22, 0.6)); }

/* --- INPUTS --- */
.input-group { margin-bottom: 20px; }
.input-label { display: block; font-size: 13px; color: #d4d4d8; margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
.form-input {
  width: 100%; padding: 14px 16px; border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.4);
  color: #fff; font-size: 15px; outline: none;
  transition: all 0.3s ease; box-sizing: border-box;
}
.form-input:focus { border-color: #f97316; background: rgba(0, 0, 0, 0.6); box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.1); }
.input-locked { background: rgba(255, 255, 255, 0.03); color: #71717a; border-color: transparent; cursor: not-allowed; }

/* --- BUTTONS --- */
.submit-btn {
  width: 100%; padding: 16px; margin-top: 10px; border: none; border-radius: 16px;
  font-size: 16px; font-weight: 700; color: white; cursor: pointer;
  background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
  box-shadow: 0 4px 20px rgba(234, 88, 12, 0.4), inset 0 1px 0 rgba(255,255,255,0.2);
  transition: transform 0.2s; position: relative; overflow: hidden;
}
.submit-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(234, 88, 12, 0.5); }
.submit-btn:active { transform: translateY(0); }
.submit-btn:disabled { background: #444; cursor: not-allowed; color: #888; }

/* --- DASHBOARD SPECIFIC --- */
.dashboard-container { min-height: 100vh; background: #050505; color: white; padding: 20px; font-family: 'Inter', sans-serif; }
.dash-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid #222; margin-bottom: 30px; }
.dash-title { font-size: 24px; font-weight: 900; text-transform: uppercase; color: #fff; }
.logout-btn { background: #1a1a1a; color: #ef4444; border: 1px solid #333; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; }

/* Stats Grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
.stat-card { background: #111; padding: 25px; border-radius: 24px; border: 1px solid #222; }
.stat-val { font-size: 32px; font-weight: 900; color: white; }
.stat-label { font-size: 11px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }

/* Table */
.table-container { background: #0a0a0a; border-radius: 24px; border: 1px solid #222; overflow-x: auto; margin-top: 40px; }
.admin-table { width: 100%; text-align: left; border-collapse: collapse; }
.admin-table th { background: #111; padding: 20px; font-size: 10px; text-transform: uppercase; color: #666; letter-spacing: 1px; font-weight: 900; }
.admin-table td { padding: 20px; border-bottom: 1px solid #1a1a1a; font-size: 14px; font-weight: 600; vertical-align: middle; }
.admin-table tr:hover { background: rgba(255,255,255,0.02); }

/* Tabs */
.nav-tabs { display: flex; gap: 10px; margin-bottom: 30px; overflow-x: auto; }
.tab-btn { padding: 12px 24px; border-radius: 12px; font-size: 12px; font-weight: 800; text-transform: uppercase; border: 1px solid #222; background: #111; color: #666; cursor: pointer; }
.tab-btn.active { background: #f97316; color: white; border-color: #f97316; }

/* Extend Button */
.btn-extend { background: #22c55e; color: black; border: none; padding: 8px 16px; borderRadius: 8px; font-weight: 900; cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 6px; margin-top: 5px; }
.btn-extend:hover { transform: scale(1.05); }
`;

const SuperAdmin = () => {
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

    // --- STATE ---
    const [activeTab, setActiveTab] = useState("dashboard"); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [owners, setOwners] = useState([]);
    
    // Create New Restaurant State
    const [regData, setRegData] = useState({ restaurantName: "", username: "", password: "" });

    // Login Inputs
    const [usernameInput, setUsernameInput] = useState("");
    const [passwordInput, setPasswordInput] = useState("");

    // Support & Broadcast State
    const [tickets, setTickets] = useState([]);
    const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", type: "UPDATE" });

    // Stats
    const [stats, setStats] = useState({ totalClients: 0, proClients: 0, mrr: 0 });

    const ADMIN_USERNAME = "srinivas";
    const ADMIN_PASSWORD = "srividya"; 

    // --- EFFECTS ---
    useEffect(() => {
        if (isAuthenticated) {
            if(activeTab === "dashboard") {
                fetchOwners();
                fetchStats();
            }
            if(activeTab === "support") fetchTickets();
        }
    }, [isAuthenticated, activeTab]);

    // --- LOGIC ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (usernameInput === ADMIN_USERNAME && passwordInput === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            alert("❌ Access Denied");
        }
    };

    const fetchOwners = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/superadmin/all-owners`);
            setOwners(res.data);
        } catch (error) { console.error("Fetch Error", error); } 
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE}/superadmin/platform-stats`);
            setStats(res.data);
        } catch (e) {}
    };

    // Auto-generate ID from Name
    const handleNameChange = (e) => {
        const rawName = e.target.value;
        const cleanId = rawName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        setRegData({ ...regData, restaurantName: rawName, username: cleanId });
    };

    const handleCreateOwner = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API_BASE}/auth/register`, {
                restaurantName: regData.restaurantName,
                username: regData.username,
                email: `${regData.username}@smartmenu.com`,
                password: regData.password
            });
            alert(`✅ PARTNER CREATED!\n\nID: ${regData.username}\nPass: ${regData.password}`);
            setRegData({ restaurantName: "", username: "", password: "" });
            fetchOwners();
        } catch (error) {
            alert("❌ Creation Failed. ID might be taken.");
        } finally {
            setLoading(false);
        }
    };

    // ⚡ EXTENSION LOGIC
    const handleExtend = async (owner) => {
        const confirmMsg = `
        💰 CASH COLLECTION CONFIRMATION
        --------------------------------
        Restaurant: ${owner.restaurantName}
        Action: Extend Validity by 1 Month
        
        Did you collect ₹999 Cash?
        `;

        if (!window.confirm(confirmMsg)) return;

        try {
            await axios.put(`${API_BASE}/superadmin/extend/${owner._id}`);
            alert("✅ SUCCESS! Plan extended by 30 days.");
            fetchOwners();
        } catch (e) {
            alert("❌ Error extending plan.");
        }
    };

    // Support Logic
    const fetchTickets = async () => {
        try { const res = await axios.get(`${API_BASE}/support/all`); setTickets(res.data); } catch (e) {}
    };

    // Broadcast Logic
    const handleBroadcast = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/broadcast/send`, broadcastForm);
            alert("📢 Broadcast Sent!");
            setBroadcastForm({ title: "", message: "", type: "UPDATE" });
        } catch (e) { alert("Failed"); }
    };

    // --- 1. LOGIN SCREEN ---
    if (!isAuthenticated) {
        return (
            <>
                <style>{styles}</style>
                <div className="register-container">
                    <div className="register-card">
                        <div className="rocket-icon"><FaUserShield style={{color: '#f97316'}} /></div>
                        <h1 className="title">Super Admin</h1>
                        <p className="subtitle">Secure Network Access Protocol</p>
                        
                        <form onSubmit={handleLogin}>
                            <div className="input-group">
                                <label className="input-label">Admin ID</label>
                                <input type="text" className="form-input" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Pass Key</label>
                                <input type="password" className="form-input" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                            </div>
                            <button className="submit-btn">Decrypt Access 🔓</button>
                        </form>
                    </div>
                </div>
            </>
        );
    }

    // --- 2. MAIN DASHBOARD ---
    return (
        <>
            <style>{styles}</style>
            <div className="dashboard-container">
                <header className="dash-header">
                    <div>
                        <h1 className="dash-title"><FaCrown style={{color:'#f97316', marginRight:'10px'}}/> Master Control</h1>
                        <p style={{fontSize:'11px', color:'#666', marginTop:'5px', fontWeight:'bold'}}>SYSTEM V2.8 • ONLINE</p>
                    </div>
                    <button onClick={() => setIsAuthenticated(false)} className="logout-btn">LOCK SYSTEM</button>
                </header>

                <nav className="nav-tabs">
                    <button onClick={() => setActiveTab("dashboard")} className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}><FaStore/> Dashboard</button>
                    <button onClick={() => setActiveTab("support")} className={`tab-btn ${activeTab === "support" ? "active" : ""}`}><FaComments/> Support</button>
                    <button onClick={() => setActiveTab("broadcast")} className={`tab-btn ${activeTab === "broadcast" ? "active" : ""}`}><FaBullhorn/> Broadcast</button>
                </nav>

                {/* === TAB: DASHBOARD === */}
                {activeTab === "dashboard" && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <p className="stat-label"><FaChartLine/> Monthly Revenue</p>
                                <p className="stat-val" style={{color:'#22c55e'}}>₹{stats.mrr?.toLocaleString()}</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label"><FaUsers/> Active Partners</p>
                                <p className="stat-val" style={{color:'#3b82f6'}}>{stats.totalClients}</p>
                            </div>
                            <div className="stat-card">
                                <p className="stat-label"><FaCrown/> Pro Users</p>
                                <p className="stat-val" style={{color:'#f97316'}}>{stats.proClients}</p>
                            </div>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '40px', alignItems: 'start'}}>
                            
                            {/* --- CREATE NEW RESTAURANT FORM --- */}
                            <div>
                                <div className="register-card" style={{margin: 0}}>
                                    <div className="rocket-icon">🚀</div>
                                    <h1 className="title" style={{fontSize:'22px'}}>Onboard Partner</h1>
                                    <p className="subtitle" style={{marginBottom:'20px'}}>Create new restaurant license.</p>

                                    <form onSubmit={handleCreateOwner}>
                                        <div className="input-group">
                                            <label className="input-label">Restaurant Name</label>
                                            <input type="text" className="form-input" placeholder="e.g. Urban Grill" value={regData.restaurantName} onChange={handleNameChange} required />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Generated ID</label>
                                            <input type="text" className="form-input input-locked" value={regData.username} readOnly />
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Assign Password</label>
                                            <input type="text" className="form-input" placeholder="Set a strong password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} required />
                                        </div>
                                        <button className="submit-btn" disabled={loading}>
                                            {loading ? "Creating..." : "Generate License ⚡"}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* --- PARTNER LIST --- */}
                            <div className="table-container" style={{marginTop:0}}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Client Details</th>
                                            <th>Plan Status</th>
                                            <th>Validity</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {owners.map(owner => (
                                            <tr key={owner._id}>
                                                <td>
                                                    <p style={{color:'white', fontSize:'15px'}}>{owner.restaurantName}</p>
                                                    <p style={{color:'#666', fontSize:'11px', marginTop:'2px'}}>ID: {owner.username}</p>
                                                </td>
                                                <td>
                                                    <span style={{padding:'4px 10px', borderRadius:'20px', background: owner.isPro ? 'rgba(249, 115, 22, 0.2)' : '#111', color: owner.isPro ? '#f97316' : '#666', fontSize:'10px'}}>
                                                        {owner.isPro ? "PRO" : "TRIAL"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <p style={{color: owner.daysLeft <= 5 ? '#ef4444' : '#22c55e', fontWeight:'bold'}}>
                                                        {owner.daysLeft < 0 ? "⚠️ EXPIRED" : `${owner.daysLeft} Days`}
                                                    </p>
                                                    <p style={{color:'#666', fontSize:'10px'}}>
                                                        Exp: {new Date(owner.trialEndsAt).toLocaleDateString()}
                                                    </p>
                                                </td>
                                                <td>
                                                    <button onClick={() => handleExtend(owner)} className="btn-extend">
                                                        <FaMoneyBillWave /> EXTEND
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* === TAB: SUPPORT === */}
                {activeTab === "support" && (
                    <div className="register-card" style={{maxWidth:'800px', margin:'0 auto'}}>
                        <h2 className="title" style={{fontSize:'20px', textAlign:'left'}}>Support Inbox</h2>
                        {tickets.length === 0 ? <p className="subtitle">No open tickets.</p> : (
                            <div style={{marginTop:'20px'}}>
                                {tickets.map(t => (
                                    <div key={t._id} style={{background:'#111', padding:'15px', borderRadius:'15px', marginBottom:'10px', border:'1px solid #222'}}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                            <h3 style={{fontWeight:'bold', color:'white'}}>{t.subject}</h3>
                                            <span style={{fontSize:'10px', color:'#666'}}>{t.restaurantName}</span>
                                        </div>
                                        <p style={{fontSize:'13px', color:'#aaa', marginTop:'5px'}}>{t.messages[t.messages.length-1]?.text}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* === TAB: BROADCAST === */}
                {activeTab === "broadcast" && (
                    <div className="register-card">
                        <div className="rocket-icon"><FaBullhorn/></div>
                        <h1 className="title">System Broadcast</h1>
                        <p className="subtitle">Send alerts to all connected restaurants.</p>
                        
                        <form onSubmit={handleBroadcast}>
                            <div className="input-group">
                                <label className="input-label">Title</label>
                                <input className="form-input" value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Message</label>
                                <textarea className="form-input" style={{height:'100px', resize:'none'}} value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} />
                            </div>
                            <button className="submit-btn">Send Announcement 🚀</button>
                        </form>
                    </div>
                )}

            </div>
        </>
    );
};

export default SuperAdmin;