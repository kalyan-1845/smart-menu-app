import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { FaArrowLeft, FaTrash, FaCheckCircle, FaBell, FaChair, FaUtensils, FaBoxOpen } from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

const Cart = ({ cart, customerId, clearCart, removeFromCart, tableNum, setTableNum }) => {
    
    const { restaurantId } = useParams(); 
    const navigate = useNavigate();
    
    // Auto-open modal if no table is selected
    const [showTableModal, setShowTableModal] = useState(!tableNum);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 
    const [paymentChosen, setPaymentChosen] = useState(""); 
    const [callLoading, setCallLoading] = useState(false);
    const socketRef = useRef(null); 

    const finalTableNum = tableNum || localStorage.getItem("last_table_scanned");
    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    // ✅ 1. SOCKET CONNECTION (Polling for stability)
    useEffect(() => {
        if (restaurantId) {
            socketRef.current = io(SERVER_URL, { 
                transports: ['polling'], 
                withCredentials: true,
                query: { restaurantId: restaurantId } 
            });

            socketRef.current.on('connect', () => {
                console.log("✅ Cart Socket Connected");
            });

            socketRef.current.emit("join-restaurant", restaurantId);
        }
        
        return () => { 
            if (socketRef.current) socketRef.current.disconnect(); 
        };
    }, [restaurantId]);

    // ✅ 2. NEW: Handle Instant Table/Parcel Selection
    const handleSelection = (value) => {
        setTableNum(value);
        localStorage.setItem("last_table_scanned", value);
        setShowTableModal(false);
        toast.success(value === "Parcel" ? "Selected: Parcel Mode" : `Selected: Table ${value}`);
    };

    // ✅ 3. CALL WAITER (Works perfectly with Parcel too)
    const handleCallWaiter = async () => {
        if (!finalTableNum) return setShowTableModal(true);
        setCallLoading(true);
        if ("vibrate" in navigator) navigator.vibrate(100);
        try {
            socketRef.current.emit("call-waiter", {
                restaurantId: restaurantId,
                tableNumber: finalTableNum, // Sends "Parcel" or "1", "2" etc.
                customerId: customerId,
                _id: Date.now().toString()
            });
            toast.success("Staff notified!");
        } catch (err) { toast.error("Call failed"); }
        finally { setCallLoading(false); }
    };

    // ✅ 4. ORDER PROCESS (Auto-Names the customer)
    const processOrder = async (paymentType) => { 
        if (isSubmitting) return;
        
        // Force selection if not done
        if (!finalTableNum) return setShowTableModal(true);
        if (cart.length === 0) return toast.error("Cart is empty");

        setIsSubmitting(true);
        setPaymentChosen(paymentType);

        try {
            // Get Restaurant ID
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            const realMongoId = idRes.data.id;

            const formattedPayment = paymentType === "CASH" ? "Cash" : "Online";
            
            // Auto-Generate Name based on selection
            const autoName = finalTableNum === "Parcel" ? "Takeaway Order" : `Guest (Table ${finalTableNum})`;

            const payload = {
                customerName: autoName, // 🟢 No input needed
                customerId: customerId,
                tableNum: finalTableNum.toString(),
                items: cart.map(i => ({ 
                    dishId: i._id, 
                    name: i.name, 
                    quantity: i.quantity, 
                    price: i.price,
                    image: i.image 
                })),
                totalAmount: totalPrice,
                paymentMethod: formattedPayment, 
                status: "Pending", 
                restaurantId: realMongoId
            };

            // Send to Backend
            const res = await axios.post(`${API_BASE}/orders?t=${Date.now()}`, payload);
            
            // Notify Kitchen
            if (socketRef.current) socketRef.current.emit("new-order", res.data);

            setOrderSuccess(true);
            
            // Redirect
            setTimeout(() => {
                clearCart(); 
                navigate(`/track/${res.data._id}`); 
            }, 2000); 

        } catch (err) {
            console.error("ORDER ERROR:", err);
            toast.error("Order Failed. Try again.");
            setIsSubmitting(false);
        }
    };

    return (
        <div style={styles.container}>
            {orderSuccess && (
                <div style={styles.overlay}>
                    <div style={styles.successCard} className="pop-in">
                        <FaCheckCircle size={80} color="#22c55e" className="checkmark-anim" />
                        <h2 style={styles.successTitle}>Order Sent!</h2>
                        <p style={styles.counterNote}>
                            Pay: <strong>{paymentChosen}</strong><br/>
                            {finalTableNum === "Parcel" ? "Collect at Counter" : "Wait at Table"}
                        </p>
                        <p style={styles.successSub}>Opening tracker...</p>
                        <div style={styles.loaderLine}></div>
                    </div>
                </div>
            )}
            
            {/* ✅ NEW SELECTION MODAL (PARCEL + 10 TABLES) */}
            {showTableModal && (
                <div style={styles.overlay}>
                    <div style={styles.tableCard}>
                        <h2 style={{marginTop:0, marginBottom:15, fontSize:18, fontWeight: 900}}>Dining Option</h2>
                        
                        {/* 🟥 PARCEL BUTTON */}
                        <button onClick={() => handleSelection("Parcel")} style={styles.parcelBtn}>
                            <FaBoxOpen size={20} /> PARCEL / TAKEAWAY
                        </button>

                        <div style={styles.divider}><span>OR SELECT TABLE</span></div>

                        {/* 🔢 TABLE NUMBERS 1-10 */}
                        <div style={styles.tableGrid}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                <button key={num} onClick={() => handleSelection(num)} style={styles.numBtn}>
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                    <h1 style={styles.title}>Cart</h1>
                </div>
                <button onClick={handleCallWaiter} disabled={callLoading} style={styles.callBtn}>
                    <FaBell style={{marginRight:'6px'}}/> Call Staff
                </button>
            </div>

            <div style={styles.infoCard}>
                <div onClick={() => setShowTableModal(true)} style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        {finalTableNum === "Parcel" ? <FaBoxOpen color="#ef4444" size={20}/> : <FaChair color="#f97316" size={20}/>}
                        <div style={{display:'flex', flexDirection:'column'}}>
                            <span style={{fontSize:14, fontWeight:'bold', color:'white'}}>
                                {finalTableNum === "Parcel" ? "Parcel Order" : `Dining at Table ${finalTableNum || "?"}`}
                            </span>
                            <span style={{fontSize:10, color:'#666'}}>Tap to change</span>
                        </div>
                    </div>
                    <button style={styles.changeBtn}>Change</button>
                </div>
            </div>

            <div style={styles.list}>
                {cart.length === 0 ? (
                    <div style={{textAlign: 'center', marginTop: '60px', opacity: 0.3}}>
                        <FaUtensils size={40} style={{marginBottom: '10px'}}/>
                        <p>Cart is empty</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={styles.item}>
                            <img 
                                src={item.image && item.image.startsWith("http") ? item.image : `https://images.unsplash.com/${item.image}?w=200`} 
                                alt={item.name} 
                                style={{ width: "50px", height: "50px", borderRadius: "10px", objectFit: "cover", marginRight: "15px" }}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100?text=Yummy"; }}
                            />
                            
                            <div style={{flex: 1}}>
                                <p style={{margin:0, fontWeight:'bold'}}>{item.name}</p>
                                <p style={{margin:0, color:'#f97316'}}>₹{item.price * item.quantity} ({item.quantity}x)</p>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={styles.delBtn}><FaTrash /></button>
                        </div>
                    ))
                )}
            </div>

            <div style={styles.footer}>
                <div style={styles.totalRow}><span>Total</span><span>₹{totalPrice}</span></div>
                <div style={styles.btnRow}>
                    <button onClick={() => processOrder("Cash")} disabled={isSubmitting} style={styles.cashBtn}>Pay Cash</button>
                    <button onClick={() => processOrder("Online")} disabled={isSubmitting} style={styles.onlineBtn}>Pay Online</button>
                </div>
            </div>
            <style>{`.pop-in { animation: pop 0.3s; } @keyframes pop { from {transform:scale(0.8)} to {transform:scale(1)} } .checkmark-anim { animation: checkBounce 0.5s ease-out forwards; } @keyframes checkBounce { 0% { transform: scale(0); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } } .loaderLine { height: 3px; background: #22c55e; width: 100%; margin: 20px auto 0; border-radius: 10px; animation: loadingBar 2.5s linear forwards; } @keyframes loadingBar { from { width: 0%; } to { width: 100%; } }`}</style>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '15px', paddingBottom: '160px', fontFamily: 'Inter, sans-serif' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px)' },
    successCard: { background: '#111', padding: '40px 30px', borderRadius: '30px', textAlign: 'center', border: '1px solid #22c55e', width: '85%', maxWidth: '320px' },
    successTitle: { fontSize: '24px', fontWeight: '900', margin: '15px 0 5px' },
    counterNote: { color: '#22c55e', fontSize: '15px', margin: '10px 0', lineHeight: '1.5', fontWeight: '600' },
    successSub: { color: '#666', fontSize: '12px', margin: 0 },
    
    // ✅ NEW SELECTION SCREEN STYLES
    tableCard: { background: '#111', padding: '25px', borderRadius: '24px', textAlign: 'center', border: '1px solid #333', width: '90%', maxWidth: '350px' },
    parcelBtn: { width: '100%', padding: '18px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)', cursor:'pointer' },
    divider: { margin: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' },
    tableGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' },
    numBtn: { padding: '15px 0', background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px', color: 'white', fontWeight: '900', fontSize: '16px', cursor:'pointer' },

    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' },
    backBtn: { background: '#1a1a1a', border: '1px solid #333', color: 'white', padding: '12px', borderRadius: '12px', display:'flex' },
    callBtn: { background: '#ef4444', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '12px', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center' },
    title: { margin: 0, fontSize: '18px', fontWeight: '900' },
    infoCard: { background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #222' },
    changeBtn: { background: 'rgba(255, 255, 255, 0.1)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' },
    list: { display: 'flex', flexDirection: 'column', gap: '10px' },
    item: { background: '#0a0a0a', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', border: '1px solid #111' },
    delBtn: { background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '10px', borderRadius: '10px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#080808', padding: '20px', borderTop: '1px solid #111' },
    totalRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px', fontWeight: '900' },
    btnRow: { display: 'flex', gap: '10px' },
    onlineBtn: { flex: 1, height: '55px', background: '#111', color: 'white', border: '1px solid #333', borderRadius: '15px', fontWeight: 'bold' },
    cashBtn: { flex: 1.5, height: '55px', background: '#f97316', color: 'white', border: 'none', borderRadius: '15px', fontWeight: '900' }
};

export default Cart;