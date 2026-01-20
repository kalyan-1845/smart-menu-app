import React from "react";
import { 
  FaQrcode, FaUtensils, FaShieldAlt, FaRocket, 
  FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaDatabase, FaServer, FaCode, FaNodeJs, FaLock
} from "react-icons/fa";

const ProjectFlyer = () => {
  return (
    <div style={styles.container}>
      {/* --- HEADER SECTION --- */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.brandName}>KOVIXA</h1>
          <span style={styles.badge}>ENTERPRISE EDITION</span>
        </div>
        <div style={styles.authorBox}>
          <span style={styles.roleLabel}>LEAD ARCHITECT</span>
          <h3 style={styles.authorName}>B. Kalyan Reddy</h3>
          <span style={styles.roleSub}>Full Stack Engineer</span>
        </div>
      </div>

      {/* --- HERO TYPOGRAPHY --- */}
      <div style={styles.heroSection}>
        <h2 style={styles.headline}>
          The Future of <br />
          <span style={styles.textGradient}>Restaurant</span> <br />
          <span style={styles.textGradient}>Management.</span>
        </h2>
        <p style={styles.subHeadline}>
          A complete Operating System for modern dining. Seamlessly 
          connecting customers, kitchens, and owners in real-time.
        </p>
      </div>

      {/* --- FEATURE GRID --- */}
      <div style={styles.grid}>
        <FeatureCard 
          icon={<FaQrcode />} 
          title="Contactless Dining" 
          desc="QR-based ordering system. No app download required. Instant menu updates and session-based carts."
        />
        <FeatureCard 
          icon={<FaUtensils />} 
          title="Smart Kitchen (KDS)" 
          desc="Real-time order transmission via WebSockets. Chefs see orders instantly. Zero paper waste."
        />
        <FeatureCard 
          icon={<FaShieldAlt />} 
          title="Admin Command" 
          desc="Full inventory control, revenue analytics, and staff management from a secure dashboard."
        />
        <FeatureCard 
          icon={<FaRocket />} 
          title="Cloud Scalability" 
          desc="Built on the MERN Stack. Designed to handle millions of requests with 99.9% uptime."
        />
      </div>

      {/* --- TECH STACK (POWERED BY) --- */}
      <div style={styles.techSection}>
        <p style={styles.techLabel}>P O W E R E D &nbsp; B Y</p>
        <div style={styles.techRow}>
          <TechBadge icon={<FaDatabase/>} text="MongoDB" />
          <TechBadge icon={<FaServer/>} text="Express.js" />
          <TechBadge icon={<FaCode/>} text="React.js" />
          <TechBadge icon={<FaNodeJs/>} text="Node.js" />
          <TechBadge icon={<FaRocket/>} text="Socket.io" />
          <TechBadge icon={<FaLock/>} text="JWT Auth" />
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div style={styles.footer}>
        <div style={styles.contactRow}>
          <div style={styles.contactItem}><FaPhoneAlt size={12}/> +91 63050 13340</div>
          <div style={styles.separator}>|</div>
          <div style={styles.contactItem}><FaEnvelope size={12}/> bitebox.web@gmail.com</div>
          <div style={styles.separator}>|</div>
          <div style={styles.contactItem}><FaMapMarkerAlt size={12}/> Hyderabad, India</div>
        </div>
        <p style={styles.copyright}>© 2026 Kovixa Systems. All Rights Reserved.</p>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const FeatureCard = ({ icon, title, desc }) => (
  <div style={styles.card}>
    <div style={styles.iconBox}>{icon}</div>
    <h3 style={styles.cardTitle}>{title}</h3>
    <p style={styles.cardDesc}>{desc}</p>
  </div>
);

const TechBadge = ({ icon, text }) => (
  <div style={styles.techBadge}>
    {icon} <span>{text}</span>
  </div>
);

// --- LUXURY STYLES ---
const styles = {
  container: {
    minHeight: "100vh",
    background: "#000000",
    color: "#ffffff",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  header: {
    width: "100%",
    maxWidth: "800px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "60px",
    borderBottom: "1px solid #222",
    paddingBottom: "20px"
  },
  brandName: { fontSize: "36px", fontWeight: "900", margin: "0", letterSpacing: "-1px", lineHeight: "1" },
  badge: { background: "#222", color: "#888", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", display: "inline-block", marginTop: "8px" },
  
  authorBox: { textAlign: "right" },
  roleLabel: { fontSize: "9px", color: "#555", fontWeight: "800", letterSpacing: "2px", display: "block", marginBottom: "4px" },
  authorName: { fontSize: "16px", fontWeight: "700", margin: "0", color: "#fff" },
  roleSub: { fontSize: "12px", color: "#666" },

  heroSection: { width: "100%", maxWidth: "800px", marginBottom: "60px" },
  headline: { fontSize: "56px", fontWeight: "800", lineHeight: "1.1", margin: "0 0 20px 0", letterSpacing: "-2px" },
  textGradient: { color: "#ffffff" }, // Kept white for stark contrast like image
  subHeadline: { fontSize: "18px", color: "#666", lineHeight: "1.6", maxWidth: "500px" },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    width: "100%",
    maxWidth: "800px",
    marginBottom: "80px"
  },
  card: {
    background: "#080808",
    border: "1px solid #1a1a1a",
    borderRadius: "16px",
    padding: "30px",
    transition: "0.3s",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start"
  },
  iconBox: { fontSize: "24px", color: "#fff", marginBottom: "20px" },
  cardTitle: { fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" },
  cardDesc: { fontSize: "14px", color: "#555", lineHeight: "1.6", margin: 0 },

  techSection: { textAlign: "center", marginBottom: "60px", width: "100%", maxWidth: "800px" },
  techLabel: { fontSize: "10px", fontWeight: "800", letterSpacing: "3px", color: "#333", marginBottom: "20px" },
  techRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "10px" },
  techBadge: { 
    display: "flex", alignItems: "center", gap: "8px", 
    border: "1px solid #222", borderRadius: "30px", 
    padding: "8px 16px", fontSize: "12px", color: "#666", fontWeight: "600" 
  },

  footer: { 
    borderTop: "1px solid #111", 
    width: "100%", 
    maxWidth: "800px", 
    paddingTop: "30px",
    textAlign: "center" 
  },
  contactRow: { 
    display: "flex", justifyContent: "center", flexWrap: "wrap", 
    gap: "15px", alignItems: "center", marginBottom: "15px", color: "#fff", fontSize: "13px", fontWeight: "600" 
  },
  contactItem: { display: "flex", alignItems: "center", gap: "8px" },
  separator: { color: "#222" },
  copyright: { fontSize: "12px", color: "#333" }
};

// 📱 MOBILE RESPONSIVE STYLES
const mobileStyles = `
  @media (max-width: 768px) {
    .headline { fontSize: 40px !important; }
    .header { flex-direction: column; gap: 20px; }
    .authorBox { text-align: left; }
    .contactRow { flex-direction: column; gap: 10px; }
    .separator { display: none; }
  }
`;

export default ProjectFlyer;