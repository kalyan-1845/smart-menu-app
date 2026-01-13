import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaStore, FaUser, FaLock, FaArrowRight, FaSpinner, FaPhone, FaNetworkWired } from "react-icons/fa";

// --- INLINE STYLES (PREMIUM THEME) ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.register-container {
    background-color: #020617;
    background-image: radial-gradient(circle at 50% 0%, #1e293b 0%, transparent 70%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    position: relative;
    overflow: hidden;
}

/* Glow Effects */
.glow-spot {
    position: absolute;
    width: 600px; height: 600px; border-radius: 50%;
    filter: blur(120px); z-index: 0; pointer-events: none; opacity: 0.3;
}
.top-right { top: -200px; right: -200px; background: radial-gradient(circle, #3b82f6 0%, transparent 70%); }
.bottom-left { bottom: -200px; left: -200px; background: radial-gradient(circle, #10b981 0%, transparent 70%); }

.register-card {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 40px 35px;
    width: 100%; max-width: 440px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    z-index: 1; position: relative;
}

.header { text-align: center; margin-bottom: 30px; }
.header h1 { font-size: 28px; color: white; margin: 0 0 5px 0; fontWeight: 800; letter-spacing: -1px; }
.header p { color: #94a3b8; font-size: 14px; margin: 0; }

.input-group { margin-bottom: 18px; }
.label { display: block; color: #cbd5e1; fontSize: 11px; text-transform: uppercase; fontWeight: 700; marginBottom: 8px; letter-spacing: 0.5px; }
.wrapper { position: relative; display: flex; align-items: center; }

.input-icon { position: absolute; left: 16px; color: #64748b; font-size: 16px; transition: 0.3s; z-index: 2; }
.wrapper:focus-within .input-icon { color: #3b82f6; }

.input {
    width: 100%; background: #0f172a; border: 1px solid #1e293b;
    padding: 16px 16px 16px 48px; border-radius: 14px;
    color: white; font-size: 15px; outline: none; transition: 0.2s; font-weight: 500;
}
.input:focus { border-color: #3b82f6; background: #0f172a; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }

.btn {
    width: 100%; padding: 16px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    border: none; borderRadius: 14px; color: white; fontWeight: 700; fontSize: 16px;
    cursor: pointer; display: flex; alignItems: center; justifyContent: center; gap: 10px;
    margin-top: 10px; transition: 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}
.btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4); }
.btn:disabled { opacity: 0.7; cursor: not-allowed; }

.error-msg { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; padding: 12px; borderRadius: 10px; fontSize: 13px; textAlign: center; marginBottom: 20px; fontWeight: 600; }

.footer { marginTop: 25px; textAlign: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; color: #64748b; fontSize: 13px; }
.link { color: #60a5fa; text-decoration: none; fontWeight: 700; transition: 0.2s; }
.link:hover { color: #93c5fd; text-decoration: underline; }

.legal-text { font-size: 11px; color: #475569; margin-top: 15px; text-align: center; line-height: 1.5; }
.spinner { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-top-color: white; borderRadius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
`;

// Dynamic API Selection
const API_BASE = window.location.hostname === "localhost" 
    ? "http://localhost:5000/api" 
    : "https://smart-menu-app-production.up.railway.app/api";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "", 
    phoneNumber: "", // ✅ Added Phone Number
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError("");

    // 1. CLEAN DATA
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

      // 4. PREPARE PAYLOAD
      // Note: We send 'phoneNumber' here. Make sure backend accepts it!
      // If backend ignores it, it won't break anything, just won't save.
      const payload = {
        restaurantName: formData.restaurantName.trim(),
        username: cleanUsername,
        phoneNumber: formData.phoneNumber, // ✅ Sending Phone Number
        password: formData.password,
        email: autoEmail, 
        trialEndsAt: freeAccessDate.toISOString() 
      };

      const res = await axios.post(`${API_BASE}/auth/register`, payload);
      
      if ("vibrate" in navigator) navigator.vibrate(50);
      navigate("/login");

    } catch (err) {
      console.error("Registration Error:", err);
      const msg = err.response?.data?.message || "Network Error. Is the backend live?";
      if (msg.includes("duplicate")) {
          setError("That Unique ID is already taken. Try another.");
      } else {
          setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="register-container">
        <div className="glow-spot top-right"></div>
        <div className="glow-spot bottom-left"></div>

        <div className="register-card">
          <div className="header">
            <h1>Kovixa Access</h1>
            <p>Claim your 100-Year Free License</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleRegister}>
            {/* 1. Restaurant Name */}
            <div className="input-group">
              <label className="label">Restaurant Name</label>
              <div className="wrapper">
                <FaStore className="input-icon" />
                <input 
                  className="input"
                  name="restaurantName"
                  placeholder="e.g. Biryani House" 
                  value={formData.restaurantName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 2. Unique ID */}
            <div className="input-group">
              <label className="label">Unique ID (Login Username)</label>
              <div className="wrapper">
                <FaUser className="input-icon" />
                <input 
                  className="input"
                  name="username"
                  placeholder="e.g. biryanihouse1" 
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 3. Phone Number (NEW) */}
            <div className="input-group">
              <label className="label">Owner Phone Number</label>
              <div className="wrapper">
                <FaPhone className="input-icon" />
                <input 
                  className="input"
                  name="phoneNumber"
                  type="tel"
                  placeholder="e.g. 9876543210" 
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 4. Password */}
            <div className="input-group">
              <label className="label">Secure Password</label>
              <div className="wrapper">
                <FaLock className="input-icon" />
                <input 
                  className="input"
                  type="password"
                  name="password"
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? <div className="spinner"></div> : <>ACTIVATE LICENSE <FaArrowRight /></>}
            </button>
          </form>

          <div className="footer">
            Already a partner? <Link to="/login" className="link">Login Here</Link>
          </div>

          <p className="legal-text">
            By registering, you agree to our 
            <Link to="/terms" style={{ color: '#60a5fa', textDecoration:'none', marginLeft: '4px', fontWeight:'700' }}>Terms & Privacy Policy</Link>
          </p>
          
          <div style={{textAlign:'center', marginTop:20, opacity:0.5}}>
             <span style={{fontSize:10, textTransform:'uppercase', letterSpacing:1, border:'1px solid #334155', padding:'4px 8px', borderRadius:20}}>
                <FaNetworkWired size={8} style={{marginRight:4}}/> Secure SSL
             </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;