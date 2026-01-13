import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaStore, FaUser, FaLock, FaArrowRight, FaSpinner } from "react-icons/fa";

// Dynamic API Selection: High Speed for Local / Reliable for Production
const API_BASE = window.location.hostname === "localhost" 
    ? "http://localhost:5000/api" 
    : "https://kovixa-backend-v99.up.railway.app/api";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "", 
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);
    setError("");

    // 1. CLEAN DATA: Remove spaces and force lowercase for the ID
    const cleanUsername = formData.username.trim().toLowerCase();

    if (cleanUsername.includes(" ")) {
      setError("Unique ID cannot contain spaces.");
      setLoading(false);
      return;
    }

    try {
      // 2. High-Speed Logic: Calculate 100 Year Access instantly
      const freeAccessDate = new Date();
      freeAccessDate.setFullYear(freeAccessDate.getFullYear() + 100); 

      // 3. Auto-Generate DB-Safe Unique Email
      const autoEmail = `${cleanUsername}@kovixa.local`;

      const payload = {
        restaurantName: formData.restaurantName.trim(),
        username: cleanUsername,
        password: formData.password,
        email: autoEmail, 
        trialEndsAt: freeAccessDate.toISOString() 
      };

      // 4. Send to Backend
      const res = await axios.post(`${API_BASE}/auth/register`, payload, {
        timeout: 10000 // 10 second timeout for mobile networks
      });
      
      if ("vibrate" in navigator) navigator.vibrate(50); // Tactile success feedback
      alert("Registration Successful! You can now login.");
      navigate("/login");

    } catch (err) {
      console.error("Registration Error:", err);
      const msg = err.response?.data?.message || "Network Error. Is the backend live?";
      
      if (msg.includes("duplicate") || msg.includes("already registered")) {
          setError("That Unique ID is already taken. Try another.");
      } else {
          setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Kovixa</h1>
          <p style={styles.sub}>Create your Free Forever account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Restaurant Name</label>
            <div style={styles.wrapper}>
              <FaStore style={styles.icon} />
              <input 
                style={styles.input} 
                name="restaurantName"
                placeholder="e.g. Skyline Biryani" 
                value={formData.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Unique ID (Admin Username)</label>
            <div style={styles.wrapper}>
              <FaUser style={styles.icon} />
              <input 
                style={styles.input} 
                name="username"
                placeholder="e.g. skyline1 (No Spaces)" 
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Security Password</label>
            <div style={styles.wrapper}>
              <FaLock style={styles.icon} />
              <input 
                style={styles.input} 
                type="password"
                name="password"
                placeholder="••••••••" 
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" style={loading ? styles.btnDisabled : styles.btn} disabled={loading}>
            {loading ? <FaSpinner className="spin" /> : <>Get Free Access <FaArrowRight /></>}
          </button>
        </form>

        {/* ✅ MOVED HERE: Correct location for the Terms link */}
        <p style={{ fontSize: '11px', color: '#444', marginTop: '15px', textAlign: 'center' }}>
          By registering, you agree to our 
          <Link to="/terms" style={{ color: '#f97316', marginLeft: '4px' }}>Terms & Privacy Policy</Link>
        </p>

        <div style={styles.footer}>
          Already a partner? <Link to="/login" style={styles.link}>Login Here</Link>
        </div>
      </div>

      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "Inter, sans-serif" },
  card: { width: "100%", maxWidth: "400px", background: "#111", padding: "40px 30px", borderRadius: "24px", border: "1px solid #222", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" },
  header: { textAlign: "center", marginBottom: "30px" },
  title: { color: "#f97316", fontSize: "32px", fontWeight: "900", margin: "0 0 5px 0", letterSpacing: "-1px" },
  sub: { color: "#666", fontSize: "14px", margin: 0 },
  inputGroup: { marginBottom: "20px" },
  label: { display: "block", color: "#aaa", fontSize: "10px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "8px", letterSpacing: "1px" },
  wrapper: { position: "relative" },
  icon: { position: "absolute", left: "15px", top: "16px", color: "#444" },
  input: { width: "100%", padding: "16px 16px 16px 45px", background: "#000", border: "1px solid #333", borderRadius: "12px", color: "white", outline: "none", fontSize: "15px", boxSizing: "border-box", transition: "0.3s" },
  btn: { width: "100%", padding: "16px", background: "#f97316", border: "none", borderRadius: "12px", color: "white", fontWeight: "900", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px", transition: "0.3s" },
  btnDisabled: { width: "100%", padding: "16px", background: "#333", border: "none", borderRadius: "12px", color: "#666", fontWeight: "900", fontSize: "16px", cursor: "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "10px" },
  error: { background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px", borderRadius: "10px", fontSize: "13px", textAlign: "center", marginBottom: "20px" },
  footer: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#666" },
  link: { color: "#f97316", textDecoration: "none", fontWeight: "bold" }
};

export default Register;