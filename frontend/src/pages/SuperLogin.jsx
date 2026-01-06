import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserSecret, FaLock, FaArrowRight, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-hot-toast";
import InstallButton from "../components/InstallButton";

// Ensure this matches your actual backend URL
const API_URL = "https://smart-menu-backend-5ge7.onrender.com"; 

const SuperLogin = () => {
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    try {
      // 🚀 SEND PASSWORD TO SERVER TO GET REAL TOKEN
      const res = await axios.post(`${API_URL}/api/superadmin/login`, { 
        password: secret 
      });

      if (res.data.success) {
        // ✅ Save the exact token name SuperAdmin.jsx looks for
        localStorage.setItem("admin_token", res.data.token);
        
        toast.success("Welcome, CEO.");
        
        // Smooth entry delay
        setTimeout(() => {
          navigate("/superadmin"); 
        }, 500);
      }
    } catch (err) {
      console.error(err);
      toast.error("ACCESS DENIED: Incorrect Key");
      setSecret(""); // Clear input
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]); // Haptic Error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.installWrapper}>
        <InstallButton />
      </div>

      <div style={styles.card}>
        <FaUserSecret size={50} color="#f97316" style={{ marginBottom: "20px" }} />
        <h1 style={styles.title}>CEO ACCESS</h1>
        <p style={styles.subtitle}>Restricted Area. Authorized Personnel Only.</p>
        
        <form onSubmit={handleLogin} autoCapitalize="none">
          <div style={styles.inputWrapper}>
            <FaLock style={styles.lockIcon} />
            <input 
              type="password" 
              placeholder="Enter Master Key" 
              value={secret} 
              autoFocus
              inputMode="numeric"
              onChange={(e) => setSecret(e.target.value)}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? <><FaSpinner className="spin"/> AUTHENTICATING...</> : <>ENTER PANEL <FaArrowRight /></>}
          </button>
        </form>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; } 
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @media screen and (max-width: 768px) { input { font-size: 16px !important; } }
      `}</style>
    </div>
  );
};

const styles = {
  container: { height: "100vh", background: "radial-gradient(circle at center, #111 0%, #000 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "Inter, sans-serif", position: 'relative' },
  installWrapper: { position: 'absolute', top: '20px', right: '20px', zIndex: 100 },
  card: { width: "90%", maxWidth: "350px", padding: "40px", background: "#0a0a0a", borderRadius: "24px", border: "1px solid #222", textAlign: "center", transition: '0.3s border-color ease', boxSizing: 'border-box' },
  title: { fontSize: "24px", fontWeight: "900", margin: "0 0 10px 0", letterSpacing: '-1px' },
  subtitle: { color: "#555", fontSize: "12px", marginBottom: "30px", fontWeight: '600' },
  inputWrapper: { position: "relative", marginBottom: "20px" },
  lockIcon: { position: "absolute", left: "15px", top: "18px", color: "#444" },
  input: { width: "100%", padding: "16px 16px 16px 45px", background: "#000", border: "1px solid #222", borderRadius: "14px", color: "white", outline: "none", boxSizing: 'border-box', fontSize: '18px' },
  button: { width: "100%", padding: "16px", background: "#f97316", border: "none", borderRadius: "14px", color: 'white', fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: '0.2s' }
};

export default SuperLogin;