import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "", // ✅ ADDED: Email field to prevent 500 Error
    password: "",
    restaurantName: "",
    address: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ Using the dynamic URL based on where the app is running
      // If you are on localhost, ensure your api.js/axios config points to localhost:5000
      // If you are on Netlify, this points to Render.
      const API_URL = "https://smart-menu-backend-5ge7.onrender.com/api/auth/register";
      
      await axios.post(API_URL, formData);
      
      alert("Registration Successful! Please Login.");
      navigate("/login"); // Redirects to login after success
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Partner Registration</h1>
        <p style={styles.subtitle}>Join Smart Menu & Digitize Your Restaurant</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          
          {/* USERNAME */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Owner Username</label>
            <input
              type="text"
              name="username"
              placeholder="e.g. kalyanresto"
              value={formData.username}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* EMAIL (Crucial for DB Validation) */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. kalyan@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* RESTAURANT NAME */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Restaurant Name</label>
            <input
              type="text"
              name="restaurantName"
              placeholder="e.g. Spicy Kitchen"
              value={formData.restaurantName}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* PASSWORD */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* ADDRESS */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Address (Optional)</label>
            <input
              type="text"
              name="address"
              placeholder="City, Area"
              value={formData.address}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Creating Account..." : "Register Restaurant"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account? <Link to="/login" style={styles.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
};

// --- STYLES (Dark Theme) ---
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050505",
    padding: "20px",
    fontFamily: "'Inter', sans-serif"
  },
  card: {
    backgroundColor: "#111",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "450px",
    border: "1px solid #222",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
  },
  title: {
    color: "white",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center"
  },
  subtitle: {
    color: "#888",
    fontSize: "14px",
    marginBottom: "30px",
    textAlign: "center"
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "14px",
    textAlign: "center"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  label: {
    color: "#ccc",
    fontSize: "12px",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    padding: "15px",
    backgroundColor: "#050505",
    border: "1px solid #333",
    borderRadius: "10px",
    color: "white",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s"
  },
  button: {
    padding: "18px",
    backgroundColor: "#f97316",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
    transition: "background 0.2s"
  },
  footerText: {
    color: "#666",
    textAlign: "center",
    marginTop: "25px",
    fontSize: "14px"
  },
  link: {
    color: "#f97316",
    textDecoration: "none",
    fontWeight: "bold"
  }
};

export default Register;