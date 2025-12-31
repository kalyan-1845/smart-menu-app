import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/ReceiptGenerator";
import { 
    FaCheck, FaUtensils, FaConciergeBell, FaFlagCheckered,
    FaArrowLeft, FaPhoneAlt, FaDownload, FaSpinner, FaReceipt, FaLock
} from "react-icons/fa";

const SERVER_URL = window.location.hostname === "localhost" || window.location.hostname.startsWith("192.168")
    ? "http://localhost:5000" 
    : "https://smart-menu-backend-5ge7.onrender.com";

const API_BASE = `${SERVER_URL}/api`;

const OrderTracker = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [callStatus, setCallStatus] = useState("Call Waiter"); 
    const [isCalling, setIsCalling] = useState(false);
    const [hasDownloaded, setHasDownloaded] = useState(false); // Prevents duplicate downloads

    const getStepIndex = (status) => {
        if (!status) return 0;
        const s = status.toLowerCase();
        if (s.includes('place') || s.includes('pend') || s.includes('new')) return 0;
        if (s.includes('cook') || s.includes('prepar')) return 1;
        if (s.includes('ready')) return 2;
        if (s.includes('serv') || s.includes('complet') || s.includes('paid')) return 3;
        return 0;
    };

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/orders/${id}`); 
                setOrder(res.data);
                
                if(res.data.restaurantId && !restaurant) {
                    const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.restaurantId}`);
                    setRestaurant(resInfo.data);
                }
            } catch (e) { console.error(e); }
        };

        fetchOrderData();
        
        const socket = io(SERVER_URL);
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        const interval = setInterval(fetchOrderData, 3000);
        return () => { socket.disconnect(); clearInterval(interval); };
    }, [id]);

    // ✅ AUTO DOWNLOAD RECEIPT WHEN SERVED
    useEffect(() => {
        if (order && order.status === "Served" && !hasDownloaded && restaurant) {
            generateCustomerReceipt(order, restaurant);
            setHasDownloaded(true);
        }
    }, [order, hasDownloaded, restaurant]);

    const currentStep = order ? getStepIndex(order.status) : 0;
    const isServed = currentStep === 3; 

    const handleCallWaiter = async () => {
        setIsCalling(true);
        setCallStatus("Calling...");
        try {
            await axios.post(`${API_BASE}/orders/call-waiter`, {
                restaurantId: order.restaurantId,
                tableNumber: order.tableNum,
                type: "help"
            });
            setCallStatus("Waiter Coming!");
            setTimeout(() => { setCallStatus("Call Waiter"); setIsCalling(false); }, 5000);
        } catch (e) {
            setCallStatus("Try Again");
            setIsCalling(false);
        }
    };

    if (!order) return <div style={styles.center}><FaSpinner className="spin" size={30} color="#f97316"/></div>;

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <div>
                    <h1 style={styles.title}>Track Order</h1>
                    <p style={styles.sub}>Order #{order._id.slice(-4).toUpperCase()}</p>
                </div>
            </div>

            {/* STATUS CARD */}
            <div style={styles.statusCard}>
                <h2 style={styles.statusTitle}>
                    {currentStep === 0 ? "Order Sent" : 
                     currentStep === 1 ? "Cooking..." : 
                     currentStep === 2 ? "Ready to Serve" : "ENJOY MEAL"}
                </h2>
                
                <div style={styles.statusBarContainer}>
                    <div style={styles.lineBase}></div>
                    <div style={{...styles.lineFill, width: `${currentStep * 33}%`}}></div>

                    <div style={styles.stepWrapper}>
                        <StepIcon icon={<FaCheck/>} label="Sent" active={currentStep >= 0} />
                        <StepIcon icon={<FaUtensils/>} label="Cooking" active={currentStep >= 1} />
                        <StepIcon icon={<FaConciergeBell/>} label="Ready" active={currentStep >= 2} />
                        <StepIcon icon={<FaFlagCheckered/>} label="Served" active={currentStep >= 3} />
                    </div>
                </div>
            </div>

            {/* RECEIPT CARD */}
            <div style={styles.receiptCard}>
                <div style={styles.receiptHeader}>
                    <FaReceipt color="#666" /> <span>ORDER SUMMARY</span>
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
                <div style={styles.totalRow}>
                    <span>Total Bill</span>
                    <span style={styles.totalPrice}>₹{order.totalAmount}</span>
                </div>
                <div style={styles.paymentTag}>
                    {order.paymentMethod === "Online" ? "PAID ONLINE" : "PAY CASH AT COUNTER"}
                </div>
            </div>

            {/* FOOTER */}
            <div style={styles.footer}>
                <button onClick={handleCallWaiter} disabled={isCalling} style={styles.outlineBtn}>
                    <FaPhoneAlt /> {callStatus}
                </button>
                
                {/* LOCKED BUTTON */}
                <button 
                    onClick={() => { if(isServed) generateCustomerReceipt(order, restaurant); }} 
                    disabled={!isServed} 
                    style={{...styles.solidBtn, background: isServed ? '#f97316' : '#333', color: isServed ? 'white' : '#666', cursor: isServed ? 'pointer' : 'not-allowed'}}
                >
                    {isServed ? <><FaDownload /> Download Bill</> : <><FaLock /> Wait for Bill</>}
                </button>
            </div>

            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

const StepIcon = ({ icon, label, active }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, width: '40px' }}>
        <div style={{
            width: '35px', height: '35px', borderRadius: '50%',
            background: active ? '#f97316' : '#222',
            border: '3px solid #050505',
            color: active ? 'white' : '#555',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: '0.3s all ease'
        }}>
            {icon}
        </div>
        <span style={{ fontSize: '9px', marginTop: '5px', fontWeight: 'bold', color: active ? 'white' : '#444' }}>{label}</span>
    </div>
);

const styles = {
    container: { minHeight: "100vh", background: "#050505", color: "white", padding: "20px", paddingBottom: "100px", fontFamily: "sans-serif" },
    center: { height: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
    backBtn: { width: '40px', height: '40px', background: '#222', border: 'none', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    title: { margin: 0, fontSize: '24px', fontWeight: '900' },
    sub: { margin: 0, color: '#888', fontSize: '12px', fontWeight: 'bold' },
    statusCard: { background: '#111', borderRadius: '20px', padding: '25px 20px', border: '1px solid #222', marginBottom: '20px', textAlign: 'center' },
    statusTitle: { margin: '0 0 30px 0', color: '#f97316', fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' },
    statusBarContainer: { position: 'relative', marginTop: '10px', padding: '0 10px' },
    lineBase: { position: 'absolute', top: '15px', left: '25px', right: '25px', height: '4px', background: '#222', borderRadius: '2px', zIndex: 0 },
    lineFill: { position: 'absolute', top: '15px', left: '25px', height: '4px', background: '#f97316', borderRadius: '2px', zIndex: 1, transition: 'width 0.5s ease' },
    stepWrapper: { display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 },
    receiptCard: { background: '#111', borderRadius: '20px', padding: '20px', border: '1px solid #222' },
    receiptHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', color: '#666', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px' },
    itemList: { display: 'flex', flexDirection: 'column', gap: '15px' },
    itemRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    itemLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    qtyBox: { background: '#222', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', color: '#f97316' },
    itemName: { fontWeight: '600', fontSize: '14px' },
    itemPrice: { fontWeight: 'bold' },
    divider: { height: '1px', background: '#222', margin: '20px 0' },
    totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: '900' },
    totalPrice: { color: '#22c55e' },
    paymentTag: { marginTop: '15px', background: '#1a1a1a', padding: '10px', borderRadius: '10px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', color: '#888', letterSpacing: '1px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'rgba(5,5,5,0.95)', backdropFilter: 'blur(10px)', display: 'flex', gap: '15px', borderTop: '1px solid #222', zIndex: 100 },
    outlineBtn: { flex: 1, height: '50px', background: 'transparent', border: '1px solid #333', color: 'white', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    solidBtn: { flex: 1, height: '50px', border: 'none', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
};

export default OrderTracker;