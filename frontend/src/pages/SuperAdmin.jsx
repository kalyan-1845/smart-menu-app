import React, { useState, useEffect } from "react";
import { FaTrash, FaClock, FaKey, FaSearch, FaStore, FaSignOutAlt, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- FORM STATE FOR CREATING NEW RESTAURANT ---
  const [newOwner, setNewOwner] = useState({
    restaurantName: "",
    username: "",
    password: "",
    trialDays: 30
  });

  // --- CHECK CREDENTIALS ON LOAD ---
  useEffect(() => {
    // Basic protection: If they didn't log in via your special flow, kick them out.
    // Ideally, you'd use a real auth token here, but for now:
    const isSuperAdmin = sessionStorage.getItem("isSuperAdmin");
    if (!isSuperAdmin) {
      const user = prompt("Super Admin Username:");
      const pass = prompt("Super Admin Password:");
      if (user === "srinivas" && pass === "srividya") {
        sessionStorage.setItem("isSuperAdmin", "true");
      } else {
        alert("Access Denied");
        navigate("/");
        return;
      }
    }
    fetchRestaurants();
  }, [navigate]);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/restaurants`);
      const data = await res.json();
      if (res.ok) setRestaurants(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CREATE RESTAURANT FUNCTION ---
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if(!newOwner.restaurantName || !newOwner.username || !newOwner.password) return alert("Fill all fields");

    try {
      // You are using the /register endpoint, but calling it from Admin panel
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOwner),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Success! Created account for ${newOwner.restaurantName}`);
        setNewOwner({ restaurantName: "", username: "", password: "", trialDays: 30 }); // Reset Form
        fetchRestaurants(); // Refresh list
      } else {
        alert("Failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      alert("Server Error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this restaurant permanently?")) return;
    try {
      await fetch(`${API_URL}/api/auth/admin/delete-owner/${id}`, { method: "DELETE" });
      fetchRestaurants();
    } catch (err) { alert("Error deleting"); }
  };

  // ... (Keep your existing handleExtendTrial and Password Reset logic here)

  const filteredRestaurants = restaurants.filter(r => 
    r.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "30px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px", borderBottom: "1px solid #333", paddingBottom: "20px" }}>
        <h1 style={{ color: "#f97316", display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
          <FaStore /> Srinivas Admin Panel
        </h1>
        <button onClick={() => { sessionStorage.removeItem("isSuperAdmin"); navigate("/"); }} style={{ background: "#222", border: "none", color: "white", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        
        {/* --- LEFT COLUMN: CREATE NEW RESTAURANT --- */}
        <div style={{ background: "#111", padding: "25px", borderRadius: "12px", border: "1px solid #333", height: "fit-content" }}>
          <h2 style={{ marginTop: 0, marginBottom: "20px", color: "white", fontSize: "18px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaPlus color="#22c55e" /> Onboard New Client
          </h2>
          <form onSubmit={handleCreateRestaurant} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input 
              placeholder="Restaurant Name (e.g. Deccan Fresh)" 
              value={newOwner.restaurantName}
              onChange={(e) => setNewOwner({...newOwner, restaurantName: e.target.value})}
              style={inputStyle} 
            />
            <input 
              placeholder="Set Username" 
              value={newOwner.username}
              onChange={(e) => setNewOwner({...newOwner, username: e.target.value})}
              style={inputStyle} 
            />
            <input 
              placeholder="Set Password" 
              value={newOwner.password}
              onChange={(e) => setNewOwner({...newOwner, password: e.target.value})}
              style={inputStyle} 
            />
            <button type="submit" style={{ background: "#22c55e", color: "black", padding: "12px", borderRadius: "8px", border: "none", fontWeight: "bold", cursor: "pointer" }}>
              Create Account
            </button>
          </form>
        </div>

        {/* --- RIGHT COLUMN: LIST OF CLIENTS --- */}
        <div>
           <div style={{ marginBottom: "20px", position: "relative" }}>
             <FaSearch style={{ position: "absolute", left: "15px", top: "12px", color: "#666" }} />
             <input 
               placeholder="Search clients..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{...inputStyle, paddingLeft: "40px", width: "100%"}}
             />
           </div>

           <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
             {loading ? <p>Loading...</p> : filteredRestaurants.map(r => (
               <div key={r._id} style={{ background: "#161616", padding: "20px", borderRadius: "10px", border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div>
                   <h3 style={{ margin: "0 0 5px 0", color: "white" }}>{r.restaurantName}</h3>
                   <div style={{ color: "#888", fontSize: "13px" }}>User: <span style={{color: "#f97316"}}>{r.username}</span></div>
                 </div>
                 <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => handleDelete(r._id)} style={{ background: "#3a1111", color: "#ef4444", border: "1px solid #ef4444", padding: "8px", borderRadius: "6px", cursor: "pointer" }}><FaTrash /></button>
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%", padding: "12px", borderRadius: "8px", background: "#050505", border: "1px solid #333", color: "white", outline: "none"
};

export default SuperAdmin;