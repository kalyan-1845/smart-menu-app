import React from "react";
import { FaTools, FaClock, FaBox } from "react-icons/fa";

const Maintenance = () => {
  // ✅ Moving styles INSIDE the function to prevent ReferenceErrors in production
  const styles = {
    container: { 
      height: "100vh", 
      background: "#050505", 
      color: "#fff", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      fontFamily: "'Inter', sans-serif", 
      textAlign: "center", 
      padding: "20px",
      position: 'relative' 
    },
    content: { maxWidth: "450px" },
    iconWrapper: { marginBottom: "30px" },
    brand: { 
      fontSize: "14px", 
      fontWeight: "900", 
      color: "#444", 
      marginBottom: "20px", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: "8px", 
      letterSpacing: "2px" 
    },
    title: { fontSize: "32px", fontWeight: "900", marginBottom: "15px", letterSpacing: "-1px" },
    text: { color: "#a1a1aa", lineHeight: "1.6", marginBottom: "30px", fontSize: "15px" },
    timeBox: { 
      background: "#0a0a0a", 
      border: "1px solid #111", 
      padding: "15px 25px", 
      borderRadius: "15px", 
      display: "inline-flex", 
      alignItems: "center", 
      gap: "10px", 
      fontSize: "13px", 
      fontWeight: "700" 
    },
    footer: { 
      position: "absolute", 
      bottom: "30px", 
      color: "#222", 
      fontSize: "10px", 
      fontWeight: "900", 
      letterSpacing: "1px",
      width: "100%",
      left: 0
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gear-spin { animation: rotate 4s linear infinite; }
      `}</style>

      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <FaTools className="gear-spin" size={60} color="#f97316" />
        </div>
        
        <div style={styles.brand}>
          <FaBox color="#f97316" /> BiteBox OS
        </div>
        
        <h1 style={styles.title}>System Upgrade in Progress</h1>
        <p style={styles.text}>
          We are currently polishing the gears to make your experience faster. 
          Orders are temporarily paused and will resume shortly.
        </p>
        
        <div style={styles.timeBox}>
          <FaClock color="#f97316" />
          <span>Expected Uptime: Within 15-30 minutes</span>
        </div>
      </div>
      
      <footer style={styles.footer}>
        BiteBox Global Network • Status: MAINTENANCE_MODE_ACTIVE
      </footer>
    </div>
  );
};

export default Maintenance;