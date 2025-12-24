import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSpecs, setSelectedSpecs] = useState({});

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC: AUTOMATIC SUBMISSION ---
    // This effect triggers if the user has already provided their name and table.
    // It fulfills your "No time wasted for Chef" requirement.
    useEffect(() => {
        if (customerName.trim() && tableNum && cart.length > 0 && !isSubmitting) {
            handlePlaceOrder();
        }
    }, [customerName, tableNum]);

    const handlePlaceOrder = async () => {
        if (!customerName.trim() || !tableNum || cart.length === 0 || isSubmitting) return;

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
            paymentMethod: "PENDING", 
            paymentId: "NOT_SET",
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save to history
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            // Redirect straight to your updated OrderTracker
            navigate(`/track-order/${response.data._id}`);
            
        } catch (error) {
            console.error("Submission error:", error);
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '160px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* 1. TABLE MODAL (Forces choice so order can be sent immediately) */}
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
                    </div>
                </div>
            )}

            {/* 2. HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>Review Basket</h1>
            </div>

            {/* 3. NAME INPUT (The "Trigger" for auto-ordering) */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '28px', marginBottom: '20px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>ENTER NAME TO CONFIRM ORDER</p>
                <input 
                    type="text" 
                    placeholder="E.g. Kalyan Reddy" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #222', borderRadius: '14px', color: 'white', outline: 'none', fontWeight: 'bold' }} 
                />
                <p style={{ fontSize: '11px', color: '#444', marginTop: '10px' }}>Order will be sent to kitchen immediately after entering name.</p>
            </div>

            {/* 4. ITEM LIST */}
            <div style={{ background: '#111', borderRadius: '28px', padding: '20px', border: '1px solid #1a1a1a', marginBottom: '20px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>YOUR SELECTIONS</p>
                {cart.map((item) => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #1a1a1a' }}>
                        <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '14px' }}>{item.name}</h4>
                            <p style={{ margin: '5px 0 0', color: '#f97316', fontWeight: '900' }}>₹{item.price}</p>
                        </div>
                        <div style={{ fontWeight: 'bold' }}>x{item.quantity}</div>
                    </div>
                ))}
            </div>

            {/* 5. AUTO-SUBMIT STATUS */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '25px', background: 'rgba(8, 8, 8, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <span style={{ color: '#888', fontWeight: 'bold' }}>Total</span>
                    <span style={{ fontSize: '26px', fontWeight: '900' }}>₹{totalPrice}</span>
                </div>
                <button 
                    disabled={isSubmitting || !customerName.trim()}
                    style={{ 
                        width: '100%', padding: '20px', borderRadius: '18px', border: 'none', 
                        background: (isSubmitting || !customerName.trim()) ? '#333' : '#f97316', 
                        color: 'white', fontSize: '16px', fontWeight: '900'
                    }}
                >
                    {isSubmitting ? "SENDING TO KITCHEN..." : "READY TO ORDER"}
                </button>
            </div>
        </div>
    );
};

export default Cart;