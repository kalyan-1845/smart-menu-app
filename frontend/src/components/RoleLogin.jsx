import React, { useState } from "react";
import axios from "axios";
import { FaLock, FaUnlock, FaUserTie, FaUtensils } from "react-icons/fa";

const RoleLogin = ({ role, restaurantUsername, onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Calls the backend route we created in Part 1
      const res = await axios.post(`${API_BASE}/auth/verify-role`, {
        username: restaurantUsername,
        password: password,
        role: role // 'waiter' or 'chef'
      });

      if (res.data.success) {
        // Pass the mongo ID back to the parent component
        onLoginSuccess(res.data.restaurantId);
      }
    } catch (err) {
      setError("❌ Wrong Password");
      // Fallback for testing if backend isn't updated yet:
      if (password === "bitebox18") {
         // Remove this block once backend is live
         // This allows you to test immediately
         console.log("Bypass: Password matches bitebox18");
         onLoginSuccess("temp_bypass_id"); 
      }
    } finally {
      setLoading(false);
    }
  };

  const isChef = role === 'chef';

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050505",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "white",
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{
        background: "#111",
        padding: "40px",
        borderRadius: "24px",
        border: "1px solid #333",
        textAlign: "center",
        width: "100%",
        maxWidth: "320px"
      }}>
        <div style={{ 
          background: isChef ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)", 
          width: "60px", height: "60px", borderRadius: "50%", 
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px auto",
          color: isChef ? "#ef4444" : "#3b82f6"
        }}>
          {isChef ? <FaUtensils size={24} /> : <FaUserTie size={24} />}
        </div>
        
        <h2 style={{ margin: "0 0 5px 0", textTransform: "uppercase" }}>{restaurantUsername}</h2>
        <p style={{ color: "#666", fontSize: "12px", margin: "0 0 20px 0" }}>
          {role.toUpperCase()} ACCESS
        </p>

        <form onSubmit={handleLogin}>
          <input 
            type="password" 
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "14px",
              background: "#222",
              border: "1px solid #444",
              borderRadius: "12px",
              color: "white",
              textAlign: "center",
              marginBottom: "15px",
              outline: "none"
            }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: "12px", margin: "-10px 0 10px" }}>{error}</p>}
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: isChef ? "#ef4444" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
            }}
          >
            {loading ? "Checking..." : <><FaUnlock /> Access View</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleLogin;