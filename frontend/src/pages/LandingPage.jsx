import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaQrcode, FaArrowRight, FaSpinner, FaUtensils } from "react-icons/fa";

const LandingPage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRedirect = () => {
        const lastResId = localStorage.getItem("activeResId");
        const lastTable = localStorage.getItem("activeTable");

        // If we have data, try to go there
        if (lastResId && lastResId.length > 10) { 
            if (lastTable) {
                navigate(`/menu/${lastResId}/${lastTable}`);
            } else {
                navigate(`/menu/${lastResId}`);
            }
        } else {
            // No data? Stop loading and show the scan button
            setChecking(false);
        }
    };

    // 🛡️ SAFETY TIMER: If check takes > 2 seconds, stop waiting
    const timer = setTimeout(() => {
        setChecking(false);
    }, 2000);

    checkRedirect();
    
    return () => clearTimeout(timer);
  }, [navigate]);

  // LOADING VIEW
  if (checking) return (
    <div style={{ height: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", color: "#f97316" }}>
      <div className="spinner"></div>
      <p style={{ marginTop: "20px", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" }}>BITEBOX SYSTEM</p>
      <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #f97316; border-radius: 50%; animation: spin 0.8s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // MAIN VIEW
  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div style={styles.iconBox}><FaUtensils /></div>
        <h1 style={styles.title}>BiteBox</h1>
        <p style={styles.subtitle}>Scan. Order. Eat.</p>
        
        <div style={styles.card}>
            <p style={{ color: '#888', marginBottom: '20px', fontSize: '14px', lineHeight: '1.5' }}>
                Welcome back! Please scan the QR code on your table to view the menu.
            </p>
            <button style={styles.btn} onClick={() => alert("Open your Camera app to scan!")}>
                <FaQrcode /> SCAN QR CODE
            </button>
        </div>

        <div style={{ marginTop: '40px' }}>
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
  iconBox: { width: '60px', height: '60px', background: 'rgba(249, 115, 22, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#f97316', fontSize: '24px' },
  title: { fontSize: "32px", fontWeight: "900", margin: "0", letterSpacing: "-1px" },
  subtitle: { color: "#666", fontSize: "14px", fontWeight: "600", marginBottom: "40px", marginTop: "5px" },
  card: { background: "#111", padding: "30px", borderRadius: "24px", border: "1px solid #222" },
  btn: { width: "100%", padding: "16px", background: "#f97316", color: "white", border: "none", borderRadius: "14px", fontWeight: "800", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", boxShadow: "0 4px 15px rgba(249, 115, 22, 0.2)" },
  linkBtn: { background: "none", border: "none", color: "#444", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", margin: "0 auto", fontWeight: "600" }
};

export default LandingPage;