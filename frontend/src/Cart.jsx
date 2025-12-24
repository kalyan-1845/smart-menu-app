import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaQrcode, FaMoneyBillWave, FaEdit } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // RESTORED: Payment Method Toggle (from your video)
    const [paymentMethod, setPaymentMethod] = useState("Online"); // "Online" or "Cash"

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC FIX: Persistence ---
    const finalRestaurantId = restaurantId || localStorage.getItem("activeResId");

    const handlePlaceOrder = async () => {
        // Validation
        if (!tableNum) return setShowTableModal(true);
        if (!customerName.trim()) return alert("Please enter your name!");
        if (cart.length === 0) return alert("Cart is empty!");
        if (!finalRestaurantId) return alert("Error: Restaurant ID missing. Please rescan menu.");

        setIsSubmitting(true);

        // Data Payload
        const orderData = {
            customerName: customerName,
            tableNumber: tableNum.toString(),
            owner: finalRestaurantId,
            items: cart.map(item => ({
                dishId: item._id, // Critical for Backend
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalPrice,
            status: "PLACED",
            paymentStatus: paymentMethod === "Cash" ? "Cash_Pending" : "Pending",
            paymentMethod: paymentMethod // Sending the method to backend
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save History
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            // Redirect to Tracker
            navigate(`/track/${response.data._id}`);
            
        } catch (error) {
            console.error("Order Error:", error);
            alert("Order Failed: " + (error.response?.data?.message || "Check connection"));
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '120px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* --- 1. TABLE MODAL --- */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '25px', padding: '30px', border: '1px solid #333' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px', borderRadius: '12px', background: tableNum === opt ? '#f97316' : '#222', color: 'white', border: '1px solid #333', fontWeight: 'bold' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- 2. HEADER --- */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#222', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '22px', margin: 0 }}>Review Order</h1>
            </div>

            {/* --- 3. CUSTOMER DETAILS CARD --- */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <p style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>DELIVERING TO</p>
                        <h3 style={{ margin: 0, color: '#f97316' }}>{tableNum ? `Table ${tableNum}` : "Not Selected"}</h3>
                    </div>
                    {/* FIXED: Edit Button opens modal now */}
                    <button onClick={() => setShowTableModal(true)} style={{ background: '#222', border: 'none', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Edit
                    </button>
                </div>

                <div style={{ paddingTop: '15px', borderTop: '1px dashed #333' }}>
                    <p style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>YOUR NAME</p>
                    <input 
                        type="text" 
                        placeholder="Who is eating?" 
                        value={customerName} 
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '10px', color: 'white', outline: 'none' }} 
                    />
                </div>
            </div>

            {/* --- 4. ITEMS LIST --- */}
            <div style={{ background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222', marginBottom: '20px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            {/* Uses item image if available */}
                            <img src={item.image} alt="" style={{width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', background: '#333'}} />
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</div>
                                <div style={{ color: '#f97316', fontSize: '14px' }}>₹{item.price}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#222', padding: '5px 10px', borderRadius: '10px', height: 'fit-content' }}>
                            <button onClick={() => updateQuantity(item._id, -1)} style={{ background: 'none', color: 'white', border: 'none', fontSize: '16px' }}>-</button>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, 1)} style={{ background: 'none', color: 'white', border: 'none', fontSize: '16px' }}>+</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- 5. PAYMENT METHOD TOGGLE (Restored from Video) --- */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '20px', border: '1px solid #222', marginBottom: '20px' }}>
                <p style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px' }}>PAYMENT METHOD</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => setPaymentMethod("Online")}
                        style={{ flex: 1, padding: '15px', borderRadius: '12px', border: paymentMethod === "Online" ? '1px solid #f97316' : '1px solid #333', background: paymentMethod === "Online" ? 'rgba(249, 115, 22, 0.1)' : '#080808', color: paymentMethod === "Online" ? '#f97316' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <FaQrcode /> SCAN & PAY
                    </button>
                    <button 
                        onClick={() => setPaymentMethod("Cash")}
                        style={{ flex: 1, padding: '15px', borderRadius: '12px', border: paymentMethod === "Cash" ? '1px solid #f97316' : '1px solid #333', background: paymentMethod === "Cash" ? 'rgba(249, 115, 22, 0.1)' : '#080808', color: paymentMethod === "Cash" ? '#f97316' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                    >
                        <FaMoneyBillWave /> CASH
                    </button>
                </div>
            </div>

            {/* --- 6. BOTTOM BAR --- */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '20px', background: 'rgba(8,8,8,0.95)', borderTop: '1px solid #333', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{color: '#888'}}>Total Bill</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{totalPrice}</span>
                </div>
                <button 
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '18px', borderRadius: '15px', border: 'none', background: '#f97316', color: 'white', fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}
                >
                    {isSubmitting ? "PROCESSING..." : "CONFIRM ORDER"}
                </button>
            </div>
        </div>
    );
};

export default Cart;