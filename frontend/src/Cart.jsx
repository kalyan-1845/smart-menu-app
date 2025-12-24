import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMobileAlt, FaMoneyBillWave, FaArrowLeft, FaTrash, FaQrcode, FaCheckCircle } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI"); 
    const [utrNumber, setUtrNumber] = useState(""); 
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC: SUBMIT ORDER ---
    const handlePlaceOrder = async () => {
        // 1. Validation
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Your cart is empty!");
        
        // 2. UPI Specific Validation
        if (paymentMethod === "UPI" && utrNumber.length < 4) {
            return alert("Please enter the last 4 digits of your UPI Transaction ID (UTR).");
        }

        // 3. Lock Button
        setIsSubmitting(true);

        const orderData = {
            customerName: customerName,
            tableNumber: tableNum.toString(),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                customizations: item.customizations || [] 
            })),
            totalAmount: totalPrice,
            paymentMethod: paymentMethod, 
            paymentId: paymentMethod === "UPI" ? utrNumber : "CASH", 
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save order ID to local history
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            navigate(`/track/${response.data._id}`);
        } catch (error) {
            console.error("Submission error:", error);
            alert(error.response?.data?.message || "Connection Error. Try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '180px', maxWidth: '480px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            
            {/* 1. TABLE SELECTION MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid #222', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', fontWeight: '900' }}>Where are you sitting?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '18px 0', borderRadius: '16px', border: '1px solid #333', background: tableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: '900', fontSize: '14px', cursor: 'pointer', transition: '0.2s' }}>
                                    {opt === "Takeaway" ? "🛍️" : opt}
                                    <div style={{fontSize: '10px', marginTop: '4px'}}>{opt === "Takeaway" ? "Takeaway" : `Table ${opt}`}</div>
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTableModal(false)} style={{width: '100%', padding: '15px', marginTop: '20px', background: 'transparent', border: 'none', color: '#666', fontWeight: 'bold'}}>Close</button>
                    </div>
                </div>
            )}

            {/* 2. TOP NAVIGATION */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Review Order</h1>
            </div>

            {/* 3. DELIVERY & CUSTOMER INFO */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
                    <div>
                        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Delivery To</p>
                        <h3 style={{ margin: 0, color: '#f97316', fontWeight: '900' }}>{tableNum ? (tableNum === "Takeaway" ? "Takeaway Order" : `Table ${tableNum}`) : "Select Table"}</h3>
                    </div>
                    <span style={{ color: '#f97316', fontSize: '12px', fontWeight: 'bold', background: 'rgba(249, 115, 22, 0.1)', padding: '5px 12px', borderRadius: '10px' }}>Change</span>
                </div>
                <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '15px' }}>
                    <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Your Name</p>
                    <input type="text" placeholder="Enter name for the bill" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #222', borderRadius: '14px', color: 'white', outline: 'none', fontWeight: 'bold' }} />
                </div>
            </div>

            {/* 4. ORDER SUMMARY */}
            <p style={{ color: '#555', fontSize: '11px', fontWeight: '900', letterSpacing: '1px', marginBottom: '12px', marginLeft: '5px' }}>ORDER SUMMARY</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                {cart.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '30px', color: '#444', background: '#111', borderRadius: '24px'}}>Your cart is empty.</div>
                ) : cart.map((item) => (
                    <div key={item._id} style={{ background: '#111', padding: '12px', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img src={item.image || "https://via.placeholder.com/60"} alt="" style={{ width: '55px', height: '55px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{item.name}</h4>
                            <p style={{ margin: 0, color: '#f97316', fontWeight: '900', fontSize: '13px' }}>₹{item.price * item.quantity}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#080808', padding: '5px 12px', borderRadius: '10px', border: '1px solid #1a1a1a' }}>
                            <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '18px', cursor: 'pointer' }}>-</button>
                            <span style={{ fontSize: '13px', fontWeight: '900' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '18px', cursor: 'pointer' }}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} style={{background: '#1a1a1a', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '10px'}}><FaTrash size={12}/></button>
                    </div>
                ))}
            </div>

            {/* 5. PAYMENT SELECTION */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>CHOOSE PAYMENT</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                    <button onClick={() => setPaymentMethod("UPI")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'UPI' ? '#f97316' : '#1a1a1a', background: paymentMethod === 'UPI' ? 'rgba(249, 115, 22, 0.05)' : '#161616', color: paymentMethod === 'UPI' ? '#f97316' : '#555', transition: '0.3s', cursor: 'pointer' }}>
                        <FaQrcode size={18} style={{ marginBottom: '6px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>ONLINE PAY</span>
                    </button>
                    <button onClick={() => setPaymentMethod("CASH")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'CASH' ? '#22c55e' : '#1a1a1a', background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.05)' : '#161616', color: paymentMethod === 'CASH' ? '#22c55e' : '#555', transition: '0.3s', cursor: 'pointer' }}>
                        <FaMoneyBillWave size={18} style={{ marginBottom: '6px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>PAY AT DESK</span>
                    </button>
                </div>

                {paymentMethod === "UPI" && (
                    <div style={{ background: '#161616', padding: '15px', borderRadius: '18px', border: '1px dashed #f97316' }}>
                        <p style={{ color: '#f97316', fontSize: '11px', marginBottom: '10px', fontWeight:'900' }}>VERIFY TRANSACTION ID</p>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            placeholder="Enter last 4 digits of UTR" 
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))} // Numbers only
                            maxLength={4}
                            style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #333', borderRadius: '12px', color: 'white', outline: 'none', fontWeight: '900', fontSize:'18px', textAlign: 'center', letterSpacing: '4px' }} 
                        />
                        <p style={{ color: '#666', fontSize: '9px', marginTop: '10px', textAlign: 'center' }}>Pay using the QR code at your table before confirming.</p>
                    </div>
                )}
            </div>

            {/* 6. FIXED BOTTOM CHECKOUT */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '20px', background: 'rgba(8, 8, 8, 0.9)', backdropFilter: 'blur(15px)', borderTop: '1px solid #1a1a1a', zIndex: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold' }}>Total Payable</span>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</div>
                    </div>
                    {paymentMethod === "UPI" && utrNumber.length === 4 && <FaCheckCircle color="#22c55e" size={24} />}
                </div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting || cart.length === 0}
                    style={{ 
                        width: '100%', 
                        padding: '18px', 
                        borderRadius: '16px', 
                        border: 'none', 
                        background: isSubmitting ? '#222' : (paymentMethod === 'UPI' ? '#f97316' : '#22c55e'), 
                        color: isSubmitting ? '#555' : 'white', 
                        fontSize: '15px', 
                        fontWeight: '900', 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                        boxShadow: isSubmitting ? 'none' : '0 8px 20px rgba(0,0,0,0.4)',
                        transition: '0.3s transform',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isSubmitting ? "PROCESSING ORDER..." : (paymentMethod === "UPI" ? "CONFIRM PAYMENT & ORDER" : "PLACE ORDER (CASH)")}
                </button>
            </div>
        </div>
    );
};

export default Cart;