import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState("");
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 

    // Secure Data Isolation
    const finalRestaurantId = restaurantId || localStorage.getItem("last_restaurant_id");
    const finalTableNum = tableNum || localStorage.getItem("last_table_num");

    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    const processOrder = async (paymentType) => {
        if (isSubmitting) return;
        if (!customerName.trim()) return alert("Enter your name!");
        if (!finalTableNum) return setShowTableModal(true);
        if (!cart.length) return alert("Cart is empty!");

        setIsSubmitting(true);
        try {
            const payload = {
                customerName,
                tableNum: finalTableNum.toString(),
                items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
                totalAmount: totalPrice,
                paymentMethod: paymentType === "ONLINE" ? "Online" : "Cash",
                restaurantId: finalRestaurantId,
                status: "Pending"
            };

            const res = await axios.post(`${API_BASE}/orders`, payload);
            
            // Notify Admin via Socket
            const socket = io(SERVER_URL);
            socket.emit("new-order", res.data);

            // ✅ TRIGGER SUCCESS MODAL
            setOrderSuccess(true);
            
            setTimeout(() => {
                clearCart();
                navigate(`/track/${res.data._id}`); // Redirect to Unique Tracker URL
            }, 2000);

        } catch (err) {
            alert("Order failed. Check internet.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* SUCCESS POPUP */}
            {orderSuccess && (
                <div style={styles.overlay}>
                    <div style={styles.successCard}>
                        <FaCheckCircle size={60} color="#22c55e" />
                        <h2>Order Placed!</h2>
                        <p>Opening status tracker...</p>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={styles.title}>Review Cart</h1>
            </div>

            {/* INFO CARD */}
            <div style={styles.infoCard}>
                <div onClick={() => setShowTableModal(true)} style={styles.infoRow}>
                    <p>Table: <span style={{color: '#f97316'}}>{finalTableNum || "Select"}</span></p>
                    <button style={styles.changeBtn}>Change</button>
                </div>
                <input style={styles.input} placeholder="Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>

            {/* CART ITEMS */}
            <div style={styles.list}>
                {cart.map(item => (
                    <div key={item._id} style={styles.item}>
                        <div style={{flex: 1}}>
                            <p style={{margin: 0, fontWeight: 'bold'}}>{item.name}</p>
                            <p style={{margin: 0, color: '#f97316'}}>₹{item.price * item.quantity}</p>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} style={styles.delBtn}><FaTrash /></button>
                    </div>
                ))}
            </div>

            {/* BOTTOM BUTTONS */}
            <div style={styles.footer}>
                <div style={styles.totalRow}><span>Total</span><span>₹{totalPrice}</span></div>
                <div style={styles.btnRow}>
                    <button onClick={() => processOrder("ONLINE")} disabled={isSubmitting} style={styles.onlineBtn}>Online Pay</button>
                    <button onClick={() => processOrder("CASH")} disabled={isSubmitting} style={styles.cashBtn}>Order Now (Cash)</button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '140px' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    successCard: { background: '#111', padding: '40px', borderRadius: '25px', textAlign: 'center', border: '1px solid #22c55e' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { background: '#222', border: 'none', color: 'white', padding: '10px', borderRadius: '10px' },
    title: { margin: 0, fontSize: '20px' },
    infoCard: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px' },
    infoRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    changeBtn: { background: 'rgba(249, 115, 22, 0.2)', border: 'none', color: 'white', borderRadius: '8px', padding: '5px 10px' },
    input: { width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '10px', color: 'white' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    item: { background: '#111', padding: '15px', borderRadius: '15px', display: 'flex', alignItems: 'center' },
    delBtn: { background: 'none', border: 'none', color: '#ef4444' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#050505', padding: '20px', borderTop: '1px solid #222' },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '18px', fontWeight: 'bold' },
    btnRow: { display: 'flex', gap: '10px' },
    onlineBtn: { flex: 1, height: '50px', background: '#222', color: 'white', border: 'none', borderRadius: '12px' },
    cashBtn: { flex: 1.2, height: '50px', background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' }
};

export default Cart;