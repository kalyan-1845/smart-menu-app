import React, { useState, useEffect } from "react";
import { FaTrash, FaClock, FaKey, FaSearch, FaStore, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; // Check this URL matches your backend

const SuperAdmin = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Stats
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });

  // Password Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/restaurants`);
      const data = await res.json();
      
      if (res.ok) {
        setRestaurants(data);
        calculateStats(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const total = data.length;
    const now = new Date();
    const active = data.filter(r => new Date(r.trialEndsAt) > now).length;
    const expired = total - active;
    setStats({ total, active, expired });
  };

  // --- ACTIONS ---

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This deletes the restaurant and ALL menu items.")) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/delete-owner/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("Restaurant Deleted");
        fetchRestaurants(); // Refresh list
      }
    } catch (err) {
      alert("Error deleting restaurant");
    }
  };

  const handleExtendTrial = async (id) => {
    if (!window.confirm("Extend this plan by 30 days?")) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/extend-trial/${id}`, {
        method: "PUT",
      });
      if (res.ok) {
        alert("Plan Extended Successfully");
        fetchRestaurants();
      }
    } catch (err) {
      alert("Error extending plan");
    }
  };

  const openResetModal = (id) => {
    setSelectedOwnerId(id);
    setNewPassword("");
    setShowResetModal(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword) return alert("Enter a new password");

    try {
      const res = await fetch(`${API_URL}/api/auth/admin/reset-password/${selectedOwnerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        alert("Password Updated Successfully");
        setShowResetModal(false);
      } else {
        alert("Failed to update password");
      }
    } catch (err) {
      alert("Network Error");
    }
  };

  // Filter Search
  const filteredRestaurants = restaurants.filter(r => 
    r.restaurantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", borderBottom: "1px solid #222", paddingBottom: "20px" }}>
        <h1 style={{ margin: 0, color: "#f97316", display: "flex", alignItems: "center", gap: "10px" }}>
          <FaStore /> SUPER ADMIN
        </h1>
        <button onClick={() => navigate("/")} style={{ background: "#222", border: "none", color: "white", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
          <FaSignOutAlt /> Logout
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
        <StatCard label="Total Restaurants" value={stats.total} color="#3b82f6" />
        <StatCard label="Active Plans" value={stats.active} color="#22c55e" />
        <StatCard label="Expired Plans" value={stats.expired} color="#ef4444" />
      </div>

      {/* SEARCH BAR */}
      <div style={{ marginBottom: "20px", position: "relative" }}>
        <FaSearch style={{ position: "absolute", left: "15px", top: "12px", color: "#666" }} />
        <input 
          type="text" 
          placeholder="Search by Restaurant Name or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: "100%", padding: "12px 12px 12px 40px", borderRadius: "8px", background: "#111", border: "1px solid #333", color: "white", outline: "none" }}
        />
      </div>

      {/* RESTAURANT LIST */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Loading Data...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {filteredRestaurants.map((owner) => (
            <div key={owner._id} style={{ background: "#111", padding: "20px", borderRadius: "12px", border: "1px solid #222", display: "flex", flexDirection: "column", gap: "15px" }}>
              
              {/* Info Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", color: "white" }}>{owner.restaurantName}</h3>
                  <span style={{ color: "#888", fontSize: "13px" }}>ID: {owner.username}</span>
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#aaa" }}>Trial Ends:</div>
                  <div style={{ color: new Date(owner.trialEndsAt) > new Date() ? "#22c55e" : "#ef4444", fontWeight: "bold" }}>
                    {new Date(owner.trialEndsAt).toDateString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", borderTop: "1px solid #222", paddingTop: "15px" }}>
                
                <button onClick={() => handleExtendTrial(owner._id)} style={btnStyle("#1e3a8a", "#60a5fa")}>
                  <FaClock /> Extend 30 Days
                </button>
                
                <button onClick={() => openResetModal(owner._id)} style={btnStyle("#3f2c10", "#f97316")}>
                  <FaKey /> Reset Pass
                </button>
                
                <button onClick={() => handleDelete(owner._id)} style={btnStyle("#3a1111", "#ef4444")}>
                  <FaTrash /> Delete
                </button>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showResetModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1a1a1a", padding: "30px", borderRadius: "16px", width: "90%", maxWidth: "350px", textAlign: "center", border: "1px solid #333" }}>
            <h3 style={{ marginTop: 0 }}>Reset Password</h3>
            <input 
              type="text" 
              placeholder="Enter New Password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #333", background: "black", color: "white" }}
            />
            <button onClick={handleResetPassword} style={{ width: "100%", padding: "10px", background: "#f97316", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Save Password</button>
            <button onClick={() => setShowResetModal(false)} style={{ marginTop: "10px", background: "transparent", border: "none", color: "#888", cursor: "pointer", textDecoration: "underline" }}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  );
};

// --- SUB-COMPONENTS & STYLES ---

const StatCard = ({ label, value, color }) => (
  <div style={{ flex: "1 1 150px", background: "#111", padding: "20px", borderRadius: "12px", borderLeft: `4px solid ${color}` }}>
    <div style={{ color: "#888", fontSize: "12px", marginBottom: "5px" }}>{label}</div>
    <div style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>{value}</div>
  </div>
);

const btnStyle = (bg, color) => ({
  flex: 1,
  background: bg,
  color: color,
  border: `1px solid ${bg}`,
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  fontSize: "13px",
  fontWeight: "600"
});

export default SuperAdmin;