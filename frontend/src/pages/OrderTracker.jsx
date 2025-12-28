import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/ReceiptGenerator";
import { 
    FaCheck, FaUtensils, FaConciergeBell, FaCheckCircle, 
    FaArrowLeft, FaPhoneAlt, FaSpinner, FaReceipt, FaDownload,
    FaExclamationTriangle, FaExclamationCircle
} from "react-icons/fa";

// 🚀 SMART API SWITCHER
const getApiBase = () => {
    const host = window.location.hostname;
    if (host === "localhost" || host.startsWith("192.168") || host.startsWith("10.") || host === "127.0.0.1") {
        return `http://${window.location.hostname}:5000/api`;
    }
    return "https://smart-menu-backend-5ge7.onrender.com/api";
};

// --- STYLES ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
.tracker-container { background-color: #050505; min-height: 100vh; font-family: 'Inter', sans-serif; color: white; padding: 20px; padding-bottom: 140px; max-width: 600px; margin: 0 auto; position: relative; }
.loading-screen, .error-screen { background: #050505; height: 100vh; color: #f97316; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px; text-align: center; }
.error-screen { color: #ef4444; }

/* ANIMATIONS */
@keyframes pulse-orange { 0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); } 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); } }
.pulse-active { animation: pulse-orange 2s infinite; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* HEADER */
.nav-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-top: 10px; }
.back-btn { background: #222; border: none; color: white; width: 45px; height: 45px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; }
.order-title { font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
.order-id { font-size: 12px; color: #888; font-weight: 600; margin-top: 2px; }

/* STATUS CARD */
.status-card { background: #111; border: 1px solid #222; border-radius: 24px; padding: 40px 20px; margin-bottom: 30px; text-align: center; position: relative; overflow: hidden; }
.status-label { font-size: 12px; text-transform: uppercase; letter-spacing: 3px; color: #666; font-weight: 800; margin-bottom: 10px; }
.status-value { font-size: 32px; font-weight: 900; color: white; margin-bottom: 10px; line-height: 1.1; }

/* STEPPER */
.stepper-wrapper { position: relative; display: flex; justify-content: space-between; align-items: flex-start; margin: 0 10px 30px 10px; }
.progress-bg { position: absolute; top: 20px; left: 0; width: 100%; height: 4px; background: #222; z-index: 0; border-radius: 10px; }
.progress-fill { position: absolute; top: 20px; left: 0; height: 4px; background: #f97316; z-index: 0; transition: width 0.5s ease; border-radius: 10px; }
.step-item { z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; }
.step-icon { width: 44px; height: 44px; border-radius: 50%; background: #111; border: 3px solid #222; color: #555; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.3s; }
.step-icon.active { border-color: #f97316; color: white; background: #f97316; }
.step-label { font-size: 11px; font-weight: 700; color: #555; text-align: center; transition: color 0.3s; }
.step-label.active { color: white; }

/* RECEIPT CARD */
.receipt-card { background: #111; border-radius: 24px; padding: 25px; border: 1px solid #222; }
.receipt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px dashed #333; padding-bottom: 20px; }

/* ITEMS */
.item-row { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 15px; align-items: center; }
.item-left { display: flex; align-items: center; gap: 12px; }
.item-qty { background: #222; color: white; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
.item-name { color: #eee; font-weight: 600; }
.item-price { color: white; font-weight: 700; }

.total-row { display: flex; justify-content: space-between; margin-top: 25px; padding-top: 20px; border-top: 1px solid #333; align-items: center; }
.total-label { font-size: 14px; font-weight: 800; color: #888; text-transform: uppercase; }
.total-amount { font-size: 26px; font-weight: 900; color: white; }

/* FOOTER - FIXED & FULL WIDTH */
.sticky-footer { position: fixed; bottom: 0; left: 50%; transform: translateX(-50%); width: 100%; max-width: 600px; background: rgba(5,5,5,0.95); backdrop-filter: blur(15px); padding: 20px; border-top: 1px solid #222; display: flex; flex-direction: column; gap: 12px; z-index: 100; padding-bottom: 30px; }
.footer-buttons-row { display: flex; gap: 12px; width: 100%; }
.btn-call { flex: 1; background: #1a1a1a; color: white; border: 1px solid #333; height: 56px; border-radius: 16px; font-weight: 700; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; }
.btn-status { flex: 2; background: #f97316; color: white; border: none; height: 56px; border-radius: 16px; font-weight: 800; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(249, 115, 22, 0.25); }
.retry-btn { background: #333; color: white; padding: 12px 25px; border-radius: 10px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px; }
`;

const OrderTracker = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = getApiBase(); 
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [callStatus, setCallStatus] = useState("Call Waiter"); 
    const [isCalling, setIsCalling] = useState(false);
    const [error, setError] = useState(null);

    // --- FETCH ORDER ---
    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/orders/track/${id}`);
                
                // 1. DETECT DATA STRUCTURE
                let orderData = res.data.order ? res.data.order : res.data;
                if (!orderData) throw new Error("Order not found");

                // 2. FORCE ITEMS FIELD
                let finalItems = [];
                if (orderData.items && orderData.items.length > 0) finalItems = orderData.items;
                else if (orderData.products && orderData.products.length > 0) finalItems = orderData.products;
                else if (orderData.cartItems && orderData.cartItems.length > 0) finalItems = orderData.cartItems;
                else if (orderData.orderItems && orderData.orderItems.length > 0) finalItems = orderData.orderItems;

                orderData.items = finalItems; // Force unified 'items' field

                setOrder(orderData);
                
                // 3. FETCH RESTAURANT
                const restId = orderData.restaurantId || orderData.owner;
                if(restId) {
                    const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${restId}`);
                    setRestaurant(resInfo.data);
                }

            } catch (e) { 
                console.error("Fetch Error:", e);
                setError("Could not load order details.");
            }
        };

        fetchOrderData();
        
        // --- SOCKETS ---
        const SOCKET_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "https://smart-menu-backend-5ge7.onrender.com";
        const socket = io(SOCKET_URL);
        socket.on(`order-update-${id}`, (updated) => setOrder(prev => ({ ...prev, ...updated })));
        socket.on("order-status-updated", (updated) => { if (updated._id === id) setOrder(updated); });
        return () => socket.disconnect();
    }, [id, API_BASE]);

    // --- SMART TOTAL CALCULATION ---
    const orderTotal = useMemo(() => {
        if (!order) return 0;
        if (order.totalAmount && order.totalAmount > 0) return order.totalAmount;
        if (order.totalPrice && order.totalPrice > 0) return order.totalPrice;
        if (order.bill && order.bill > 0) return order.bill;
        
        return order.items?.reduce((acc, item) => {
            return acc + (Number(item.price || 0) * Number(item.quantity || 1));
        }, 0) || 0;
    }, [order]);

    const handleBack = () => {
        if(order?.restaurantId) navigate(`/menu/${order.restaurantId}`);
        else navigate(-1);
    };

    const handleDownloadReceipt = () => {
        if (!order || !restaurant) {
            alert("Receipt data is syncing... try again in 2 seconds.");
            return;
        }
        const safeOrder = { ...order, totalAmount: orderTotal };
        generateCustomerReceipt(safeOrder, restaurant);
    };

    const handleCallWaiter = async () => {
        if (!order || isCalling) return;
        setIsCalling(true);
        setCallStatus("Calling...");
        
        try {
            await axios.post(`${API_BASE}/broadcast/notify`, {
                restaurantId: order.restaurantId,
                tableNumber: order.tableNumber,
                title: `Table ${order.tableNumber} Needs Help`,
                message: "Customer requested assistance via app.",
                type: "warning"
            });
            setCallStatus("Sent ✓");
        } catch (e) {
            try {
                await axios.post(`${API_BASE}/notification/send`, {
                    restaurantId: order.restaurantId,
                    table: order.tableNumber,
                    type: "call_waiter"
                });
                setCallStatus("Sent ✓");
            } catch (err2) {
                alert("Could not contact server. Please ask staff manually.");
                setCallStatus("Failed ✕");
            }
        }
        
        setTimeout(() => { setCallStatus("Call Waiter"); setIsCalling(false); }, 4000);
    };

    if (error) return (
        <>
            <style>{styles}</style>
            <div className="error-screen">
                <FaExclamationTriangle size={40} />
                <h3>Order Not Found</h3>
                <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
            </div>
        </>
    );

    if (!order) return (
        <>
            <style>{styles}</style>
            <div className="loading-screen">
                <FaSpinner className="spin" size={30} />
                <span>Syncing Order...</span>
            </div>
        </>
    );

    const stages = [
        { id: "pending", label: "Sent", icon: <FaCheck /> },
        { id: "preparing", label: "Cooking", icon: <FaUtensils /> },
        { id: "ready", label: "Ready", icon: <FaConciergeBell /> },
        { id: "completed", label: "Served", icon: <FaCheckCircle /> }
    ];

    const currentStatus = order.status || "pending";
    const activeIndex = stages.findIndex(s => s.id === currentStatus);
    const progressWidth = activeIndex === -1 ? 5 : (activeIndex / (stages.length - 1)) * 100;

    return (
        <>
            <style>{styles}</style>
            <div className="tracker-container">
                
                {/* HEADER */}
                <div className="nav-header">
                    <button onClick={handleBack} className="back-btn"><FaArrowLeft /></button>
                    <div>
                        <h1 className="order-title">Track Order</h1>
                        <div className="order-id">ID: #{order._id?.slice(-6).toUpperCase()} • Table {order.tableNumber}</div>
                    </div>
                </div>

                {/* STATUS CARD */}
                <div className={`status-card ${currentStatus !== 'completed' ? 'pulse-active' : ''}`}>
                    <div className="status-label">CURRENT STATUS</div>
                    <div className="status-value" style={{ color: currentStatus === 'completed' ? '#22c55e' : 'white'}}>
                        {currentStatus === "pending" ? "ORDER SENT" : 
                         currentStatus === "preparing" ? "COOKING" : 
                         currentStatus === "ready" ? "READY" : "SERVED"}
                    </div>
                </div>

                {/* STEPPER */}
                <div className="stepper-wrapper">
                    <div className="progress-bg"></div>
                    <div className="progress-fill" style={{ width: `${progressWidth}%` }}></div>
                    {stages.map((stage, i) => (
                        <div key={stage.id} className="step-item">
                            <div className={`step-icon ${i <= activeIndex ? 'active' : ''}`}>{stage.icon}</div>
                            <div className={`step-label ${i <= activeIndex ? 'active' : ''}`}>{stage.label}</div>
                        </div>
                    ))}
                </div>

                {/* RECEIPT AREA */}
                <div className="receipt-card">
                    <div className="receipt-header">
                        <span style={{fontWeight:'800', color:'#888', fontSize:'12px', letterSpacing:'1px'}}>ORDER SUMMARY</span>
                        <FaReceipt color="#444"/>
                    </div>
                    
                    {/* ITEMS LIST */}
                    {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                            <div key={i} className="item-row">
                                <div className="item-left">
                                    <span className="item-qty">{item.quantity}x</span>
                                    <span className="item-name">{item.name || "Unknown Item"}</span>
                                </div>
                                <span className="item-price">₹{(item.price || 0) * (item.quantity || 1)}</span>
                            </div>
                        ))
                    ) : (
                        <div style={{color: '#666', textAlign: 'center', padding: '20px', fontSize:'13px', fontStyle:'italic'}}>
                            No items in this order.
                        </div>
                    )}

                    {order.note && (
                        <div style={{marginTop:'15px', padding:'10px', background:'rgba(249,115,22,0.1)', color:'#f97316', borderRadius:'10px', fontSize:'13px', display:'flex', gap:'8px'}}>
                            <FaExclamationCircle/> <span>Note: "{order.note}"</span>
                        </div>
                    )}

                    <div className="total-row">
                        <div className="total-label">TOTAL TO PAY</div>
                        <div className="total-amount">₹{orderTotal}</div>
                    </div>
                </div>

                {/* FIXED FOOTER */}
                <div className="sticky-footer">
                    <div className="footer-buttons-row">
                        <button onClick={handleCallWaiter} className="btn-call" disabled={isCalling} style={{opacity: isCalling ? 0.7 : 1}}>
                            {isCalling ? <FaSpinner className="spin"/> : <FaPhoneAlt />} {callStatus}
                        </button>
                        <button onClick={handleDownloadReceipt} className="btn-status">
                            <FaDownload /> SAVE RECEIPT
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
};

export default OrderTracker;