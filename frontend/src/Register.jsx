import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

// 🚀 REGISTRATION COMPONENT
const Register = () => {
  const navigate = useNavigate();

  // --- 1. STATE MANAGEMENT ---
  const [formData, setFormData] = useState({
    restaurantName: "",
    username: "",
    email: "",
    password: ""
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // --- 2. LOGIC: AUTO-GENERATE EMAIL ---
  const handleNameChange = (e) => {
    const rawName = e.target.value;
    
    // Create a clean ID: remove spaces, special chars, and make lowercase
    // Example: "Kalyan Resto & Bar" -> "kalyanrestobar"
    const cleanId = rawName.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

    setFormData({
      restaurantName: rawName,
      username: cleanId,             // Auto-fill Username
      email: cleanId ? `${cleanId}@gmail.com` : "", // Auto-fill Email
      password: formData.password    // Keep password same
    });
  };

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, password: e.target.value });
  };

  // --- 3. SUBMIT HANDLER ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if(!formData.username) {
        setError("Please enter a valid restaurant name.");
        setLoading(false);
        return;
    }

    try {
      // Adjust this URL to match your actual backend URL
      const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", formData);
      
      // If successful, save token and redirect
      if (res.data) {
        alert("Registration Successful! Please Login.");
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Server error. Try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 4. RENDER ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* HEADER */}
        <h1 style={styles.title}>🚀 Launch Your Menu</h1>
        <p style={styles.subtitle}>Create your restaurant account and start taking orders.</p>

        {/* ERROR MESSAGE */}
        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* 1. RESTAURANT NAME (Main Input) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Restaurant Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Kalyan Resto"
              value={formData.restaurantName}
              onChange={handleNameChange}
              style={styles.input}
            />
          </div>

          {/* 2. USERNAME (Auto-Filled & Read-Only) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username (Public ID)</label>
            <input
              type="text"
              readOnly
              value={formData.username}
              style={{ ...styles.input, ...styles.readOnlyInput }}
              title="Auto-generated from restaurant name"
            />
          </div>

          {/* 3. EMAIL (Auto-Filled & Read-Only - BLOCKED PERSONAL EMAILS) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Business Email (Security Locked)</label>
            <input
              type="email"
              readOnly
              value={formData.email}
              style={{ ...styles.input, ...styles.readOnlyInput }}
              title="Email is locked to the restaurant name for security"
            />
            <p style={styles.helperText}>*Email is automatically generated to prevent duplicates.</p>
          </div>

          {/* 4. PASSWORD */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={handlePasswordChange}
              style={styles.input}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading} 
            style={loading ? styles.buttonDisabled : styles.button}
          >
            {loading ? "Creating Account..." : "Create Account & Access 🚀"}
          </button>

        </form>

        {/* FOOTER */}
        <div style={styles.footer}>
            Already have a restaurant account? 
            <Link to="/login" style={styles.link}> Log In Here</Link>
        </div>
        <div style={styles.version}>
            Restaurant SaaS Platform v2.0 • Data Encryption Active
        </div>

      </div>
    </div>
  );
};

// --- INLINE STYLES (No CSS File Needed) ---
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#000",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
    color: "#fff",
  },
  card: {
    width: "100%",
    maxWidth: "450px",
    padding: "10px", // Minimal padding to match your screenshot
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    marginBottom: "10px",
    marginTop: "0",
  },
  subtitle: {
    color: "#ccc",
    marginBottom: "20px",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: "14px",
    marginBottom: "5px",
    color: "#ddd",
  },
  input: {
    padding: "12px",
    borderRadius: "4px",
    border: "1px solid #444",
    backgroundColor: "#222",
    color: "#fff",
    fontSize: "16px",
    outline: "none",
  },
  readOnlyInput: {
    backgroundColor: "#333", // Darker background to show it's locked
    color: "#888",
    cursor: "not-allowed",
    border: "1px solid #333",
  },
  button: {
    padding: "15px",
    backgroundColor: "#666", // Greyish button like in screenshot
    color: "#fff",
    border: "none",
    borderRadius: "20px", // Rounded pill shape
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    transition: "background 0.3s",
  },
  buttonDisabled: {
    padding: "15px",
    backgroundColor: "#444",
    color: "#888",
    border: "none",
    borderRadius: "20px",
    cursor: "not-allowed",
    marginTop: "10px",
  },
  errorBox: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    border: "1px solid red",
    color: "red",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "15px",
    fontSize: "14px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "14px",
    color: "#ccc",
  },
  link: {
    color: "#4a90e2",
    textDecoration: "none",
    marginLeft: "5px",
  },
  helperText: {
    fontSize: "11px",
    color: "#666",
    marginTop: "4px",
    fontStyle: "italic"
  },
  version: {
    marginTop: "30px",
    fontSize: "12px",
    color: "#fff",
    borderTop: "1px solid #333",
    paddingTop: "10px"
  }
};

export default Register;