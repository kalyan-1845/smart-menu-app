import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaArrowRight, FaSpinner } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // 1. SMART REDIRECT CHECK
    const lastResId = localStorage.getItem("activeResId");
    const lastTable = localStorage.getItem("activeTable");

    if (lastResId) {
      // If we know the restaurant, GO THERE IMMEDIATELY
      if (lastTable) {
        navigate(`/menu/${lastResId}/${lastTable}`);
      } else {
        navigate(`/menu/${lastResId}`);
      }
    } else {
      // New user? Stay here.
      setChecking(false);
    }
  }, [navigate]);

  if (checking) return (
    <div style={{ height: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#f97316" }}>
      <FaSpinner className="spin" size={40} />
      <p style={{ marginTop: "15px", fontWeight: "bold", fontSize: "12px" }}>ENTERING RESTAURANT...</p>
      <style>{`.spin { animation: spin 0.8s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // --- DEFAULT LANDING VIEW (For New Users) ---
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <img src="/logo192.png" alt="Logo" style={{ width: '80px', marginBottom: '20px' }} />
        <h1 style={styles.title}>BiteBox</h1>
        <p style={styles.subtitle}>The Future of Dining</p>
        
        <div style={styles.card}>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px' }}>
                Please scan the QR code on your table to access the menu.
            </p>
            <button style={styles.btn} onClick={() => alert("Please open your camera app to scan the QR code!")}>
                <FaQrcode /> SCAN QR CODE
            </button>
        </div>

        <div style={{ marginTop: '30px' }}>
            <button onClick={() => navigate('/login')} style={styles.linkBtn}>
                Restaurant Owner Login <FaArrowRight />
            </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "#050505", color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: 'Inter, sans-serif' },
  hero: { textAlign: "center", maxWidth: "400px", width: "100%" },
  title: { fontSize: "40px", fontWeight: "900", margin: "0", letterSpacing: "-1px" },
  subtitle: { color: "#f97316", fontSize: "16px", fontWeight: "600", marginBottom: "40px" },
  card: { background: "#111", padding: "30px", borderRadius: "20px", border: "1px solid #222" },
  btn: { width: "100%", padding: "15px", background: "#f97316", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer" },
  linkBtn: { background: "none", border: "none", color: "#666", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", margin: "0 auto" }
};

export default LandingPage;