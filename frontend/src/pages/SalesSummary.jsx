import React, { useState, useEffect, useMemo } from "react";
import { 
  FaTrash, FaClock, FaKey, FaSearch, FaStore, FaSignOutAlt, 
  FaPlus, FaChartLine, FaEnvelope, FaShieldAlt, FaUsers, 
  FaArrowRight, FaCrown, FaGlobe, FaShoppingCart, FaTrophy, 
  FaSync, FaCopy, FaTimes, FaMagic, FaEye, FaEyeSlash, 
  FaUser, FaPhone, FaLock, FaChartBar 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// 🚀 1. SMART API SWITCHER
const getApiBase = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("192.168") || host.startsWith("10.") || host === "127.0.0.1") {
        return "http://localhost:5000";
    }
    return "https://smart-menu-backend-5ge7.onrender.com";
};

// 🚀 2. ADD RESTAURANT MODAL COMPONENT
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
                    <h2>Onboard New Partner</h2>
                    <button onClick={onClose} className="close-btn"><FaTimes /></button>
                </div>
                <p className="modal-sub">Setup login credentials for the restaurant owner.</p>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="input-group">
                        <label><FaStore /> Restaurant Name</label>
                        <input placeholder="e.g. Skyline Cafe" value={formData.restaurantName} onChange={e => setFormData({...formData, restaurantName: e.target.value})} required />
                    </div>
                    <div className="input-group">
                        <label><FaUser /> Login Username</label>
                        <input placeholder="e.g. skylineadmin" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})} required />
                    </div>
                    <div className="input-group">
                        <label><FaLock /> Password</label>
                        <div className="password-wrapper">
                            <input type={showPassword ? "text" : "password"} placeholder="Click Generate" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="eye-btn">{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                            <button type="button" onClick={generatePassword} className="gen-btn" title="Generate"><FaMagic /></button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label><FaPhone /> Contact (Optional)</label>
                        <input placeholder="Mobile Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <button type="submit" className="modal-submit" disabled={loading}>
                        {loading ? "Creating..." : "ACTIVATE ACCOUNT"}
                    </button>
                </form>
            </div>
        </div>
    );
};

// 🚀 3. SALES CHART COMPONENT (YOUR NEW FEATURE)
const SalesSummary = ({ restaurants }) => {
    // Logic to find top earning restaurants
    const sortedPerformers = useMemo(() => {
        return [...restaurants]
            .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
            .slice(0, 5);
    }, [restaurants]);

    const totalSystemRevenue = restaurants.reduce((acc, res) => acc + (res.totalRevenue || 0), 0);

    return (
        <div className="glass-panel" style={{ borderLeft: '5px solid #f97316', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <FaChartBar color="#f97316" /> <h2 style={{margin:0, fontSize:'18px'}}>SALES PERFORMANCE</h2>
            </div>

            <div className="chart-container">
                {restaurants.slice(0, 10).map((res, i) => (
                    <div key={i} className="chart-bar-wrapper">
                        <div className="bar" style={{ height: `${Math.min(((res.totalRevenue || 0) / 1000) * 10, 100)}px`, backgroundColor: i % 2 === 0 ? '#22c55e' : '#f97316' }}></div>
                        <span className="bar-label">{res.restaurantName?.substring(0, 5)}</span>
                    </div>
                ))}
            </div>

            <div className="performer-metrics">
                <div>
                    <h4 style={{margin:'0 0 10px 0', fontSize:'12px'}}><FaTrophy color="#FFD700" /> TOP PERFORMERS</h4>
                    {sortedPerformers.map((res, i) => (
                        <div key={i} style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'#888', marginBottom:'5px'}}>
                            <span>{i+1}. {res.restaurantName}</span>
                            <strong style={{color:'white'}}>₹{res.totalRevenue || 0}</strong>
                        </div>
                    ))}
                </div>
                <div style={{textAlign:'right'}}>
                    <p style={{fontSize:'10px', color:'#666', fontWeight:'900', margin:0}}>TOTAL SYSTEM REVENUE</p>
                    <h3 style={{fontSize:'28px', margin:'5px 0 0 0'}}>₹{totalSystemRevenue.toLocaleString()}</h3>
                </div>
            </div>
        </div>
    );
};

// 🚀 4. MAIN SUPER ADMIN DASHBOARD
const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [msg, setMsg] = useState({ title: "", content: "" });

  const BASE_URL = getApiBase();

  useEffect(() => {
    // Auth Check
    const isSuperAdmin = sessionStorage.getItem("isSuperAdmin");
    if (!isSuperAdmin) { navigate("/ceo-login"); return; }
    
    fetchData();

    // Socket Connection
    const socket = io(BASE_URL);
    socket.emit("join-super-admin");
    socket.on("global-new-order", (order) => {
        setGlobalOrders(prev => [order, ...prev].slice(0, 10));
        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
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
    if(!window.confirm(`Activate ${days} days PRO for this partner?`)) return;
    try {
        await axios.put(`${BASE_URL}/api/superadmin/update-subscription/${id}`, { isPro: true, extendDays: days });
        alert("✨ PRO Activated!");
        fetchData();
    } catch (e) { alert("Update failed"); }
  };

  const sendBroadcast = async () => {
      if(!msg.title || !msg.content) return alert("Fill message details");
      try {
          await axios.post(`${BASE_URL}/api/broadcast/send`, msg);
          alert("Message Sent to All Restaurants!");
          setMsg({ title: "", content: "" });
      } catch(e) { alert("Broadcast failed"); }
  }

  const copyLoginLink = (username) => {
      const url = `${window.location.origin}/login`;
      navigator.clipboard.writeText(`Dashboard Access:\nURL: ${url}\nUsername: ${username}`);
      alert("📋 Login info copied!");
  }

  return (
    <div className="superadmin-container">
      <style>{styles}</style>
      
      {/* --- MODAL POPUP --- */}
      {showAddModal && (
          <AddRestaurantModal 
            onClose={() => setShowAddModal(false)} 
            refreshList={fetchData} 
            BASE_URL={BASE_URL} 
          />
      )}
      
      {/* --- NAVBAR --- */}
      <nav className="ceo-nav">
        <div className="brand">
          <img src="/logo192.png" className="ceo-logo" alt="BiteBox" />
          <span>CEO CONTROL CENTER</span>
        </div>
        <div className="nav-actions">
           <button onClick={() => setShowAddModal(true)} className="add-btn"><FaPlus /> New Partner</button>
           <button onClick={fetchData} className="refresh-btn"><FaSync className={loading ? 'spin' : ''} /> Sync</button>
           <button onClick={() => { sessionStorage.removeItem("isSuperAdmin"); navigate("/ceo-login"); }} className="logout-btn"><FaSignOutAlt /></button>
        </div>
      </nav>

      {/* --- LAYOUT --- */}
      <div className="dashboard-layout">
        <aside className="ceo-sidebar">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><FaChartLine /> Overview</button>
          <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}><FaCrown /> Billing</button>
          <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}><FaEnvelope /> Broadcast</button>
        </aside>

        <main className="ceo-content">
          
          {/* --- TAB: OVERVIEW --- */}
          {activeTab === 'overview' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                    <FaStore className="card-icon" />
                    <div><h3>{restaurants.length}</h3><p>Active Clients</p></div>
                </div>
                <div className="stat-card gold">
                    <FaCrown className="card-icon" />
                    <div><h3>{restaurants.filter(r => r.isPro).length}</h3><p>Pro Members</p></div>
                </div>
              </div>

              {/* 🆕 YOUR SALES CHART HERE */}
              <SalesSummary restaurants={restaurants} />

              <div className="split-view">
                <div className="glass-panel" style={{gridColumn: 'span 2'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                    <FaGlobe color="#22c55e" /> <h2 style={{margin:0, fontSize:'16px'}}>LIVE GLOBAL FEED</h2>
                  </div>
                  <div className="order-ticker">
                    {globalOrders.length === 0 ? <p style={{color:'#444', fontSize:'12px'}}>Waiting for live orders...</p> : 
                      globalOrders.map((o, i) => (
                        <div key={i} className="ticker-item">
                            <FaShoppingCart color="#22c55e" />
                            <div style={{flex:1, marginLeft:'10px'}}>
                                <div style={{fontSize:'12px', fontWeight:'bold'}}>{o.restaurantName}</div>
                                <div style={{fontSize:'10px', color:'#666'}}>₹{o.totalAmount} • Table {o.tableNumber}</div>
                            </div>
                            <span style={{fontSize:'10px', color:'#444'}}>{new Date().toLocaleTimeString()}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </>
          )}

          {/* --- TAB: BILLING --- */}
          {activeTab === 'billing' && (
             <div className="glass-panel">
                <h2>Subscription Management</h2>
                <div className="restaurant-list">
                    {restaurants.map(r => (
                        <div key={r._id} className="client-item">
                            <div>
                                <strong>{r.restaurantName}</strong> <span style={{fontSize:'10px', color:'#888'}}>({r.username})</span>
                                <p style={{fontSize:'11px', color:'#666'}}>Status: {r.isPro ? 'PRO' : 'TRIAL'}</p>
                            </div>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => copyLoginLink(r.username)} className="billing-btn" title="Copy Login Info"><FaCopy /></button>
                                <button onClick={() => handleActivatePro(r._id, 30)} className="billing-btn">+30 Days</button>
                                <button onClick={() => handleActivatePro(r._id, 365)} className="billing-btn gold-btn">Yearly</button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {/* --- TAB: BROADCAST --- */}
          {activeTab === 'broadcast' && (
             <div className="glass-panel centered">
                <h2>📢 System-Wide Alert</h2>
                <input placeholder="Title" value={msg.title} onChange={e => setMsg({...msg, title: e.target.value})} className="msg-input" />
                <textarea placeholder="Message..." value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})} className="msg-box"></textarea>
                <button onClick={sendBroadcast} className="ceo-btn gold">Broadcast Now</button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- CSS STYLES ---
const styles = `
.superadmin-container { background: #050505; min-height: 100vh; color: white; font-family: 'Inter', sans-serif; }
.ceo-nav { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; background: #0a0a0a; border-bottom: 1px solid #1a1a1a; }
.ceo-logo { width: 35px; border-radius: 8px; }
.brand { display: flex; align-items: center; gap: 12px; font-weight: 900; color: #f97316; }

.dashboard-layout { display: flex; height: calc(100vh - 71px); }
.ceo-sidebar { width: 220px; background: #080808; border-right: 1px solid #111; padding: 20px; display: flex; flex-direction: column; gap: 8px; }
.ceo-sidebar button { background: none; border: none; color: #555; padding: 14px; text-align: left; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 12px; border-radius: 12px; font-size: 13px; }
.ceo-sidebar button.active { background: rgba(249, 115, 22, 0.1); color: #f97316; }

.ceo-content { flex: 1; padding: 30px; overflow-y: auto; background: radial-gradient(circle at top right, #110a05 0%, #050505 50%); }
.stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; }
.stat-card { background: #0d0d0d; padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid #1a1a1a; }
.stat-card.gold { border-color: #f9731666; background: linear-gradient(135deg, #0d0d0d 0%, #1a100a 100%); }
.card-icon { font-size: 24px; color: #f97316; }

/* CHARTS */
.chart-container { display: flex; align-items: flex-end; gap: 12px; height: 100px; border-bottom: 1px solid #222; margin-bottom: 20px; }
.chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar { width: 12px; border-radius: 4px 4px 0 0; transition: height 0.5s ease; }
.bar-label { font-size: 8px; color: #444; margin-top: 5px; text-transform: uppercase; }
.performer-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

/* UI COMPONENTS */
.glass-panel { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 25px; border-radius: 24px; margin-bottom: 20px; }
.split-view { display: grid; grid-template-columns: 1fr; gap: 20px; }
.ceo-btn { width: 100%; padding: 15px; background: #f97316; color: black; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; text-transform: uppercase; }
.restaurant-list { display: flex; flex-direction: column; gap: 10px; }
.client-item { display: flex; justify-content: space-between; alignItems: center; background: #111; padding: 15px; border-radius: 12px; border: 1px solid #222; }
.billing-btn { background: #111; color: #22c55e; border: 1px solid #1a3a1a; padding: 8px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; cursor: pointer; }
.gold-btn { color: #f97316; border-color: #3a2010; }
.order-ticker { display: flex; flex-direction: column; gap: 8px; }
.ticker-item { background: #000; border: 1px solid #111; padding: 12px; border-radius: 12px; display: flex; align-items: center; }
.nav-actions { display: flex; gap: 10px; }
.add-btn { background: #f97316; border: none; color: black; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; display: flex; align-items: center; gap: 6px; font-size: 12px; }
.refresh-btn, .logout-btn { background: #111; border: 1px solid #222; color: #888; padding: 8px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px; }
.refresh-btn:hover { color: #fff; border-color: #333; }
.logout-btn:hover { color: #ef4444; border-color: #333; }
.msg-input, .msg-box { width: 100%; padding: 15px; background: #000; border: 1px solid #333; color: white; border-radius: 10px; margin-bottom: 10px; outline: none; }
.msg-box { min-height: 100px; }

/* MODAL STYLES */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #111; padding: 35px; border-radius: 24px; width: 100%; max-width: 450px; border: 1px solid #222; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.modal-header h2 { color: white; font-size: 20px; font-weight: 900; margin: 0; }
.close-btn { background: none; border: none; color: #444; font-size: 20px; cursor: pointer; }
.modal-sub { color: #666; font-size: 12px; margin-bottom: 25px; }
.modal-form { display: flex; flex-direction: column; gap: 18px; }
.input-group { display: flex; flex-direction: column; gap: 6px; }
.input-group label { color: #f97316; font-size: 10px; font-weight: 900; text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
.input-group input { padding: 14px; background: #000; border: 1px solid #333; color: white; border-radius: 12px; font-size: 14px; outline: none; }
.password-wrapper { display: flex; gap: 10px; position: relative; }
.password-wrapper input { width: 100%; }
.eye-btn { position: absolute; right: 60px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #555; cursor: pointer; font-size: 16px; }
.gen-btn { padding: 0 15px; background: #222; color: #f97316; border: 1px solid #333; border-radius: 12px; cursor: pointer; }
.modal-submit { padding: 16px; background: #f97316; color: black; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; margin-top: 10px; text-transform: uppercase; letter-spacing: 1px; }
`;

export default SuperAdmin;