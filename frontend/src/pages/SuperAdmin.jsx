import { useEffect, useState } from "react";

export default function SuperAdmin({
  fetchRestaurants,
  createRestaurant,
  toggleRestaurantStatus,
}) {
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    try {
      const data = await fetchRestaurants();
      setRestaurants(data || []);
    } catch (err) {
      console.error("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert("Restaurant name required");
    await createRestaurant({ name });
    setName("");
    loadRestaurants();
  };

  const toggleStatus = async (id, active) => {
    await toggleRestaurantStatus(id, !active);
    loadRestaurants();
  };

  if (loading) {
    return <p style={styles.center}>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🛡️ Super Admin</h2>

      {/* Create Restaurant */}
      <div style={styles.createBox}>
        <input
          style={styles.input}
          placeholder="Restaurant name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button style={styles.button} onClick={handleCreate}>
          Create Restaurant
        </button>
      </div>

      {/* Restaurant List */}
      {restaurants.length === 0 ? (
        <p style={styles.center}>No restaurants yet</p>
      ) : (
        restaurants.map((res) => (
          <div key={res.id} style={styles.card}>
            <strong>{res.name}</strong>

            <button
              style={{
                ...styles.statusBtn,
                backgroundColor: res.active ? "#16a34a" : "#dc2626",
              }}
              onClick={() => toggleStatus(res.id, res.active)}
            >
              {res.active ? "Active" : "Disabled"}
            </button>
          </div>
        ))
      )}
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
    textAlign: "center",
    marginBottom: 20,
  },
  createBox: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    padding: "10px 14px",
    borderRadius: 6,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  statusBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
    color: "#fff",
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
