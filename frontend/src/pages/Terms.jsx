import React from "react";
import { Link } from "react-router-dom";
import { FaShieldAlt, FaLock, FaUserShield, FaArrowLeft } from "react-icons/fa";

useEffect(() => {
  window.scrollTo(0, 0);
}, []);
const Terms = () => {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/" style={styles.backBtn}><FaArrowLeft /> Back</Link>
        <h1 style={styles.title}>Legal & Privacy</h1>
      </header>

      <div style={styles.content}>
        {/* --- SECTION 1: TERMS --- */}
        <section style={styles.section}>
          <div style={styles.iconHeading}>
            <FaShieldAlt color="#f97316" size={24} />
            <h2>Terms of Service</h2>
          </div>
          <p>By using <strong>BiteBox SaaS</strong>, you agree to the following conditions:</p>
          <ul style={styles.list}>
            <li><strong>Account Security:</strong> You are responsible for keeping your Master Key and PINs secure.</li>
            <li><strong>Service Usage:</strong> Any "time-pass" or fake registrations intended to stress the network will result in a permanent ban and IP blocking.</li>
            <li><strong>Subscription:</strong> Trial accounts expire after 30 days. Failure to upgrade will result in automatic URL suspension.</li>
            <li><strong>Limitation of Liability:</strong> BiteBox is a tool to help your business. We are not responsible for any local hardware failures or internet outages in your restaurant.</li>
          </ul>
        </section>

        {/* --- SECTION 2: PRIVACY --- */}
        <section style={styles.section}>
          <div style={styles.iconHeading}>
            <FaLock color="#22c55e" size={24} />
            <h2>Privacy Policy</h2>
          </div>
          <p>We take your data security seriously. Here is how we handle your information:</p>
          <ul style={styles.list}>
            <li><strong>Data Ownership:</strong> Your menu items and order history belong to you. We do not sell your customer data to third parties.</li>
            <li><strong>Auto-Cleanup:</strong> To maintain high-speed performance, individual order details are purged every 30 days. Please download your reports monthly.</li>
            <li><strong>Cookies:</strong> We use local storage to keep you logged in on your mobile and laptop devices.</li>
          </ul>
        </section>

        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} BiteBox Cloud OS. Purged & Secured.</p>
        </footer>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "#050505", color: "#fff", padding: "20px", fontFamily: "'Inter', sans-serif" },
  header: { maxWidth: "800px", margin: "0 auto 40px", display: "flex", alignItems: "center", gap: "20px" },
  backBtn: { color: "#f97316", textDecoration: "none", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", gap: "5px" },
  title: { fontSize: "24px", fontWeight: "900" },
  content: { maxWidth: "800px", margin: "0 auto" },
  section: { background: "#0a0a0a", padding: "30px", borderRadius: "24px", border: "1px solid #111", marginBottom: "20px" },
  iconHeading: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" },
  list: { paddingLeft: "20px", marginTop: "15px", color: "#a1a1aa", lineHeight: "1.8" },
  footer: { textAlign: "center", marginTop: "40px", color: "#444", fontSize: "12px" }
};

export default Terms;