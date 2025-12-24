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

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 400 ERROR FIX: Get ID from URL if state is lost ---
    // If you refresh the page, restaurantId might become null. This fixes it.
    const finalRestaurantId = restaurantId || localStorage.getItem("lastRestId");

    const handlePlaceOrder = async () => {
        // Validation
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Cart is empty!");
        if (!finalRestaurantId) return alert("Error: Restaurant ID missing. Go back to menu.");

        setIsSubmitting(true);

        // --- THE DATA PAYLOAD (Strictly formatted for your Backend) ---
        const orderData = {
            customerName: customerName,
            tableNumber: tableNum.toString(),
            owner: finalRestaurantId, // Ensure this isn't null
            items: cart.map(item => ({
                dishId: item._id, // ✅ FIX: Most backends require the MongoDB _id
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: totalPrice,
            status: "PLACED",
            paymentStatus: "Pending"
        };

        try {
            console.log("Attempting to place order...", orderData);
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save order ID so user can find it later
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            // Go to tracker
            navigate(`/track/${response.data._id}`);
            
        } catch (error) {
            setIsSubmitting(false);
            // This shows you the EXACT reason the backend said 400
            const errorMsg = error.response?.data?.message || "Check Console for details";
            console.error("BACKEND REJECTION:", error.response?.data);
            alert("Order Failed: " + errorMsg);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            {/* Table Selection Modal */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#111', width: '90%', borderRadius: '25px', padding: '25px' }}>
                        <h2 style={{ textAlign: 'center' }}>Select Table</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px', borderRadius: '12px', background: tableNum === opt ? '#f97316' : '#222', color: 'white', border: 'none' }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <button onClick={() => navigate(-1)} style={{ background: '#222', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '10px' }}>←</button>
                <h1 style={{ fontSize: '20px' }}>Review Basket</h1>
            </div>

            <div style={{ background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px' }}>
                <p style={{ color: '#666', fontSize: '12px' }}>NAME</p>
                <input 
                    type="text" 
                    placeholder="Enter your name" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: '#000', border: '1px solid #333', borderRadius: '10px', color: 'white' }} 
                />
            </div>

            <div style={{ background: '#111', borderRadius: '20px', padding: '20px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                            <div style={{ color: '#f97316' }}>₹{item.price} x {item.quantity}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={() => updateQuantity(item._id, -1)} style={{ background: '#222', color: 'white', border: 'none', width: '30px', borderRadius: '5px' }}>-</button>
                            <button onClick={() => updateQuantity(item._id, 1)} style={{ background: '#222', color: 'white', border: 'none', width: '30px', borderRadius: '5px' }}>+</button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '20px', background: '#080808', borderTop: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Total Bill</span>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>₹{totalPrice}</span>
                </div>
                <button 
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: '#f97316', color: 'white', fontWeight: 'bold' }}
                >
                    {isSubmitting ? "ORDERING..." : "CONFIRM ORDER"}
                </button>
            </div>
        </div>
    );
};

export default Cart;