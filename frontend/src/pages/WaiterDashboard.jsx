import { useEffect, useState } from "react";

export default function WaiterDashboard({ fetchOrders, updateOrderStatus }) {
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

  const markServed = async (orderId) => {
    await updateOrderStatus(orderId, "served");
    loadOrders();
  };

  if (loading) {
    return <p style={styles.center}>Loading orders...</p>;
  }

  if (orders.length === 0) {
    return <p style={styles.center}>No orders to serve</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🧑‍🍽️ Waiter Dashboard</h2>

      {orders
        .filter(order => order.status === "prepared")
        .map((order) => (
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

            <button
              style={styles.button}
              onClick={() => markServed(order.id)}
            >
              Mark as Served
            </button>
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
    color: "#16a34a",
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
    backgroundColor: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
