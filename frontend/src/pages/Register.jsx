import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "", // ✅ ADDED: Required by Backend
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
      await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/auth/register", formData);
      alert("Registration Successful! Please Login.");
      navigate("/login");
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
        
        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          {/* Owner Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Owner Name</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required style={styles.input} />
          </div>

          {/* ✅ NEW EMAIL FIELD */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input type="email" name="email" placeholder="owner@example.com" value={formData.email} onChange={handleChange} required style={styles.input} />
          </div>

          {/* Restaurant Name */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Restaurant Name</label>
            <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleChange} required style={styles.input} />
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={styles.input} />
          </div>

          {/* Address */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} style={styles.input} />
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

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#050505", padding: "20px", fontFamily: "'Inter', sans-serif" },
  card: { backgroundColor: "#111", padding: "40px", borderRadius: "20px", width: "100%", maxWidth: "450px", border: "1px solid #222" },
  title: { color: "white", fontSize: "24px", fontWeight: "bold", marginBottom: "20px", textAlign: "center" },
  error: { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "10px", borderRadius: "8px", marginBottom: "20px", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "15px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "5px" },
  label: { color: "#888", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase" },
  input: { padding: "12px", backgroundColor: "#050505", border: "1px solid #333", borderRadius: "8px", color: "white", fontSize: "16px", outline: "none" },
  button: { padding: "15px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  footerText: { color: "#666", textAlign: "center", marginTop: "20px", fontSize: "14px" },
  link: { color: "#f97316", textDecoration: "none", fontWeight: "bold" }
};

export default Register;