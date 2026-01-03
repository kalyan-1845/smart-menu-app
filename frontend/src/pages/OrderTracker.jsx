import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/ReceiptGenerator";
import { 
    FaCheck, FaUtensils, FaConciergeBell, FaFlagCheckered,
    FaArrowLeft, FaPhoneAlt, FaDownload, FaSpinner, FaReceipt, FaLock,
    FaShieldAlt, FaWallet, FaStar, FaTimes
} from "react-icons/fa";

const SERVER_URL = "https://smart-menu-backend-5ge7.onrender.com";
const API_BASE = `${SERVER_URL}/api`;

const OrderTracker = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [callStatus, setCallStatus] = useState("Call Waiter"); 
    const [isCalling, setIsCalling] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false);
    
    // Feedback State
    const [showFeedback, setShowFeedback] = useState(false);
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const getStepIndex = (status) => {
        if (!status) return 0;
        const s = status.toLowerCase();
        if (s.includes('place') || s.includes('pend') || s.includes('new')) return 0;
        if (s.includes('cook') || s.includes('prepar')) return 1;
        if (s.includes('ready')) return 2;
        if (s.includes('serv') || s.includes('complet') || s.includes('paid')) return 3;
        return 0;
    };

    const fetchOrderData = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE}/orders/${id}?t=${Date.now()}`); 
            setOrder(res.data);
            
            if(res.data.restaurantId && !restaurant) {
                const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.restaurantId}`);
                setRestaurant(resInfo.data);
            }
        } catch (e) { console.error("Fetch Error:", e); }
    }, [id, restaurant]);

    useEffect(() => {
        fetchOrderData();
        const socket = io(SERVER_URL, { transports: ['websocket'] });

        socket.on("connect", () => {
            socket.emit('join-restaurant', id); 
        });

        socket.on("chef-ready-alert", (data) => {
            if (data.orderId === id) fetchOrderData(); 
        });

        const interval = setInterval(fetchOrderData, 8000); 
        return () => { socket.disconnect(); clearInterval(interval); };
    }, [id, fetchOrderData]);

    // 🧾 AUTO-DOWNLOAD & FEEDBACK TRIGGER
    useEffect(() => {
        const triggerSequence = async () => {
            if (order && (order.status.toLowerCase() === "served" || order.status.toLowerCase() === "completed")) {
                if (!hasDownloaded && restaurant) {
                    setTimeout(async () => {
                        await generateCustomerReceipt(order, restaurant);
                        setHasDownloaded(true);
                        
                        // 🌟 Show feedback pop-up 1.5s after download
                        setTimeout(() => setShowFeedback(true), 1500);
                    }, 1200);
                }
            }
        };
        triggerSequence();
    }, [order?.status, hasDownloaded, restaurant, order]);

    const handleRating = (val) => {
        setRating(val);
        // You can add an axios.post here to save ratings to your DB
        setTimeout(() => {
            setSubmitted(true);
            setTimeout(() => setShowFeedback(false), 2000);
        }, 5000);
    };

    const currentStep = order ? getStepIndex(order.status) : 0;
    const isServed = currentStep === 3; 

    if (!order) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <div style={{ flex: 1 }}>
                    <h1 style={styles.title}>Track Order</h1>
                    <p style={styles.sub}>ORDER #{id.slice(-4).toUpperCase()}</p>
                </div>
                <img src="/logo192.png" alt="BiteBox" style={styles.smallLogo} />
            </div>

            <div style={styles.statusCard}>
                <h2 style={styles.statusTitle}>
                    {currentStep === 0 ? "Order Received" : 
                     currentStep === 1 ? "Chef Cooking..." : 
                     currentStep === 2 ? "Ready to Pickup" : "ORDER SERVED!"}
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
                        <FaReceipt color="#f97316" /> <span style={{letterSpacing:'1px', fontWeight:'900'}}>ORDER SUMMARY</span>
                    </div>
                    <span style={{fontSize:'10px', color:'#555', fontWeight: 'bold'}}>TABLE {order.tableNum}</span>
                </div>
                <div style={styles.itemList}>
                    {order.items.map((item, i) => (
                        <div key={i} style={styles.itemRow}>
                            <div style={styles.itemLeft}><span style={styles.qtyBox}>{item.quantity}x</span><span style={styles.itemName}>{item.name}</span></div>
                            <span style={styles.itemPrice}>₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>
                <div style={styles.divider}></div>
                <div style={styles.totalRow}><span>Grand Total</span><span style={styles.totalPrice}>₹{order.totalAmount}</span></div>
            </div>

            {/* ⭐ FEEDBACK MODAL */}
            {showFeedback && (
                <div style={styles.feedbackOverlay}>
                    <div style={styles.feedbackCard} className="pop-in">
                        {!submitted ? (
                            <>
                                <button onClick={() => setShowFeedback(false)} style={styles.closeBtn}><FaTimes/></button>
                                <h3 style={{margin:'0 0 10px 0'}}>Rate your Meal!</h3>
                                <p style={{fontSize:'12px', color:'#666', marginBottom:'20px'}}>How was the food and service at {restaurant?.restaurantName}?</p>
                                <div style={{display:'flex', gap:'10px', justifyContent:'center'}}>
                                    {[1,2,3,4,5].map(num => (
                                        <FaStar 
                                            key={num} 
                                            size={30} 
                                            color={rating >= num ? "#f97316" : "#333"} 
                                            onClick={() => handleRating(num)}
                                            style={{cursor:'pointer', transition:'0.2s'}}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{textAlign:'center', padding:'20px'}}>
                                <FaCheck color="#22c55e" size={40}/>
                                <h3 style={{marginTop:'15px'}}>Thank you!</h3>
                                <p style={{fontSize:'12px', color:'#888'}}>Your feedback helps us improve.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={styles.footer}>
                <button onClick={() => { if(isServed) generateCustomerReceipt(order, restaurant); }} 
                    disabled={!isServed} 
                    style={{...styles.solidBtn, background: isServed ? '#f97316' : '#222', color: isServed ? 'white' : '#555'}}
                >
                    {isServed ? <><FaDownload /> Download Bill</> : <><FaLock /> Receipt Locked</>}
                </button>
            </div>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } } .pop-in { animation: pop 0.4s cubic-bezier(0.17, 0.89, 0.32, 1.49); } @keyframes pop { from { opacity:0; transform: scale(0.8) translateY(20px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>
        </div>
    );
};

const StepIcon = ({ icon, label, active }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '40px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: active ? '#f97316' : '#18181b', color: active ? 'white' : '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.4s' }}>{icon}</div>
        <span style={{ fontSize: '9px', marginTop: '6px', fontWeight: '900', color: active ? 'white' : '#3f3f46' }}>{label}</span>
    </div>
);

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "20px", paddingBottom: "120px", fontFamily: "'Inter', sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#050505' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
    backBtn: { width: '45px', height: '45px', background: '#111', border: '1px solid #222', borderRadius: '15px', color: 'white' },
    title: { margin: 0, fontSize: '22px', fontWeight: '900' },
    sub: { margin: 0, color: '#555', fontSize: '11px', fontWeight: '900' },
    smallLogo: { width: '35px', height: '35px', borderRadius: '8px', objectFit: 'contain', background: 'white', padding: '2px' },
    statusCard: { background: '#0a0a0a', borderRadius: '28px', padding: '30px 20px', border: '1px solid #111', marginBottom: '20px', textAlign: 'center' },
    statusTitle: { margin: '0 0 35px 0', color: '#f97316', fontSize: '24px', fontWeight: '900' },
    statusBarContainer: { position: 'relative', marginTop: '10px' },
    lineBase: { position: 'absolute', top: '19px', left: '30px', right: '30px', height: '3px', background: '#18181b', zIndex: 0 },
    lineFill: { position: 'absolute', top: '19px', left: '30px', height: '3px', background: '#f97316', zIndex: 1, transition: 'width 0.8s ease' },
    stepWrapper: { display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 },
    receiptCard: { background: '#0a0a0a', borderRadius: '28px', padding: '24px', border: '1px solid #111' },
    receiptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
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
    feedbackOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
    feedbackCard: { background:'white', color:'black', borderRadius:'28px', padding:'30px', width:'100%', maxWidth:'320px', position:'relative', textAlign:'center' },
    closeBtn: { position:'absolute', top:'15px', right:'15px', background:'none', border:'none', color:'#ccc', fontSize:'20px' }
};

export default OrderTracker;