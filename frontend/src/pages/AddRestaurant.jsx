import { useState } from "react";

export default function AddRestaurant({ createRestaurant }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    plan: "trial",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");

    try {
      await createRestaurant(form);
      setSuccess("Restaurant created successfully");
      setForm({
        name: "",
        phone: "",
        email: "",
        password: "",
        plan: "trial",
      });
    } catch (err) {
      alert("Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🏪 Add Restaurant</h2>

      <form onSubmit={submit} style={styles.card}>
        <input
          name="name"
          placeholder="Restaurant Name"
          value={form.name}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          name="phone"
          placeholder="Owner Phone"
          value={form.phone}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          name="email"
          type="email"
          placeholder="Owner Email"
          value={form.email}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          name="password"
          type="password"
          placeholder="Login Password"
          value={form.password}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <select
          name="plan"
          value={form.plan}
          onChange={handleChange}
          style={styles.select}
        >
          <option value="trial">Trial (2 Months)</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>

        <button style={styles.button} disabled={loading}>
          {loading ? "Creating..." : "Create Restaurant"}
        </button>

        {success && <p style={styles.success}>{success}</p>}
      </form>
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
    background: "#fff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },
  input: {
    width: "100%",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  select: {
    width: "100%",
    padding: 10,
    marginBottom: 12,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  button: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
  },
  success: {
    marginTop: 10,
    textAlign: "center",
    color: "#16a34a",
    fontSize: 14,
  },
};
