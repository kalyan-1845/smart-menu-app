import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaCheckCircle, FaBell, FaChair, FaUtensils, FaBoxOpen, FaPaperPlane, FaStar, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

// --- 🌟 FEEDBACK MODAL COMPONENT (Internal) ---
const FeedbackModal = ({ onClose }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState("");

    const styles = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' },
        card: { background: '#0a0a0a', padding: '30px', borderRadius: '30px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #222', position: 'relative' },
        title: { fontSize: '20px', fontWeight: '900', marginBottom: '20px', color: '#fff' },
        stars: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '25px' },
        input: { width: '100%', background: '#000', border: '1px solid #222', borderRadius: '15px', padding: '15px', color: 'white', minHeight: '100px', marginBottom: '20px', outline: 'none', fontSize: '14px' },
        submitBtn: { width: '100%', background: '#f97316', color: 'white', border: 'none', padding: '18px', borderRadius: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' },
        close: { position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }
    };

    const handleSubmit = async () => {
        if (rating === 0) return toast.error("Please select stars!");
        // Simulating submission since there isn't a specific endpoint for general feedback in the snippet provided
        // You can replace this URL with your actual feedback endpoint
        toast.success("Thank you for the feedback!");
        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <button onClick={onClose} style={styles.close}><FaTimes /></button>
                <h2 style={styles.title}>Rate your experience</h2>
                <div style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} size={35} color={(hover || rating) >= star ? "#f97316" : "#333"}
                            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)}
                            style={{ cursor: 'pointer', transition: '0.2s', transform: hover === star ? 'scale(1.1)' : 'scale(1)' }}
                        />
                    ))}
                </div>
                <textarea placeholder="Any suggestions?" style={styles.input} value={comment} onChange={(e) => setComment(e.target.value)} />
                <button onClick={handleSubmit} style={styles.submitBtn}>SUBMIT REVIEW <FaPaperPlane /></button>
            </div>
        </div>
    );
};

const Cart = ({ cart, customerId, clearCart, removeFromCart, tableNum, setTableNum }) => {
    
    const { restaurantId } = useParams(); 
    const navigate = useNavigate();
    
    // Auto-open modal if no table is selected
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 
    const [callLoading, setCallLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false); // 🆕 Feedback State
    const socketRef = useRef(null); 

    const finalTableNum = tableNum || localStorage.getItem("last_table_scanned");
    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    // ✅ 1. SOCKET CONNECTION
    useEffect(() => {
        if (restaurantId) {
            socketRef.current = io(SERVER_URL, { 
                transports: ['polling'], 
                withCredentials: true,
                query: { restaurantId: restaurantId } 
            });

            socketRef.current.emit("join-restaurant", restaurantId);
        }
        
        return () => { 
            if (socketRef.current) socketRef.current.disconnect(); 
        };
    }, [restaurantId]);

    // ✅ 2. Handle Table Selection
    const handleSelection = (value) => {
        setTableNum(value);
        localStorage.setItem("last_table_scanned", value);
        setShowTableModal(false);
        toast.success(value === "Parcel" ? "Selected: Parcel Mode" : `Selected: Table ${value}`);
    };

    // ✅ 3. Call Waiter
    const handleCallWaiter = async () => {
        if (!finalTableNum) return setShowTableModal(true);
        setCallLoading(true);
        if ("vibrate" in navigator) navigator.vibrate(100);
        try {
            socketRef.current.emit("call-waiter", {
                restaurantId: restaurantId,
                tableNumber: finalTableNum,
                customerId: customerId,
                _id: Date.now().toString()
            });
            toast.success("Staff notified!");
        } catch (err) { toast.error("Call failed"); }
        finally { setCallLoading(false); }
    };

    // ✅ 4. PLACE ORDER
    const handlePlaceOrder = async () => { 
        if (isSubmitting) return;
        
        if (!finalTableNum) return setShowTableModal(true);
        if (cart.length === 0) return toast.error("Cart is empty");

        setIsSubmitting(true);

        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            const realMongoId = idRes.data.id;
            const autoName = finalTableNum === "Parcel" ? "Takeaway Customer" : `Guest (Table ${finalTableNum})`;

            const payload = {
                customerName: autoName,
                customerId: customerId,
                tableNum: finalTableNum.toString(),
                items: cart.map(i => ({ dishId: i._id, name: i.name, quantity: i.quantity, price: i.price, image: i.image })),
                totalAmount: totalPrice,
                paymentMethod: "Pay Later",
                status: "Pending", 
                restaurantId: realMongoId
            };

            const res = await axios.post(`${API_BASE}/orders?t=${Date.now()}`, payload);
            if (socketRef.current) socketRef.current.emit("new-order", res.data);

            setOrderSuccess(true);
            
        } catch (err) {
            console.error("ORDER ERROR:", err);
            toast.error("Order Failed. Try again.");
            setIsSubmitting(false);
        }
    };

    // ✅ 5. HANDLE "ORDER MORE"
    const handleOrderMore = () => {
        clearCart(); 
        setOrderSuccess(false);
        setIsSubmitting(false);
        navigate(`/menu/${restaurantId}`); 
    };

    return (
        <div style={styles.container}>
            
            {/* 🌟 FEEDBACK MODAL */}
            {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

            {/* SUCCESS MODAL */}
            {orderSuccess && (
                <div style={styles.overlay}>
                    <div style={styles.successCard} className="pop-in">
                        <FaCheckCircle size={80} color="#22c55e" className="checkmark-anim" />
                        <h2 style={styles.successTitle}>Order Sent!</h2>
                        <p style={styles.counterNote}>
                            Your order has been sent to the kitchen for <strong>Table {finalTableNum}</strong>.
                        </p>
                        
                        <div style={{marginTop: 20, display:'flex', flexDirection:'column', gap:'10px'}}>
                            <button onClick={handleOrderMore} style={styles.orderMoreBtn}>
                                <FaUtensils /> Order More Items
                            </button>
                            <button onClick={() => setShowFeedback(true)} style={styles.feedbackBtn}>
                                <FaStar /> Rate Experience
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* SELECTION MODAL */}
            {showTableModal && (
                <div style={styles.overlay}>
                    <div style={styles.tableCard}>
                        <h2 style={{marginTop:0, marginBottom:15, fontSize:18, fontWeight: 900}}>Select Your Table</h2>
                        <button onClick={() => handleSelection("Parcel")} style={styles.parcelBtn}>
                            <FaBoxOpen size={20} /> PARCEL / TAKEAWAY
                        </button>
                        <div style={styles.divider}><span>OR SELECT TABLE NUMBER</span></div>
                        <div style={styles.tableGrid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                                <button key={num} onClick={() => handleSelection(num)} style={styles.numBtn}>{num}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                    <h1 style={styles.title}>Your Cart</h1>
                </div>
                <button onClick={handleCallWaiter} disabled={callLoading} style={styles.callBtn}>
                    <FaBell style={{marginRight:'6px'}}/> Call Staff
                </button>
            </div>

            <div style={styles.infoCard}>
                <div onClick={() => setShowTableModal(true)} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        {finalTableNum === "Parcel" ? <FaBoxOpen color="#ef4444" size={20}/> : <FaChair color="#f97316" size={20}/>}
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontSize:14, fontWeight:'bold', color:'white'}}>
                                {finalTableNum === "Parcel" ? "Parcel Order" : `Dining at Table ${finalTableNum || "?"}`}
                            </span>
                            <span style={{fontSize:10, color:'#666'}}>Tap to change</span>
                        </div>
                    </div>
                    <button style={styles.changeBtn}>Change</button>
                </div>
            </div>

            <div style={styles.list}>
                {cart.length === 0 ? (
                    <div style={{textAlign: 'center', marginTop: '60px', opacity: 0.3}}>
                        <FaUtensils size={40} style={{marginBottom: '10px'}}/>
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={styles.item}>
                            <img src={item.image || `https://images.unsplash.com/${item.image}?w=200`} alt={item.name} 
                                style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", marginRight: "15px" }}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=Yummy"; }}
                            />
                            <div style={{flex: 1}}>
                                <p style={{margin:0, fontWeight:'bold'}}>{item.name}</p>
                                <p style={{margin:0, color:'#f97316'}}>₹{item.price * item.quantity} ({item.quantity}x)</p>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={styles.delBtn}><FaTrash /></button>
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <div style={styles.totalRow}><span>Total Bill</span><span>₹{totalPrice}</span></div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting} style={styles.placeOrderBtn}>
                    {isSubmitting ? "Sending..." : <><FaPaperPlane style={{marginRight:8}}/> PLACE ORDER</>}
                </button>
            </div>
            
            <style>{`.pop-in { animation: pop 0.3s; } @keyframes pop { from {transform:scale(0.8)} to {transform:scale(1)} } .checkmark-anim { animation: checkBounce 0.5s ease-out forwards; } @keyframes checkBounce { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', paddingBottom: '160px', fontFamily: 'Inter, sans-serif' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' },
    
    successCard: { background: '#111', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', border: '1px solid #22c55e', width: '85%', maxWidth: '320px' },
    successTitle: { fontSize: '24px', fontWeight: '900', margin: '15px 0 5px' },
    counterNote: { color: '#888', fontSize: '14px', margin: '10px 0', lineHeight: '1.5' },
    orderMoreBtn: { background: '#22c55e', color: 'black', border: 'none', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' },
    feedbackBtn: { background: '#333', color: 'white', border: 'none', padding: '15px 25px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' },

    tableCard: { background: '#111', padding: '25px', borderRadius: '24px', textAlign: 'center', border: '1px solid #333', width: '90%', maxWidth: '350px' },
    parcelBtn: { width: '100%', padding: '18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', cursor:'pointer' },
    divider: { margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' },
    numBtn: { padding: '15px 0', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', fontWeight: '900', fontSize: '16px', cursor:'pointer' },

    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' },
    backBtn: { background: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '12px', display:'flex' },
    callBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    infoCard: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #222' },
    changeBtn: { background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    item: { background: '#0a0a0a', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', border: '1px solid #111' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px' },
    
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#080808', padding: '20px', borderTop: '1px solid #111' },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: '900' },
    placeOrderBtn: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', border: 'none', borderRadius: '16px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)' }
};

export default Cart;