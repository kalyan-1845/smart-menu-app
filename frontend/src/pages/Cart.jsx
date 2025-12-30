import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    FaArrowLeft, FaTrash, FaMobileAlt, FaMoneyBillWave, 
    FaMapMarkerAlt, FaCommentDots, FaLock, FaSpinner, FaExclamationTriangle 
} from "react-icons/fa";

const Cart = ({ cart, clearCart, updateQuantity, removeFromCart, restaurantId, tableNum, setTableNum }) => {
    const navigate = useNavigate();

    // --- STATE ---
    const [customerName, setCustomerName] = useState("");
    const [chefNote, setChefNote] = useState(""); 
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [realRestaurantId, setRealRestaurantId] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const tableOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, "Takeaway"];
    const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

    // --- 1. AUTO-FIX RESTAURANT ID ---
    useEffect(() => {
        const resolveId = async () => {
            const storedId = restaurantId || localStorage.getItem("activeResId");
            if (!storedId) return;

            // Check if it looks like a valid ID (24 chars, no spaces)
            if (storedId.length === 24 && !storedId.includes(" ")) {
                setRealRestaurantId(storedId);
                return;
            }

            // If it's a username (e.g. "deccanfresh"), convert it to ID
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${storedId}`);
                if (res.data?._id) {
                    setRealRestaurantId(res.data._id);
                    // Update local storage so we don't ask again
                    localStorage.setItem("activeResId", res.data._id);
                }
            } catch (err) {
                console.error("ID Fix Failed:", err);
                setErrorMsg("Restaurant System Offline. Please Scan QR Again.");
            }
        };
        resolveId();
    }, [restaurantId]);

    // --- 2. SUBMIT ORDER (Safe Mode) ---
    const submitOrder = async (paymentType) => {
        // Validation
        if (!customerName.trim()) { alert("Please enter your name!"); return; }
        if (!tableNum) { setShowTableModal(true); return; }
        if (cart.length === 0) { alert("Cart is empty!"); return; }
        if (!realRestaurantId) { alert("❌ System Error: Please re-scan the QR code."); return; }

        setIsSubmitting(true);
        setErrorMsg("");

        // 🛡️ DATA SANITIZATION (The Fix for 400 Errors)
        const cleanItems = cart.map(item => ({
            dishId: item._id || item.id, // Handle both ID formats
            name: item.name,
            quantity: Number(item.quantity),
            price: Number(item.price)
        })).filter(item => item.dishId); // Remove items with no ID

        if (cleanItems.length === 0) {
            alert("❌ Error: Your cart contains invalid items. Please clear cart and add again.");
            setIsSubmitting(false);
            return;
        }

        const orderPayload = {
            customerName: customerName,
            tableNum: tableNum.toString(),
            items: cleanItems,
            note: chefNote, 
            totalAmount: totalPrice,
            paymentMethod: paymentType === "ONLINE" ? "Online" : "Cash", 
            paymentStatus: "Pending",
            restaurantId: realRestaurantId, 
            status: "Pending"
        };

        try {
            const res = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderPayload);
            
            // Success!
            const history = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
            localStorage.setItem("smartMenu_History", JSON.stringify([res.data._id, ...history]));
            
            clearCart(); 
            navigate(`/track/${res.data._id}`);

        } catch (error) {
            console.error("Submission Error:", error);
            // Show the EXACT error from the server so we know what's wrong
            const serverMessage = error.response?.data?.message || error.message;
            setErrorMsg(`Order Failed: ${serverMessage}`);
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* ERROR BANNER */}
            {errorMsg && (
                <div style={styles.errorBanner}>
                    <FaExclamationTriangle /> {errorMsg}
                </div>
            )}

            {/* LOADING OVERLAY */}
            {isSubmitting && (
                <div style={styles.loadingOverlay}>
                    <FaSpinner className="spin" size={40} color="#f97316" />
                    <p style={{ marginTop: '15px', fontWeight: 'bold' }}>Sending Order...</p>
                </div>
            )}

            {/* TABLE MODAL */}
            {showTableModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        <div style={styles.iconCircle}><FaMapMarkerAlt /></div>
                        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>Select Table</h2>
                        <div style={styles.tableGrid}>
                            {tableOptions.map((opt) => (
                                <button key={opt} onClick={() => { setTableNum(opt); setShowTableModal(false); }} 
                                    style={{ ...styles.tableBtn, background: tableNum === opt ? '#f97316' : '#1a1a1a', borderColor: tableNum === opt ? '#f97316' : '#333' }}>
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
                <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Your Bag</h1>
            </div>

            {/* INFO CARD */}
            <div style={styles.card}>
                <div onClick={() => setShowTableModal(true)} style={styles.rowBetween}>
                    <div>
                        <p style={styles.label}>DELIVER TO</p>
                        <div style={{ color: '#f97316', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaMapMarkerAlt size={14}/> {tableNum ? `Table ${tableNum}` : "Choose Table"}
                        </div>
                    </div>
                    <span style={styles.editBtn}>CHANGE</span>
                </div>
                <div style={{ width: '100%', height: '1px', background: '#222', margin: '15px 0' }}></div>
                <div>
                    <p style={styles.label}>GUEST NAME</p>
                    <input type="text" placeholder="Enter your name..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={styles.input} />
                </div>
            </div>

            {/* CART ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }}>
                {cart.map((item) => (
                    <div key={item._id || item.id} style={styles.itemCard}>
                        <img src={item.image || "https://via.placeholder.com/60"} alt="" style={styles.itemImage} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600' }}>{item.name}</h4>
                            <p style={{ margin: 0, color: '#888', fontSize: '12px' }}>₹{item.price} x {item.quantity}</p>
                        </div>
                        <div style={styles.qtyWrapper}>
                            <button onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)} style={styles.qtyBtn}>-</button>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)} style={{...styles.qtyBtn, color: '#f97316'}}>+</button>
                        </div>
                        <button onClick={() => removeFromCart(item._id || item.id)} style={styles.deleteBtn}><FaTrash size={14}/></button>
                    </div>
                ))}
            </div>

            {/* CHEF NOTE */}
            <p style={styles.label}><FaCommentDots /> KITCHEN NOTE</p>
            <textarea placeholder="Allergies? Spice level?" value={chefNote} onChange={(e) => setChefNote(e.target.value)} style={styles.textArea} />

            {/* FOOTER */}
            <div style={styles.footer}>
                <div style={styles.rowBetween}>
                    <span style={{ color: '#888', fontWeight: '600' }}>Total to Pay</span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: 'white' }}>₹{totalPrice}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button onClick={() => submitOrder("CASH")} style={{ ...styles.payBtn, background: '#1a1a1a', border: '1px solid #333', color: '#f97316' }}>
                        <FaMoneyBillWave size={18} /> Pay Cash
                    </button>
                    <button onClick={() => submitOrder("ONLINE")} style={{ ...styles.payBtn, background: '#f97316', color: '#000' }}>
                        <FaMobileAlt size={18} /> Pay Online
                    </button>
                </div>
                <p style={styles.secureMsg}><FaLock size={10}/> Order sent directly to Waiter</p>
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '20px', paddingBottom: '200px', fontFamily: 'Inter, sans-serif' },
    errorBanner: { background: '#dc2626', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 'bold' },
    loadingOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    modalCard: { background: '#111', width: '100%', maxWidth: '350px', borderRadius: '24px', padding: '30px', border: '1px solid #222' },
    iconCircle: { width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(249, 115, 22, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', color: '#f97316' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
    tableBtn: { padding: '12px', borderRadius: '12px', border: '1px solid #333', color: 'white', fontWeight: 'bold', fontSize: '14px' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
    backBtn: { background: '#111', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer' },
    card: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #1a1a1a' },
    rowBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    label: { color: '#666', fontSize: '10px', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px' },
    editBtn: { color: '#f97316', fontSize: '11px', fontWeight: '800', cursor: 'pointer' },
    input: { width: '100%', padding: '12px 0', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: 'white', fontWeight: '600', fontSize: '16px', outline: 'none' },
    itemCard: { background: '#111', padding: '12px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #1a1a1a' },
    itemImage: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' },
    qtyWrapper: { display: 'flex', alignItems: 'center', gap: '12px', background: '#000', padding: '6px 12px', borderRadius: '10px' },
    qtyBtn: { background: 'none', border: 'none', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
    deleteBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#666', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    textArea: { width: '100%', padding: '15px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: 'white', minHeight: '80px', marginTop: '5px', fontSize: '14px' },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '25px', background: 'rgba(0,0,0,0.95)', borderTop: '1px solid #222', zIndex: 100, backdropFilter: 'blur(10px)' },
    payBtn: { flex: 1, padding: '16px', borderRadius: '14px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer', transition: 'transform 0.1s' },
    secureMsg: { textAlign: 'center', fontSize: '10px', color: '#444', marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }
};

export default Cart;