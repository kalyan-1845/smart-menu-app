import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTrash, FaQrcode, FaMoneyBillWave } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI"); 
    const [utrNumber, setUtrNumber] = useState(""); 
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    const handlePlaceOrder = async () => {
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Cart is empty!");
        if (paymentMethod === "UPI" && utrNumber.length < 4) return alert("Enter last 4 digits of UTR.");

        setIsSubmitting(true);

        const orderData = {
            customerName,
            tableNumber: tableNum.toString(),
            items: cart.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
            totalAmount: totalPrice,
            paymentMethod, 
            paymentId: paymentMethod === "UPI" ? utrNumber : "CASH", 
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            clearCart();
            
            // 🚀 THE REDIRECT: This opens the Order Tracker automatically
            navigate(`/track/${res.data._id}`); 
        } catch (error) {
            alert("Error placing order.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            <h1 style={{ fontWeight: '900' }}>Review Order</h1>
            
            {/* Table & Name Inputs */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', marginBottom: '20px' }}>
                 <p style={{ color: '#555', fontSize: '10px' }}>DELIVERING TO</p>
                 <h3 style={{ color: '#f97316' }}>{tableNum ? `Table ${tableNum}` : "Select Table"}</h3>
                 <input type="text" placeholder="Your Name" value={customerName} onChange={(e)=>setCustomerName(e.target.value)} style={{ width: '100%', padding: '15px', background: '#000', border: '1px solid #222', color: 'white', borderRadius: '12px' }} />
            </div>

            {/* Cart Items List... (Your standard map code here) */}

            {/* Payment & Submit */}
            <button onClick={handlePlaceOrder} disabled={isSubmitting} style={{ width: '100%', padding: '20px', background: '#f97316', color: 'white', borderRadius: '18px', fontWeight: 'bold' }}>
                {isSubmitting ? "PLACING ORDER..." : "CONFIRM & TRACK ORDER"}
            </button>
        </div>
    );
};
export default Cart;