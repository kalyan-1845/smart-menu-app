import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, FaUtensils, FaMapMarkerAlt, FaCommentDots } from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [chefNote, setChefNote] = useState(""); // New: Note for Chef
    const [restaurant, setRestaurant] = useState(null);
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Customizations (If your menu supports them later)
    const [selectedSpecs, setSelectedSpecs] = useState({});
    
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. FETCH RESTAURANT DETAILS (For UPI & Config) ---
    useEffect(() => {
        const fetchRestaurant = async () => {
            const activeId = restaurantId || localStorage.getItem("activeResId");
            if (activeId) {
                try {
                    const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${activeId}`);
                    setRestaurant(res.data);
                } catch (err) {
                    console.error("Error fetching restaurant details:", err);
                }
            }
        };
        fetchRestaurant();
    }, [restaurantId]);

    // --- 2. SUBMIT ORDER FUNCTION ---
    const processOrder = async (paymentMethod) => {
        // Validation
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!tableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Your cart is empty!"); return; }

        setIsSubmitting(true);

        const activeId = restaurantId || localStorage.getItem("activeResId");

        // Prepare Order Data - EXACTLY MATCHING CHEF DASHBOARD SCHEMA
        const orderData = {
            customerName: customerName,
            tableNumber: tableNum.toString(),
            items: cart.map(item => ({
                dishId: item._id, // ✅ Critical for Stock Control
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                customizations: selectedSpecs[item._id] || [],
            })),
            note: chefNote, // ✅ New: Passed to Chef
            totalAmount: totalPrice,
            paymentMethod: paymentMethod === "ONLINE" ? "Online" : "Cash", // 'CASH' triggers Waiter Cash collection
            paymentStatus: "Pending",
            owner: activeId,
            status: "PLACED" // Shows as 'NEW' in KDS
        };

        try {
            // 1. Send Order to Backend
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // 2. Save to Local History for Tracker
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));
            
            clearCart(); 

            // 3. Handle Redirections
            if (paymentMethod === "ONLINE" && restaurant?.upiId) {
                // Construct UPI Link (Mobile Deep Link)
                const cleanName = restaurant.username.replace(/\s/g, '');
                const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${cleanName}&am=${totalPrice}&cu=INR`;
                
                // Redirect to Payment App
                window.location.href = upiLink;

                // Move to Tracker after delay
                setTimeout(() => {
                    navigate(`/track/${response.data._id}`);
                }, 1000);
            } else {
                // Cash -> Go straight to tracker
                navigate(`/track/${response.data._id}`);
            }

        } catch (error) {
            console.error("Submission error:", error);
            alert(`Order Failed: ${error.response?.data?.message || "Server Error"}`);
            setIsSubmitting(false);
        }
    };

    // --- RENDER ---
    return (
        <div style={styles.container}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
                * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
                body { background: #050505; }
                .ripple { background-position: center; transition: background 0.8s; }
                .ripple:hover { background: #222 radial-gradient(circle, transparent 1%, #222 1%) center/15000%; }
                .ripple:active { background-color: #333; background-size: 100%; transition: background 0s; }
            `}</style>
            
            {/* 1. TABLE MODAL */}
            {showTableModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.iconCircle}><FaMapMarkerAlt /></div>
                        <h2 style={{ textAlign: 'center', marginBottom: '8px', color: 'white' }}>Select Table</h2>
                        <p style={{ textAlign: 'center', color: '#888', fontSize: '12px', marginBottom: '20px' }}>Where are you sitting?</p>
                        <div style={styles.tableGrid}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ 
                                        ...styles.tableBtn, 
                                        background: tableNum === opt ? '#f97316' : '#1a1a1a', 
                                        borderColor: tableNum === opt ? '#f97316' : '#333'
                                    }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 2. HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Review Order</h1>
            </div>

            {/* 3. INFO CARD */}
            <div style={styles.card}>
                {/* Table Selector */}
                <div onClick={() => setShowTableModal(true)} style={styles.tableSelector}>
                    <div>
                        <p style={styles.label}>DELIVERING TO</p>
                        <div style={{ margin: 0, color: '#f97316', fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaMapMarkerAlt size={14}/> {tableNum ? `Table ${tableNum}` : "Select Table"}
                        </div>
                    </div>
                    <span style={styles.changeBtn}>Change</span>
                </div>
                
                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <p style={styles.label}>YOUR NAME</p>
                    <input type="text" placeholder="e.g., Rahul" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                        style={styles.input} />
                </div>
            </div>

            {/* 4. CART LIST */}
            {cart.length === 0 ? (
                <div style={{textAlign: 'center', padding: '60px 20px', color: '#444'}}>
                    <FaUtensils size={40} style={{opacity: 0.2, marginBottom: '20px'}}/>
                    <p>Your cart is empty.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.map((item) => (
                        <div key={item._id} style={styles.itemCard}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                {/* Image Fallback */}
                                {item.image ? (
                                    <img src={item.image} alt="" style={styles.itemImage} />
                                ) : (
                                    <div style={{...styles.itemImage, background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <FaUtensils color="#444" size={12}/>
                                    </div>
                                )}
                                
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'white' }}>{item.name}</h4>
                                    <p style={{ margin: '4px 0 0 0', color: '#f97316', fontWeight: '800', fontSize: '13px' }}>₹{item.price * item.quantity}</p>
                                </div>

                                <div style={styles.qtyControl}>
                                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyBtn}>-</button>
                                    <span style={{ fontSize: '13px', fontWeight: '900', color: 'white', minWidth: '15px', textAlign: 'center' }}>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{...styles.qtyBtn, color: '#f97316'}}>+</button>
                                </div>

                                <button onClick={() => removeFromCart(item._id)} style={styles.deleteBtn}>
                                    <FaTrash size={12}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 5. CHEF NOTE (Optional) */}
            {cart.length > 0 && (
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <p style={styles.label}><FaCommentDots style={{verticalAlign: 'middle'}}/> NOTE FOR CHEF (OPTIONAL)</p>
                    <textarea 
                        placeholder="e.g. Less spicy, no onions..." 
                        value={chefNote}
                        onChange={(e) => setChefNote(e.target.value)}
                        style={styles.textArea}
                    />
                </div>
            )}

            {/* 6. FOOTER (Fixed) */}
            <div style={styles.footer}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={styles.totalLabel}>TOTAL TO PAY</span>
                    <span style={styles.totalValue}>₹{totalPrice}</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* CASH ON COUNTER (Triggers Waiter) */}
                    <button 
                        onClick={() => processOrder("CASH")} 
                        disabled={isSubmitting}
                        style={{ ...styles.payBtn, background: '#1a1a1a', border: '1px solid #333', color: '#f97316' }}
                    >
                        <FaMoneyBillWave size={16} /> Cash
                    </button>

                    {/* PAY ONLINE (UPI) */}
                    <button 
                        onClick={() => processOrder("ONLINE")} 
                        disabled={isSubmitting}
                        style={{ ...styles.payBtn, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: 'white', border: 'none' }}
                    >
                        <FaMobileAlt size={16} /> Pay UPI
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MOBILE-FIRST STYLES ---
const styles = {
    container: {
        minHeight: '100vh', background: '#050505', color: 'white',
        padding: '15px', paddingBottom: '160px', // Extra padding for footer
        width: '100%', maxWidth: '600px', margin: '0 auto',
        position: 'relative'
    },
    // Modal
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' },
    modalCard: { background: '#111', width: '100%', maxWidth: '360px', borderRadius: '24px', padding: '30px', border: '1px solid #222', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' },
    iconCircle: { width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: '#f97316', fontSize: '20px' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    tableBtn: { padding: '15px', borderRadius: '12px', border: '1px solid #333', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px', transition: '0.2s' },

    // Header
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingTop: '10px' },
    backBtn: { border: 'none', color: 'white', background: '#1a1a1a', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

    // Card
    card: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '15px', border: '1px solid #1a1a1a' },
    tableSelector: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', cursor: 'pointer', alignItems: 'center' },
    label: { color: '#666', fontSize: '10px', fontWeight: '900', letterSpacing: '1px', marginBottom: '8px', textTransform: 'uppercase' },
    changeBtn: { color: '#fff', fontSize: '11px', fontWeight: 'bold', background: '#222', padding: '6px 12px', borderRadius: '8px' },
    input: { width: '100%', padding: '14px', background: '#080808', border: '1px solid #222', borderRadius: '12px', color: 'white', outline: 'none', fontWeight: 'bold', fontSize: '16px' },
    textArea: { width: '100%', padding: '14px', background: '#111', border: '1px solid #222', borderRadius: '12px', color: 'white', outline: 'none', fontSize: '14px', minHeight: '80px', resize: 'none' },

    // Item List
    itemCard: { background: '#111', padding: '12px', borderRadius: '16px', border: '1px solid #1a1a1a' },
    itemImage: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' },
    qtyControl: { display: 'flex', alignItems: 'center', gap: '8px', background: '#080808', padding: '6px 10px', borderRadius: '8px', border: '1px solid #222' },
    qtyBtn: { background: 'none', border: 'none', color: '#555', fontSize: '16px', cursor: 'pointer', padding: '0 4px' },
    deleteBtn: { background: 'none', border: 'none', color: '#444', cursor: 'pointer', padding: '8px' },

    // Footer
    footer: { 
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
        width: '100%', maxWidth: '600px', 
        padding: '20px', paddingBottom: '30px', // Extra for safe area
        background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(12px)', 
        borderTop: '1px solid #222', 
        display: 'flex', flexDirection: 'column', gap: '15px',
        zIndex: 100
    },
    totalLabel: { color: '#888', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' },
    totalValue: { fontSize: '22px', fontWeight: '900', color: 'white' },
    payBtn: { 
        flex: 1, height: '52px', borderRadius: '14px', 
        fontSize: '14px', fontWeight: '900', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        cursor: 'pointer', transition: '0.2s'
    }
};

export default Cart;