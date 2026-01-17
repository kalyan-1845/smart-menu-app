import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client"; 
import { 
    FaArrowLeft, FaTrash, FaCheckCircle, FaUtensils, FaPaperPlane, FaTimes 
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

const Cart = ({ cart, customerId, clearCart, removeFromCart, tableNum }) => {
    const { restaurantId } = useParams(); 
    const navigate = useNavigate();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState(false); 
    const socketRef = useRef(null); 

    // ✅ SMART TABLE LOGIC
    const storedTable = localStorage.getItem("last_table_scanned");
    const storedRest = localStorage.getItem("last_rest_scanned");
    const finalTableNum = tableNum || (storedRest === restaurantId ? storedTable : null);

    const totalPrice = cart.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);

    useEffect(() => {
        if (restaurantId) {
            socketRef.current = io(SERVER_URL, { transports: ['polling'] });
        }
        return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }, [restaurantId]);

    const handlePlaceOrder = async () => { 
        if (isSubmitting) return;
        
        if (!finalTableNum) {
            toast.error("Please scan the Table QR Code again.");
            return; 
        }
        if (cart.length === 0) return toast.error("Your cart is empty!");

        setIsSubmitting(true);
        if(navigator.vibrate) navigator.vibrate(50); 

        try {
            const idRes = await axios.get(`${API_BASE}/auth/owner-id/${restaurantId}`);
            const realMongoId = idRes.data.id;

            const payload = {
                restaurantId: realMongoId,
                tableNum: finalTableNum.toString(),
                items: cart.map(i => ({ 
                    name: i.name, 
                    quantity: i.quantity, 
                    price: i.price,
                    dishId: i._id,
                    image: i.image 
                })),
                totalAmount: totalPrice,
                status: "Pending", 
                customerName: "Guest"
            };

            const res = await axios.post(`${API_BASE}/orders`, payload);
            
            if (socketRef.current) {
                socketRef.current.emit("new-order", res.data);
            }
            
            setOrderSuccess(true);
            if(navigator.vibrate) navigator.vibrate([100, 50, 100]); 

        } catch (err) {
            console.error(err);
            toast.error("Connection Error. Please try again.");
            setIsSubmitting(false);
        }
    };

    // ✅ "ADD ITEMS" LOGIC
    const handleAddMore = () => {
        clearCart();
        navigate(`/menu/${restaurantId}?table=${finalTableNum}`); 
    };

    return (
        <div style={styles.container}>
            
            {/* ✅ PREMIUM SUCCESS POPUP */}
            {orderSuccess && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalCard}>
                        {/* BRANDING HEADER */}
                        <div style={styles.popupHeader}>
                            <h3 style={styles.popupBrand}>
                                KOVIXA <span style={{color:'#f59e0b'}}>x</span> {restaurantId?.toUpperCase()}
                            </h3>
                        </div>

                        <div style={styles.successIconBox}>
                            <FaCheckCircle size={50} color="#22c55e" />
                        </div>
                        
                        <h2 style={styles.modalTitle}>Order Placed!</h2>
                        <p style={styles.modalSub}>Table {finalTableNum} • Kitchen Notified</p>
                        
                        {/* ORDER RECEIPT LIST */}
                        <div style={styles.receiptList}>
                            {cart.map((item) => (
                                <div key={item._id} style={styles.receiptItem}>
                                    <div style={{display:'flex', gap:8, alignItems:'center'}}>
                                        <div style={styles.qtySquare}>{item.quantity}</div>
                                        <span style={styles.receiptName}>{item.name}</span>
                                    </div>
                                    <span style={styles.receiptPrice}>₹{item.price * item.quantity}</span>
                                </div>
                            ))}
                            <div style={styles.divider}></div>
                            <div style={styles.receiptTotal}>
                                <span>Total Amount</span>
                                <span style={{color:'#f59e0b'}}>₹{totalPrice}</span>
                            </div>
                        </div>

                        {/* ADD ITEMS BUTTON */}
                        <button onClick={handleAddMore} style={styles.addMoreBtn}>
                            <FaUtensils /> ADD MORE ITEMS
                        </button>
                    </div>
                </div>
            )}

            {/* 🏛️ HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <div>
                    <h1 style={styles.pageTitle}>Review Order</h1>
                    <p style={styles.pageSub}>Table {finalTableNum || "?"}</p>
                </div>
            </div>

            {/* 🛒 CART LIST */}
            <div style={styles.listContainer}>
                {cart.length === 0 ? (
                    <div style={styles.emptyState}>
                        <FaUtensils style={{fontSize: 40, color: '#334155', marginBottom: 20}} />
                        <h3 style={{color:'#94a3b8'}}>Cart is empty</h3>
                        <button onClick={() => navigate(-1)} style={styles.browseBtn}>Go to Menu</button>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item._id} style={styles.cartItem}>
                            <div style={styles.itemInfo}>
                                <h4 style={styles.itemName}>{item.name}</h4>
                                <div style={styles.itemMeta}>
                                    <span style={styles.qtyBadge}>{item.quantity}x</span>
                                    <span style={styles.itemPrice}>₹{item.price * item.quantity}</span>
                                </div>
                            </div>
                            <button onClick={() => removeFromCart(item._id)} style={styles.trashBtn}>
                                <FaTrash size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* 💰 FOOTER */}
            {cart.length > 0 && (
                <div style={styles.footerWrapper}>
                    <div style={styles.footerContent}>
                        <div style={styles.billRow}>
                            <span style={{color:'#94a3b8'}}>Total to Pay</span>
                            <span style={{fontWeight:'800', fontSize:18, color:'#f59e0b'}}>₹{totalPrice}</span>
                        </div>
                        
                        <button onClick={handlePlaceOrder} disabled={isSubmitting} style={styles.placeOrderBtn}>
                            {isSubmitting ? "SENDING..." : <>CONFIRM ORDER <FaPaperPlane /></>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 🎨 DARK PREMIUM THEME
const styles = {
    container: { minHeight: '100vh', background: '#020617', color: 'white', paddingBottom: '140px', fontFamily: "'Plus Jakarta Sans', sans-serif" },
    
    // Header
    header: { display: 'flex', alignItems: 'center', gap: 20, padding: '20px', background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #1e293b' },
    backBtn: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    pageTitle: { fontSize: 20, fontWeight: '800', margin: 0 },
    pageSub: { fontSize: 13, color: '#64748b', margin: 0 },

    // List
    listContainer: { padding: '20px', display: 'flex', flexDirection: 'column', gap: 15 },
    cartItem: { background: '#0f172a', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #1e293b' },
    itemInfo: { flex: 1 },
    itemName: { margin: '0 0 6px 0', fontSize: 15, fontWeight: '700', color: '#f1f5f9' },
    itemMeta: { display: 'flex', alignItems: 'center', gap: 10 },
    qtyBadge: { background: '#1e293b', color: '#cbd5e1', fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: '700', border: '1px solid #334155' },
    itemPrice: { color: '#f59e0b', fontWeight: '700', fontSize: 14 },
    trashBtn: { background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

    // Footer
    footerWrapper: { 
        position: 'fixed', bottom: 0, left: 0, right: 0, 
        background: 'rgba(2, 6, 23, 0.95)', backdropFilter: 'blur(10px)',
        borderTop: '1px solid #1e293b', zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)' 
    },
    footerContent: { padding: '20px', maxWidth: '600px', margin: '0 auto' },
    billRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, fontSize: 14 },
    placeOrderBtn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', border: 'none', borderRadius: 14, fontWeight: '800', fontSize: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, cursor:'pointer' },

    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    modalCard: { background: '#0f172a', borderRadius: '24px', textAlign: 'center', border: '1px solid #1e293b', width: '100%', maxWidth: '360px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)' },
    
    popupHeader: { background: '#1e293b', padding: '15px', borderBottom: '1px solid #334155' },
    popupBrand: { margin: 0, fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#e2e8f0' },
    
    successIconBox: { marginTop: 25, marginBottom: 15 },
    modalTitle: { fontSize: 24, fontWeight: '800', margin: '0 0 5px 0', color: 'white' },
    modalSub: { color: '#94a3b8', fontSize: 13, margin: 0 },

    receiptList: { padding: '20px', maxHeight: '200px', overflowY: 'auto' },
    receiptItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 },
    qtySquare: { background: '#334155', color: '#fff', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' },
    receiptName: { color: '#cbd5e1' },
    receiptPrice: { color: '#fff', fontWeight: '600' },
    divider: { height: 1, background: '#334155', margin: '15px 0' },
    receiptTotal: { display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: '800' },

    addMoreBtn: { width: '100%', padding: '18px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: '800', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },

    // Empty State
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: 80 },
    browseBtn: { marginTop: 20, background: '#f59e0b', border: 'none', padding: '12px 24px', borderRadius: 12, color: '#000', fontWeight: '800' }
};

export default Cart;