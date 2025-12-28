import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleLogin({ login }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login({ role, email, password });

      if (user.role === "superadmin") navigate("/super");
      if (user.role === "owner") navigate("/admin");
      if (user.role === "chef") navigate("/chef");
      if (user.role === "waiter") navigate("/waiter");
    } catch {
      alert("Invalid login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={submit}>
        <h2 style={styles.title}>BiteBox Login</h2>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        >
          <option value="superadmin">Super Admin</option>
          <option value="owner">Restaurant Owner</option>
          <option value="chef">Chef</option>
          <option value="waiter">Waiter</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          required
          style={styles.input}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          style={styles.input}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button style={styles.button} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
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
  },
  card: {
    background: "#fff",
    padding: 24,
    borderRadius: 14,
    width: "100%",
    maxWidth: 360,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  title: {
    textAlign: "center",
    marginBottom: 14,
  },
  input: {
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
    background: "#2563eb",
    color: "#fff",
    border: "none",
    fontWeight: "bold",
  },
};
