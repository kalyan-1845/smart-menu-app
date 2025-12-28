import { useState } from "react";

export default function Cart({ cartItems, total, placeOrder }) {
  const [tableNumber, setTableNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    // 🔴 Validation
    if (!tableNumber || Number(tableNumber) <= 0) {
      setError("Enter a valid table number");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await placeOrder({
        tableNumber: Number(tableNumber),
        items: cartItems,
      });
    } catch (err) {
      setError("Failed to place order. Try again.");
      setLoading(false);
    }
  };

  // 🛑 Empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <div style={styles.center}>
        <h3>Your cart is empty</h3>
        <p>Please add items from menu</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2>Your Order</h2>
      <p style={styles.subText}>Review items before placing order</p>

      {/* 🧾 Items */}
      {cartItems.map((item) => (
        <div key={item.id} style={styles.itemRow}>
          <span>{item.name} × {item.qty}</span>
          <strong>₹{item.price * item.qty}</strong>
        </div>
      ))}

      {/* 💵 Bill */}
      <div style={styles.bill}>
        <div style={styles.billRow}>
          <span>Total</span>
          <strong>₹{total}</strong>
        </div>
        <small>Final bill will be generated at counter</small>
      </div>

      {/* 🔢 Table Number */}
      <div style={styles.inputBox}>
        <label>Table Number</label>
        <input
          type="number"
          placeholder="e.g. 5"
          value={tableNumber}
          onChange={(e) => setTableNumber(e.target.value)}
        />
        {error && <small style={styles.error}>{error}</small>}
      </div>

      {/* 🟢 Place Order */}
      <button
        style={styles.button}
        onClick={handlePlaceOrder}
        disabled={loading}
      >
        {loading ? "Placing order..." : "Place Order"}
      </button>
    </div>
  );
}
const styles = {
  container: {
    padding: 16,
    maxWidth: 500,
    margin: "0 auto",
  },
  subText: {
    color: "#666",
    marginBottom: 12,
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },
  bill: {
    marginTop: 16,
    paddingTop: 8,
    borderTop: "2px solid #000",
  },
  billRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 16,
  },
  inputBox: {
    marginTop: 16,
  },
  error: {
    color: "red",
  },
  button: {
    marginTop: 20,
    width: "100%",
    padding: 12,
    fontSize: 16,
    backgroundColor: "#16a34a",
    color: "#fff",
    border: "none",
    borderRadius: 8,
  },
  center: {
    textAlign: "center",
    marginTop: 50,
  },
};
