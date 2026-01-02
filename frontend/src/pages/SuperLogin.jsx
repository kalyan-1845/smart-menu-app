import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserSecret, FaLock, FaArrowRight } from "react-icons/fa";
import InstallButton from "../components/InstallButton"; // ✅ Added Install Button

const SuperLogin = () => {
  const [secret, setSecret] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false); // Added for smooth transition
  const navigate = useNavigate();

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    // 🔐 YOUR MASTER PASSWORD
    if (secret === "bb1972") {
      localStorage.setItem("superAdminAuth", "true"); 
      sessionStorage.setItem("isSuperAdmin", "true");
      
      // Artificial slight delay for smooth "success" feeling on mobile
      setTimeout(() => {
        navigate("/superadmin"); 
      }, 300);
    } else {
      setError(true);
      setSecret(""); 
      setLoading(false);
      if ("vibrate" in navigator) navigator.vibrate(200); // Haptic feedback for error
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={styles.container}>
      {/* Install Button placed at the top right for CEO convenience */}
      <div style={styles.installWrapper}>
        <InstallButton />
      </div>

      <div style={{...styles.card, borderColor: error ? '#ef4444' : '#222'}}>
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
              inputMode="numeric" // 📱 Opens number pad on mobile for faster entry
              onChange={(e) => setSecret(e.target.value)}
              style={styles.input}
            />
          </div>
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "AUTHENTICATING..." : <>ENTER PANEL <FaArrowRight /></>}
          </button>
        </form>
        {error && <p style={styles.errorText}>INCORRECT MASTER KEY</p>}
      </div>

      <style>{`
        /* Prevent zoom on mobile focus */
        @media screen and (max-width: 768px) {
          input { font-size: 16px !important; }
        }
        * { -webkit-tap-highlight-color: transparent; }
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
  button: { width: "100%", padding: "16px", background: "#f97316", border: "none", borderRadius: "14px", color: 'white', fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", transition: '0.2s' },
  errorText: { color: '#ef4444', fontSize: '10px', marginTop: '15px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }
};

export default SuperLogin;