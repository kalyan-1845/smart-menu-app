import { useEffect, useState } from "react";

export default function SalesSummary({ fetchSales }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await fetchSales();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load sales summary");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.center}>Loading sales...</p>;
  }

  if (!summary) {
    return <p style={styles.center}>No sales data</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📊 Sales Summary</h2>

      <div style={styles.grid}>
        <div style={styles.card}>
          <p>Total Orders</p>
          <strong>{summary.totalOrders}</strong>
        </div>

        <div style={styles.card}>
          <p>Total Revenue</p>
          <strong>₹{summary.totalRevenue}</strong>
        </div>

        <div style={styles.card}>
          <p>Today Orders</p>
          <strong>{summary.todayOrders}</strong>
        </div>

        <div style={styles.card}>
          <p>Today Revenue</p>
          <strong>₹{summary.todayRevenue}</strong>
        </div>
      </div>
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 700,
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
    fontSize: 14,
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
