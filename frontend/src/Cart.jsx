import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTrash, FaGoogle, FaMobileAlt, FaWallet, FaMoneyBillWave, FaCheckCircle, FaTimes } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [restaurant, setRestaurant] = useState(null);
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Payment Logic State
    // 'selection' = Showing icons
    // 'verifying' = User came back, needs to enter UTR
    const [paymentStage, setPaymentStage] = useState("selection"); 
    const [selectedApp, setSelectedApp] = useState(null);
    const [transactionId, setTransactionId] = useState(""); 

    const [selectedSpecs, setSelectedSpecs] = useState({});
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];

    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. FETCH RESTAURANT DETAILS ---
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

    // --- 2. TRIGGER PAYMENT APP ---
    const handlePaymentClick = (appName) => {
        // Validation
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!tableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Your cart is empty!"); return; }
        
        // Cash Logic
        if (appName === "Cash") {
            submitOrder("Cash", "PAY_AT_TABLE");
            return;
        }

        // UPI Logic
        if (!restaurant?.upiId) { alert("Restaurant UPI not set up."); return; }

        // 1. Construct Deep Link
        const cleanName = restaurant.username.replace(/\s/g, '');
        // Generates: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
        const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${cleanName}&am=${totalPrice}&cu=INR`;

        // 2. Open App (GPay/PhonePe etc)
        window.location.href = upiLink;

        // 3. Change UI to "Verify" mode
        setSelectedApp(appName);
        setPaymentStage("verifying");
    };

    // --- 3. SUBMIT ORDER TO BACKEND ---
    const submitOrder = async (paymentMethod, txnId) => {
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
            transactionId: txnId, // Sends UTR or 'PAY_AT_TABLE' to Admin
            owner: restaurantId,
            status: "PLACED"
        };

        try {
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // Save to History
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));
            
            clearCart(); 
            
            // DIRECT REDIRECT TO TRACKER
            navigate(`/track/${response.data._id}`);

        } catch (error) {
            console.error("Submission error:", error);
            // If CORS error persists, it will show here
            alert("Order Failed: " + (error.response?.data?.message || "Check Network/Server"));
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

            {/* 5. PAYMENT SECTION (ICONS) */}
            <div style={{ marginBottom: '100px' }}>
                <p style={{ color: '#555', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '15px', textTransform: 'uppercase' }}>Select Payment</p>
                
                {paymentStage === 'selection' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                        
                        {/* GPay */}
                        <button onClick={() => handlePaymentClick("Google Pay")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 5px', borderRadius: '18px', background: '#1a1a1a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#1f1f1f', border: '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                <FaGoogle size={20} color="#fff"/>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>GPay</span>
                        </button>

                        {/* PhonePe */}
                        <button onClick={() => handlePaymentClick("PhonePe")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 5px', borderRadius: '18px', background: '#1a1a1a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#5f259f', border: '1px solid #7848b0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                <FaMobileAlt size={20} color="#fff"/>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>PhonePe</span>
                        </button>

                        {/* FamPay */}
                        <button onClick={() => handlePaymentClick("FamPay")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 5px', borderRadius: '18px', background: '#1a1a1a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#FFAD00', border: '1px solid #ffbf40', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                <FaWallet size={20} color="#000"/>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>FamPay</span>
                        </button>

                        {/* Cash */}
                        <button onClick={() => handlePaymentClick("Cash")}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 5px', borderRadius: '18px', background: '#1a1a1a', border: '1px solid #333', color: 'white', cursor: 'pointer' }}>
                            <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#22c55e', border: '1px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                <FaMoneyBillWave size={20} color="#fff"/>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Cash</span>
                        </button>

                    </div>
                ) : (
                    // --- UTR ENTRY SCREEN (Shows after clicking app) ---
                    <div style={{ background: '#111', padding: '25px', borderRadius: '24px', border: '1px solid #333', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>Verify {selectedApp}</h3>
                            <button onClick={() => setPaymentStage("selection")} style={{background:'none', border:'none', color:'#666'}}><FaTimes/></button>
                        </div>
                        
                        <p style={{ color: '#888', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
                            You should have just paid <b>₹{totalPrice}</b> on {selectedApp}.<br/>
                            Enter the <b>last 4 digits</b> of the UTR/Transaction ID below to confirm.
                        </p>
                        
                        <input 
                            type="tel" 
                            maxLength={4}
                            placeholder="Last 4 Digits (e.g. 8832)"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value.replace(/\D/g,''))}
                            style={{ 
                                width: '100%', padding: '18px', borderRadius: '16px', background: '#080808', 
                                border: '1px solid #333', color: 'white', fontSize: '22px', textAlign: 'center', 
                                letterSpacing: '6px', fontWeight: '900', marginBottom: '20px', outline: 'none'
                            }}
                        />

                        <button 
                            onClick={() => submitOrder(selectedApp, transactionId)}
                            disabled={transactionId.length < 4 || isSubmitting}
                            style={{ 
                                width: '100%', padding: '18px', borderRadius: '16px', border: 'none', 
                                background: transactionId.length < 4 ? '#333' : '#f97316', 
                                color: transactionId.length < 4 ? '#666' : 'white', 
                                fontWeight: '900', fontSize: '16px',
                                cursor: transactionId.length < 4 ? 'not-allowed' : 'pointer',
                                transition: '0.3s'
                            }}>
                            {isSubmitting ? "VERIFYING..." : "CONFIRM PAYMENT"}
                        </button>
                    </div>
                )}
            </div>

            {/* 6. FIXED BOTTOM TOTAL - NEW LAYOUT (Grid) */}
            {paymentStage === 'selection' && (
                <div style={{ 
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
                    width: '100%', maxWidth: '600px', padding: '20px 25px', 
                    background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(15px)', borderTop: '1px solid #222', 
                    display: 'grid', gridTemplateColumns: '1fr 1.5fr', alignItems: 'center', gap: '20px' 
                }}>
                    <div style={{display:'flex', flexDirection:'column'}}>
                        <span style={{ color: '#888', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total to Pay</span>
                        <span style={{ fontSize: '28px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</span>
                    </div>
                    
                    {/* The "Place Order" button now defaults to Cash if they didn't click an icon above, 
                        OR acts as a "Cash" trigger. This matches the user's visual request for a big button. */}
                    <button onClick={() => handlePaymentClick("Cash")} disabled={isSubmitting}
                        style={{ 
                            width: '100%', height: '55px', borderRadius: '16px', border: 'none', 
                            background: '#f97316', color: 'white', fontSize: '14px', fontWeight: '900', 
                            textTransform: 'uppercase', letterSpacing: '1px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                            boxShadow: '0 4px 20px rgba(249, 115, 22, 0.4)'
                        }}>
                        {isSubmitting ? "PROCESSING..." : "PLACE ORDER"}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Cart;