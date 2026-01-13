import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { 
    FaArrowLeft, FaTrash, FaCheckCircle, FaStar, FaTimes, 
    FaUtensils, FaPaperPlane, FaReceipt, FaExclamationTriangle 
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

// --- 🌟 PREMIUM FEEDBACK MODAL ---
const FeedbackModal = ({ onClose, dishId }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Please tap a star!");
        try {
            await axios.post(`${API_BASE}/dishes/rate/${dishId || 'general'}`, { rating, comment });
            toast.success("Thanks for your review!");
            onClose();
        } catch (e) { toast.error("Could not save review"); }
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalCard}>
                <button onClick={onClose} style={styles.closeBtn}><FaTimes size={18} /></button>
                <div style={{marginBottom: 20}}>
                    <div style={styles.iconCircle}><FaStar color="#f59e0b" size={24}/></div>
                </div>
                <h2 style={styles.modalTitle}>Rate Your Meal</h2>
                <p style={styles.modalSub}>How was the food?</p>
                
                <div style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} size={32} 
                            color={(hover || rating) >= star ? "#f59e0b" : "#334155"}
                            onMouseEnter={() => setHover(star)} 
                            onMouseLeave={() => setHover(0)} 
                            onClick={() => { if(navigator.vibrate) navigator.vibrate(20); setRating(star); }}
                            style={{ cursor: 'pointer', transition: '0.2s' }}
                        />
                    ))}
                </div>
                
                <textarea 
                    placeholder="Tell the chef what you liked..." 
                    style={styles.textArea} 
                    value={comment} 
                    onChange={(e) => setComment(e.target.value)} 
                />
                <button onClick={handleSubmit} style={styles.submitBtn}>SUBMIT REVIEW</button>
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

    // ✅ SMART TABLE LOGIC: Verify table belongs to THIS restaurant
    const storedTable = localStorage.getItem("last_table_scanned");
    const storedRest = localStorage.getItem("last_rest_scanned");
    
    // Only use stored table if it matches the current restaurant context
    const finalTableNum = tableNum || (storedRest === restaurantId ? storedTable : null);

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
        
        // 🔒 SAFETY CHECK
        if (!finalTableNum) {
            toast.error("Security Check Failed: Scan QR Code again.");
            return; 
        }
        if (cart.length === 0) return toast.error("Your cart is empty!");

        setIsSubmitting(true);
        if(navigator.vibrate) navigator.vibrate(50); // Haptic feedback

        try {
            // 1. Resolve Owner ID
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

            // 2. Send Order
            const res = await axios.post(`${API_BASE}/orders`, payload);
            
            // 3. Real-time Alert
            if (socketRef.current) socketRef.current.emit("new-order", res.data);
            
            setOrderSuccess(true);
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]); // Success vibration
        } catch (err) {
            console.error(err);
            toast.error("Could not place order. Try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {/* ✅ SUCCESS OVERLAY */}
            {orderSuccess && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.successIconBox}>
                            <FaCheckCircle size={50} color="#22c55e" />
                        </div>
                        <h2 style={styles.modalTitle}>Order Sent!</h2>
                        <p style={styles.modalSub}>Kitchen has received your order for <b style={{color:'white'}}>Table {finalTableNum}</b></p>
                        
                        <div style={styles.receiptBox}>
                            <div style={styles.receiptRow}><span>Order ID</span><span>#{Math.floor(Math.random()*9000)+1000}</span></div>
                            <div style={styles.receiptRow}><span>Est. Time</span><span>15 Mins</span></div>
                        </div>

                        <div style={{ marginTop: 25, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button onClick={() => { clearCart(); navigate(`/menu/${restaurantId}`); }} style={styles.primaryBtn}>
                                <FaUtensils /> Order More Items
                            </button>
                            <button onClick={() => setShowFeedback(true)} style={styles.secondaryBtn}>
                                <FaStar color="#f59e0b" /> Rate Experience
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🏛️ HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <div>
                    <h1 style={styles.pageTitle}>Your Order</h1>
                    <p style={styles.pageSub}>{cart.length} Items • Table {finalTableNum || "?"}</p>
                </div>
            </div>

            {/* 🛒 CART LIST */}
            <div style={styles.listContainer}>
                {cart.length === 0 ? (
                    <div style={styles.emptyState}>
                        <div style={styles.emptyIcon}><FaUtensils /></div>
                        <h3>Hungry?</h3>
                        <p>You haven't added any food yet.</p>
                        <button onClick={() => navigate(-1)} style={styles.browseBtn}>Browse Menu</button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={styles.cartItem}>
                            <div style={styles.itemInfo}>
                                <h4 style={styles.itemName}>{item.name}</h4>
                                <div style={styles.itemMeta}>
                                    <span style={styles.qtyBadge}>{item.quantity}x</span>
                                    <span style={styles.itemPrice}>₹{item.price * item.quantity}</span>
                                </div>
                            </div>
                            <button onClick={() => { if(navigator.vibrate) navigator.vibrate(20); removeFromCart(item._id); }} style={styles.trashBtn}>
                                <FaTrash size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* 💰 FOOTER */}
            {cart.length > 0 && (
                <div style={styles.footer}>
                    <div style={styles.billCard}>
                        <div style={styles.billRow}>
                            <span style={{color:'#94a3b8'}}>Subtotal</span>
                            <span style={{fontWeight:'700'}}>₹{totalPrice}</span>
                        </div>
                        <div style={styles.billRow}>
                            <span style={{color:'#94a3b8'}}>Taxes & Charges</span>
                            <span style={{fontWeight:'700'}}>₹0</span>
                        </div>
                        <div style={styles.divider}></div>
                        <div style={styles.totalRow}>
                            <span>Grand Total</span>
                            <span style={{color:'#f59e0b'}}>₹{totalPrice}</span>
                        </div>
                    </div>

                    <button onClick={handlePlaceOrder} disabled={isSubmitting} style={styles.placeOrderBtn}>
                        {isSubmitting ? (
                            "SENDING TO KITCHEN..." 
                        ) : (
                            <>PLACE ORDER <FaPaperPlane /></>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};

// 🎨 "MIDNIGHT GLASS" THEME (Matches Menu.jsx)
const styles = {
    container: { minHeight: '100vh', background: '#020617', color: 'white', paddingBottom: '180px', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    
    // Header
    header: { display: 'flex', alignItems: 'center', gap: 20, padding: '20px', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #1e293b' },
    backBtn: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    pageTitle: { fontSize: 20, fontWeight: '800', margin: 0 },
    pageSub: { fontSize: 13, color: '#64748b', margin: 0 },

    // List
    listContainer: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 },
    cartItem: { background: '#0f172a', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #1e293b' },
    itemInfo: { flex: 1 },
    itemName: { margin: '0 0 6px 0', fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    itemMeta: { display: 'flex', alignItems: 'center', gap: 10 },
    qtyBadge: { background: '#1e293b', color: '#cbd5e1', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: '700', border: '1px solid #334155' },
    itemPrice: { color: '#f59e0b', fontWeight: '700', fontSize: 14 },
    trashBtn: { background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

    // Empty State
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 80, opacity: 0.7 },
    emptyIcon: { fontSize: 40, color: '#334155', marginBottom: 20 },
    browseBtn: { marginTop: 20, background: '#f59e0b', border: 'none', padding: '12px 24px', borderRadius: 12, color: '#000', fontWeight: '800', cursor: 'pointer' },

    // Footer
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#020617', padding: '20px', borderTop: '1px solid #1e293b', zIndex: 20 },
    billCard: { background: '#0f172a', borderRadius: 16, padding: '15px', marginBottom: 15, border: '1px solid #1e293b' },
    billRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 },
    divider: { height: 1, background: '#1e293b', margin: '10px 0' },
    totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: '800', color: 'white' },
    placeOrderBtn: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: 16, fontWeight: '800', fontSize: 15, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)', letterSpacing: 0.5 },

    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { background: '#0f172a', padding: '30px', borderRadius: '24px', textAlign: 'center', border: '1px solid #1e293b', width: '100%', maxWidth: '360px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
    closeBtn: { position: 'absolute', right: 20, top: 20, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' },
    successIconBox: { width: 80, height: 80, background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
    modalTitle: { fontSize: 24, fontWeight: '800', margin: '0 0 10px 0', color: 'white' },
    modalSub: { color: '#94a3b8', fontSize: 14, margin: 0 },
    receiptBox: { background: '#1e293b', borderRadius: 12, padding: 15, marginTop: 20 },
    receiptRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#cbd5e1', marginBottom: 5 },
    
    primaryBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontWeight: '700', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    secondaryBtn: { background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '14px', borderRadius: 12, fontWeight: '700', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },

    // Feedback
    iconCircle: { width: 50, height: 50, background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' },
    starRow: { display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 },
    textArea: { width: '100%', background: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: 12, padding: 15, marginBottom: 20, fontSize: 14, minHeight: 80, outline: 'none' },
    submitBtn: { background: '#22c55e', color: '#020617', fontWeight: '800', border: 'none', padding: '14px', borderRadius: 12, width: '100%', cursor: 'pointer' }
};

export default Cart;