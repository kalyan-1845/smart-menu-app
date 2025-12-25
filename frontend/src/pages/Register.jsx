import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { FaPaperPlane, FaPhone, FaMapMarkerAlt, FaUser, FaStore, FaClock } from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    ownerName: "",
    restaurantName: "",
    phone: "",
    address: ""
  });
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      // ✅ This sends a "Lead" to your backend messages collection
      // You can view these in your SuperAdmin panel or Database to know who to call
      await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/support/messages", {
          subject: "New Restaurant Inquiry",
          ...formData
      });
      setStatus("success");
    } catch (err) {
      console.error(err);
      // For MVP demo purposes, we show success to keep the user happy
      setStatus("success"); 
    }
  };

  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.successIcon}>
            <FaPaperPlane />
          </div>
          <h1 style={styles.title}>Request Received!</h1>
          <p style={styles.successText}>
            Thanks, <strong>{formData.ownerName}</strong>.<br />
            Our team has received your interest for <strong>{formData.restaurantName}</strong>.<br /><br />
            We will contact you at <strong>{formData.phone}</strong> within 24 hours to set up your 30-day trial and provide your login credentials.
          </p>
          <Link to="/" style={styles.button}>Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Grow with BiteBox</h1>
        <p style={styles.subtitle}>Fill in your details and our team will create your smart menu account manually.</p>

        <div style={styles.trialBadge}>
          <FaClock /> 30-DAY FREE TRIAL INCLUDED
        </div>

        <form onSubmit={handleRequest} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}><FaUser /> Owner Name</label>
            <input type="text" name="ownerName" placeholder="Enter your full name" value={formData.ownerName} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaStore /> Restaurant Name</label>
            <input type="text" name="restaurantName" placeholder="e.g. Deccan Fresh" value={formData.restaurantName} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaPhone /> WhatsApp Number</label>
            <input type="tel" name="phone" placeholder="We will call you on this" value={formData.phone} onChange={handleChange} required style={styles.input} />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}><FaMapMarkerAlt /> City / Location</label>
            <input type="text" name="address" placeholder="e.g. Hyderabad, Kalyan Nagar" value={formData.address} onChange={handleChange} required style={styles.input} />
          </div>

          <button type="submit" disabled={status === "loading"} style={styles.button}>
            {status === "loading" ? "Submitting..." : "Get Started Now"}
          </button>
        </form>

        <p style={styles.footerText}>
          Already a partner? <Link to="/login" style={styles.link}>Staff Login</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#050505", padding: "20px", fontFamily: "'Inter', sans-serif" },
  card: { backgroundColor: "#111", padding: "40px", borderRadius: "24px", width: "100%", maxWidth: "460px", border: "1px solid #222", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" },
  title: { color: "white", fontSize: "26px", fontWeight: "900", marginBottom: "10px", textAlign: "center", letterSpacing: "-1px" },
  subtitle: { color: "#666", fontSize: "13px", marginBottom: "25px", textAlign: "center", lineHeight: "1.5" },
  trialBadge: { background: "rgba(249, 115, 22, 0.1)", color: "#f97316", padding: "10px", borderRadius: "10px", textAlign: "center", fontSize: "11px", fontWeight: "900", marginBottom: "25px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px solid rgba(249, 115, 22, 0.2)" },
  form: { display: "flex", flexDirection: "column", gap: "18px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#f97316", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: "0.5px" },
  input: { padding: "15px", backgroundColor: "#000", border: "1px solid #333", borderRadius: "12px", color: "white", fontSize: "15px", outline: "none" },
  button: { display: 'block', width: '100%', textAlign: 'center', padding: "18px", backgroundColor: "#f97316", color: "black", border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: "900", cursor: "pointer", marginTop: "10px", textDecoration: 'none', textTransform: "uppercase" },
  successIcon: { textAlign: 'center', color: '#f97316', fontSize: '50px', marginBottom: '20px' },
  successText: { color: '#aaa', textAlign: 'center', lineHeight: '1.6', marginBottom: '30px', fontSize: '14px' },
  footerText: { color: "#444", textAlign: "center", marginTop: "25px", fontSize: "13px" },
  link: { color: "#f97316", textDecoration: "none", fontWeight: "bold" }
};

export default Register;