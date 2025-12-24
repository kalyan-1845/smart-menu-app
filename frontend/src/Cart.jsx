import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaMobileAlt, FaMoneyBillWave, FaArrowLeft, FaTrash, FaQrcode, FaCheckCircle, FaGoogle, FaWallet } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("UPI"); 
    const [utrNumber, setUtrNumber] = useState(""); 
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // 🟢 Store Restaurant Data (Needed for UPI Links)
    const [restaurant, setRestaurant] = useState(null);

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. FETCH RESTAURANT DETAILS (For UPI ID) ---
    useEffect(() => {
        const fetchRestaurant = async () => {
            if(restaurantId) {
                try {
                    const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${restaurantId}`);
                    setRestaurant(res.data);
                } catch (e) { console.error("Error fetching restaurant UPI", e); }
            }
        };
        fetchRestaurant();
    }, [restaurantId]);

    // --- 2. PAYMENT APP HANDLER ---
    const handleAppPayment = () => {
        if (!restaurant || !restaurant.upiId) return alert("Restaurant UPI ID not available. Please pay Cash.");
        
        const payeeName = restaurant.username || "Restaurant";
        const note = `Table ${tableNum || 'NA'} Bill`;
        
        // Universal UPI Link format
        let upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${payeeName}&am=${totalPrice}&cu=INR&tn=${note}`;
        
        // Open the App
        window.location.href = upiLink;
    };

    // --- 3. SUBMIT ORDER ---
    const handlePlaceOrder = async () => {
        // Validation
        if (!customerName.trim()) return alert("Please enter your name!");
        if (!tableNum) return setShowTableModal(true);
        if (cart.length === 0) return alert("Your cart is empty!");
        
        // UPI Validation
        if (paymentMethod === "UPI" && utrNumber.length < 4) {
            return alert("Please enter the last 4 digits of your UPI Transaction ID (UTR) to confirm.");
        }

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
            
            // Save order history locally
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));

            clearCart();
            // Redirect to Order Tracker
            navigate(`/track/${response.data._id}`);
        } catch (error) {
            console.error("Submission error:", error);
            alert(error.response?.data?.message || "Connection Error.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#080808', color: 'white', padding: '20px', paddingBottom: '180px', maxWidth: '480px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
            
            {/* TABLE MODAL */}
            {showTableModal && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(10px)' }}>
                    <div style={{ background: '#111', width: '100%', maxWidth: '400px', borderRadius: '32px', padding: '30px', border: '1px solid #222', textAlign: 'center' }}>
                        <h2 style={{ marginBottom: '20px', fontWeight: '900' }}>Where are you sitting?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ padding: '15px 0', borderRadius: '16px', border: '1px solid #333', background: tableNum === opt ? '#f97316' : '#1a1a1a', color: 'white', fontWeight: '900', fontSize: '14px', cursor: 'pointer' }}>
                                    {opt === "Takeaway" ? "🛍️" : opt}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowTableModal(false)} style={{width: '100%', padding: '15px', marginTop: '20px', background: 'transparent', border: 'none', color: '#666'}}>Close</button>
                    </div>
                </div>
            )}

            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <button onClick={() => navigate(-1)} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '45px', height: '45px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Review Order</h1>
            </div>

            {/* CUSTOMER INFO */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>Delivery To</p>
                        <h3 style={{ margin: 0, color: '#f97316', fontWeight: '900' }}>{tableNum ? (tableNum === "Takeaway" ? "Takeaway Order" : `Table ${tableNum}`) : "Select Table"}</h3>
                    </div>
                    <span style={{ color: '#f97316', fontSize: '12px', fontWeight: 'bold' }}>Change</span>
                </div>
                <input type="text" placeholder="Enter Your Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #222', borderRadius: '14px', color: 'white', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {/* ORDER ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={{ background: '#111', padding: '12px', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>{item.name}</h4>
                            <p style={{ margin: 0, color: '#f97316', fontWeight: '900', fontSize: '13px' }}>₹{item.price * item.quantity}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#080808', padding: '5px 12px', borderRadius: '10px', border: '1px solid #1a1a1a' }}>
                            <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '18px' }}>-</button>
                            <span style={{ fontSize: '13px', fontWeight: '900' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '18px' }}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(item._id)} style={{background: '#1a1a1a', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '10px'}}><FaTrash size={12}/></button>
                    </div>
                ))}
            </div>

            {/* PAYMENT METHOD SECTION */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px' }}>PAYMENT METHOD</p>
                
                {/* Toggle Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                    <button onClick={() => setPaymentMethod("UPI")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'UPI' ? '#f97316' : '#1a1a1a', background: paymentMethod === 'UPI' ? 'rgba(249, 115, 22, 0.05)' : '#161616', color: paymentMethod === 'UPI' ? '#f97316' : '#555', transition: '0.3s' }}>
                        <FaQrcode size={18} style={{ marginBottom: '6px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>ONLINE PAY</span>
                    </button>
                    <button onClick={() => setPaymentMethod("CASH")} 
                        style={{ padding: '15px', borderRadius: '18px', border: '2px solid', borderColor: paymentMethod === 'CASH' ? '#22c55e' : '#1a1a1a', background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.05)' : '#161616', color: paymentMethod === 'CASH' ? '#22c55e' : '#555', transition: '0.3s' }}>
                        <FaMoneyBillWave size={18} style={{ marginBottom: '6px' }} /><br/>
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>PAY CASH</span>
                    </button>
                </div>

                {/* 🟢 UPI SPECIFIC: Show App Buttons + UTR Input */}
                {paymentMethod === "UPI" && (
                    <div style={{animation: 'fadeIn 0.5s'}}>
                        
                        {/* 1. Payment App Buttons */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                            <button onClick={handleAppPayment} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#1f1f1f', border: '1px solid #333', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FaGoogle /> GPay
                            </button>
                            <button onClick={handleAppPayment} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#5f259f', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FaMobileAlt /> PhonePe
                            </button>
                            <button onClick={handleAppPayment} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#f97316', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <FaWallet /> Any
                            </button>
                        </div>

                        {/* 2. UTR Input */}
                        <div style={{ background: '#161616', padding: '15px', borderRadius: '18px', border: '1px dashed #f97316' }}>
                            <p style={{ color: '#f97316', fontSize: '11px', marginBottom: '10px', fontWeight:'900' }}>AFTER PAYMENT, ENTER UTR 👇</p>
                            <input 
                                type="text" 
                                inputMode="numeric"
                                placeholder="Last 4 digits of UTR" 
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                                maxLength={4}
                                style={{ width: '100%', padding: '15px', background: '#080808', border: '1px solid #333', borderRadius: '12px', color: 'white', outline: 'none', fontWeight: '900', fontSize:'18px', textAlign: 'center', letterSpacing: '4px' }} 
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* FIXED FOOTER */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', padding: '20px', background: 'rgba(8, 8, 8, 0.95)', borderTop: '1px solid #222', zIndex: 100 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <div>
                        <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold' }}>Total Payable</span>
                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</div>
                    </div>
                    {paymentMethod === "UPI" && utrNumber.length === 4 && <FaCheckCircle color="#22c55e" size={24} />}
                </div>
                <button onClick={handlePlaceOrder} disabled={isSubmitting}
                    style={{ 
                        width: '100%', padding: '18px', borderRadius: '16px', border: 'none', 
                        background: isSubmitting ? '#222' : (paymentMethod === 'UPI' ? '#f97316' : '#22c55e'), 
                        color: isSubmitting ? '#555' : 'white', fontSize: '15px', fontWeight: '900'
                    }}
                >
                    {isSubmitting ? "PROCESSING..." : "CONFIRM ORDER"}
                </button>
            </div>
        </div>
    );
};

export default Cart;