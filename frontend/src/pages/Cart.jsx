import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const glowStyles = `
@keyframes pulseGlow {
  0% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.8); }
  100% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.4); }
}
.glow-button { animation: pulseGlow 2s infinite ease-in-out; }
.glass-input:focus { border-color: #f97316 !important; box-shadow: 0 0 15px rgba(249, 115, 22, 0.3); }
@keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
`;

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState("");
    const [restaurant, setRestaurant] = useState(null);
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 

    // --- 🔐 SAAS ISOLATION: Unique Storage for 1000 Users ---
    const finalRestaurantId = restaurantId || localStorage.getItem("last_restaurant_id");
    const finalTableNum = tableNum || localStorage.getItem("last_table_num");

    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    useEffect(() => {
        if (finalRestaurantId) {
            localStorage.setItem("last_restaurant_id", finalRestaurantId);
            axios.get(`${API_BASE}/auth/restaurant/${finalRestaurantId}`)
                .then(res => setRestaurant(res.data))
                .catch(err => console.log("Fetch error"));
        }
    }, [finalRestaurantId]);

    const processOrder = async (paymentMethod) => {
        if (isSubmitting) return;
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!finalTableNum) return setShowTableModal(true);
        if (!cart || cart.length === 0) return alert("Your cart is empty!");

        setIsSubmitting(true);

        try {
            const payload = {
                customerName: customerName,
                tableNum: finalTableNum.toString(),
                items: cart.map(item => ({
                    name: item.name,
                    quantity: parseInt(item.quantity) || 1,
                    price: parseFloat(item.price) || 0
                })),
                totalAmount: totalPrice,
                paymentMethod: paymentMethod === "ONLINE" ? "Online" : "Cash",
                restaurantId: finalRestaurantId,
                status: "Pending",
                isDownloaded: false
            };

            const response = await axios.post(`${API_BASE}/orders`, payload);
            
            const socket = io(SERVER_URL);
            socket.emit("new-order", response.data);

            // 1. POPUP SUCCESS
            setOrderSuccess(true);
            
            // 2. REDIRECT after 2 seconds
            setTimeout(() => {
                clearCart(); 
                navigate(`/track/${response.data._id}`); 
            }, 2000);

        } catch (error) {
            alert("Order failed. Please check your internet.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', paddingBottom: '160px', width: '100%', maxWidth: '600px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            <style>{glowStyles}</style>
            
            {orderSuccess && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', padding: '40px', borderRadius: '30px', textAlign: 'center', border: '1px solid #22c55e', animation: 'popIn 0.5s ease-out' }}>
                        <FaCheckCircle size={70} color="#22c55e" style={{ marginBottom: '20px' }} />
                        <h2 style={{ fontSize: '26px', fontWeight: '900', margin: 0 }}>Order Placed!</h2>
                        <p style={{ color: '#888', marginTop: '10px' }}>Redirecting to status tracker...</p>
                    </div>
                </div>
            )}

            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid #222' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); localStorage.setItem("last_table_num", opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px', borderRadius: '16px', background: finalTableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: 'bold', border: '1px solid #333' }}>{opt}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: '15px' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '24px', fontWeight: '900' }}>Review Order</h1>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '28px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', cursor: 'pointer' }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '10px', fontWeight: '900' }}>RESTUARANT TABLE</p>
                        <div style={{ color: '#f97316', fontSize: '20px', fontWeight: '900' }}>{finalTableNum ? `Table ${finalTableNum}` : "Choose"}</div>
                    </div>
                    <span style={{ color: 'white', fontSize: '11px', background: 'rgba(249, 115, 22, 0.2)', padding: '8px 16px', borderRadius: '12px' }}>Edit</span>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '900' }}>CUSTOMER NAME</p>
                    <input type="text" placeholder="Enter name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="glass-input"
                        style={{ width: '100%', padding: '16px', background: '#080808', border: '1px solid #222', borderRadius: '16px', color: 'white', outline: 'none' }} />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '15px' }}>{item.name}</h4>
                                <p style={{ margin: '4px 0 0 0', color: '#f97316', fontWeight: '900' }}>₹{item.price * item.quantity}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '6px 14px', borderRadius: '14px' }}>
                                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555' }}>-</button>
                                <span style={{ fontWeight: '900' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={{background: 'none', border: 'none', color: '#ef4444'}}><FaTrash size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', padding: '25px 25px 40px 25px', background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(25px)', borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 100 }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '15px'}}>
                    <span style={{ color: '#aaa', fontWeight: '900' }}>TOTAL AMOUNT</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => processOrder("ONLINE")} disabled={isSubmitting} style={{ flex: 1, height: '58px', borderRadius: '18px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '800' }}>Pay Online</button>
                    <button type="button" onClick={() => processOrder("CASH")} disabled={isSubmitting} className="glow-button" style={{ flex: 1.2, height: '58px', borderRadius: '18px', background: '#f97316', color: 'white', border: 'none', fontWeight: '900' }}>ORDER NOW</button>
                </div>
            </div>
        </div>
    );
};

export default Cart;