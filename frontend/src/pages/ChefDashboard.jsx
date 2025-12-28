import { useEffect, useState } from "react";

export default function ChefDashboard({ fetchOrders, updateOrderStatus }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await fetchOrders();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const markPrepared = async (orderId) => {
    await updateOrderStatus(orderId, "prepared");
    loadOrders();
  };

  if (loading) {
    return <p style={styles.center}>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p style={styles.center}>No active orders</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👨‍🍳 Chef Dashboard</h2>

      {orders.map((order) => (
        <div key={order.id} style={styles.card}>
          <div style={styles.header}>
            <strong>Table {order.tableNo}</strong>
            <span style={styles.status}>{order.status}</span>
          </div>

          <ul style={styles.list}>
            {order.items.map((item, idx) => (
              <li key={idx}>
                {item.name} × {item.qty}
              </li>
            ))}
          </ul>

          {order.status === "pending" && (
            <button
              style={styles.button}
              onClick={() => markPrepared(order.id)}
            >
              Mark as Prepared
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 600,
    margin: "0 auto",
  },
  title: {
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  status: {
    fontSize: 12,
    color: "#888",
  },
  list: {
    paddingLeft: 18,
    marginBottom: 10,
  },
  button: {
    width: "100%",
    padding: 10,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
