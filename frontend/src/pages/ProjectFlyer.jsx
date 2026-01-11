import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { 
  FaRocket, FaQrcode, FaUtensils, FaMobileAlt, FaWifi, 
  FaMoneyBillWave, FaConciergeBell, FaChartLine, FaPhone, 
  FaMapMarkerAlt, FaEnvelope, FaSearchPlus, FaSearchMinus, 
  FaRedo, FaCamera, FaSpinner, FaCheckCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast"; // Optional, remove if not using toast

const ProjectFlyer = () => {
  const flyerRef = useRef(null);
  const [scale, setScale] = useState(0.8); // Default zoomed out a bit to fit screens
  const [isExporting, setIsExporting] = useState(false);

  // --- 📸 4K SCREENSHOT LOGIC ---
  const handleDownload = async () => {
    if (!flyerRef.current) return;
    setIsExporting(true);
    
    try {
      // Wait for font rendering
      await document.fonts.ready;

      const canvas = await html2canvas(flyerRef.current, {
        scale: 4, // ⚡ FORCE 4X RESOLUTION (High Quality)
        useCORS: true, // Allow external images
        backgroundColor: "#050505", // Ensure background isn't transparent
        logging: false,
        width: flyerRef.current.offsetWidth,
        height: flyerRef.current.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: flyerRef.current.scrollWidth,
        windowHeight: flyerRef.current.scrollHeight
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = "KOVIXA_4K_Poster.png";
      link.click();
      
      // Optional: Toast notification
      if(window.alert) alert("4K Poster Downloaded Successfully!"); 
    } catch (error) {
      console.error("Export Failed", error);
      alert("Failed to export. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const adjustZoom = (delta) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.4), 2));
  };

  return (
    <div style={styles.workspace}>
      
      {/* --- 🎮 FLOATING CONTROLS --- */}
      <div style={styles.toolbar}>
        <div style={styles.zoomGroup}>
          <button onClick={() => adjustZoom(-0.1)} style={styles.toolBtn} title="Zoom Out"><FaSearchMinus /></button>
          <span style={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
          <button onClick={() => adjustZoom(0.1)} style={styles.toolBtn} title="Zoom In"><FaSearchPlus /></button>
          <button onClick={() => setScale(0.8)} style={styles.toolBtn} title="Reset"><FaRedo /></button>
        </div>
        <div style={styles.divider}></div>
        <button 
          onClick={handleDownload} 
          disabled={isExporting}
          style={{...styles.downloadBtn, opacity: isExporting ? 0.7 : 1}}
        >
          {isExporting ? <FaSpinner className="spin" /> : <FaCamera />}
          {isExporting ? " RENDERING 4K..." : " SAVE AS 4K IMAGE"}
        </button>
      </div>

      {/* --- 📄 FLYER CONTAINER (SCROLLABLE) --- */}
      <div style={styles.scrollArea}>
        <div 
          style={{
            ...styles.scaler,
            transform: `scale(${scale})`,
            transformOrigin: 'top center'
          }}
        >
          {/* --- 🖼️ ACTUAL DESIGN (TARGET FOR SCREENSHOT) --- */}
          <div ref={flyerRef} style={styles.flyer}>
            
            {/* BACKGROUND ACCENTS */}
            <div style={styles.glowTop}></div>
            <div style={styles.glowBottom}></div>

            {/* --- HEADER --- */}
            <header style={styles.header}>
              <div style={styles.brandBox}>
                <h1 style={styles.lalaTitle}>KOVIXA</h1>
                <div style={styles.taglineBox}>
                  <div style={styles.line}></div>
                  <span style={styles.tagline}>SMART RESTO SOLUTIONS</span>
                  <div style={styles.line}></div>
                </div>
              </div>
              <div style={styles.developerInfo}>
                <h2 style={styles.devName}>Bhoompally Kalyan Reddy</h2>
                <div style={styles.badge}>FOUNDER & LEAD DEV</div>
              </div>
            </header>

            {/* --- HERO SECTION --- */}
            <div style={styles.hero}>
              <h2 style={styles.heroText}>
                The Future of <span style={styles.gradientText}>Contactless Dining</span> is Here.
              </h2>
              <p style={styles.heroSub}>
                A complete Full-Stack ecosystem managing Orders, Kitchen, and Service in real-time. Built for speed, scale, and reliability.
              </p>
            </div>

            {/* --- FEATURES GRID --- */}
            <div style={styles.grid}>
              
              {/* CARD 1: CUSTOMER */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}><FaQrcode /></div>
                  <h3 style={styles.cardTitle}>Customer Experience</h3>
                </div>
                <ul style={styles.list}>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Scan & Order:</strong> No App Download (PWA).</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Smart Menu:</strong> Search, Filter & Categories.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Live Tracking:</strong> Real-time order status.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Seamless:</strong> Designed for Mobile First.</li>
                </ul>
              </div>

              {/* CARD 2: KITCHEN (CHEF) */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}><FaUtensils /></div>
                  <h3 style={styles.cardTitle}>Kitchen Dashboard</h3>
                </div>
                <ul style={styles.list}>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Audio Alerts:</strong> "Ding" sound on new orders.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Stock Control:</strong> Toggle Item Availability.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Workflow:</strong> Pending &rarr; Cooking &rarr; Ready.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>KOT View:</strong> Clear, big text for Chefs.</li>
                </ul>
              </div>

              {/* CARD 3: WAITER & SERVICE */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}><FaConciergeBell /></div>
                  <h3 style={styles.cardTitle}>Smart Service</h3>
                </div>
                <ul style={styles.list}>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Digital Bell:</strong> Waiter Calling System.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Digital Receipts:</strong> PDF Generation.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Socket.io:</strong> Zero latency sync.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Offline Mode:</strong> Works on spotty WiFi.</li>
                </ul>
              </div>

              {/* CARD 4: ADMIN POWER */}
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconCircle}><FaChartLine /></div>
                  <h3 style={styles.cardTitle}>Owner Control</h3>
                </div>
                <ul style={styles.list}>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Analytics:</strong> Revenue & Top Selling Items.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Menu Editor:</strong> Update prices instantly.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>QR Generator:</strong> Print stickers 1-100.</li>
                  <li style={styles.li}><FaCheckCircle style={styles.check}/> <strong>Broadcast:</strong> Scroll messages to staff.</li>
                </ul>
              </div>

            </div>

            {/* --- TECH SPECS --- */}
            <div style={styles.techBar}>
              <span style={styles.techItem}><FaRocket/> MERN STACK</span>
              <span style={styles.techItem}><FaMobileAlt/> PWA READY</span>
              <span style={styles.techItem}><FaWifi/> REAL-TIME</span>
              <span style={styles.techItem}><FaMoneyBillWave/> LOW COST</span>
            </div>

            {/* --- FOOTER (CONTACT) --- */}
            <footer style={styles.footer}>
              <div style={styles.contactItem}>
                <FaPhone style={styles.icon} /> 
                <span>+91 63050 13340</span> 
              </div>
              <div style={styles.contactItem}>
                <FaEnvelope style={styles.icon} /> 
                <span>bitebox.web@gmail.com</span> 
              </div>
              <div style={styles.contactItem}>
                <FaMapMarkerAlt style={styles.icon} /> 
                <span>Hyderabad, India</span>
              </div>
            </footer>

          </div>
        </div>
      </div>
      
      {/* Add spin animation globally */}
      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// --- CSS STYLES ---
const styles = {
  // 🟢 WORKSPACE (The screen view)
  workspace: {
    height: "100vh",
    width: "100vw",
    background: "#121212",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif",
  },
  
  // 🛠️ TOOLBAR
  toolbar: {
    height: "60px",
    background: "#1a1a1a",
    borderBottom: "1px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    padding: "0 20px",
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)"
  },
  zoomGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#222",
    padding: "5px 10px",
    borderRadius: "8px",
    border: "1px solid #333"
  },
  toolBtn: {
    background: "transparent",
    border: "none",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center"
  },
  zoomLabel: {
    color: "#fff",
    fontSize: "12px",
    fontWeight: "bold",
    minWidth: "40px",
    textAlign: "center"
  },
  divider: {
    width: "1px",
    height: "20px",
    background: "#444"
  },
  downloadBtn: {
    background: "linear-gradient(135deg, #FF8800 0%, #FF5500 100%)",
    border: "none",
    color: "white",
    padding: "8px 20px",
    borderRadius: "8px",
    fontWeight: "900",
    fontSize: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 0 15px rgba(255, 85, 0, 0.4)"
  },

  // 📜 SCROLL AREA
  scrollArea: {
    flex: 1,
    overflow: "auto",
    padding: "40px",
    display: "flex",
    justifyContent: "center",
    background: "#050505 url('https://www.transparenttextures.com/patterns/dark-matter.png')", // Optional Texture
  },
  scaler: {
    transition: "transform 0.2s ease-out",
  },

  // 🖼️ THE FLYER (Target for Screenshot)
  flyer: {
    width: "1000px", // Fixed Width for High Resolution
    minHeight: "1414px", // A4 Aspect Ratio roughly
    background: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: "0",
    padding: "60px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 0 100px rgba(0,0,0,0.8)",
    color: "white"
  },

  // ✨ VISUAL EFFECTS
  glowTop: {
    position: "absolute",
    top: "-100px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "600px",
    height: "200px",
    background: "#f97316",
    filter: "blur(150px)",
    opacity: 0.15,
    zIndex: 0
  },
  glowBottom: {
    position: "absolute",
    bottom: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    background: "#3b82f6",
    filter: "blur(180px)",
    opacity: 0.1,
    zIndex: 0
  },

  // 🏗️ LAYOUT ELEMENTS
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #222",
    paddingBottom: "40px",
    marginBottom: "50px",
    position: "relative",
    zIndex: 1
  },
  brandBox: { display: "flex", flexDirection: "column" },
  lalaTitle: {
    fontSize: "90px",
    fontWeight: "900",
    margin: 0,
    color: "#fff",
    letterSpacing: "-4px",
    lineHeight: "0.9",
    textShadow: "0 0 30px rgba(255, 255, 255, 0.1)"
  },
  taglineBox: { display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px' },
  line: { height: '2px', background: '#f97316', width: '40px' },
  tagline: { fontSize: "18px", letterSpacing: "6px", color: "#f97316", fontWeight: "bold", textTransform: 'uppercase' },
  
  developerInfo: { textAlign: "right" },
  devName: { margin: 0, fontSize: "28px", fontWeight: "bold", color: "#ddd" },
  badge: { 
    display: 'inline-block', 
    background: '#222', 
    color: '#888', 
    padding: '5px 12px', 
    borderRadius: '6px', 
    fontSize: '12px', 
    fontWeight: 'bold', 
    marginTop: '5px',
    border: '1px solid #333'
  },

  hero: { textAlign: "center", marginBottom: "60px", position: "relative", zIndex: 1 },
  heroText: { fontSize: "42px", margin: "0 0 15px 0", fontWeight: '800' },
  gradientText: { 
    background: "linear-gradient(90deg, #f97316, #fb923c)", 
    WebkitBackgroundClip: "text", 
    WebkitTextFillColor: "transparent" 
  },
  heroSub: { color: "#999", fontSize: "20px", maxWidth: "700px", margin: "0 auto", lineHeight: "1.5" },

  grid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "30px", 
    marginBottom: "60px", 
    position: "relative", 
    zIndex: 1 
  },
  card: {
    background: "rgba(255, 255, 255, 0.03)",
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  iconCircle: {
    width: "60px", height: "60px",
    background: "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05))",
    color: "#f97316",
    borderRadius: "16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "28px",
    border: "1px solid rgba(249, 115, 22, 0.3)"
  },
  cardTitle: { fontSize: "24px", fontWeight: "800", margin: 0 },
  list: { padding: 0, listStyle: 'none', margin: 0 },
  li: { color: "#ccc", fontSize: "15px", lineHeight: "2.2", display: 'flex', alignItems: 'center', gap: '10px' },
  check: { color: '#22c55e', fontSize: '14px' },

  techBar: {
    display: "flex",
    justifyContent: "space-between",
    background: "#111",
    padding: "20px 40px",
    borderRadius: "15px",
    border: "1px solid #222",
    marginBottom: "50px",
    position: "relative",
    zIndex: 1
  },
  techItem: {
    fontWeight: "bold", fontSize: "14px", color: "#888", 
    textTransform: "uppercase", display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '1px'
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "2px solid #222",
    paddingTop: "40px",
    position: "relative",
    zIndex: 1
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#ddd",
    background: "#1a1a1a",
    padding: "10px 20px",
    borderRadius: "50px",
    border: "1px solid #333"
  },
  icon: { color: '#f97316' }
};

export default ProjectFlyer;