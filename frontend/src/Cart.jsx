import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash, FaPlus, FaMinus, FaArrowLeft, FaQrcode, FaMoneyBillWave } from "react-icons/fa";

const Cart = ({ cart, updateQuantity, removeFromCart, clearCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const handlePlaceOrder = async () => {
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return alert("Please select a table!");
        if (cart.length === 0) return alert("Basket is empty!");

        setIsSubmitting(true);
        const orderData = {
            customerName,
            tableNumber: tableNum.toString(),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalPrice,
            paymentMethod,
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            clearCart();
            navigate(`/track/${res.data._id}`);
        } catch (err) {
            alert("Order failed. Try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={styles.title}>Review Order</h1>
            </div>

            {/* Delivering To Section */}
            <div style={styles.card}>
                <div style={styles.flexRow}>
                    <div>
                        <p style={styles.label}>DELIVERING TO</p>
                        <h3 style={styles.orangeText}>Table {tableNum || "Not Set"}</h3>
                    </div>
                    <button onClick={() => navigate("/")} style={styles.editBtn}>Edit</button>
                </div>
            </div>

            {/* Name Input */}
            <div style={styles.card}>
                <p style={styles.label}>YOUR NAME</p>
                <input 
                    style={styles.input} 
                    placeholder="Who's eating?" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                />
            </div>

            {/* Cart Items */}
            <div style={styles.itemsList}>
                {cart.map(item => (
                    <div key={item._id} style={styles.itemCard}>
                        <img src={item.image} alt="" style={styles.itemImg} />
                        <div style={{ flex: 1 }}>
                            <h4 style={styles.itemName}>{item.name}</h4>
                            <p style={styles.orangeText}>₹{item.price}</p>
                        </div>
                        <div style={styles.qtyControls}>
                            <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyBtn}><FaMinus /></button>
                            <span style={styles.qtyNum}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={styles.qtyBtn}><FaPlus /></button>
                        </div>
                        <FaTrash onClick={() => removeFromCart(item._id)} style={styles.trash} />
                    </div>
                ))}
            </div>

            {/* Payment Method Selector */}
            <div style={styles.card}>
                <p style={styles.label}>PAYMENT METHOD</p>
                <div style={styles.flexRow}>
                    <button onClick={() => setPaymentMethod("UPI")} style={paymentMethod === 'UPI' ? styles.methodActive : styles.methodInactive}>
                        <FaQrcode /> SCAN & PAY
                    </button>
                    <button onClick={() => setPaymentMethod("CASH")} style={paymentMethod === 'CASH' ? styles.methodActive : styles.methodInactive}>
                        <FaMoneyBillWave /> CASH
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <div style={styles.flexRow}>
                    <span style={styles.totalLabel}>Total</span>
                    <span style={styles.totalVal}>₹{totalPrice}</span>
                </div>
                <button 
                    disabled={isSubmitting} 
                    onClick={handlePlaceOrder} 
                    style={styles.confirmBtn}
                >
                    {isSubmitting ? "PROCESSING..." : "CONFIRM PAYMENT"}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { background: '#050505', minHeight: '100vh', padding: '20px', color: 'white', paddingBottom: '120px' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { background: '#1a1a1a', border: 'none', color: 'white', padding: '10px', borderRadius: '10px' },
    title: { fontSize: '24px', fontWeight: '800' },
    card: { background: '#121212', padding: '20px', borderRadius: '15px', marginBottom: '15px' },
    label: { color: '#666', fontSize: '10px', fontWeight: 'bold', marginBottom: '10px' },
    orangeText: { color: '#FF5200', margin: 0 },
    flexRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    input: { width: '100%', background: '#000', border: '1px solid #333', padding: '15px', borderRadius: '10px', color: 'white' },
    itemCard: { background: '#121212', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' },
    itemImg: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' },
    itemName: { margin: 0, fontSize: '14px' },
    qtyControls: { display: 'flex', alignItems: 'center', background: '#000', borderRadius: '8px', padding: '5px' },
    qtyBtn: { background: 'none', border: 'none', color: '#666', padding: '5px 10px' },
    qtyNum: { fontWeight: 'bold', minWidth: '20px', textAlign: 'center' },
    trash: { color: '#333', marginLeft: '10px', cursor: 'pointer' },
    confirmBtn: { width: '100%', background: '#FF5200', border: 'none', color: 'white', padding: '18px', borderRadius: '15px', fontWeight: 'bold', fontSize: '16px', marginTop: '15px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#000', padding: '20px', borderTop: '1px solid #222' },
    totalLabel: { color: '#666', fontSize: '18px' },
    totalVal: { fontSize: '28px', fontWeight: '900' },
    methodActive: { flex: 1, background: 'rgba(255, 82, 0, 0.1)', border: '1px solid #FF5200', color: '#FF5200', padding: '15px', borderRadius: '10px', margin: '0 5px' },
    methodInactive: { flex: 1, background: '#1a1a1a', border: '1px solid #333', color: '#666', padding: '15px', borderRadius: '10px', margin: '0 5px' }
};

export default Cart;