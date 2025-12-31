import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaStore, FaUser, FaLock, FaArrowRight } from "react-icons/fa";

// --- STYLES ---
const styles = {
  container: { minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "sans-serif" },
  card: { width: "100%", maxWidth: "400px", background: "linear-gradient(180deg, #1e1e1e 0%, #0a0a0a 100%)", padding: "40px 30px", borderRadius: "24px", border: "1px solid #333", position: "relative" },
  header: { textAlign: "center", marginBottom: "30px" },
  title: { color: "white", fontSize: "28px", fontWeight: "800", margin: "0 0 10px 0" },
  sub: { color: "#888", fontSize: "14px", margin: 0 },
  inputGroup: { marginBottom: "20px" },
  label: { display: "block", color: "#aaa", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold", marginBottom: "8px" },
  wrapper: { position: "relative" },
  icon: { position: "absolute", left: "15px", top: "14px", color: "#666" },
  input: { width: "100%", padding: "14px 14px 14px 45px", background: "#0f0f0f", border: "1px solid #333", borderRadius: "12px", color: "white", outline: "none", fontSize: "15px", boxSizing: "border-box" },
  btn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)", border: "none", borderRadius: "12px", color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginTop: "10px" },
  error: { background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px", borderRadius: "10px", fontSize: "13px", textAlign: "center", marginBottom: "20px" },
  footer: { marginTop: "20px", textAlign: "center", fontSize: "13px", color: "#666" },
  link: { color: "#22c55e", textDecoration: "none", fontWeight: "bold" }
};

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
    setLoading(true);
    setError("");

    if (formData.username.includes(" ")) {
      setError("Username cannot contain spaces.");
      setLoading(false);
      return;
    }

    try {
      // 1. Calculate Free Access Date (100 Years)
      const freeAccessDate = new Date();
      freeAccessDate.setFullYear(freeAccessDate.getFullYear() + 100); 

      // 2. Auto-Generate Dummy Email
      const autoEmail = `${formData.username}@smartmenu.local`;

      const payload = {
        ...formData,
        email: autoEmail, 
        trialEndsAt: freeAccessDate.toISOString() 
      };

      console.log("Sending to Localhost:", payload); 

      // ✅ FIX: POINT TO LOCALHOST (Not Render)
      const res = await axios.post("http://localhost:5000/api/auth/register", payload);
      
      console.log("Success:", res.data);
      alert("Registration Successful!");
      navigate("/login");

    } catch (err) {
      console.error("Registration Error:", err);
      if (err.response && err.response.data) {
        const msg = err.response.data.message || JSON.stringify(err.response.data);
        if (msg.includes("duplicate") || msg.includes("already registered")) {
            setError("That Username is already taken. Please try a new one.");
        } else {
            setError(msg);
        }
      } else {
        setError("Network Error. Is your backend running on port 5000?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Join Smart Menu</h1>
          <p style={styles.sub}>Create your Free Forever account</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister}>
          {/* Restaurant Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Restaurant Name</label>
            <div style={styles.wrapper}>
              <FaStore style={styles.icon} />
              <input 
                style={styles.input} 
                name="restaurantName"
                placeholder="e.g. BSR Biryani Point" 
                value={formData.restaurantName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Username */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Unique ID (Username)</label>
            <div style={styles.wrapper}>
              <FaUser style={styles.icon} />
              <input 
                style={styles.input} 
                name="username"
                placeholder="e.g. bsr (No Spaces)" 
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
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

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Creating Account..." : <>Get Free Access <FaArrowRight /></>}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Login Here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;