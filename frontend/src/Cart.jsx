import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMobileAlt, FaMoneyBillWave, FaArrowLeft, FaTrash, FaQrcode } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI"); 
    const [utrNumber, setUtrNumber] = useState(""); // 🟢 New State for UTR
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track selected specifications: { "itemId": ["No Onion"] }
    const [selectedSpecs, setSelectedSpecs] = useState({});
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC: SUBMIT ORDER ---
    const handlePlaceOrder = async () => {
        // 1. Basic Validation
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Your cart is empty!");
        
        // 2. Payment Validation (The crucial fix)
        if (paymentMethod === "UPI" && utrNumber.length < 4) {
            return alert("Please enter the last 4 digits of your UPI Transaction ID (UTR) to confirm payment.");
        }

        // 3. Lock the button immediately
        setIsSubmitting(true);

        const orderData = {
            customerName: customerName,
            tableNumber: tableNum.toString(),
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                customizations: selectedSpecs[item._id] || [] 
            })),
            totalAmount: totalPrice,
            paymentMethod: paymentMethod, 
            // 🟢 Send UTR to backend so Owner can see it
            paymentId: paymentMethod === "UPI" ? utrNumber : "CASH", 
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save to local history for "Re-track" feature
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            navigate(`/track/${response.data._id}`);
            
            // NOTE: We DO NOT set setIsSubmitting(false) here. 
            // We keep it disabled while the page transitions.

        } catch (error) {
            console.error("Submission error:", error);
            alert(error.response?.data?.message || "Connection Error.");
            
            // Only unlock if it FAILED
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '160px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* 1. TABLE MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid #222' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '18px', borderRadius: '16px', border: '1px solid #333', background: tableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: 'bold' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTableModal(false)} style={{width: '100%', padding: '15px', marginTop: '20px', background: 'transparent', border: 'none', color: '#666'}}>Cancel</button>
                    </div>
                </div>
            )}

            {/* 2. HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Review Order</h1>
            </div>

            {/* 3. USER DETAILS INPUTS */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '28px', marginBottom: '20px', border: '1px solid #1a1a1a' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', cursor: 'pointer' }}>
                    <div>
                        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px' }}>DELIVERING TO</p>
                        <h3 style={{ margin: 0, color: '#f97316' }}>{tableNum ? `Table ${tableNum}` : "Select Table"}</h3>
                    </div>
                    <span style={{ color: '#444', fontSize: '12px', fontWeight: 'bold' }}>Edit</span>
                </div>
                <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
                    <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>YOUR NAME</p>
                    <input type="text" placeholder="Who's eating?" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #222', borderRadius: '14px', color: 'white', outline: 'none', fontWeight: 'bold' }} />
                </div>
            </div>

            {/* 4. CART ITEMS LIST */}
            {cart.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#444'}}>
                    <p>Your cart is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                    {cart.map((item) => (
                        <div key={item._id} style={{ background: '#111', padding: '15px', borderRadius: '24px', border: '1px solid #1a1a1a', display: 'flex', gap: '15px', alignItems: 'center' }}>
                             {item.image ? <img src={item.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '14px', objectFit: 'cover' }} /> : <div style={{width:'60px', height:'60px', background:'#222', borderRadius:'14px'}}></div>}
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '14px' }}>{item.name}</h4>
                                <p style={{ margin: 0, color: '#f97316', fontWeight: '900' }}>₹{item.price * item.quantity}</p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#080808', padding: '6px 14px', borderRadius: '12px' }}>
                                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '20px', cursor: 'pointer' }}>-</button>
                                <span style={{ fontSize: '14px', fontWeight: '900' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '20px', cursor: 'pointer' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={{background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '5px'}}><FaTrash size={12}/></button>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. PAYMENT SECTION (Updated) */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '28px', marginBottom: '20px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>PAYMENT METHOD</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <button onClick={() => setPaymentMethod("UPI")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'UPI' ? '#f97316' : '#222', background: paymentMethod === 'UPI' ? 'rgba(249, 115, 22, 0.1)' : 'transparent', color: paymentMethod === 'UPI' ? '#f97316' : '#555', transition: '0.3s', cursor: 'pointer' }}>
                        <FaQrcode size={20} style={{ marginBottom: '5px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>SCAN & PAY</span>
                    </button>
                    <button onClick={() => setPaymentMethod("CASH")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'CASH' ? '#22c55e' : '#222', background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.1)' : 'transparent', color: paymentMethod === 'CASH' ? '#22c55e' : '#555', transition: '0.3s', cursor: 'pointer' }}>
                        <FaMoneyBillWave size={20} style={{ marginBottom: '5px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>CASH</span>
                    </button>
                </div>

                {/* 🟢 CONDITIONAL INPUT: Only show if UPI is selected */}
                {paymentMethod === "UPI" && (
                    <div style={{animation: 'fadeIn 0.5s'}}>
                        <p style={{ color: '#f97316', fontSize: '11px', marginBottom: '8px', fontWeight:'bold' }}>VERIFY PAYMENT 👇</p>
                        <input 
                            type="text" 
                            placeholder="Enter last 4 digits of UTR / Ref No." 
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value)}
                            maxLength={12}
                            style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #f97316', borderRadius: '14px', color: 'white', outline: 'none', fontWeight: 'bold', fontSize:'14px' }} 
                        />
                        <p style={{ color: '#666', fontSize: '10px', marginTop: '8px' }}>*Scan the QR at the table, pay, and enter the reference number here.</p>
                    </div>
                )}
            </div>

            {/* 6. FIXED BOTTOM CHECKOUT BAR */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '25px', background: 'rgba(8, 8, 8, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#888', fontWeight: 'bold' }}>Final Total</span>
                    <span style={{ fontSize: '26px', fontWeight: '900' }}>₹{totalPrice}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting}
                    style={{ 
                        width: '100%', 
                        padding: '20px', 
                        borderRadius: '18px', 
                        border: 'none', 
                        background: isSubmitting ? '#444' : '#f97316', 
                        color: isSubmitting ? '#888' : 'white', 
                        fontSize: '16px', 
                        fontWeight: '900', 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                        boxShadow: isSubmitting ? 'none' : '0 10px 25px rgba(249, 115, 22, 0.3)',
                        transition: '0.3s'
                    }}>
                    {isSubmitting ? "VERIFYING..." : (paymentMethod === "UPI" ? "CONFIRM PAYMENT" : "PLACE ORDER")}
                </button>
            </div>
        </div>
    );
};

export default Cart;