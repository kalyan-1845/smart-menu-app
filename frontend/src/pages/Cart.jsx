import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, FaCheckCircle, FaBell, FaUtensils } from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState("");
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 
    const [callLoading, setCallLoading] = useState(false);
    const socketRef = useRef(null); 

    const finalRestaurantId = restaurantId || localStorage.getItem("last_restaurant_id");
    const finalTableNum = tableNum || localStorage.getItem("last_table_num");

    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    // High-performance cleanup for mobile memory management
    useEffect(() => {
        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    const handleCallWaiter = async () => {
        if (!finalTableNum) return alert("Please select a table first!");
        setCallLoading(true);
        if ("vibrate" in navigator) navigator.vibrate(100);

        try {
            await axios.post(`${API_BASE}/orders/call-waiter`, {
                restaurantId: finalRestaurantId,
                tableNumber: finalTableNum
            });

            // Fast-handshake socket for high traffic
            const socket = io(SERVER_URL, { transports: ['websocket'], upgrade: false });
            socket.emit("join-restaurant", finalRestaurantId);
            socket.emit("new-waiter-call", {
                restaurantId: finalRestaurantId,
                tableNumber: finalTableNum,
                _id: Date.now().toString()
            });

            alert("🛎️ Waiter has been notified!");
            setTimeout(() => socket.disconnect(), 500);
        } catch (err) {
            console.error("Call failed", err);
        } finally {
            setCallLoading(false);
        }
    };

    const processOrder = async (paymentType) => {
        if (isSubmitting) return;
        if (!customerName.trim()) return alert("Enter your name!");
        if (!finalTableNum) return setShowTableModal(true);
        if (!cart.length) return alert("Cart is empty!");

        if ("vibrate" in navigator) navigator.vibrate(50);
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
            
            // Scalable socket emission
            const socket = io(SERVER_URL, { transports: ['websocket'], upgrade: false });
            socket.emit("join-restaurant", finalRestaurantId); 
            socket.emit("new-order", res.data);

            setOrderSuccess(true);
            
            // FASTER REDIRECT: Reduced to 1.2s for high-speed user experience
            setTimeout(() => {
                clearCart();
                socket.disconnect();
                navigate(`/track/${res.data._id}`); 
            }, 1200); 

        } catch (err) {
            alert("Order failed. Check internet.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* --- FASTER HIGH-SPEED SUCCESS SCREEN --- */}
            {orderSuccess && (
                <div style={styles.overlay}>
                    <div style={styles.successCard} className="pop-in">
                        <div className="checkmark-wrapper">
                             <FaCheckCircle size={80} color="#22c55e" className="checkmark-anim" />
                        </div>
                        <h2 style={styles.successTitle}>Order Placed!</h2>
                        <p style={styles.successSub}>Kitchen is preparing your meal.</p>
                        <div style={styles.loaderLine}></div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                    <h1 style={styles.title}>Review Cart</h1>
                </div>
                <button 
                    onClick={handleCallWaiter} 
                    disabled={callLoading}
                    style={{...styles.callBtn, opacity: callLoading ? 0.5 : 1}}
                >
                    <FaBell style={{marginRight: '6px'}}/> {callLoading ? '...' : 'Call'}
                </button>
            </div>

            <div style={styles.infoCard}>
                <div onClick={() => setShowTableModal(true)} style={styles.infoRow}>
                    <p style={{margin: 0}}>Table: <span style={{color: '#f97316', fontWeight: 'bold'}}>{finalTableNum || "Select"}</span></p>
                    <button style={styles.changeBtn}>Change</button>
                </div>
                <input style={styles.input} placeholder="Enter Your Name" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>

            <div style={styles.list}>
                {cart.length === 0 ? (
                    <div style={{textAlign: 'center', marginTop: '60px', color: '#444'}}>
                        <FaUtensils size={40} style={{marginBottom: '10px'}}/>
                        <p>Your cart is empty</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={styles.item}>
                            <img 
                                src={item.image} 
                                alt={item.name} 
                                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', marginRight: '15px' }} 
                            />
                            <div style={{flex: 1}}>
                                <p style={{margin: 0, fontWeight: 'bold', fontSize: '15px'}}>{item.name}</p>
                                <p style={{margin: 0, color: '#f97316', fontSize: '14px'}}>
                                    ₹{item.price * item.quantity} <span style={{color: '#555', fontSize: '12px'}}>({item.quantity}x)</span>
                                </p>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={styles.delBtn}><FaTrash /></button>
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <div style={styles.totalRow}>
                    <span>Order Total</span>
                    <span style={{color: '#f97316'}}>₹{totalPrice}</span>
                </div>
                <div style={styles.btnRow}>
                    <button onClick={() => processOrder("ONLINE")} disabled={isSubmitting} style={styles.onlineBtn}>
                        <FaMobileAlt style={{marginRight: '8px'}}/> Online
                    </button>
                    <button onClick={() => processOrder("CASH")} disabled={isSubmitting} style={styles.cashBtn}>
                        <FaMoneyBillWave style={{marginRight: '8px'}}/> Pay Cash
                    </button>
                </div>
            </div>
            
            <style>{`
                @keyframes scaleUp { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes loadingBar { from { width: 0%; } to { width: 100%; } }
                @keyframes checkBounce { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
                .pop-in { animation: scaleUp 0.3s ease-out; }
                .checkmark-anim { animation: checkBounce 0.5s ease-out forwards; }
                .loaderLine { height: 3px; background: #22c55e; width: 100%; margin: 20px auto 0; border-radius: 10px; animation: loadingBar 1.2s linear forwards; }
            `}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '160px', fontFamily: 'Inter, sans-serif' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
    
    successCard: { background: '#111', padding: '40px 30px', borderRadius: '32px', textAlign: 'center', border: '1px solid #22c55e', width: '85%', maxWidth: '320px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' },
    successTitle: { fontSize: '24px', fontWeight: '900', color: 'white', margin: '0 0 10px 0' },
    successSub: { color: '#888', fontSize: '14px', lineHeight: '1.5', margin: 0 },
    loaderLine: { height: '3px', background: '#22c55e', width: '100%', margin: '20px auto 0', borderRadius: '10px' },

    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' },
    backBtn: { background: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' },
    callBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center' },
    title: { margin: 0, fontSize: '20px', fontWeight: '800' },
    infoCard: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #222' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    changeBtn: { background: 'rgba(249, 115, 22, 0.15)', border: 'none', color: '#f97316', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold' },
    input: { width: '100%', padding: '14px', background: '#000', border: '1px solid #333', borderRadius: '12px', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' },
    list: { display: 'flex', flexDirection: 'column', gap: '12px' },
    item: { background: '#111', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', border: '1px solid #222' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '12px', borderRadius: '10px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0a0a0a', padding: '25px 20px', borderTop: '1px solid #222', boxShadow: '0 -10px 20px rgba(0,0,0,0.5)', zIndex: 10 },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '20px', fontWeight: '900' },
    btnRow: { display: 'flex', gap: '12px' },
    onlineBtn: { flex: 1, height: '55px', background: '#1a1a1a', color: 'white', border: '1px solid #333', borderRadius: '15px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    cashBtn: { flex: 1.3, height: '55px', background: '#f97316', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default Cart;