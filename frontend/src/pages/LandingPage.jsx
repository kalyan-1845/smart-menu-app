export default function LandingPage() {
  return (
    <div style={styles.page}>
      {/* HERO */}
      <header style={styles.hero}>
        <h1 style={styles.brand}>🍽️ BiteBox</h1>
        <p style={styles.tagline}>
          Scan. Order. Serve faster.
        </p>
        <p style={styles.sub}>
          Smart digital menu & ordering system for restaurants
        </p>

        <button style={styles.cta}>Request Demo</button>
      </header>

      {/* FEATURES */}
      <section style={styles.section}>
        <h2>Why BiteBox?</h2>

        <div style={styles.features}>
          <Feature title="QR Ordering" desc="Customers order from their table" />
          <Feature title="No App Needed" desc="Works directly in browser" />
          <Feature title="Faster Service" desc="Less wait, more turnover" />
          <Feature title="Chef & Waiter Dashboards" desc="Smooth kitchen flow" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={styles.sectionAlt}>
        <h2>How it works</h2>
        <ol style={styles.steps}>
          <li>Scan QR code</li>
          <li>Select food</li>
          <li>Place order</li>
          <li>Food served faster</li>
        </ol>
      </section>

      {/* FOOTER */}
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} BiteBox</p>
        <p>Smart dining made simple</p>
      </footer>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div style={styles.featureCard}>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}
const styles = {
  page: {
    fontFamily: "Arial, sans-serif",
    color: "#111",
  },

  hero: {
    padding: "60px 20px",
    textAlign: "center",
    background: "linear-gradient(135deg,#111827,#1f2933)",
    color: "#fff",
  },

  brand: {
    fontSize: 36,
    marginBottom: 10,
  },

  tagline: {
    fontSize: 18,
    fontWeight: "bold",
  },

  sub: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.9,
  },

  cta: {
    marginTop: 24,
    padding: "12px 24px",
    fontSize: 16,
    borderRadius: 8,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
  },

  section: {
    padding: "40px 20px",
    textAlign: "center",
  },

  sectionAlt: {
    padding: "40px 20px",
    background: "#f9fafb",
    textAlign: "center",
  },

  features: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
    marginTop: 20,
  },

  featureCard: {
    padding: 16,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  steps: {
    listStyle: "none",
    padding: 0,
    marginTop: 20,
    lineHeight: "2rem",
    fontSize: 16,
  },

  footer: {
    padding: 20,
    textAlign: "center",
    fontSize: 13,
    background: "#111827",
    color: "#fff",
  },
};
