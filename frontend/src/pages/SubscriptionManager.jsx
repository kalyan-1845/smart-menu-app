import { useEffect, useState } from "react";

export default function SubscriptionManager({
  fetchSubscriptions,
  updateSubscription,
}) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubs();
  }, []);

  const loadSubs = async () => {
    try {
      const data = await fetchSubscriptions();
      setSubs(data || []);
    } catch (err) {
      console.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const activate = async (id) => {
    await updateSubscription(id, "active");
    loadSubs();
  };

  const expire = async (id) => {
    await updateSubscription(id, "expired");
    loadSubs();
  };

  if (loading) {
    return <p style={styles.center}>Loading subscriptions...</p>;
  }

  if (subs.length === 0) {
    return <p style={styles.center}>No subscriptions found</p>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💳 Subscription Manager</h2>

      {subs.map((sub) => (
        <div key={sub.id} style={styles.card}>
          <div>
            <strong>{sub.restaurantName}</strong>
            <p style={styles.small}>
              Status: <b>{sub.status}</b>
            </p>
            <p style={styles.small}>
              Trial Ends: {sub.trialEnd || "—"}
            </p>
          </div>

          <div style={styles.actions}>
            {sub.status !== "active" && (
              <button
                style={{ ...styles.btn, background: "#16a34a" }}
                onClick={() => activate(sub.id)}
              >
                Activate
              </button>
            )}

            {sub.status !== "expired" && (
              <button
                style={{ ...styles.btn, background: "#dc2626" }}
                onClick={() => expire(sub.id)}
              >
                Expire
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 700,
    margin: "0 auto",
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
  },
  small: {
    fontSize: 13,
    color: "#555",
  },
  actions: {
    display: "flex",
    gap: 8,
  },
  btn: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "none",
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
