import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaCheckCircle, FaBell, FaUtensils, FaBoxOpen, FaPaperPlane, FaStar, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

// --- 🌟 INTERNAL FEEDBACK MODAL ---
const FeedbackModal = ({ onClose, dishId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Please select stars!");
        try {
            await axios.post(`${API_BASE}/dishes/rate/${dishId || 'general'}`, { rating, comment });
            toast.success("Thank you for the feedback!");
            onClose();
        } catch (e) { toast.error("Submission failed"); }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.successCard}>
                <button onClick={onClose} style={{ position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: '#666' }}><FaTimes /></button>
                <h2 style={{ color: 'white', marginBottom: 20 }}>Rate Experience</h2>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} size={30} color={(hover || rating) >= star ? "#f97316" : "#333"}
                            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)}
                            style={{ cursor: 'pointer' }}
                        />
                    ))}
                </div>
                <textarea placeholder="Suggestions..." style={{ width: '100%', background: '#000', border: '1px solid #333', color: 'white', borderRadius: 10, padding: 10, marginBottom: 20 }} value={comment} onChange={(e) => setComment(e.target.value)} />
                <button onClick={handleSubmit} style={styles.orderMoreBtn}>SUBMIT</button>
            </div>
        </div>
    );
};

const Cart = ({ cart, customerId, clearCart, removeFromCart, tableNum }) => {
    const { restaurantId } = useParams(); 
    const navigate = useNavigate();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 
    const [showFeedback, setShowFeedback] = useState(false);
    const socketRef = useRef(null); 

    // ✅ AUTO-SYNC TABLE: No manual entry needed
    const finalTableNum = tableNum || localStorage.getItem("last_table_scanned");
    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    useEffect(() => {
        if (restaurantId) {
            socketRef.current = io(SERVER_URL, { transports: ['polling'], query: { restaurantId } });
            socketRef.current.emit("join-restaurant", restaurantId);
        }
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [restaurantId]);

    const handlePlaceOrder = async () => { 
        if (isSubmitting) return;
        if (!finalTableNum) return toast.error("Please re-scan QR Code to identify table.");
        if (cart.length === 0) return toast.error("Cart is empty");

        setIsSubmitting(true);
        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            const realMongoId = idRes.data.id;

            const payload = {
                customerName: `Guest (Table ${finalTableNum})`,
                customerId,
                tableNum: finalTableNum.toString(),
                items: cart.map(i => ({ dishId: i._id, name: i.name, quantity: i.quantity, price: i.price })),
                totalAmount: totalPrice,
                paymentMethod: "Pay Later",
                status: "Pending", 
                restaurantId: realMongoId
            };

            const res = await axios.post(`${API_BASE}/orders`, payload);
            if (socketRef.current) socketRef.current.emit("new-order", res.data);
            setOrderSuccess(true);
        } catch (err) {
            toast.error("Order Failed");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {orderSuccess && (
                <div style={styles.overlay}>
                    <div style={styles.successCard}>
                        <FaCheckCircle size={80} color="#22c55e" />
                        <h2 style={{ color: 'white' }}>Order Sent!</h2>
                        <p style={{ color: '#888' }}>Sent for Table {finalTableNum}</p>
                        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <button onClick={() => { clearCart(); navigate(`/menu/${restaurantId}`); }} style={styles.orderMoreBtn}><FaUtensils /> Order More</button>
                            <button onClick={() => setShowFeedback(true)} style={styles.feedbackBtn}><FaStar /> Rate Us</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={{ fontSize: 20 }}>Table {finalTableNum || '?'} Cart</h1>
            </div>

            <div style={styles.list}>
                {cart.length === 0 ? <p style={{ textAlign: 'center', opacity: 0.5 }}>Cart empty</p> : 
                  cart.map(item => (
                    <div key={item._id} style={styles.item}>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{item.name}</p>
                            <p style={{ margin: 0, color: '#f97316' }}>₹{item.price * item.quantity} ({item.quantity}x)</p>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} style={{ background: 'none', border: 'none', color: '#ef4444' }}><FaTrash /></button>
                    </div>
                ))}
            </div>

            <div style={styles.footer}>
                <div style={styles.totalRow}><span>Total</span><span>₹{totalPrice}</span></div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting} style={styles.placeOrderBtn}>
                    <FaPaperPlane /> {isSubmitting ? "SENDING..." : "PLACE ORDER"}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '120px' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    successCard: { background: '#111', padding: '40px', borderRadius: '30px', textAlign: 'center', border: '1px solid #333', width: '85%', maxWidth: '350px', position: 'relative' },
    orderMoreBtn: { background: '#22c55e', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', width: '100%', cursor: 'pointer' },
    feedbackBtn: { background: '#333', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', width: '100%', cursor: 'pointer' },
    header: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 30 },
    backBtn: { background: '#1a1a1a', border: '1px solid #333', color: 'white', padding: 12, borderRadius: 12 },
    list: { display: 'flex', flexDirection: 'column', gap: 10 },
    item: { background: '#0a0a0a', padding: 20, borderRadius: 18, display: 'flex', border: '1px solid #111' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#080808', padding: 20, borderTop: '1px solid #222' },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 20, fontWeight: 'bold' },
    placeOrderBtn: { width: '100%', padding: 20, background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', border: 'none', borderRadius: 16, fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: 10 }
};

export default Cart;