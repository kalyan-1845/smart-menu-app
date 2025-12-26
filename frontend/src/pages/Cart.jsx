import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, 
    FaUtensils, FaMapMarkerAlt, FaCommentDots, FaLock 
} from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [chefNote, setChefNote] = useState(""); 
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Valid table options
    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. HANDLE ORDER SUBMISSION ---
    // This function sends the details to the Waiter/Chef/Admin
    const sendOrderToStaff = async (paymentType) => {
        // 1. Basic Validation
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!tableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Your cart is empty!"); return; }

        setIsSubmitting(true);
        
        // 2. Get the correct Restaurant ID
        // (This ensures the order goes to the RIGHT admin, not a different restaurant)
        const activeId = restaurantId || localStorage.getItem("activeResId");
        
        if (!activeId) {
            alert("❌ System Error: Restaurant ID missing. Please scan QR again.");
            setIsSubmitting(false);
            return;
        }

        // 3. PREPARE DATA (Exactly how your database wants it)
        const orderData = {
            customerName: customerName,
            tableNum: tableNum.toString(), // ✅ Fixed Name
            items: cart.map(item => ({
                dishId: item._id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            note: chefNote, 
            totalAmount: totalPrice,
            // Just tells the waiter how to collect money
            paymentMethod: paymentType === "ONLINE" ? "Online" : "Cash", 
            paymentStatus: "Pending",
            restaurantId: activeId, // ✅ Fixed Name
            status: "Pending"       // ✅ Fixed Status
        };

        console.log("🚀 Sending Order to Staff:", orderData);

        try {
            // 4. SEND TO SERVER
            const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);
            
            // 5. SUCCESS! 
            // Save Order ID so user can track it
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([response.data._id, ...history]));
            
            clearCart(); 

            // 6. IF UPI SELECTED (Optional Helper)
            // This just opens the UPI app on their phone to make it easier. 
            // The waiter still checks the payment manually.
            if (paymentType === "ONLINE") {
                // Try to find restaurant details for UPI link (optional)
                try {
                    const resDetails = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${activeId}`);
                    const upiId = resDetails.data.upiId;
                    if (upiId) {
                        const cleanName = resDetails.data.username.replace(/\s/g, '');
                        const upiLink = `upi://pay?pa=${upiId}&pn=${cleanName}&am=${totalPrice}&cu=INR`;
                        window.location.href = upiLink; // Opens GPay/PhonePe
                    }
                } catch (e) {
                    console.log("No UPI ID found, manual payment only.");
                }
            }

            // 7. GO TO TRACKER
            // Wait 1 second then show the tracking screen
            setTimeout(() => {
                navigate(`/track/${response.data._id}`);
            }, 1000);

        } catch (error) {
            console.error("Order Failed:", error);
            const msg = error.response?.data?.message || error.message;
            alert(`❌ Order Failed: ${msg}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* TABLE SELECTOR MODAL */}
            {showTableModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.iconCircle}><FaMapMarkerAlt /></div>
                        <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>Select Table</h2>
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

            {/* HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={{ fontSize: '18px', fontWeight: '900' }}>Review Order</h1>
            </div>

            {/* CUSTOMER INFO CARD */}
            <div style={styles.card}>
                <div onClick={() => setShowTableModal(true)} style={styles.tableSelector}>
                    <div>
                        <p style={styles.label}>LOCATION</p>
                        <div style={{ color: '#f97316', fontSize: '16px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaMapMarkerAlt size={14}/> {tableNum ? `Table ${tableNum}` : "Select Table"}
                        </div>
                    </div>
                    <span style={styles.changeBtn}>Change</span>
                </div>
                <div style={{ borderTop: '1px solid #222', paddingTop: '15px' }}>
                    <p style={styles.label}>YOUR NAME</p>
                    <input type="text" placeholder="Enter your name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={styles.input} />
                </div>
            </div>

            {/* CART ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cart.map((item) => (
                    <div key={item._id} style={styles.itemCard}>
                        <div style={styles.displayFlex}>
                            <img src={item.image || "https://via.placeholder.com/50"} alt="" style={styles.itemImage} />
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '14px', color: 'white' }}>{item.name}</h4>
                                <p style={{ margin: '2px 0 0 0', color: '#f97316', fontWeight: 'bold', fontSize: '12px' }}>₹{item.price * item.quantity}</p>
                            </div>
                            <div style={styles.qtyControl}>
                                <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={styles.qtyBtn}>-</button>
                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{...styles.qtyBtn, color: '#f97316'}}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={styles.deleteBtn}><FaTrash size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* INSTRUCTIONS */}
            <div style={{ marginTop: '20px' }}>
                <p style={styles.label}><FaCommentDots /> NOTE TO CHEF</p>
                <textarea placeholder="Ex: Less spicy, No onions..." value={chefNote} onChange={(e) => setChefNote(e.target.value)} style={styles.textArea} />
            </div>

            {/* ACTION BAR */}
            <div style={styles.footer}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <span style={styles.totalLabel}>Grand Total</span>
                    <span style={styles.totalValue}>₹{totalPrice}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {/* BUTTON 1: CASH */}
                    <button onClick={() => sendOrderToStaff("CASH")} disabled={isSubmitting} style={{ ...styles.payBtn, background: '#111', border: '1px solid #333', color: '#f97316' }}>
                        <FaMoneyBillWave /> Pay Cash
                    </button>
                    {/* BUTTON 2: ONLINE (Manual Check) */}
                    <button onClick={() => sendOrderToStaff("ONLINE")} disabled={isSubmitting} style={{ ...styles.payBtn, background: '#f97316', color: '#000' }}>
                        <FaMobileAlt /> Pay Online
                    </button>
                </div>
                <p style={styles.secureText}><FaLock size={8}/> Order sent directly to kitchen</p>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', paddingBottom: '180px' },
    modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    modalCard: { background: '#111', width: '100%', maxWidth: '340px', borderRadius: '20px', padding: '25px', border: '1px solid #222' },
    iconCircle: { width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#f97316' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    tableBtn: { padding: '12px', borderRadius: '10px', border: '1px solid #333', color: 'white', fontWeight: 'bold' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { background: '#111', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '10px' },
    card: { background: '#111', padding: '15px', borderRadius: '16px', marginBottom: '15px' },
    tableSelector: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    label: { color: '#555', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px', marginBottom: '5px' },
    changeBtn: { color: '#f97316', fontSize: '10px', fontWeight: 'bold' },
    input: { width: '100%', padding: '12px', background: '#000', border: '1px solid #222', borderRadius: '10px', color: 'white', fontWeight: 'bold' },
    textArea: { width: '100%', padding: '12px', background: '#111', border: '1px solid #222', borderRadius: '10px', color: 'white', minHeight: '60px' },
    itemCard: { background: '#111', padding: '10px', borderRadius: '12px' },
    displayFlex: { display: 'flex', gap: '12px', alignItems: 'center' },
    itemImage: { width: '45px', height: '45px', borderRadius: '8px', objectFit: 'cover' },
    qtyControl: { display: 'flex', alignItems: 'center', gap: '10px', background: '#000', padding: '5px 10px', borderRadius: '8px' },
    qtyBtn: { background: 'none', border: 'none', color: '#fff', fontWeight: 'bold' },
    deleteBtn: { background: 'none', border: 'none', color: '#333' },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(5, 5, 5, 0.98)', borderTop: '1px solid #222', zIndex: 100 },
    totalLabel: { color: '#888', fontWeight: 'bold', fontSize: '12px' },
    totalValue: { fontSize: '20px', fontWeight: '900' },
    payBtn: { flex: 1, padding: '15px', borderRadius: '12px', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' },
    secureText: { textAlign: 'center', fontSize: '8px', color: '#444', marginTop: '10px', textTransform: 'uppercase' }
};

export default Cart;