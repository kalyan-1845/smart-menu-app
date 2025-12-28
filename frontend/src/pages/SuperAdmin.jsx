import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  FaChartLine, FaCrown, FaEnvelope, FaStore, FaPlus, FaSync, 
  FaSignOutAlt, FaTimes, FaUser, FaLock, FaPhone, FaMagic, 
  FaEye, FaEyeSlash, FaChartBar, FaTrophy, FaShoppingCart, FaGlobe,
  FaMoneyBillWave, FaShieldAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// 🚀 SMART API SWITCHER
const getApiBase = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("192.168") || host.startsWith("10.") || host === "127.0.0.1") {
        return "http://localhost:5000";
    }
    return "https://smart-menu-backend-5ge7.onrender.com";
};

// --- SECURITY: AUTO-LOGOUT LOGIC ---
const useAutoLogout = (navigate) => {
    const timerRef = useRef(null);

    const logout = () => {
        sessionStorage.removeItem("isSuperAdmin"); // Destroy Key
        navigate("/ceo-login"); // Kick out
    };

    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        // 🔒 LOCK AFTER 5 MINUTES OF INACTIVITY
        timerRef.current = setTimeout(() => {
            alert("🔒 Session Expired: Dashboard Locked for Security.");
            logout();
        }, 5 * 60 * 1000); 
    };

    useEffect(() => {
        // Listen for ANY movement or click
        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("click", resetTimer);
        window.addEventListener("keypress", resetTimer);
        
        resetTimer(); // Start timer on load

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener("mousemove", resetTimer);
            window.removeEventListener("click", resetTimer);
            window.removeEventListener("keypress", resetTimer);
        };
    }, [navigate]);
};

// --- COMPONENT: ADD RESTAURANT MODAL ---
const AddRestaurantModal = ({ onClose, refreshList, BASE_URL }) => {
    const [formData, setFormData] = useState({ username: "", password: "", restaurantName: "", email: "", phone: "" });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const generatePassword = () => {
        const randomPass = Math.random().toString(36).slice(-8).toUpperCase();
        setFormData({ ...formData, password: `BB${randomPass}` });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${BASE_URL}/api/auth/register`, formData);
            const successMsg = `✅ Account Created!\n\nShop: ${formData.restaurantName}\nUser: ${formData.username}\nPass: ${formData.password}`;
            alert(successMsg);
            navigator.clipboard.writeText(successMsg);
            refreshList(); 
            onClose();     
        } catch (err) {
            alert("Failed: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header">
                    <h2>New Partner</h2>
                    <button onClick={onClose} className="close-btn"><FaTimes /></button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="input-group">
                        <label><FaStore /> Shop Name</label>
                        <input placeholder="e.g. Skyline Cafe" value={formData.restaurantName} onChange={e => setFormData({...formData, restaurantName: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label><FaUser /> Username</label>
                        <input placeholder="e.g. skylineadmin" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} required />
                    </div>
                    <div className="input-group">
                        <label><FaLock /> Password</label>
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} placeholder="Generate" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                            <button type="button" onClick={generatePassword} className="gen-btn"><FaMagic /></button>
                        </div>
                    </div>
                    <button type="submit" className="modal-submit" disabled={loading}>
                        {loading ? "Creating..." : "ACTIVATE"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENT: SALES CHARTS ---
const SalesSummary = ({ restaurants }) => {
    const sortedPerformers = useMemo(() => {
        return [...restaurants]
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 5);
    }, [restaurants]);
    const totalSystemRevenue = restaurants.reduce((acc, res) => acc + (res.totalRevenue || 0), 0);

    return (
        <div className="glass-panel" style={{borderLeft: '4px solid #f97316'}}>
            <div className="panel-header">
                <FaChartBar color="#f97316" /> <h2>REVENUE INTELLIGENCE</h2>
            </div>
            <div className="chart-container">
                {restaurants.slice(0, 10).map((res, i) => (
                    <div key={i} className="chart-bar-wrapper">
                        <div className="bar" style={{ height: `${Math.min(((res.totalRevenue || 0) / 1000) * 10, 80)}px`, backgroundColor: i % 2 === 0 ? '#22c55e' : '#f97316' }}></div>
                        <span className="bar-label">{res.restaurantName?.substring(0, 4)}</span>
                    </div>
                ))}
            </div>
            <div className="performer-metrics">
                <div>
                     <h4 style={{margin:'0 0 10px 0', fontSize:'12px', color:'#888'}}>TOP EARNERS</h4>
                     {sortedPerformers.map((res, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'5px', color:'#aaa'}}>
                            <span>{i+1}. {res.restaurantName}</span>
                            <strong style={{color:'white'}}>₹{res.totalRevenue}</strong>
                        </div>
                     ))}
                </div>
                <div style={{textAlign:'right', borderLeft:'1px solid #222', paddingLeft:'15px'}}>
                    <p style={{fontSize:'10px', color:'#666', fontWeight:'bold'}}>TOTAL SYSTEM REVENUE</p>
                    <h3 style={{fontSize:'24px', margin:'5px 0 0 0'}}>₹{totalSystemRevenue.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENT: SUBSCRIPTION LIST ---
const SubscriptionList = ({ restaurants, handleActivatePro, copyLoginLink }) => {
    return (
        <div className="glass-panel">
            <h2 style={{fontSize:'16px', marginBottom:'15px'}}>Subscription Management</h2>
            <div className="sub-list">
                {restaurants.map(r => (
                    <div key={r._id} className="sub-item">
                        <div>
                            <strong>{r.restaurantName}</strong>
                            <p style={{fontSize:'10px', color: r.isPro ? '#22c55e' : '#888'}}>{r.isPro ? 'PREMIUM' : 'TRIAL'}</p>
                        </div>
                        <div style={{display:'flex', gap:'5px'}}>
                            <button onClick={() => copyLoginLink(r.username)} className="icon-btn-small"><FaCopy /></button>
                            <button onClick={() => handleActivatePro(r._id, 30)} className="action-btn">
                                <FaMoneyBillWave /> +30 Days
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN PAGE ---
const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [msg, setMsg] = useState({ title: "", content: "" });

  const BASE_URL = getApiBase();

  // 🛡️ ACTIVATE AUTO-LOGOUT
  useAutoLogout(navigate);

  useEffect(() => {
    // 🛡️ STRICT ENTRY CHECK
    const isSuperAdmin = sessionStorage.getItem("isSuperAdmin");
    if (!isSuperAdmin) { 
        navigate("/ceo-login"); 
        return; 
    }
    
    fetchData();
    
    // Setup Socket
    const socket = io(BASE_URL);
    socket.emit("join-super-admin");
    socket.on("global-new-order", (order) => {
        setGlobalOrders(prev => [order, ...prev].slice(0, 10));
    });
    return () => socket.disconnect();
  }, [navigate, BASE_URL]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/api/superadmin/restaurants`); 
      setRestaurants(res.data);
    } catch (error) { console.error("Fetch Error", error); }
    setLoading(false);
  };

  const handleActivatePro = async (id, days) => {
    if(!window.confirm(`Activate ${days} days PRO?`)) return;
    try {
        await axios.put(`${BASE_URL}/api/superadmin/update-subscription/${id}`, { isPro: true, extendDays: days });
        alert("Success!");
        fetchData();
    } catch (e) { alert("Error"); }
  };

  const sendBroadcast = async () => {
      if(!msg.title) return;
      try {
          await axios.post(`${BASE_URL}/api/broadcast/send`, msg);
          alert("Sent!");
          setMsg({ title: "", content: "" });
      } catch(e) { alert("Error"); }
  }

  const copyLoginLink = (username) => {
    const url = `${window.location.origin}/login`;
    navigator.clipboard.writeText(`Dashboard: ${url}\nUser: ${username}`);
    alert("Copied!");
  }

  return (
    <div className="superadmin-container">
      <style>{styles}</style>

      {showAddModal && <AddRestaurantModal onClose={() => setShowAddModal(false)} refreshList={fetchData} BASE_URL={BASE_URL} />}

      {/* TOP BAR */}
      <nav className="ceo-nav">
        <div className="brand">
          <FaShieldAlt color="#f97316" size={18} />
          <span>SECURE CEO PANEL</span>
        </div>
        <div className="nav-actions">
           <button onClick={() => setShowAddModal(true)} className="icon-btn-primary"><FaPlus /></button>
           <button onClick={fetchData} className="icon-btn"><FaSync className={loading ? 'spin' : ''} /></button>
           {/* LOGOUT DESTROYS SESSION */}
           <button onClick={() => { sessionStorage.clear(); navigate("/ceo-login"); }} className="icon-btn red-btn"><FaSignOutAlt /></button>
        </div>
      </nav>

      <div className="dashboard-content">
          {/* TAB CONTENT */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                    <FaStore color="#f97316"/>
                    <div><h3>{restaurants.length}</h3><p>Clients</p></div>
                </div>
                <div className="stat-card">
                    <FaShoppingCart color="#22c55e"/>
                    <div><h3>{globalOrders.length}</h3><p>Live Orders</p></div>
                </div>
              </div>
              
              <SalesSummary restaurants={restaurants} />
              
              <div className="glass-panel">
                  <h2 style={{fontSize:'16px', marginBottom:'10px'}}>Live Feed</h2>
                  <div className="order-ticker">
                    {globalOrders.length === 0 ? <p style={{color:'#666', fontSize:'12px'}}>No active orders...</p> : 
                      globalOrders.map((o, i) => (
                        <div key={i} className="ticker-item">
                            <span style={{color:'#f97316', fontWeight:'bold'}}>{o.restaurantName}</span>
                            <span>₹{o.totalAmount}</span>
                        </div>
                      ))
                    }
                  </div>
              </div>
            </>
          )}

          {activeTab === 'billing' && (
             <SubscriptionList restaurants={restaurants} handleActivatePro={handleActivatePro} copyLoginLink={copyLoginLink} />
          )}

          {activeTab === 'broadcast' && (
             <div className="glass-panel">
                <h2>Alert All</h2>
                <input placeholder="Title" value={msg.title} onChange={e => setMsg({...msg, title: e.target.value})} className="msg-input" />
                <textarea placeholder="Message..." value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})} className="msg-box" />
                <button onClick={sendBroadcast} className="ceo-btn">SEND ALERT</button>
             </div>
          )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="bottom-nav">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
              <FaChartLine /><span>Stats</span>
          </button>
          <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}>
              <FaCrown /><span>Billing</span>
          </button>
          <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}>
              <FaEnvelope /><span>Alerts</span>
          </button>
      </div>
    </div>
  );
};

// --- CSS STYLES ---
const styles = `
.superadmin-container { background: #050505; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; padding-bottom: 80px; }
.ceo-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; background: #0a0a0a; border-bottom: 1px solid #222; position: sticky; top: 0; z-index: 50; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; }
.nav-actions { display: flex; gap: 10px; }

.dashboard-content { padding: 20px; max-width: 800px; margin: 0 auto; }

/* STATS GRID */
.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
.stat-card { background: #111; padding: 20px; border-radius: 16px; display: flex; align-items: center; gap: 15px; border: 1px solid #222; }
.stat-card h3 { margin: 0; font-size: 20px; }
.stat-card p { margin: 0; font-size: 11px; color: #888; text-transform: uppercase; }

/* PANELS */
.glass-panel { background: #111; padding: 20px; border-radius: 20px; border: 1px solid #222; margin-bottom: 20px; }
.panel-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
.panel-header h2 { margin: 0; font-size: 14px; font-weight: 900; }

/* CHARTS */
.chart-container { display: flex; align-items: flex-end; gap: 8px; height: 80px; margin-bottom: 15px; }
.chart-bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
.bar { width: 8px; border-radius: 4px; transition: height 0.5s; }
.bar-label { font-size: 7px; color: #666; margin-top: 5px; }
.performer-metrics { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; border-top: 1px solid #222; padding-top: 15px; }

/* LISTS */
.sub-list { display: flex; flex-direction: column; gap: 10px; }
.sub-item { background: #050505; padding: 12px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #222; }
.action-btn { background: #1a1a1a; color: #22c55e; border: 1px solid #22c55e44; padding: 8px 12px; border-radius: 8px; font-size: 10px; font-weight: bold; cursor: pointer; display: flex; gap: 5px; align-items: center; }
.order-ticker { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
.ticker-item { display: flex; justify-content: space-between; font-size: 12px; padding: 8px; background: #000; border-radius: 8px; }

/* BUTTONS */
.icon-btn { background: #1a1a1a; border: 1px solid #333; color: #888; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-btn-primary { background: #f97316; border: none; color: black; width: 35px; height: 35px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-btn-small { background: #111; border: 1px solid #333; color: #888; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
.red-btn { color: #ef4444; border-color: #331111; }
.ceo-btn { width: 100%; padding: 12px; background: #f97316; color: black; border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
.msg-input, .msg-box { width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: white; border-radius: 10px; margin-bottom: 10px; outline: none; }
.msg-box { min-height: 80px; }

/* BOTTOM NAV (MOBILE) */
.bottom-nav { position: fixed; bottom: 0; left: 0; width: 100%; background: #0a0a0a; border-top: 1px solid #222; display: flex; justify-content: space-around; padding: 10px 0; z-index: 100; }
.bottom-nav button { background: none; border: none; color: #666; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; cursor: pointer; }
.bottom-nav button.active { color: #f97316; }
.bottom-nav button svg { font-size: 18px; }

/* MODAL */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-card { background: #111; padding: 25px; border-radius: 20px; width: 100%; max-width: 400px; border: 1px solid #333; }
.modal-header { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: center; }
.modal-header h2 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; color: #666; font-size: 20px; }
.input-group { margin-bottom: 15px; }
.input-group label { display: block; font-size: 10px; color: #f97316; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
.input-group input { width: 100%; padding: 12px; background: #000; border: 1px solid #333; color: white; border-radius: 10px; outline: none; }
.password-wrapper { display: flex; gap: 8px; }
.eye-btn, .gen-btn { background: #222; border: 1px solid #333; color: #888; width: 40px; border-radius: 10px; cursor: pointer; }
.modal-submit { width: 100%; padding: 14px; background: #f97316; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; margin-top: 10px; }

/* DESKTOP TWEAKS */
@media (min-width: 768px) {
    .bottom-nav { display: none; }
    .dashboard-content { display: block; max-width: 900px; }
}
`;

export default SuperAdmin;