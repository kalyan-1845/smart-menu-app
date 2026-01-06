import React from "react";
import { 
  FaRocket, FaQrcode, FaUtensils, FaMobileAlt, FaWifi, 
  FaMoneyBillWave, FaConciergeBell, FaChartLine, FaPhone, FaMapMarkerAlt, FaEnvelope
} from "react-icons/fa";

const ProjectFlyer = () => {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        
        {/* --- HEADER --- */}
        <header style={styles.header}>
          <div style={styles.brandBox}>
            <h1 style={styles.lalaTitle}>BITEBOX</h1>
            <span style={styles.tagline}>SMART RESTO SOLUTIONS</span>
          </div>
          <div style={styles.developerInfo}>
            <h2 style={styles.devName}>Bhoompally Kalyan Reddy</h2>
            <p style={styles.devRole}>Founder & Lead Developer</p>
          </div>
        </header>

        {/* --- HERO SECTION --- */}
        <div style={styles.hero}>
          <h2 style={styles.heroText}>
            The Future of <span style={{color: '#f97316'}}>Contactless Dining</span> is Here.
          </h2>
          <p style={styles.heroSub}>
            A complete Full-Stack ecosystem managing Orders, Kitchen, and Service in real-time.
          </p>
        </div>

        {/* --- FEATURES GRID --- */}
        <div style={styles.grid}>
          
          {/* CARD 1: CUSTOMER */}
          <div style={styles.card}>
            <div style={styles.iconCircle}><FaQrcode /></div>
            <h3>For Customers</h3>
            <ul style={styles.list}>
              <li>📱 <strong>Scan & Order:</strong> No App Download Needed (PWA).</li>
              <li>📦 <strong>Parcel Mode:</strong> Choose Dine-in or Takeaway.</li>
              <li>⏳ <strong>Live Tracking:</strong> Real-time status updates.</li>
              <li>💳 <strong>Payment:</strong> Cash or Online integration LATER.</li>
            </ul>
          </div>

          {/* CARD 2: KITCHEN (CHEF) */}
          <div style={styles.card}>
            <div style={styles.iconCircle}><FaUtensils /></div>
            <h3>Chef Dashboard</h3>
            <ul style={styles.list}>
              <li>🔔 <strong>Instant Alerts:</strong> Sound notification on new orders.</li>
              <li>✅ <strong>Stock Control:</strong> Mark items "Out of Stock" instantly.</li>
              <li>🍳 <strong>Workflow:</strong> Pending &rarr; Cooking &rarr; Ready.</li>
              <li>🧾 <strong>KOT Printing:</strong> Auto-generate Kitchen Tickets.</li>
            </ul>
          </div>

          {/* CARD 3: WAITER & SERVICE */}
          <div style={styles.card}>
            <div style={styles.iconCircle}><FaConciergeBell /></div>
            <h3>Smart Service</h3>
            <ul style={styles.list}>
              <li>🛎️ <strong>Digital Bell:</strong> Call Waiter button at every table.</li>
              <li>📜 <strong>Digital Receipts:</strong> Auto-generated PDF bills.</li>
              <li>⚡ <strong>Fast Sync:</strong> 100% Real-time Socket connection.</li>
              <li>📶 <strong>Offline Capable:</strong> Works on spotty networks.</li>
            </ul>
          </div>

          {/* CARD 4: ADMIN POWER */}
          <div style={styles.card}>
            <div style={styles.iconCircle}><FaChartLine /></div>
            <h3>Owner Control</h3>
            <ul style={styles.list}>
              <li>📊 <strong>Sales Reports:</strong> Daily revenue & item analysis.</li>
              <li>📝 <strong>Menu Editor:</strong> Add/Remove dishes in seconds.</li>
              <li>🖨️ <strong>QR Generator:</strong> Print stickers for Tables 1-10.</li>
              <li>📢 <strong>Broadcast:</strong> Send "Breaking News" to all screens.</li>
            </ul>
          </div>

        </div>

        {/* --- TECH SPECS --- */}
        <div style={styles.techBar}>
          <span>🚀 Built with MERN Stack</span>
          <span>⚡ Vite Powered</span>
          <span>🔒 JWT Secured</span>
          <span>📱 Mobile First Design</span>
        </div>

        {/* --- FOOTER (CONTACT) --- */}
        <footer style={styles.footer}>
          <div style={styles.contactItem}>
            <FaPhone style={{color:'#f97316'}} /> 
            <span>+91 63050 13340</span> {/* UPDATE YOUR PHONE HERE */}
          </div>
          <div style={styles.contactItem}>
            <FaEnvelope style={{color:'#f97316'}} /> 
            <span>bitebox.web@gmail.com</span> {/* UPDATE EMAIL HERE */}
          </div>
          <div style={styles.contactItem}>
            <FaMapMarkerAlt style={{color:'#f97316'}} /> 
            <span>Hyderabad or Siddipet, India</span>
          </div>
        </footer>

      </div>
    </div>
  );
};

// --- CSS STYLES (Print Ready) ---
const styles = {
  page: {
    minHeight: "100vh",
    background: "#111",
    color: "white",
    fontFamily: "'Inter', sans-serif",
    padding: "40px 20px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    width: "100%",
    maxWidth: "800px",
    background: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: "20px",
    padding: "40px",
    boxShadow: "0 0 50px rgba(0,0,0,0.5)",
    position: "relative",
    overflow: "hidden"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2px solid #222",
    paddingBottom: "30px",
    marginBottom: "30px"
  },
  brandBox: {
    display: "flex",
    flexDirection: "column"
  },
  lalaTitle: {
    fontSize: "60px",
    fontWeight: "900",
    margin: 0,
    color: "#f97316",
    letterSpacing: "-2px",
    lineHeight: "1"
  },
  tagline: {
    fontSize: "14px",
    letterSpacing: "4px",
    color: "#888",
    fontWeight: "bold",
    marginTop: "5px"
  },
  developerInfo: {
    textAlign: "right"
  },
  devName: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold"
  },
  devRole: {
    margin: 0,
    color: "#666",
    fontSize: "14px"
  },
  hero: {
    textAlign: "center",
    marginBottom: "40px"
  },
  heroText: {
    fontSize: "28px",
    margin: "0 0 10px 0"
  },
  heroSub: {
    color: "#888",
    fontSize: "16px",
    maxWidth: "500px",
    margin: "0 auto"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    marginBottom: "40px"
  },
  card: {
    background: "#161616",
    padding: "25px",
    borderRadius: "15px",
    border: "1px solid #222"
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    background: "rgba(249, 115, 22, 0.1)",
    color: "#f97316",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "15px"
  },
  list: {
    paddingLeft: "20px",
    color: "#ccc",
    fontSize: "13px",
    lineHeight: "2"
  },
  techBar: {
    display: "flex",
    justifyContent: "space-between",
    background: "#222",
    padding: "15px 30px",
    borderRadius: "10px",
    fontWeight: "bold",
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: "30px"
  },
  footer: {
    display: "flex",
    justifyContent: "space-around",
    borderTop: "1px solid #222",
    paddingTop: "30px"
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "bold"
  }
};

export default ProjectFlyer;