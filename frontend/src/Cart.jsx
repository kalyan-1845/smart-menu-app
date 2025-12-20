import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [showTableModal, setShowTableModal] = useState(!tableNum);

    // Track selected specifications: { "itemId": ["No Onion", "Extra Cream"] }
    const [selectedSpecs, setSelectedSpecs] = useState({});

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    // --- LOGIC: Toggle Customizations ---
    const toggleSpec = (itemId, spec) => {
        setSelectedSpecs(prev => {
            const currentSpecs = prev[itemId] || [];
            if (currentSpecs.includes(spec)) {
                return { ...prev, [itemId]: currentSpecs.filter(s => s !== spec) };
            } else {
                return { ...prev, [itemId]: [...currentSpecs, spec] };
            }
        });
    };

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- LOGIC: Submit Order to Backend ---
    const finalizeOrder = async () => {
        if (!customerName) return alert("Please enter your name");
        if (!tableNum) {
            setShowTableModal(true);
            return;
        }
        if (cart.length === 0) return alert("Your cart is empty!");

        const orderData = {
            customerName,
            // 🟢 FIX: Send as string to avoid "Table undefined" in Kitchen
            tableNumber: tableNum.toString(), 
            items: cart.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                // 🟢 FIX: Send selected customizations so Chef sees the red alerts
                selectedSpecs: selectedSpecs[item._id] || [] 
            })),
            totalAmount: totalPrice,
            paymentMethod,
            status: "PLACED", 
            owner: restaurantId,
            createdAt: new Date()
        };

        try {
            // Adjust URL to your production/local backend
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Clear cart and redirect to success page
            clearCart();
            navigate("/order-success", { state: { order: response.data } });
        } catch (error) {
            console.error("Submission error:", error);
            alert("Connection Error: The Kitchen did not receive your order. Please check your internet.");
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0d0d0d', color: 'white', padding: '20px', paddingBottom: '120px', maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            
            {/* 1. TABLE SELECTION MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: '#1a1a1a', width: '100%', maxWidth: '400px', borderRadius: '24px', padding: '30px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontSize: '20px' }}>Where are you sitting?</h2>
                        <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginBottom: '24px' }}>Select a table to see the menu correctly</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button 
                                    key={opt} 
                                    onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px', borderRadius: '16px', border: '1px solid #444', background: tableNum === opt ? '#f97316' : '#0d0d0d', color: 'white', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <Link to={-1} style={{ color: 'white', textDecoration: 'none', fontSize: '24px', background: '#1f1f1f', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>←</Link>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Review Order</h1>
            </div>

            {/* 3. LOCATION & NAME SECTION */}
            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #333' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', cursor: 'pointer' }}>
                    <div>
                        <p style={{ color: '#666', fontSize: '11px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase' }}>YOUR LOCATION</p>
                        <h3 style={{ margin: 0, fontSize: '16px', color: '#f97316' }}>{tableNum ? `Table ${tableNum}` : "Click to select table"}</h3>
                    </div>
                    <span style={{ fontSize: '14px' }}>✎</span>
                </div>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: '#666', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>GUEST NAME</label>
                    <input 
                        type="text" placeholder="Enter your name..." value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#0d0d0d', border: '1px solid #333', borderRadius: '12px', color: 'white', outline: 'none' }}
                    />
                </div>
            </div>

            {/* 4. CART ITEMS LIST */}
            {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#444' }}>
                    <h3 style={{ marginBottom: '10px' }}>Your cart is empty</h3>
                    <Link to="/" style={{ color: '#f97316', textDecoration: 'none', fontWeight: 'bold' }}>Browse Menu</Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {cart.map((item) => (
                        <div key={item._id} style={{ background: '#1a1a1a', padding: '16px', borderRadius: '20px', border: '1px solid #333' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img src={item.image} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>{item.name}</h3>
                                    <p style={{ margin: 0, color: '#f97316', fontWeight: 'bold', fontSize: '14px' }}>₹{item.price * item.quantity}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0d0d0d', padding: '5px 12px', borderRadius: '12px' }}>
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer' }}>+</button>
                                </div>
                            </div>

                            {/* 🟢 DYNAMIC SPECIFICATIONS (Chef alert logic) */}
                            <div style={{ background: '#0d0d0d', padding: '12px', borderRadius: '12px', marginTop: '15px' }}>
                                <p style={{ fontSize: '10px', color: '#555', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Specifications</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {item.specifications && item.specifications.length > 0 ? (
                                        item.specifications.map((spec) => (
                                            <button
                                                key={spec}
                                                onClick={() => toggleSpec(item._id, spec)}
                                                style={{
                                                    padding: '6px 12px', borderRadius: '8px', fontSize: '11px', border: '1px solid #333',
                                                    background: selectedSpecs[item._id]?.includes(spec) ? '#f97316' : '#1a1a1a',
                                                    color: selectedSpecs[item._id]?.includes(spec) ? 'black' : 'white', 
                                                    fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
                                                }}
                                            >
                                                {spec}
                                            </button>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: '11px', color: '#333' }}>Standard Recipe</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. FIXED BOTTOM ACTION BAR */}
            {cart.length > 0 && (
                <div style={{ position: 'fixed', bottom: '0', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#1a1a1a', padding: '20px', borderTop: '1px solid #333', zIndex: 100, borderRadius: '24px 24px 0 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ fontSize: '14px', color: '#888' }}>Grand Total</span>
                        <span style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</span>
                    </div>
                    <button 
                        onClick={finalizeOrder} 
                        style={{ width: '100%', background: '#f97316', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '900', border: 'none', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(249, 115, 22, 0.3)' }}
                    >
                        SEND TO KITCHEN
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;