import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI"); // Added Payment State
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track selected specifications
    const [selectedSpecs, setSelectedSpecs] = useState({});
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC: SUBMIT ORDER ---
    const handlePlaceOrder = async () => {
        if (!customerName.trim()) return alert("Please enter your name so the waiter knows it's you!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Your cart is empty!");

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
            paymentMethod: paymentMethod, // Now using the selected method
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            navigate(`/track/${response.data._id}`);
        } catch (error) {
            console.error("Submission error:", error);
            alert(error.response?.data?.message || "Connection Error: Check your internet.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---
    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '160px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* 1. TABLE MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid #222' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px', borderRadius: '16px', border: '1px solid #333', background: tableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: 'bold' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Review Order</h1>
            </div>

            {/* 3. USER DETAILS INPUTS */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                {/* Table Selector - SMALLER SIZE */}
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', cursor: 'pointer', alignItems: 'center' }}>
                    <div>
                        <p style={{ color: '#555', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>DELIVERING TO</p>
                        {/* Reduced font size from h3 to 16px */}
                        <div style={{ margin: 0, color: '#f97316', fontSize: '16px', fontWeight: 'bold' }}>
                            {tableNum ? `Table ${tableNum}` : "Select Table"}
                        </div>
                    </div>
                    <span style={{ color: '#444', fontSize: '11px', fontWeight: 'bold', background: '#1a1a1a', padding: '4px 10px', borderRadius: '8px' }}>Change</span>
                </div>
                
                {/* Name Input */}
                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <p style={{ color: '#555', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px' }}>YOUR NAME</p>
                    <input type="text" placeholder="Who's eating?" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid #222', borderRadius: '12px', color: 'white', outline: 'none', fontWeight: 'bold', fontSize: '14px' }} />
                </div>
            </div>

            {/* 4. CART ITEMS LIST */}
            {cart.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#444'}}>
                    <p>Your cart is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    {cart.map((item) => (
                        <div key={item._id} style={{ background: '#111', padding: '12px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {/* Image Placeholder */}
                                {item.image ? (
                                    <img src={item.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#222'}}></div>
                                )}
                                
                                <div style={{ flex: 1 }}>
                                    {/* Reduced font size for Name and Price */}
                                    <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{item.name}</h4>
                                    <p style={{ margin: '2px 0 0 0', color: '#f97316', fontWeight: '800', fontSize: '13px' }}>₹{item.price * item.quantity}</p>
                                </div>
                                
                                {/* Quantity Controls */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#080808', padding: '5px 10px', borderRadius: '10px' }}>
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontSize: '12px', fontWeight: '900' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '16px', cursor: 'pointer' }}>+</button>
                                </div>
                                
                                <button onClick={() => removeFromCart(item._id)} style={{background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '5px'}}>
                                    <FaTrash size={10}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. PAYMENT METHOD SELECTOR (Restored per request) */}
            <div style={{ marginBottom: '100px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px', textTransform: 'uppercase' }}>Payment Method</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* UPI Button */}
                    <button 
                        onClick={() => setPaymentMethod("UPI")}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s',
                            // Styles for selected vs unselected
                            background: 'transparent',
                            border: paymentMethod === 'UPI' ? '2px solid #f97316' : '1px solid #222',
                            color: paymentMethod === 'UPI' ? '#f97316' : '#555'
                        }}
                    >
                        <FaMobileAlt size={24} />
                        <span style={{ fontSize: '11px', fontWeight: '900' }}>UPI ONLINE</span>
                    </button>

                    {/* Cash Button */}
                    <button 
                        onClick={() => setPaymentMethod("CASH")}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '16px', cursor: 'pointer', transition: '0.2s',
                            // Styles for selected vs unselected
                            background: 'transparent',
                            border: paymentMethod === 'CASH' ? '2px solid #f97316' : '1px solid #222',
                            color: paymentMethod === 'CASH' ? '#f97316' : '#555'
                        }}
                    >
                        <FaMoneyBillWave size={24} />
                        <span style={{ fontSize: '11px', fontWeight: '900' }}>PAY AT TABLE</span>
                    </button>
                </div>
            </div>

            {/* 6. FIXED BOTTOM CHECKOUT BAR */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '25px', background: 'rgba(8, 8, 8, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#888', fontWeight: 'bold', fontSize: '14px' }}>Final Total</span>
                    <span style={{ fontSize: '24px', fontWeight: '900' }}>₹{totalPrice}</span>
                </div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting}
                    style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: isSubmitting ? '#555' : '#f97316', color: 'white', fontSize: '15px', fontWeight: '900', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: isSubmitting ? 'none' : '0 10px 25px rgba(249, 115, 22, 0.3)' }}>
                    {isSubmitting ? "SYNCING..." : "PLACE ORDER NOW"}
                </button>
            </div>
        </div>
    );
};

export default Cart;