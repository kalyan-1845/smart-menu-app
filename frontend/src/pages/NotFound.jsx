import React from "react";
import { Link } from "react-router-dom";
import { FaUtensils, FaHome, FaExclamationTriangle } from "react-icons/fa";

const NotFound = () => {
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .floating-icon { animation: float 3s ease-in-out infinite; }
      `}</style>

      <div style={styles.content}>
        <div className="floating-icon" style={styles.iconWrapper}>
          <FaUtensils size={80} color="#f97316" />
        </div>
        
        <h1 style={styles.errorCode}>404</h1>
        <h2 style={styles.title}>Kitchen is Empty!</h2>
        <p style={styles.message}>
          The page you are looking for has been cleared from the table or never existed.
        </p>

        <div style={styles.actionGap}>
          <Link to="/" style={styles.homeBtn}>
            <FaHome /> Back to Home
          </Link>
          <Link to="/login" style={styles.loginBtn}>
            Partner Login
          </Link>
        </div>
      </div>
      
      <footer style={styles.footer}>
        Kovixa Cloud OS • Error Reference: NULL_ROUTE
      </footer>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#050505",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    fontFamily: "'Inter', sans-serif",
    textAlign: "center"
  },
  content: { maxWidth: "450px" },
  iconWrapper: { marginBottom: "30px", opacity: 0.8 },
  errorCode: { 
    fontSize: "120px", 
    fontWeight: "900", 
    margin: 0, 
    lineHeight: 1, 
    background: "linear-gradient(180deg, #f97316 0%, #444 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-5px"
  },
  title: { fontSize: "28px", fontWeight: "800", marginBottom: "15px" },
  message: { color: "#71717a", lineHeight: "1.6", marginBottom: "40px" },
  actionGap: { display: "flex", flexDirection: "column", gap: "15px" },
  homeBtn: { 
    background: "#f97316", 
    color: "#fff", 
    textDecoration: "none", 
    padding: "18px", 
    borderRadius: "15px", 
    fontWeight: "800", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: "10px" 
  },
  loginBtn: { 
    background: "#111", 
    color: "#fff", 
    border: "1px solid #222", 
    textDecoration: "none", 
    padding: "15px", 
    borderRadius: "15px", 
    fontWeight: "700" 
  },
  footer: { position: "absolute", bottom: "30px", color: "#222", fontSize: "10px", fontWeight: "900", letterSpacing: "1px" }
};

export default NotFound;