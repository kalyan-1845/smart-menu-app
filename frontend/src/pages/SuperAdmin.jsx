import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaUsers, FaChartLine, FaStore, FaSignOutAlt, FaBolt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  
  // --- FORM STATE (For creating new accounts) ---
  const [formData, setFormData] = useState({
    username: "",      // This will be the Login ID
    password: "",      // You generate this
    restaurantName: "",
    email: "",         // Required by backend
    phone: "",
    address: ""
  });

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      // Adjust endpoint if you have a specific route to list all owners
      const res = await axios.get("https://smart-menu-backend-5ge7.onrender.com/api/superadmin/restaurants");
      setRestaurants(res.data);
    } catch (err) {
      console.log("Error fetching lists (SuperAdmin route might need setup)");
    }
  };

  const generateCredentials = () => {
    // Auto-generate a simple ID and Password
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedUser = formData.restaurantName.replace(/\s/g, '').toLowerCase() + randomSuffix;
    const generatedPass = Math.random().toString(36).slice(-8);
    
    setFormData({
      ...formData,
      username: generatedUser,
      password: generatedPass
    });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      // ✅ This hits the REAL register endpoint
      await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", formData);
      alert(`✅ Account Created!\n\nLOGIN ID: ${formData.username}\nPASSWORD: ${formData.password}\n\nShare these with the client.`);
      
      // Clear form
      setFormData({ username: "", password: "", restaurantName: "", email: "", phone: "", address: "" });
      fetchRestaurants(); // Refresh list
    } catch (err) {
      alert("Creation Failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", fontFamily: "sans-serif", padding: "20px" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#f97316", margin: 0 }}>SUPER ADMIN DASHBOARD</h1>
        <button onClick={() => navigate("/login")} style={{ background: "#222", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* STATS ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "40px" }}>
        <StatCard icon={<FaChartLine />} label="Monthly Revenue" value="₹0" />
        <StatCard icon={<FaUsers />} label="Active Partners" value={restaurants.length || "0"} />
        <StatCard icon={<FaStore />} label="Pro Users" value="0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        
        {/* --- LEFT: ONBOARD PARTNER FORM (Matches your screenshot) --- */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <FaBolt style={{ color: "#f97316", fontSize: "24px", marginBottom: "10px" }} />
            <h2 style={{ margin: 0 }}>Onboard Partner</h2>
            <p style={{ color: "#666", fontSize: "12px" }}>Create new restaurant license.</p>
          </div>

          <form onSubmit={handleCreateAccount} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            
            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Restaurant Name</label>
              <input style={s.input} placeholder="e.g. Urban Grill" value={formData.restaurantName} 
                onChange={e => setFormData({...formData, restaurantName: e.target.value})} required />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Email (Required for DB)</label>
              <input style={s.input} placeholder="owner@gmail.com" value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>

            <div style={{display:'flex', gap:'10px'}}>
               <button type="button" onClick={generateCredentials} style={s.genBtn}>
                  Auto-Generate Credentials
               </button>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Generated ID (Username)</label>
              <input style={s.input} value={formData.username} readOnly placeholder="Auto-generated" />
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
              <label style={s.label}>Assign Password</label>
              <input style={s.input} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Set a strong password" />
            </div>

            <button type="submit" style={s.submitBtn}>Generate License ⚡</button>
          </form>
        </div>

        {/* --- RIGHT: CLIENT LIST --- */}
        <div style={{ background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", borderBottom: "1px solid #222", paddingBottom: "10px" }}>
             <span style={s.th}>CLIENT DETAILS</span>
             <span style={s.th}>PLAN STATUS</span>
             <span style={s.th}>ACTION</span>
          </div>
          
          {restaurants.length === 0 ? (
            <p style={{color: '#444', textAlign: 'center', marginTop: '50px'}}>No active partners yet.</p>
          ) : (
            restaurants.map((res, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", padding: "10px", background: "#080808", borderRadius: "10px" }}>
                 <div>
                    <div style={{fontWeight:'bold'}}>{res.restaurantName}</div>
                    <div style={{fontSize:'12px', color:'#666'}}>{res.username}</div>
                 </div>
                 <div style={{color: '#f97316', fontWeight:'bold', fontSize:'12px'}}>PRO PLAN</div>
                 <button style={{background:'red', color:'white', border:'none', borderRadius:'5px', padding:'5px 10px', fontSize:'10px'}}>Block</button>
              </div>
            ))
          )}
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
  genBtn: { padding: "8px", background: "#222", color: "#f97316", border: "1px dashed #f97316", borderRadius: "8px", cursor: "pointer", fontSize: "12px", width: "100%" },
  submitBtn: { padding: "15px", background: "#f97316", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  th: { fontSize: "10px", color: "#666", fontWeight: "bold", letterSpacing: "1px" }
};

export default SuperAdmin;