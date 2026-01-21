import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaLock, FaArrowLeft, FaFileContract, FaGavel } from "react-icons/fa";

const Terms = () => {
  // 🔄 Auto-scroll to top on load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { margin: 0; background: #020617; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
      `}</style>

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link to="/" style={styles.backBtn}>
            <div style={styles.iconCircle}><FaArrowLeft /></div>
            <span>Back to Home</span>
          </Link>
          <h1 style={styles.title}>Legal & Privacy Protocols</h1>
        </div>
      </header>

      {/* CONTENT */}
      <div style={styles.content}>
        
        {/* SECTION 1: TERMS (Mandatory for Liability) */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <FaGavel color="#f97316" size={28} />
            <div>
              <h2 style={styles.heading}>Terms of Service</h2>
              <p style={styles.subHeading}>Last Updated: January 2026</p>
            </div>
          </div>
          <div style={styles.divider}></div>
          <ul style={styles.list}>
            <li>
              <strong>1. License Grant:</strong> Kovixa grants you a revocable, non-exclusive license to use the "Smart Menu System" for your restaurant operations.
            </li>
            <li>
              <strong>2. Account Responsibility:</strong> You are responsible for maintaining the confidentiality of your Master Key and Restaurant ID. 
            </li>
            <li>
              <strong>3. Acceptable Use:</strong> You agree not to misuse the platform to host illegal content or malicious software. Violations result in immediate termination.
            </li>
            <li>
              <strong>4. Liability Disclaimer:</strong> Kovixa is not liable for business losses due to internet outages, local hardware failure, or force majeure events.
            </li>
          </ul>
        </section>

        {/* SECTION 2: PRIVACY (Mandatory for Data Laws) */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <FaShieldAlt color="#3b82f6" size={28} />
            <div>
              <h2 style={styles.heading}>Privacy Policy</h2>
              <p style={styles.subHeading}>Data Handling & Ownership</p>
            </div>
          </div>
          <div style={styles.divider}></div>
          <ul style={styles.list}>
            <li>
              <strong>1. Data Ownership:</strong> All menu data, prices, and food images uploaded by you remain your intellectual property.
            </li>
            <li>
              <strong>2. Customer Data:</strong> We do not sell your customer's order history to third parties. Data is used solely for order processing.
            </li>
            <li>
              <strong>3. Auto-Purge:</strong> To ensure system speed, individual order logs (PII) are automatically archived or purged every 60 days.
            </li>
            <li>
              <strong>4. Local Storage:</strong> This app uses browser storage for essential functions (Cart state, Login sessions).
            </li>
          </ul>
        </section>

        {/* SECTION 3: SECURITY (Mandatory for Trust) */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <FaLock color="#22c55e" size={28} />
            <div>
              <h2 style={styles.heading}>Security Measures</h2>
              <p style={styles.subHeading}>Encryption Standards</p>
            </div>
          </div>
          <div style={styles.divider}></div>
          <p style={styles.text}>
            All data transmission between your device and our servers is encrypted via <strong>SSL/TLS 1.2+</strong>. 
            Passwords are hashed using <strong>Bcrypt</strong> before storage. We conduct regular vulnerability scans to ensure platform integrity.
          </p>
        </section>

        <footer style={styles.footer}>
          <FaFileContract style={{marginBottom:10}} size={20}/>
          <p>© 2026 Kovixa Systems. Engineered in Hyderabad.</p>
          <p style={{opacity:0.5, fontSize:11, marginTop:5}}>For legal inquiries: legal@smartmenuss.netlify.app</p>
        </footer>

      </div>
    </div>
  );
};

// 🎨 PREMIUM BLUE THEME STYLES
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#020617",
    backgroundImage: "radial-gradient(circle at 50% 0%, #1e293b 0%, transparent 70%)",
    color: "#f8fafc",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    paddingBottom: "80px"
  },
  header: {
    background: "rgba(2, 6, 23, 0.8)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid #1e293b",
    position: "sticky",
    top: 0,
    zIndex: 10,
    padding: "20px"
  },
  headerInner: {
    maxWidth: "800px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "15px"
  },
  backBtn: {
    textDecoration: "none",
    color: "#94a3b8",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transition: "0.2s"
  },
  iconCircle: {
    width: "32px",
    height: "32px",
    background: "#1e293b",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #334155"
  },
  title: {
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    background: "linear-gradient(to right, #fff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  content: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "30px"
  },
  card: {
    background: "rgba(30, 41, 59, 0.4)",
    backdropFilter: "blur(10px)",
    border: "1px solid #1e293b",
    borderRadius: "24px",
    padding: "30px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "20px"
  },
  heading: {
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
    color: "white"
  },
  subHeading: {
    fontSize: "12px",
    color: "#64748b",
    margin: "4px 0 0 0",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "1px"
  },
  divider: {
    height: "1px",
    background: "linear-gradient(to right, #334155, transparent)",
    marginBottom: "20px"
  },
  list: {
    paddingLeft: "0",
    listStyle: "none",
    margin: 0,
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.7",
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  text: {
    color: "#cbd5e1",
    fontSize: "15px",
    lineHeight: "1.7",
    margin: 0
  },
  footer: {
    textAlign: "center",
    marginTop: "40px",
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "500",
    borderTop: "1px solid #1e293b",
    paddingTop: "40px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  }
};

export default Terms;