import React, { useState, useEffect } from "react";
import { FaTrash, FaSearch, FaStore, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- CHECK CREDENTIALS ON LOAD ---
  useEffect(() => {
    // Basic protection
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

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this restaurant permanently?")) return;
    try {
      await fetch(`${API_URL}/api/auth/admin/delete-owner/${id}`, { method: "DELETE" });
      fetchRestaurants();
    } catch (err) { alert("Error deleting"); }
  };

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

      {/* --- CONTENT AREA (Full Width) --- */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
         
           {/* SEARCH BAR */}
           <div style={{ marginBottom: "20px", position: "relative" }}>
             <FaSearch style={{ position: "absolute", left: "15px", top: "14px", color: "#666" }} />
             <input 
               placeholder="Search clients..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{...inputStyle, paddingLeft: "45px", fontSize: "16px"}}
             />
           </div>

           {/* LIST OF CLIENTS */}
           <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
             {loading ? <p>Loading...</p> : filteredRestaurants.map(r => (
               <div key={r._id} style={{ background: "#161616", padding: "20px", borderRadius: "12px", border: "1px solid #333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <div>
                   <h3 style={{ margin: "0 0 5px 0", color: "white", fontSize: "18px" }}>{r.restaurantName}</h3>
                   <div style={{ color: "#888", fontSize: "14px" }}>User: <span style={{color: "#f97316", fontWeight: "bold"}}>{r.username}</span></div>
                 </div>
                 
                 <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        onClick={() => handleDelete(r._id)} 
                        style={{ background: "#3a1111", color: "#ef4444", border: "1px solid #ef4444", padding: "10px 14px", borderRadius: "8px", cursor: "pointer", transition: "0.2s" }}
                        title="Delete Client"
                    >
                        <FaTrash />
                    </button>
                 </div>
               </div>
             ))}
             
             {!loading && filteredRestaurants.length === 0 && (
                <div style={{ textAlign: "center", color: "#555", padding: "40px" }}>No clients found.</div>
             )}
           </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%", padding: "12px", borderRadius: "10px", background: "#0f0f0f", border: "1px solid #333", color: "white", outline: "none", boxSizing: "border-box"
};

export default SuperAdmin;