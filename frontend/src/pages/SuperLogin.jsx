import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserSecret, FaLock, FaArrowRight } from "react-icons/fa";

const SuperLogin = () => {
  const [secret, setSecret] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // 🔐 YOUR SECRET PASSWORD IS "admin123"
    if (secret === "bb1972") {
      localStorage.setItem("superAdminAuth", "true"); // Gives you the key
      navigate("/superadmin"); // Sends you to the dashboard
    } else {
      alert("❌ Access Denied!");
    }
  };

  return (
    <div style={{ height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "Inter" }}>
      <div style={{ width: "350px", padding: "40px", background: "#111", borderRadius: "20px", border: "1px solid #222", textAlign: "center" }}>
        <FaUserSecret size={50} color="#f97316" style={{ marginBottom: "20px" }} />
        <h1 style={{ fontSize: "24px", fontWeight: "900", margin: "0 0 10px 0" }}>CEO ACCESS</h1>
        <p style={{ color: "#666", fontSize: "12px", marginBottom: "30px" }}>Restricted Area. Authorized Personnel Only.</p>
        
        <form onSubmit={handleLogin}>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <FaLock style={{ position: "absolute", left: "15px", top: "15px", color: "#555" }} />
            <input 
              type="password" 
              placeholder="Enter Master Key" 
              value={secret} 
              onChange={(e) => setSecret(e.target.value)}
              style={{ width: "100%", padding: "15px 15px 15px 45px", background: "#000", border: "1px solid #333", borderRadius: "10px", color: "white", outline: "none" }}
            />
          </div>
          <button type="submit" style={{ width: "100%", padding: "15px", background: "#f97316", border: "none", borderRadius: "10px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
            ENTER PANEL <FaArrowRight />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuperLogin;