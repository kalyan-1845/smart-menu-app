import React, { useState, useEffect } from "react";
import { 
    FaTrash, FaClock, FaKey, FaSearch, FaStore, FaSignOutAlt, 
    FaPlus, FaChartLine, FaEnvelope, FaShieldAlt, FaUsers, 
    FaArrowRight, FaCrown, FaGlobe, FaShoppingCart, FaTrophy, FaSync
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// --- SUB-COMPONENT: SALES SUMMARY (THE CHART) ---
const SalesSummary = ({ restaurants }) => {
    const sortedPerformers = [...restaurants]
        .sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))
        .slice(0, 5);
    const totalSystemRevenue = restaurants.reduce((acc, res) => acc + (res.totalRevenue || 0), 0);

    return (
        <div className="glass-panel" style={{ borderLeft: '5px solid #f97316', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <FaChartLine color="#f97316" /> <h2 style={{margin:0, fontSize:'18px'}}>SALES PERFORMANCE</h2>
            </div>
            <div className="chart-container">
                {restaurants.map((res, i) => (
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

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [globalOrders, setGlobalOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); 
  
  const [msg, setMsg] = useState({ title: "", content: "" });
  const [newOwner, setNewOwner] = useState({ restaurantName: "", username: "", password: "", email: "" });

  const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

  useEffect(() => {
    const isSuperAdmin = localStorage.getItem("superAdminAuth");
    if (!isSuperAdmin) navigate("/login");
    fetchData();

    // --- LIVE ORDER MONITOR SOCKET ---
    const socket = io(API_URL);
    socket.emit("join-super-admin"); // Join the Master Room
    socket.on("global-new-order", (order) => {
        setGlobalOrders(prev => [order, ...prev].slice(0, 10));
        new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3").play().catch(()=>{});
    });
    return () => socket.disconnect();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/auth/restaurants`);
      setRestaurants(res.data);
    } catch (error) { console.error("Fetch Error"); }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Pointing to your corrected multi-tenant API
      await axios.post(`${API_URL}/api/auth/register`, newOwner);
      alert("🚀 Restaurant Onboarded!");
      setNewOwner({ restaurantName: "", username: "", password: "", email: "" });
      fetchData();
    } catch (err) { alert("Error creating account"); }
  };

  const handleActivatePro = async (id, days) => {
    if(!window.confirm(`Activate ${days} days PRO for this partner?`)) return;
    try {
        await axios.put(`${API_URL}/api/auth/admin/update-subscription/${id}`, { isPro: true, extendDays: days });
        alert("✨ PRO Activated!");
        fetchData();
    } catch (e) { alert("Update failed"); }
  };

  return (
    <div className="superadmin-container">
      <style>{styles}</style>
      
      <nav className="ceo-nav">
        <div className="brand">
          <img src="/logo192.png" className="ceo-logo" alt="BiteBox" />
          <span>BITEBOX CEO PANEL</span>
        </div>
        <div className="nav-actions">
           <button onClick={fetchData} className="refresh-btn"><FaSync className={loading ? 'spin' : ''} /> Sync</button>
           <button onClick={() => { localStorage.removeItem("superAdminAuth"); navigate("/"); }} className="logout-btn"><FaSignOutAlt /></button>
        </div>
      </nav>

      <div className="dashboard-layout">
        <aside className="ceo-sidebar">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}><FaChartLine /> Overview</button>
          <button className={activeTab === 'billing' ? 'active' : ''} onClick={() => setActiveTab('billing')}><FaCrown /> Billing</button>
          <button className={activeTab === 'broadcast' ? 'active' : ''} onClick={() => setActiveTab('broadcast')}><FaEnvelope /> Broadcast</button>
        </aside>

        <main className="ceo-content">
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

              {/* 📈 SALES PERFORMANCE COMPONENT */}
              <SalesSummary restaurants={restaurants} />

              <div className="split-view">
                <div className="glass-panel">
                   <h2><FaPlus /> Fast Onboarding</h2>
                   <form onSubmit={handleCreate}>
                      <input placeholder="Shop Name" value={newOwner.restaurantName} onChange={e => setNewOwner({...newOwner, restaurantName: e.target.value})} required />
                      <input placeholder="Username" value={newOwner.username} onChange={e => setNewOwner({...newOwner, username: e.target.value})} required />
                      <input placeholder="Password" value={newOwner.password} onChange={e => setNewOwner({...newOwner, password: e.target.value})} required />
                      <button type="submit" className="ceo-btn">Activate Partner</button>
                   </form>
                </div>

                <div className="glass-panel">
                  <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                    <FaGlobe color="#22c55e" /> <h2 style={{margin:0, fontSize:'16px'}}>LIVE GLOBAL FEED</h2>
                  </div>
                  <div className="order-ticker">
                    {globalOrders.length === 0 ? <p style={{color:'#444', fontSize:'12px'}}>Waiting for system traffic...</p> : 
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

          {activeTab === 'billing' && (
             <div className="glass-panel">
                <h2>Subscription Management</h2>
                <div className="restaurant-list">
                    {restaurants.map(r => (
                        <div key={r._id} className="client-item">
                            <div>
                                <strong>{r.restaurantName}</strong>
                                <p style={{fontSize:'11px', color:'#666'}}>Status: {r.isPro ? 'PRO' : 'TRIAL'}</p>
                            </div>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={() => handleActivatePro(r._id, 30)} className="billing-btn">+30 Days</button>
                                <button onClick={() => handleActivatePro(r._id, 365)} className="billing-btn gold-btn">Yearly</button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          )}

          {activeTab === 'broadcast' && (
             <div className="glass-panel centered">
                <h2>📢 System-Wide Alert</h2>
                <input placeholder="Title" value={msg.title} onChange={e => setMsg({...msg, title: e.target.value})} />
                <textarea placeholder="Message..." value={msg.content} onChange={e => setMsg({...msg, content: e.target.value})}></textarea>
                <button onClick={sendBroadcast} className="ceo-btn gold">Broadcast Now</button>
             </div>
          )}
        </main>
      </div>
    </div>
  );
};

// --- ELITE CEO STYLES ---
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

.chart-container { display: flex; align-items: flex-end; gap: 12px; height: 100px; border-bottom: 1px solid #222; margin-bottom: 20px; }
.chart-bar-wrapper { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar { width: 12px; border-radius: 4px 4px 0 0; transition: height 0.5s ease; }
.bar-label { font-size: 8px; color: #444; margin-top: 5px; text-transform: uppercase; }

.performer-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.glass-panel { background: #0a0a0a; border: 1px solid #1a1a1a; padding: 25px; border-radius: 24px; }
.split-view { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; }

input, textarea { width: 100%; padding: 14px; background: #000; border: 1px solid #222; color: white; border-radius: 12px; margin-bottom: 15px; outline: none; font-size: 13px; }
.ceo-btn { width: 100%; padding: 15px; background: #f97316; color: black; border: none; border-radius: 12px; font-weight: 900; cursor: pointer; text-transform: uppercase; }
.billing-btn { background: #111; color: #22c55e; border: 1px solid #1a3a1a; padding: 8px 12px; border-radius: 8px; font-size: 10px; font-weight: 900; cursor: pointer; }
.gold-btn { color: #f97316; border-color: #3a2010; }

.order-ticker { display: flex; flex-direction: column; gap: 8px; }
.ticker-item { background: #000; border: 1px solid #111; padding: 12px; border-radius: 12px; display: flex; align-items: center; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
`;

export default SuperAdmin;