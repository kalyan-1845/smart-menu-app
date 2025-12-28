import { useEffect, useState } from "react";

export default function OrderTracker({ fetchOrderStatus, orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();

    // auto refresh every 5 seconds (MVP polling)
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await fetchOrderStatus(orderId);
      setOrder(data);
    } catch (err) {
      console.error("Failed to fetch order status");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.center}>Tracking your order...</p>;
  }

  if (!order) {
    return <p style={styles.center}>Order not found</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📦 Order Status</h2>

      <div style={styles.card}>
        <p><strong>Table:</strong> {order.tableNo}</p>
        <p><strong>Order ID:</strong> {order.id}</p>
        <p>
          <strong>Status:</strong>{" "}
          <span style={styles.status(order.status)}>
            {order.status}
          </span>
        </p>
      </div>

      <ul style={styles.list}>
        {order.items.map((item, idx) => (
          <li key={idx}>
            {item.name} × {item.qty}
          </li>
        ))}
      </ul>

      <p style={styles.note}>
        You’ll be notified when food is ready 🍽️
      </p>
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 420,
    margin: "40px auto",
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  card: {
    padding: 14,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: 14,
  },
  list: {
    paddingLeft: 18,
    marginBottom: 12,
  },
  note: {
    textAlign: "center",
    fontSize: 13,
    color: "#555",
  },
  status: (state) => ({
    fontWeight: "bold",
    color:
      state === "pending"
        ? "#ca8a04"
        : state === "prepared"
        ? "#2563eb"
        : state === "served"
        ? "#16a34a"
        : "#444",
  }),
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
