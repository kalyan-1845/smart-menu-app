import { useState } from "react";

export default function Registers({ createUser }) {
  const [role, setRole] = useState("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !email || !password) {
      alert("All fields required");
      return;
    }

    setLoading(true);
    try {
      await createUser({
        name,
        email,
        password,
        role, // admin | chef | waiter
      });
      alert("User created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setRole("admin");
    } catch (err) {
      alert("Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👤 Create User</h2>

      <select
        style={styles.input}
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="admin">Restaurant Admin</option>
        <option value="chef">Chef</option>
        <option value="waiter">Waiter</option>
      </select>

      <input
        style={styles.input}
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        style={styles.button}
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create User"}
      </button>
    </div>
  );
}
const styles = {
  container: {
    maxWidth: 420,
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
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    border: "none",
    backgroundColor: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
