import { useEffect, useState } from "react";

export default function Menu({ fetchMenu, addToCart }) {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      const data = await fetchMenu();
      setMenu(data || []);
    } catch (err) {
      setError("Menu not available");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p style={styles.center}>Loading menu...</p>;
  }

  if (error) {
    return <p style={styles.center}>{error}</p>;
  }

  if (menu.length === 0) {
    return <p style={styles.center}>Menu not available</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Menu</h2>

      {menu.map((item) => (
        <div key={item.id} style={styles.card}>
          <div>
            <h4>{item.name}</h4>
            <p style={styles.price}>₹{item.price}</p>
          </div>

          <button
            style={styles.button}
            onClick={() => addToCart(item)}
          >
            Add
          </button>
        </div>
      ))}
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 500,
    margin: "0 auto",
  },
  title: {
    marginBottom: 12,
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  price: {
    color: "#555",
    marginTop: 4,
  },
  button: {
    padding: "8px 14px",
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
