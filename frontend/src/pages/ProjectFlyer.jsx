import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { 
  FaRocket, FaQrcode, FaUtensils, FaMobileAlt, FaWifi, 
  FaMoneyBillWave, FaConciergeBell, FaChartLine, FaPhone, 
  FaMapMarkerAlt, FaEnvelope, FaSearchPlus, FaSearchMinus, 
  FaRedo, FaCamera, FaSpinner, FaCheckCircle, FaCogs, FaShieldAlt
} from "react-icons/fa";

const ProjectFlyer = () => {
  const flyerRef = useRef(null);
  const [scale, setScale] = useState(0.8);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Handle auto-scaling for mobile screens
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) setScale(window.innerWidth / 1100); // Auto-fit to mobile width
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDownload = async () => {
    if (!flyerRef.current) return;
    setIsExporting(true);
    try {
      await document.fonts.ready;
      const canvas = await html2canvas(flyerRef.current, {
        scale: 3, // High resolution for print
        useCORS: true,
        backgroundColor: "#020617",
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = "KOVIXA_SmartResto_Flyer.png";
      link.click();
    } catch (error) {
      alert("Export failed. Try on a desktop browser.");
    } finally {
      setIsExporting(false);
    }
  };

  const adjustZoom = (delta) => setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2));

  return (
    <div style={styles.workspace}>
      
      {/* 🛠️ NAVIGATION & CONTROLS */}
      <div style={styles.toolbar}>
        {!isMobileView && (
          <div style={styles.zoomGroup}>
            <button onClick={() => adjustZoom(-0.1)} style={styles.toolBtn}><FaSearchMinus /></button>
            <span style={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
            <button onClick={() => adjustZoom(0.1)} style={styles.toolBtn}><FaSearchPlus /></button>
          </div>
        )}
        <button onClick={handleDownload} disabled={isExporting} style={styles.downloadBtn}>
          {isExporting ? <FaSpinner className="spin" /> : <FaCamera />}
          <span>{isExporting ? " RENDERING..." : " DOWNLOAD 4K POSTER"}</span>
        </button>
      </div>

      <div style={styles.scrollArea}>
        <div style={{ ...styles.scaler, transform: `scale(${scale})` }}>
          
          {/* 🖼️ THE FLYER DESIGN */}
          <div ref={flyerRef} style={styles.flyer}>
            
            <div style={styles.glowTop}></div>

            {/* HEADER */}
            <header style={styles.header}>
              <div style={styles.brandBox}>
                <h1 style={styles.logoText}>KOVIXA</h1>
                <p style={styles.tagline}>NEXT-GEN RESTAURANT OS</p>
              </div>
              <div style={styles.developerBox}>
                <span style={styles.devLabel}>ARCHITECTED BY</span>
                <h2 style={styles.devName}>B. Kalyan Reddy</h2>
              </div>
            </header>

            {/* HERO */}
            <section style={styles.heroSection}>
              <h2 style={styles.mainTitle}>Stop Managing. <br/><span style={styles.blueText}>Start Scaling.</span></h2>
              <p style={styles.heroSub}>A high-performance Full-Stack ecosystem that connects your customers, kitchen, and management in one real-time pipeline.</p>
            </section>

            {/* FEATURES GRID */}
            <div style={styles.grid}>
              
              <div style={styles.card}>
                <FaQrcode style={styles.cardIcon} />
                <h3 style={styles.cardTitle}>Contactless Core</h3>
                <ul style={styles.list}>
                  <li><FaCheckCircle style={styles.check}/> URL-Locked QR Tables</li>
                  <li><FaCheckCircle style={styles.check}/> No-Install PWA App</li>
                  <li><FaCheckCircle style={styles.check}/> Isolated Session Carts</li>
                </ul>
              </div>

              <div style={styles.card}>
                <FaUtensils style={styles.cardIcon} />
                <h3 style={styles.cardTitle}>Kitchen Intel</h3>
                <ul style={styles.list}>
                  <li><FaCheckCircle style={styles.check}/> Real-time Socket.io KOT</li>
                  <li><FaCheckCircle style={styles.check}/> One-Tap Stock Toggle</li>
                  <li><FaCheckCircle style={styles.check}/> Auto-Audio New Order Alert</li>
                </ul>
              </div>

              <div style={styles.card}>
                <FaShieldAlt style={styles.cardIcon} />
                <h3 style={styles.cardTitle}>Owner Control</h3>
                <ul style={styles.list}>
                  <li><FaCheckCircle style={styles.check}/> 256-bit Secure Staff Login</li>
                  <li><FaCheckCircle style={styles.check}/> Master Revenue Analytics</li>
                  <li><FaCheckCircle style={styles.check}/> Bulk QR Sticker Generator</li>
                </ul>
              </div>

              <div style={styles.card}>
                <FaConciergeBell style={styles.cardIcon} />
                <h3 style={styles.cardTitle}>Smart Service</h3>
                <ul style={styles.list}>
                  <li><FaCheckCircle style={styles.check}/> Digital Waiter Calling</li>
                  <li><FaCheckCircle style={styles.check}/> Dual-Printer Bluetooth Bills</li>
                  <li><FaCheckCircle style={styles.check}/> Feedback & Rating System</li>
                </ul>
              </div>
            </div>

            {/* TECH STACK FOOTER */}
            <div style={styles.techBar}>
              <div style={styles.techItem}><FaRocket/> MERN STACK</div>
              <div style={styles.techItem}><FaWifi/> WEBSOCKETS</div>
              <div style={styles.techItem}><FaMobileAlt/> RESPONSIVE</div>
            </div>

            <footer style={styles.footer}>
              <div style={styles.contactCapsule}><FaPhone/> +91 63050 13340</div>
              <div style={styles.contactCapsule}><FaEnvelope/> bitebox.web@gmail.com</div>
              <div style={styles.contactCapsule}><FaMapMarkerAlt/> Hyderabad, IN</div>
            </footer>

          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  workspace: { height: "100vh", width: "100vw", background: "#020617", display: "flex", flexDirection: "column", overflow: "hidden" },
  toolbar: { height: "70px", background: "rgba(15, 23, 42, 0.8)", backdropFilter: "blur(10px)", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", zIndex: 100, padding: "0 15px" },
  zoomGroup: { display: "flex", alignItems: "center", gap: "12px", background: "#0f172a", padding: "6px 12px", borderRadius: "10px", border: "1px solid #334155" },
  toolBtn: { background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "18px" },
  zoomLabel: { color: "#fff", fontSize: "14px", fontWeight: "bold", minWidth: "45px", textAlign: "center" },
  downloadBtn: { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" },
  
  scrollArea: { flex: 1, overflow: "auto", display: "flex", justifyContent: "center", paddingTop: "50px", background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)" },
  scaler: { transition: "transform 0.1s ease-out", transformOrigin: "top center" },
  
  flyer: { width: "1000px", minHeight: "1414px", background: "#020617", padding: "80px", position: "relative", overflow: "hidden", color: "white", border: "1px solid #1e293b", boxShadow: "0 50px 100px rgba(0,0,0,0.5)" },
  glowTop: { position: "absolute", top: "-150px", left: "50%", transform: "translateX(-50%)", width: "800px", height: "400px", background: "rgba(59, 130, 246, 0.15)", filter: "blur(120px)" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "80px", borderBottom: "1px solid #1e293b", paddingBottom: "30px" },
  logoText: { fontSize: "80px", fontWeight: "950", margin: 0, letterSpacing: "-5px", background: "linear-gradient(to bottom, #fff, #64748b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  tagline: { fontSize: "16px", letterSpacing: "8px", color: "#3b82f6", fontWeight: "900", margin: "5px 0 0 5px" },
  developerBox: { textAlign: "right" },
  devLabel: { fontSize: "12px", color: "#64748b", fontWeight: "bold", letterSpacing: "2px" },
  devName: { fontSize: "28px", margin: 0, fontWeight: "800", color: "#cbd5e1" },

  heroSection: { textAlign: "center", marginBottom: "80px" },
  mainTitle: { fontSize: "70px", fontWeight: "900", lineHeight: 1, letterSpacing: "-3px", margin: 0 },
  blueText: { color: "#3b82f6" },
  heroSub: { fontSize: "22px", color: "#94a3b8", maxWidth: "800px", margin: "30px auto 0", lineHeight: 1.4 },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "80px" },
  card: { background: "rgba(30, 41, 59, 0.5)", border: "1px solid #1e293b", padding: "40px", borderRadius: "24px" },
  cardIcon: { fontSize: "40px", color: "#3b82f6", marginBottom: "20px" },
  cardTitle: { fontSize: "28px", fontWeight: "800", margin: "0 0 20px 0" },
  list: { listStyle: "none", padding: 0, margin: 0 },
  check: { color: "#10b981", marginRight: "10px" },

  techBar: { display: "flex", justifyContent: "center", gap: "50px", background: "#0f172a", padding: "25px", borderRadius: "20px", border: "1px solid #1e293b", marginBottom: "80px" },
  techItem: { fontSize: "18px", fontWeight: "900", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px" },

  footer: { display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", borderTop: "1px solid #1e293b", paddingTop: "50px" },
  contactCapsule: { background: "#1e293b", padding: "12px 25px", borderRadius: "50px", fontSize: "16px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px", border: "1px solid #334155" }
};

export default ProjectFlyer;