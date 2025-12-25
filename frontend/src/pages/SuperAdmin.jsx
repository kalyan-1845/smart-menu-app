import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUsers, FaChartLine, FaStore, FaSignOutAlt, FaBolt, FaMagic, FaCalendarPlus, FaTrash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
  
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- FORM STATE ---
  const [formData, setFormData] = useState({
    username: "",      
    password: "",      
    restaurantName: "",
    email: "",         
    randomizeEmail: false // New toggle to bypass duplicate email errors
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await axios.get(`${API_BASE}/restaurants`);
      setRestaurants(res.data);
    } catch (err) {
      console.log("Error fetching lists");
    }
  };

  // --- 1. NEW GENERATOR LOGIC ---
  const generateCredentials = () => {
    // 1. Base the username on the Restaurant Name (or 'user' if empty)
    const baseName = formData.restaurantName 
      ? formData.restaurantName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() 
      : "partner";

    // 2. Add a completely random 4-digit number every time
    const randomSuffix = Math.floor(1000 + Math.random() * 9000); // e.g. 4821
    const newUsername = `${baseName}_${randomSuffix}`;

    // 3. Generate a strong random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 100);

    // 4. Handle Email (If user wants unique emails automatically)
    let newEmail = formData.email;
    if (formData.randomizeEmail) {
        const emailBase = formData.email.split('@')[0] || baseName;
        newEmail = `${emailBase}+${randomSuffix}@gmail.com`; // e.g. owner+4821@gmail.com
    }

    setFormData(prev => ({
      ...prev,
      username: newUsername,
      password: newPassword,
      email: newEmail
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, formData);
      alert(`✅ LICENSE GENERATED!\n\nID: ${formData.username}\nPASS: ${formData.password}`);
      
      // Reset form but keep the name so they can gen another if needed
      setFormData({ username: "", password: "", restaurantName: "", email: "", randomizeEmail: false });
      fetchRestaurants(); 
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EXTEND VALIDITY LOGIC ---
  const handleExtendPlan = async (id, currentName) => {
    if(!window.confirm(`Add 30 Days access to ${currentName}?`)) return;
    
    try {
        await axios.put(`${API_BASE}/admin/extend-trial/${id}`);
        alert("✅ Added 30 Days successfully!");
        fetchRestaurants(); // Refresh to see new date
    } catch (err) {
        alert("Update failed");
    }
  };

  const handleDelete = async (id) => {
      if(!window.confirm("Permanently delete this restaurant?")) return;
      try {
          await axios.delete(`${API_BASE}/admin/delete-owner/${id}`);
          fetchRestaurants();
      } catch (e) { alert("Delete failed"); }
  }

  // Calculate Days Remaining
  const getDaysLeft = (dateStr) => {
      const diff = new Date(dateStr) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "sans-serif", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#f97316", margin: 0, fontSize: '24px' }}>SUPER ADMIN <span style={{color:'white'}}>PANEL</span></h1>
        <button onClick={() => navigate("/login")} style={{ background: "#222", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <StatCard icon={<FaChartLine />} label="Total Partners" value={restaurants.length} />
        <StatCard icon={<FaUsers />} label="Active Licenses" value={restaurants.filter(r => getDaysLeft(r.trialEndsAt) > 0).length} />
        <StatCard icon={<FaStore />} label="Expired" value={restaurants.filter(r => getDaysLeft(r.trialEndsAt) <= 0).length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        
        {/* --- LEFT: ONBOARD PARTNER FORM --- */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222", height: 'fit-content' }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <FaBolt style={{ color: "#f97316", fontSize: "24px", marginBottom: "10px" }} />
            <h2 style={{ margin: 0 }}>New License</h2>
            <p style={{ color: "#666", fontSize: "12px" }}>Generate keys for new client.</p>
          </div>

          <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Restaurant Name</label>
              <input style={s.input} placeholder="e.g. Burger King" value={formData.restaurantName} 
                onChange={e => setFormData({...formData, restaurantName: e.target.value})} required />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Owner Email</label>
              <input style={s.input} placeholder="client@email.com" value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} />
              <div style={{display:'flex', gap:'5px', alignItems:'center', marginTop:'5px'}}>
                  <input type="checkbox" checked={formData.randomizeEmail} onChange={e => setFormData({...formData, randomizeEmail: e.target.checked})} />
                  <span style={{fontSize:'10px', color:'#888'}}>Auto-randomize email to avoid duplicates?</span>
              </div>
            </div>

            <button type="button" onClick={generateCredentials} style={s.genBtn}>
               <FaMagic /> Click to Generate ID & Pass
            </button>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                <label style={s.label}>Login ID</label>
                <input style={{...s.input, color:'#f97316', fontWeight:'bold'}} value={formData.username} readOnly placeholder="..." />
                </div>

                <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                <label style={s.label}>Password</label>
                <input style={{...s.input, color:'#f97316', fontWeight:'bold'}} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="..." />
                </div>
            </div>

            <button type="submit" style={s.submitBtn} disabled={!formData.username || loading}>
                {loading ? "Creating..." : "Create Account ⚡"}
            </button>
          </form>
        </div>

        {/* --- RIGHT: CLIENT LIST --- */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px" }}>
             <span style={s.th}>CLIENT</span>
             <span style={s.th}>VALIDITY</span>
             <span style={s.th}>ACTIONS</span>
          </div>
          
          <div style={{maxHeight:'500px', overflowY:'auto'}}>
            {restaurants.length === 0 ? (
                <p style={{color: '#444', textAlign: 'center', marginTop: '50px'}}>No active partners.</p>
            ) : (
                restaurants.map((res, i) => {
                    const daysLeft = getDaysLeft(res.trialEndsAt);
                    const isExpired = daysLeft <= 0;

                    return (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems:'center', marginBottom: "15px", padding: "15px", background: "#080808", borderRadius: "12px", borderLeft: isExpired ? '3px solid red' : '3px solid #22c55e' }}>
                        <div style={{flex: 1}}>
                            <div style={{fontWeight:'bold', fontSize:'14px'}}>{res.restaurantName}</div>
                            <div style={{fontSize:'11px', color:'#666', marginTop:'2px'}}>ID: <span style={{color:'#888'}}>{res.username}</span></div>
                        </div>
                        
                        <div style={{flex: 1, textAlign:'center'}}>
                            <div style={{color: isExpired ? 'red' : 'white', fontWeight:'bold', fontSize:'14px'}}>
                                {isExpired ? "EXPIRED" : `${daysLeft} DAYS LEFT`}
                            </div>
                            <div style={{fontSize:'10px', color:'#555'}}>Ends: {new Date(res.trialEndsAt).toLocaleDateString()}</div>
                        </div>

                        <div style={{display:'flex', gap:'10px'}}>
                            {/* EXTEND BUTTON */}
                            <button 
                                onClick={() => handleExtendPlan(res._id, res.restaurantName)}
                                style={{background:'#1f2937', color:'#f97316', border:'1px solid #374151', borderRadius:'6px', padding:'8px 12px', fontSize:'11px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px'}}
                            >
                                <FaCalendarPlus /> +30 Days
                            </button>
                            
                            <button onClick={() => handleDelete(res._id)} style={{background:'#330000', color:'#ff4444', border:'none', borderRadius:'6px', padding:'8px', cursor:'pointer'}}>
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                    )
                })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- STYLES ---
const StatCard = ({ icon, label, value }) => (
  <div style={{ background: "#111", padding: "20px", borderRadius: "15px", border: "1px solid #222", display: "flex", alignItems: "center", gap: "15px" }}>
    <div style={{ fontSize: "24px", color: "#f97316" }}>{icon}</div>
    <div>
      <div style={{ fontSize: "12px", color: "#888", fontWeight: "bold" }}>{label}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold" }}>{value}</div>
    </div>
  </div>
);

const s = {
  label: { fontSize: "10px", color: "#888", fontWeight: "bold", textTransform: "uppercase" },
  input: { padding: "12px", background: "#050505", border: "1px solid #333", color: "white", borderRadius: "8px", outline: "none", fontSize: "14px" },
  genBtn: { padding: "10px", background: "#222", color: "#f97316", border: "1px dashed #f97316", borderRadius: "8px", cursor: "pointer", fontSize: "12px", width: "100%", display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' },
  submitBtn: { padding: "15px", background: "#f97316", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  th: { fontSize: "10px", color: "#666", fontWeight: "bold", letterSpacing: "1px" }
};

export default SuperAdmin;