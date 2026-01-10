import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/ReceiptGenerator";
import { 
    FaCheck, FaUtensils, FaConciergeBell, FaFlagCheckered,
    FaArrowLeft, FaDownload, FaSpinner, FaReceipt, 
    FaTimes, FaBell, FaCashRegister, FaStar, FaLock, FaQuestionCircle
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SERVER_URL = "https://smart-menu-app-production.up.railway.app";
const API_BASE = `${SERVER_URL}/api`;

const OrderTracker = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const socketRef = useRef(null);
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [isCalling, setIsCalling] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    
    const [showFeedback, setShowFeedback] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false); // 🆕 EXIT CONFIRM STATE
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    // 🔄 HELPER: Calculate Progress Bar
    const getStepIndex = (status) => {
        if (!status) return 0;
        const s = status.toLowerCase();
        if (s.includes('place') || s.includes('pend') || s.includes('new')) return 0;
        if (s.includes('cook') || s.includes('prepar')) return 1;
        if (s.includes('ready')) return 2;
        if (s.includes('serv') || s.includes('complet') || s.includes('paid')) return 3;
        return 0;
    };

    // ✅ 1. FETCH ORDER & RESTAURANT DETAILS
    const fetchOrderData = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/orders/${id}?t=${Date.now()}`); 
            setOrder(res.data);
            
            if(res.data.restaurantId && !restaurant) {
                const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.restaurantId}`);
                setRestaurant(resInfo.data);
            }
        } catch (e) { 
            console.error("Order sync error"); 
        }
    }, [id, restaurant]);

    // ✅ 2. REAL-TIME SOCKET CONNECTION
    useEffect(() => {
        fetchOrderData(); 
        
        socketRef.current = io(SERVER_URL, { transports: ['websocket'] });
        
        if (order?.restaurantId) {
            socketRef.current.emit('join-restaurant', order.restaurantId);
        }

        socketRef.current.on("order-status-updated", (data) => {
            if (data.orderId === id) fetchOrderData(); 
        });

        socketRef.current.on("chef-ready-alert", (data) => {
            if (data.orderId === id) {
                if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
                toast.success("Your food is READY! 🍛");
                fetchOrderData(); 
            }
        });

        const interval = setInterval(fetchOrderData, 8000); 

        return () => { 
            if(socketRef.current) socketRef.current.disconnect(); 
            clearInterval(interval); 
        };
    }, [id, order?.restaurantId, fetchOrderData]); 

    // 🛎️ WAITER CALL
    const handleCallWaiter = () => {
        if (!order || isCalling) return;
        setIsCalling(true);
        if ("vibrate" in navigator) navigator.vibrate(100);

        socketRef.current.emit("call-waiter", {
            restaurantId: order.restaurantId,
            tableNumber: order.tableNum,
            orderId: id,
            _id: Date.now().toString()
        });

        toast.success("Staff Notified!");
        setTimeout(() => setIsCalling(false), 10000); 
    };

    // 🆕 HANDLE BACK BUTTON CLICK
    const handleBackClick = () => {
        setShowExitConfirm(true); // Show the confirmation modal instead of leaving
    };

    // 🆕 HANDLE EXIT CONFIRMATION
    const handleExitChoice = (choice) => {
        if (choice === 'yes') {
            // User wants to order more -> Go back to Menu
            // We reconstruct the menu URL using the restaurant ID from the order
            const menuUrl = `/menu/${restaurant?.username || order?.restaurantId}/${order?.tableNum}`;
            navigate(menuUrl);
        } else {
            // User wants to stay -> Close modal
            setShowExitConfirm(false);
        }
    };

    // 🧾 AUTO-DOWNLOAD RECEIPT
    useEffect(() => {
        if (order && (order.status.toLowerCase() === "served" || order.status.toLowerCase() === "paid")) {
            if (!hasDownloaded && restaurant) {
                setTimeout(async () => {
                    await generateCustomerReceipt(order, restaurant);
                    setHasDownloaded(true);
                    setTimeout(() => setShowFeedback(true), 2000); 
                }, 1500);
            }
        }
    }, [order?.status, hasDownloaded, restaurant]);

    const handleRating = (val) => {
        setRating(val);
        setTimeout(() => {
            setSubmitted(true);
            setTimeout(() => setShowFeedback(false), 2000);
        }, 1500);
    };

    const currentStep = order ? getStepIndex(order.status) : 0;
    const isLocked = order ? !(order.status.toLowerCase() === "served" || order.status.toLowerCase() === "paid") : true;

    if (!order) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            
            {/* 🆕 EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div style={styles.feedbackOverlay}>
                    <div style={styles.feedbackCard} className="pop-in">
                        <FaQuestionCircle size={50} color="#f97316" style={{marginBottom:15}}/>
                        <h3 style={{margin:'0 0 10px 0'}}>Order More Items?</h3>
                        <p style={{fontSize:'13px', color:'#666', marginBottom:'25px'}}>
                            Do you want to go back to the menu to add more food?
                        </p>
                        <div style={{display:'flex', gap:'10px'}}>
                            <button onClick={() => handleExitChoice('no')} style={styles.cancelBtn}>NO, STAY HERE</button>
                            <button onClick={() => handleExitChoice('yes')} style={styles.confirmBtn}>YES, ORDER MORE</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.header}>
                {/* 🎯 Updated Back Button to trigger Modal */}
                <button onClick={handleBackClick} style={styles.backBtn}><FaArrowLeft /></button>
                <div style={{ flex: 1 }}>
                    <h1 style={styles.title}>Live Tracker</h1>
                    <p style={styles.sub}>ID: #{id.slice(-6).toUpperCase()}</p>
                </div>
                <button 
                    onClick={handleCallWaiter} 
                    disabled={isCalling} 
                    style={{...styles.callBtn, opacity: isCalling ? 0.5 : 1}}
                >
                    <FaBell />
                </button>
            </div>

            <div style={styles.payBanner}>
                <FaCashRegister />
                <span>Payment: <b>{order.paymentMethod}</b>. Please pay at counter.</span>
            </div>

            <div style={styles.statusCard}>
                <h2 style={styles.statusTitle}>
                    {currentStep === 0 ? "Order Received" : 
                     currentStep === 1 ? "Chef is Cooking..." : 
                     currentStep === 2 ? "Ready to Enjoy!" : "ORDER SERVED!"}
                </h2>
                <div style={styles.statusBarContainer}>
                    <div style={styles.lineBase}></div>
                    <div style={{...styles.lineFill, width: `${currentStep * 33}%`}}></div>
                    <div style={styles.stepWrapper}>
                        <StepIcon icon={<FaCheck/>} label="Placed" active={currentStep >= 0} />
                        <StepIcon icon={<FaUtensils/>} label="Cooking" active={currentStep >= 1} />
                        <StepIcon icon={<FaConciergeBell/>} label="Ready" active={currentStep >= 2} />
                        <StepIcon icon={<FaFlagCheckered/>} label="Served" active={currentStep >= 3} />
                    </div>
                </div>
            </div>

            <div style={styles.receiptCard}>
                <div style={styles.receiptHeader}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <FaReceipt color="#f97316" /> <span style={{letterSpacing:'1px', fontWeight:'900'}}>YOUR ITEMS</span>
                    </div>
                    <span style={styles.tableBadge}>TABLE {order.tableNum}</span>
                </div>
                <div style={styles.itemList}>
                    {order.items.map((item, i) => (
                        <div key={i} style={styles.itemRow}>
                            <div style={styles.itemLeft}>
                                <span style={styles.qtyBox}>{item.quantity}x</span>
                                <span style={styles.itemName}>{item.name}</span>
                            </div>
                            <span style={styles.itemPrice}>₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>
                <div style={styles.divider}></div>
                <div style={styles.totalRow}><span>Total Payable</span><span style={styles.totalPrice}>₹{order.totalAmount}</span></div>
            </div>

            {showFeedback && (
                <div style={styles.feedbackOverlay}>
                    <div style={styles.feedbackCard} className="pop-in">
                        {!submitted ? (
                            <>
                                <button onClick={() => setShowFeedback(false)} style={styles.closeBtn}><FaTimes/></button>
                                <h3 style={{margin:'0 0 10px 0'}}>How was the food?</h3>
                                <p style={{fontSize:'12px', color:'#666', marginBottom:'20px'}}>Rate your experience at {restaurant?.restaurantName}</p>
                                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                                    {[1,2,3,4,5].map(num => (
                                        <FaStar key={num} size={35} color={rating >= num ? "#f97316" : "#eee"} onClick={() => handleRating(num)} style={{cursor:'pointer'}} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{padding:'20px'}}>
                                <FaCheck color="#22c55e" size={40}/>
                                <h3 style={{marginTop:'15px'}}>Thank you!</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={styles.footer}>
                <button 
                    onClick={() => generateCustomerReceipt(order, restaurant)} 
                    disabled={isLocked}
                    style={{
                        ...styles.solidBtn,
                        background: isLocked ? '#333' : '#f97316',
                        color: isLocked ? '#666' : 'white',
                        cursor: isLocked ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isLocked ? <><FaLock /> Receipt Locked (Wait for Bill)</> : <><FaDownload /> Download Receipt</>}
                </button>
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pop-in { animation: pop 0.4s cubic-bezier(0.17, 0.89, 0.32, 1.49); }`}</style>
        </div>
    );
};

const StepIcon = ({ icon, label, active }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '40px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: active ? '#f97316' : '#18181b', color: active ? 'white' : '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.4s', border: active ? '2px solid #f97316' : '1px solid #333' }}>{icon}</div>
        <span style={{ fontSize: '9px', marginTop: '6px', fontWeight: '900', color: active ? 'white' : '#555' }}>{label}</span>
    </div>
);

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "20px", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050505' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' },
    backBtn: { width: '45px', height: '45px', background: '#111', border: '1px solid #333', borderRadius: '15px', color: 'white', cursor:'pointer' },
    callBtn: { width: '45px', height: '45px', background: '#ef4444', border: 'none', borderRadius: '15px', color: 'white' },
    payBanner: { background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '12px', borderRadius: '15px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: '#22c55e', marginBottom: '20px' },
    title: { margin: 0, fontSize: '20px', fontWeight: '900' },
    sub: { margin: 0, color: '#555', fontSize: '10px', fontWeight: '900' },
    statusCard: { background: '#0a0a0a', borderRadius: '28px', padding: '30px 20px', border: '1px solid #111', marginBottom: '20px', textAlign: 'center' },
    statusTitle: { margin: '0 0 35px 0', color: '#f97316', fontSize: '24px', fontWeight: '900' },
    statusBarContainer: { position: 'relative', marginTop: '10px' },
    lineBase: { position: 'absolute', top: '19px', left: '30px', right: '30px', height: '3px', background: '#18181b', zIndex: 0 },
    lineFill: { position: 'absolute', top: '19px', left: '30px', height: '3px', background: '#f97316', zIndex: 1, transition: 'width 0.8s ease' },
    stepWrapper: { display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 },
    receiptCard: { background: '#0a0a0a', borderRadius: '28px', padding: '24px', border: '1px solid #111' },
    receiptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    tableBadge: { fontSize:'12px', color:'#f97316', fontWeight: '900', background:'rgba(249, 115, 22, 0.1)', padding:'4px 10px', borderRadius:'8px' },
    itemList: { display: 'flex', flexDirection: 'column', gap: '18px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    qtyBox: { background: '#111', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', color: '#f97316', border:'1px solid #222' },
    itemName: { fontWeight: '700', fontSize: '15px' },
    itemPrice: { fontWeight: '900', fontSize: '15px' },
    divider: { height: '1px', background: '#111', margin: '22px 0' },
    totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', fontWeight: '900' },
    totalPrice: { color: '#22c55e' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', zIndex: 100 },
    solidBtn: { width: '100%', height: '58px', border: 'none', borderRadius: '18px', fontWeight: '900', fontSize:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px' },
    feedbackOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.95)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
    feedbackCard: { background:'white', color:'black', borderRadius:'28px', padding:'30px', width:'100%', maxWidth:'320px', position:'relative', textAlign:'center' },
    closeBtn: { position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'#ccc', fontSize:'20px' },
    // 🆕 BUTTON STYLES FOR CONFIRM MODAL
    confirmBtn: { flex: 1, padding: '14px', background: '#f97316', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '900', cursor:'pointer' },
    cancelBtn: { flex: 1, padding: '14px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: '12px', fontWeight: '900', cursor:'pointer' }
};

export default OrderTracker;