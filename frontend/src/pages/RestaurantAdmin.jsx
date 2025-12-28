import { useEffect, useState } from "react";

export default function RestaurantAdmin({
  fetchRestaurant,
  updateRestaurant,
}) {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadRestaurant();
  }, []);

  const loadRestaurant = async () => {
    try {
      const data = await fetchRestaurant();
      setRestaurant(data);
    } catch (err) {
      console.error("Failed to load restaurant");
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await updateRestaurant(restaurant);
      alert("Restaurant updated");
    } catch (err) {
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={styles.center}>Loading restaurant...</p>;
  }

  if (!restaurant) {
    return <p style={styles.center}>Restaurant not found</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏪 Restaurant Admin</h2>

      <label style={styles.label}>Restaurant Name</label>
      <input
        style={styles.input}
        value={restaurant.name}
        onChange={(e) =>
          setRestaurant({ ...restaurant, name: e.target.value })
        }
      />

      <label style={styles.label}>Contact Number</label>
      <input
        style={styles.input}
        value={restaurant.phone || ""}
        onChange={(e) =>
          setRestaurant({ ...restaurant, phone: e.target.value })
        }
      />

      <label style={styles.label}>Address</label>
      <textarea
        style={styles.textarea}
        value={restaurant.address || ""}
        onChange={(e) =>
          setRestaurant({ ...restaurant, address: e.target.value })
        }
      />

      <label style={styles.switchRow}>
        <input
          type="checkbox"
          checked={restaurant.acceptingOrders}
          onChange={(e) =>
            setRestaurant({
              ...restaurant,
              acceptingOrders: e.target.checked,
            })
          }
        />
        <span>Accepting Orders</span>
      </label>

      <button
        style={styles.button}
        onClick={saveChanges}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>
    </div>
  );
}
const styles = {
  container: {
    maxWidth: 520,
    margin: "40px auto",
    padding: 20,
    borderRadius: 12,
    background: "#fff",
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
  },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  textarea: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    resize: "vertical",
  },
  switchRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  button: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    border: "none",
    backgroundColor: "#16a34a",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
  center: {
    textAlign: "center",
    marginTop: 40,
    color: "#666",
  },
};
