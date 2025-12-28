import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OrderSuccess({ orderId, tableNo }) {
  const navigate = useNavigate();

  useEffect(() => {
    // auto redirect to tracker after 5 sec
    const timer = setTimeout(() => {
      navigate(`/track/${orderId}`);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>

        <h2 style={styles.title}>Order Placed!</h2>

        <p style={styles.text}>
          Your order has been successfully sent to the kitchen.
        </p>

        <div style={styles.info}>
          <p><strong>Table:</strong> {tableNo}</p>
          <p><strong>Order ID:</strong> {orderId}</p>
        </div>

        <button
          style={styles.button}
          onClick={() => navigate(`/track/${orderId}`)}
        >
          Track Order
        </button>

        <p style={styles.note}>
          Redirecting automatically…
        </p>
      </div>
    </div>
  );
}
const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f9fafb",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#fff",
    borderRadius: 14,
    padding: 24,
    textAlign: "center",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  icon: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: "#555",
    marginBottom: 14,
  },
  info: {
    background: "#f1f5f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 14,
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: "#888",
  },
};
