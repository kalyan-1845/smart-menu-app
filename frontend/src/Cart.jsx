import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTrash, FaGoogle, FaMobileAlt, FaWallet, FaMoneyBillWave } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [restaurant, setRestaurant] = useState(null); // To store UPI ID
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Track selected specifications
    const [selectedSpecs, setSelectedSpecs] = useState({});
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. FETCH RESTAURANT DETAILS (For UPI ID) ---
    useEffect(() => {
        const fetchRestaurant = async () => {
            if (restaurantId) {
                try {
                    const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${restaurantId}`);
                    setRestaurant(res.data);
                } catch (err) {
                    console.error("Error fetching restaurant details:", err);
                }
            }
        };
        fetchRestaurant();
    }, [restaurantId]);

    // --- 2. ORDER SUBMISSION & REDIRECT ---
    const submitOrder = async (paymentMethod, shouldRedirect = false) => {
        // Validation
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!tableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Your cart is empty!"); return; }

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
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Success! Save to history
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));
            
            clearCart(); 

            // --- REDIRECT LOGIC ---
            if (shouldRedirect && restaurant?.upiId) {
                // Remove spaces from name to avoid bad UPI links
                const cleanName = restaurant.username.replace(/\s/g, '');
                const orderRef = response.data._id.slice(-4);
                
                // Construct UPI Deep Link
                const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${cleanName}&am=${totalPrice}&cu=INR&tn=Order-${orderRef}`;
                
                // Redirect user to their UPI app
                window.location.href = upiLink;

                // Move app to tracker (will show when they switch back)
                setTimeout(() => {
                    navigate(`/track/${response.data._id}`);
                }, 1000);
            } else {
                // Cash or Manual -> Go straight to tracker
                navigate(`/track/${response.data._id}`);
            }

        } catch (error) {
            console.error("Submission error:", error);
            alert("Network Error: Please check your internet connection.");
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---
    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', paddingBottom: '160px', maxWidth: '600px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            
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

            {/* 3. INFO CARD */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', marginBottom: '15px', border: '1px solid #1a1a1a' }}>
                <div onClick={() => setShowTableModal(true)} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', cursor: 'pointer', alignItems: 'center' }}>
                    <div>
                        <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '4px' }}>DELIVERING TO</p>
                        <div style={{ margin: 0, color: '#f97316', fontSize: '18px', fontWeight: 'bold' }}>
                            {tableNum ? `Table ${tableNum}` : "Select Table"}
                        </div>
                    </div>
                    <span style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', background: '#222', padding: '6px 12px', borderRadius: '8px' }}>Change</span>
                </div>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px' }}>YOUR NAME</p>
                    <input type="text" placeholder="e.g., John Doe" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={{ width: '100%', padding: '12px', background: '#080808', border: '1px solid #222', borderRadius: '12px', color: 'white', outline: 'none', fontWeight: 'bold', fontSize: '16px' }} />
                </div>
            </div>

            {/* 4. CART LIST */}
            {cart.length === 0 ? (
                <div style={{textAlign: 'center', padding: '40px', color: '#444'}}>
                    <p>Your cart is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                    {cart.map((item) => (
                        <div key={item._id} style={{ background: '#111', padding: '12px', borderRadius: '20px', border: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                {item.image ? (
                                    <img src={item.image} alt="" style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{width: '50px', height: '50px', borderRadius: '12px', background: '#222'}}></div>
                                )}
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{item.name}</h4>
                                    <p style={{ margin: '2px 0 0 0', color: '#f97316', fontWeight: '800', fontSize: '13px' }}>₹{item.price * item.quantity}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#080808', padding: '5px 10px', borderRadius: '10px' }}>
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer' }}>-</button>
                                    <span style={{ fontSize: '12px', fontWeight: '900' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ background: 'none', border: 'none', color: '#f97316', fontSize: '16px', cursor: 'pointer' }}>+</button>
                                </div>
                                <button onClick={() => removeFromCart(item._id)} style={{background: 'none', border: 'none', color: '#333', cursor: 'pointer', padding: '5px'}}>
                                    <FaTrash size={12}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. INSTANT PAY GRID (The Requested Feature) */}
            <div style={{ marginBottom: '100px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', textTransform: 'uppercase' }}>Instant Pay & Order</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {/* GPay - Dark Grey */}
                    <button 
                        onClick={() => submitOrder("Google Pay", true)}
                        disabled={isSubmitting}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #333',
                            background: '#1f1f1f', color: 'white', height: '110px', transition: 'transform 0.1s'
                        }}
                    >
                        <FaGoogle size={28} color="#fff"/>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>GPay</span>
                    </button>

                    {/* PhonePe - Purple */}
                    <button 
                        onClick={() => submitOrder("PhonePe", true)}
                        disabled={isSubmitting}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '20px', cursor: 'pointer', border: 'none',
                            background: '#5f259f', color: 'white', height: '110px'
                        }}
                    >
                        <FaMobileAlt size={28} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>PhonePe</span>
                    </button>

                    {/* FamPay / Generic UPI - Orange/Yellow */}
                    <button 
                        onClick={() => submitOrder("FamPay", true)}
                        disabled={isSubmitting}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '20px', cursor: 'pointer', border: 'none',
                            background: '#FFAD00', color: 'black', height: '110px'
                        }}
                    >
                        <FaWallet size={28} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>FamPay</span>
                    </button>

                    {/* Cash - Dark Grey (Matches your image) */}
                    <button 
                        onClick={() => submitOrder("Cash", false)}
                        disabled={isSubmitting}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '20px', borderRadius: '20px', cursor: 'pointer', border: '1px solid #333',
                            background: '#333', color: 'white', height: '110px'
                        }}
                    >
                        <FaMoneyBillWave size={28} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Cash</span>
                    </button>
                </div>
            </div>

            {/* 6. BOTTOM TOTAL BAR */}
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '600px', padding: '20px', background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(10px)', borderTop: '1px solid #222', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <span style={{ color: '#888', fontWeight: 'bold', fontSize: '12px', display: 'block' }}>Total to Pay</span>
                    <span style={{ fontSize: '26px', fontWeight: '900', color: '#f97316' }}>₹{totalPrice}</span>
                </div>
                
                {/* Fallback Button */}
                <button onClick={() => submitOrder("Cash", false)} disabled={isSubmitting}
                    style={{ padding: '16px 32px', borderRadius: '16px', border: 'none', background: '#f97316', color: 'white', fontSize: '14px', fontWeight: '900', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 8px 20px rgba(249,115,22,0.3)' }}>
                    {isSubmitting ? "SYNCING..." : "PLACE ORDER"}
                </button>
            </div>
        </div>
    );
};

export default Cart;