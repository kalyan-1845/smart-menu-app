import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, FaCircle, FaCheckCircle } from "react-icons/fa";

// 🔗 SMART API CONNECTION
const SERVER_URL = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000" 
    : "https://smart-menu-backend-5ge7.onrender.com";

const API_BASE = `${SERVER_URL}/api`;

// --- GLOW ANIMATIONS ---
const glowStyles = `
@keyframes pulseGlow {
  0% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.4), 0 0 10px rgba(249, 115, 22, 0.2); }
  50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.8), 0 0 30px rgba(249, 115, 22, 0.4); }
  100% { box-shadow: 0 0 5px rgba(249, 115, 22, 0.4), 0 0 10px rgba(249, 115, 22, 0.2); }
}
.glow-button {
  animation: pulseGlow 2s infinite ease-in-out;
}
.glass-input:focus {
  border-color: #f97316 !important;
  box-shadow: 0 0 15px rgba(249, 115, 22, 0.3);
}
@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
`;

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [restaurant, setRestaurant] = useState(null);
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Success popup state
    
    // --- SECURE FALLBACK LOGIC ---
    const finalRestaurantId = restaurantId || localStorage.getItem("last_restaurant_id");
    const finalTableNum = tableNum || localStorage.getItem("last_table_num");

    // Table Options
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- FETCH RESTAURANT DETAILS ---
    useEffect(() => {
        const fetchRestaurant = async () => {
            if (finalRestaurantId) {
                try {
                    const res = await axios.get(`${API_BASE}/auth/restaurant/${finalRestaurantId}`);
                    setRestaurant(res.data);
                } catch (err) {
                    console.error("Error fetching restaurant details:", err);
                }
            }
        };
        fetchRestaurant();
    }, [finalRestaurantId]);

    // --- ORDER SUCCESS REDIRECT LOGIC ---
    const processOrder = async (paymentMethod) => {
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!finalTableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Your cart is empty!"); return; }
        if (!finalRestaurantId) { 
            alert("System Error: Restaurant ID missing. Please reload from the menu."); 
            return; 
        }

        setIsSubmitting(true);

        const orderData = {
            customerName: customerName,
            tableNum: finalTableNum.toString(), 
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalPrice,
            paymentMethod: paymentMethod === "ONLINE" ? "Online" : "Cash",
            restaurantId: finalRestaurantId, // SECURE: Uses specific restaurant ID
            status: "Pending",
            isDownloaded: false 
        };

        try {
            const response = await axios.post(`${API_BASE}/orders`, orderData);
            
            const socket = io(SERVER_URL);
            socket.emit("new-order", response.data); 
            
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));
            
            // SHOW SUCCESS POPUP BEFORE REDIRECT
            setShowSuccessPopup(true);
            
            setTimeout(() => {
                clearCart(); 
                navigate(`/track/${response.data._id}`); // SECURE REDIRECT
            }, 2000);

        } catch (error) {
            console.error("Submission error:", error);
            alert(`Order Failed: ${error.response?.data?.message || "Network Error"}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ 
            minHeight: '100vh', background: '#050505', color: 'white', 
            padding: '15px', paddingBottom: '160px', 
            width: '100%', maxWidth: '600px', margin: '0 auto', 
            fontFamily: "'Inter', sans-serif", overflowX: 'hidden', boxSizing: 'border-box'
        }}>
            <style>{glowStyles}</style>
            
            {/* GLOWING BACKGROUND */}
            <div style={{ position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', background: 'rgba(249, 115, 22, 0.15)', filter: 'blur(100px)', zIndex: 0 }}></div>

            {/* ORDER SUCCESS POPUP */}
            {showSuccessPopup && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', padding: '40px', borderRadius: '30px', textAlign: 'center', border: '1px solid #22c55e', animation: 'fadeInScale 0.4s ease-out' }}>
                        <FaCheckCircle size={60} color="#22c55e" style={{ marginBottom: '20px' }} />
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900' }}>Order Placed!</h2>
                        <p style={{ color: '#888', marginTop: '10px' }}>Redirecting to tracker...</p>
                    </div>
                </div>
            )}

            {/* TABLE SELECTION MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 30px rgba(249, 115, 22, 0.2)' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '20px', fontWeight: '900' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { 
                                    setTableNum(opt); 
                                    localStorage.setItem("last_table_num", opt); 
                                    setShowTableModal(false); 
                                }} 
                                    style={{ padding: '15px', borderRadius: '16px', border: '1px solid #333', background: finalTableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: 'bold', boxShadow: finalTableNum === opt ? '0 0 15px rgba(249, 115, 22, 0.5)' : 'none', transition: '0.3s' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>Review Order</h1>
            </div>

            {/* INFO CARD */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '24px', borderRadius: '28px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', cursor: 'pointer', alignItems: 'center' }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '6px' }}>DELIVERING TO</p>
                        <div style={{ margin: 0, color: '#f97316', fontSize: '20px', fontWeight: '900', textShadow: '0 0 10px rgba(249, 115, 22, 0.3)' }}>
                            {finalTableNum ? `Table ${finalTableNum}` : "Select Table"}
                        </div>
                    </div>
                    <span style={{ color: 'white', fontSize: '11px', fontWeight: 'bold', background: 'rgba(249, 115, 22, 0.2)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.3)', transition: '0.3s' }}>Change</span>
                </div>
                
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                    <p style={{ color: '#888', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>YOUR NAME</p>
                    <input type="text" placeholder="Enter name for order" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        className="glass-input"
                        style={{ width: '100%', padding: '16px', background: '#080808', border: '1px solid #222', borderRadius: '16px', color: 'white', outline: 'none', fontWeight: '600', fontSize: '16px', transition: '0.3s' }} 
                    />
                </div>
            </div>

            {/* CART ITEMS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', transition: '0.3s' }}>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{item.name}</h4>
                                <p style={{ margin: '4px 0 0 0', color: '#f97316', fontWeight: '900', fontSize: '14px' }}>₹{item.price * item.quantity}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '6px 14px', borderRadius: '14px', border: '1px solid #111' }}>
                                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer' }}>-</button>
                                <span style={{ fontSize: '14px', fontWeight: '900' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '18px', cursor: 'pointer' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={{background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: '0.3s'}}>
                                <FaTrash size={14}/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* FOOTER */}
            <div style={{ 
                position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
                width: '100%', maxWidth: '600px', 
                padding: '25px 25px 40px 25px', background: 'rgba(5, 5, 5, 0.85)', backdropFilter: 'blur(25px)', 
                borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '15px', zIndex: 100
            }}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{ color: '#aaa', fontWeight: '900', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>GRAND TOTAL</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: 'white', textShadow: '0 0 15px rgba(255,255,255,0.3)' }}>₹{totalPrice}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => processOrder("ONLINE")} disabled={isSubmitting}
                        style={{ flex: 1, height: '58px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
                        <FaMobileAlt size={16} color="#f97316" /> Pay Online
                    </button>

                    <button 
                        className="glow-button"
                        onClick={() => processOrder("CASH")} disabled={isSubmitting}
                        style={{ flex: 1.2, height: '58px', borderRadius: '18px', border: 'none', background: '#f97316', color: 'white', fontSize: '14px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: '0.3s' }}>
                        <FaMoneyBillWave size={18} /> ORDER NOW
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;