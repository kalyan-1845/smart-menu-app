import React, { useEffect } from "react"; // ✅ FIXED: Added useEffect to imports
import { Link } from "react-router-dom";
import { FaShieldAlt, FaLock, FaArrowLeft } from "react-icons/fa";

const Terms = () => {
  // ✅ FIXED: useEffect must be INSIDE the component function
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ✅ FIXED: Moving styles INSIDE to prevent production ReferenceErrors
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

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <Link to="/" style={styles.backBtn}><FaArrowLeft /> Back</Link>
        <h1 style={styles.title}>Legal & Privacy</h1>
      </header>

      <div style={styles.content}>
        <section style={styles.section}>
          <div style={styles.iconHeading}>
            <FaShieldAlt color="#f97316" size={24} />
            <h2>Terms of Service</h2>
          </div>
          <p>By using <strong>BiteBox SaaS</strong>, you agree to the following conditions:</p>
          <ul style={styles.list}>
            <li><strong>Account Security:</strong> You are responsible for keeping your Master Key and PINs secure.</li>
            <li><strong>Service Usage:</strong> Fake registrations will result in a permanent ban.</li>
            <li><strong>Subscription:</strong> Trial accounts expire after 30 days.</li>
            <li><strong>Liability:</strong> We are not responsible for local hardware or internet failures.</li>
          </ul>
        </section>

        <section style={styles.section}>
          <div style={styles.iconHeading}>
            <FaLock color="#22c55e" size={24} />
            <h2>Privacy Policy</h2>
          </div>
          <p>We take your data security seriously:</p>
          <ul style={styles.list}>
            <li><strong>Data Ownership:</strong> Your menu items and history belong to you.</li>
            <li><strong>Auto-Cleanup:</strong> Individual order details are purged every 30 days. Download reports monthly.</li>
            <li><strong>Cookies:</strong> We use local storage to keep you logged in.</li>
          </ul>
        </section>

        <footer style={styles.footer}>
          <p>© {new Date().getFullYear()} BiteBox Cloud OS. Purged & Secured.</p>
        </footer>
      </div>
    </div>
  );
};

export default Terms;