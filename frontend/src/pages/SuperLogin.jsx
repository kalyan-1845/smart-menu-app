import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserSecret, FaLock, FaArrowRight } from "react-icons/fa";

const SuperLogin = () => {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    
    // 🔐 YOUR MASTER PASSWORD
    if (secret === "bb1972") {
      // Set Auth Flag
      localStorage.setItem("superAdminAuth", "true"); 
      // Set Session (dies when tab closes) for extra security
      sessionStorage.setItem("isSuperAdmin", "true");
      
      navigate("/superadmin"); 
    } else {
      setError(true);
      setSecret(""); // Clear input on failure
      setTimeout(() => setError(false), 2000); // Reset error state
    }
  };

  return (
    <div style={styles.container}>
      <div style={{...styles.card, borderColor: error ? '#ef4444' : '#222'}}>
        <FaUserSecret size={50} color="#f97316" style={{ marginBottom: "20px" }} />
        <h1 style={styles.title}>CEO ACCESS</h1>
        <p style={styles.subtitle}>Restricted Area. Authorized Personnel Only.</p>
        
        <form onSubmit={handleLogin}>
          <div style={styles.inputWrapper}>
            <FaLock style={styles.lockIcon} />
            <input 
              type="password" 
              placeholder="Enter Master Key" 
              value={secret} 
              autoFocus
              onChange={(e) => setSecret(e.target.value)}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button}>
            ENTER PANEL <FaArrowRight />
          </button>
        </form>
        {error && <p style={{color: '#ef4444', fontSize: '10px', marginTop: '10px', fontWeight: 'bold'}}>INCORRECT MASTER KEY</p>}
      </div>
    </div>
  );
};

const styles = {
  container: { height: "100vh", background: "radial-gradient(circle at center, #111 0%, #000 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "Inter, sans-serif" },
  card: { width: "350px", padding: "40px", background: "#0a0a0a", borderRadius: "24px", border: "1px solid #222", textAlign: "center", transition: '0.3s border-color ease' },
  title: { fontSize: "24px", fontWeight: "900", margin: "0 0 10px 0", letterSpacing: '-1px' },
  subtitle: { color: "#555", fontSize: "12px", marginBottom: "30px", fontWeight: '600' },
  inputWrapper: { position: "relative", marginBottom: "20px" },
  lockIcon: { position: "absolute", left: "15px", top: "16px", color: "#444" },
  input: { width: "100%", padding: "15px 15px 15px 45px", background: "#000", border: "1px solid #222", borderRadius: "12px", color: "white", outline: "none", boxSizing: 'border-box', fontSize: '16px' },
  button: { width: "100%", padding: "16px", background: "#f97316", border: "none", borderRadius: "12px", color: 'white', fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: '0.2s' }
};

export default SuperLogin;