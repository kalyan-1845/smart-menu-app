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
  const [scale, setScale] = useState(0.6);
  const [isExporting, setIsExporting] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Auto-fit to screen on load
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) setScale(window.innerWidth / 1100); 
      else setScale(0.6);
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
        scale: 4, // Ultra 4K Quality for Print
        useCORS: true,
        backgroundColor: "#000000",
      });
      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = "KOVIXA_Project_Poster.png";
      link.click();
    } catch (error) {
      alert("Export failed. Please try on Desktop.");
    } finally {
      setIsExporting(false);
    }
  };

  const adjustZoom = (delta) => setScale(prev => Math.min(Math.max(prev + delta, 0.2), 2));

  return (
    <div style={styles.workspace}>
      
      {/* 🛠️ TOOLBAR (Hidden in Export) */}
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
          <span>{isExporting ? " GENERATING 4K..." : " DOWNLOAD POSTER"}</span>
        </button>
      </div>

      <div style={styles.scrollArea}>
        <div style={{ ...styles.scaler, transform: `scale(${scale})` }}>
          
          {/* 🖼️ THE POSTER CANVAS */}
          <div ref={flyerRef} style={styles.flyer}>
            
            {/* Background Effects */}
            <div style={styles.glowTop}></div>
            <div style={styles.glowBottom}></div>

            {/* HEADER */}
            <header style={styles.header}>
              <div style={styles.brandBox}>
                <h1 style={styles.logoText}>KOVIXA</h1>
                <div style={styles.tagBadge}>ENTERPRISE EDITION</div>
              </div>
              <div style={styles.developerBox}>
                <span style={styles.devLabel}>LEAD ARCHITECT</span>
                <h2 style={styles.devName}>B. Kalyan Reddy</h2>
                <span style={styles.devRole}>Full Stack Engineer</span>
              </div>
            </header>

            {/* HERO STATEMENT */}
            <section style={styles.heroSection}>
              <h2 style={styles.mainTitle}>
                The Future of <br/>
                <span style={styles.gradientText}>Restaurant Management.</span>
              </h2>
              <p style={styles.heroSub}>
                A complete Operating System for modern dining. 
                Seamlessly connecting customers, kitchens, and owners in real-time.
              </p>
            </section>

            {/* CORE MODULES GRID */}
            <div style={styles.grid}>
              
              <div style={styles.card}>
                <div style={styles.iconCircle}><FaQrcode size={32} /></div>
                <h3 style={styles.cardTitle}>Contactless Dining</h3>
                <p style={styles.cardDesc}>
                  QR-based ordering system. No app download required. 
                  Instant menu updates and session-based carts.
                </p>
              </div>

              <div style={styles.card}>
                <div style={styles.iconCircle}><FaUtensils size={32} /></div>
                <h3 style={styles.cardTitle}>Smart Kitchen (KDS)</h3>
                <p style={styles.cardDesc}>
                  Real-time order transmission via WebSockets. 
                  Chefs see orders instantly. Zero paper waste.
                </p>
              </div>

              <div style={styles.card}>
                <div style={styles.iconCircle}><FaShieldAlt size={32} /></div>
                <h3 style={styles.cardTitle}>Admin Command</h3>
                <p style={styles.cardDesc}>
                  Full inventory control, revenue analytics, and 
                  staff management from a secure dashboard.
                </p>
              </div>

              <div style={styles.card}>
                <div style={styles.iconCircle}><FaRocket size={32} /></div>
                <h3 style={styles.cardTitle}>Cloud Scalability</h3>
                <p style={styles.cardDesc}>
                  Built on the MERN Stack. Designed to handle 
                  millions of requests with 99.9% uptime.
                </p>
              </div>

            </div>

            {/* TECHNICAL SPECS */}
            <div style={styles.techSection}>
              <h4 style={styles.techTitle}>POWERED BY</h4>
              <div style={styles.techGrid}>
                <span style={styles.techTag}>MongoDB</span>
                <span style={styles.techTag}>Express.js</span>
                <span style={styles.techTag}>React.js</span>
                <span style={styles.techTag}>Node.js</span>
                <span style={styles.techTag}>Socket.io</span>
                <span style={styles.techTag}>JWT Auth</span>
              </div>
            </div>

            {/* CONTACT FOOTER */}
            <footer style={styles.footer}>
              <div style={styles.contactRow}>
                <div style={styles.contactItem}><FaPhone/> +91 63050 13340</div>
                <div style={styles.divider}></div>
                <div style={styles.contactItem}><FaEnvelope/> bitebox.web@gmail.com</div>
                <div style={styles.divider}></div>
                <div style={styles.contactItem}><FaMapMarkerAlt/> Hyderabad, India</div>
              </div>
              <p style={styles.copyright}>© 2026 Kovixa Systems. All Rights Reserved.</p>
            </footer>

          </div>
        </div>
      </div>
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const styles = {
  workspace: { height: "100vh", width: "100vw", background: "#111", display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" },
  
  toolbar: { height: "60px", background: "#0a0a0a", borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", gap: "20px", zIndex: 100 },
  zoomGroup: { display: "flex", alignItems: "center", gap: "10px", background: "#222", padding: "5px 10px", borderRadius: "8px" },
  toolBtn: { background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "16px" },
  zoomLabel: { color: "#fff", fontSize: "12px", fontWeight: "bold", width: "40px", textAlign: "center" },
  downloadBtn: { background: "#fff", color: "#000", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" },

  scrollArea: { flex: 1, overflow: "auto", display: "flex", justifyContent: "center", paddingTop: "40px", paddingBottom: "40px", background: "#111" },
  scaler: { transition: "transform 0.1s ease-out", transformOrigin: "top center" },

  // POSTER DESIGN
  flyer: { width: "1000px", minHeight: "1414px", background: "#000", padding: "80px", position: "relative", color: "white", border: "1px solid #333", display:'flex', flexDirection:'column' },
  
  glowTop: { position: "absolute", top: "-200px", left: "0", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)", filter: "blur(80px)" },
  glowBottom: { position: "absolute", bottom: "-200px", right: "0", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)", filter: "blur(80px)" },

  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "80px", borderBottom: "1px solid #222", paddingBottom: "40px" },
  logoText: { fontSize: "70px", fontWeight: "900", margin: 0, letterSpacing: "-3px" },
  tagBadge: { background: "#333", color: "#fff", padding: "6px 12px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginTop: "10px", letterSpacing: "2px" },
  developerBox: { textAlign: "right" },
  devLabel: { fontSize: "12px", color: "#666", fontWeight: "bold", letterSpacing: "2px", display:"block", marginBottom:"5px" },
  devName: { fontSize: "24px", margin: 0, fontWeight: "700", color: "#fff" },
  devRole: { fontSize: "14px", color: "#888" },

  heroSection: { marginBottom: "80px" },
  mainTitle: { fontSize: "80px", fontWeight: "800", lineHeight: 1, letterSpacing: "-4px", margin: "0 0 30px 0" },
  gradientText: { background: "linear-gradient(90deg, #fff, #666)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroSub: { fontSize: "24px", color: "#888", maxWidth: "700px", lineHeight: 1.5, fontWeight: "400" },

  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "80px" },
  card: { background: "#0a0a0a", border: "1px solid #222", padding: "40px", borderRadius: "20px" },
  iconCircle: { width: "60px", height: "60px", background: "#111", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", marginBottom: "20px", border: "1px solid #333" },
  cardTitle: { fontSize: "24px", fontWeight: "700", margin: "0 0 15px 0" },
  cardDesc: { fontSize: "16px", color: "#666", lineHeight: 1.6 },

  techSection: { marginBottom: "80px", textAlign: "center" },
  techTitle: { fontSize: "14px", color: "#444", letterSpacing: "3px", marginBottom: "30px", fontWeight: "800" },
  techGrid: { display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" },
  techTag: { border: "1px solid #333", padding: "10px 25px", borderRadius: "30px", fontSize: "14px", fontWeight: "600", color: "#888" },

  footer: { marginTop: "auto", borderTop: "1px solid #222", paddingTop: "40px", textAlign: "center" },
  contactRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: "30px", marginBottom: "20px" },
  contactItem: { display: "flex", alignItems: "center", gap: "10px", fontSize: "16px", fontWeight: "500", color: "#ccc" },
  divider: { width: "1px", height: "20px", background: "#333" },
  copyright: { color: "#444", fontSize: "14px" }
};

export default ProjectFlyer;