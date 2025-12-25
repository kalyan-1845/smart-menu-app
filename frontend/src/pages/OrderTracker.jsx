import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
// Corrected import path to match your folder structure
import { generateCustomerReceipt } from "../utils/receiptGenerator";
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaArrowLeft, FaPhoneAlt, FaMoneyBillWave, FaCheckCircle, 
    FaSpinner, FaExclamationCircle, FaReceipt, FaDownload
} from "react-icons/fa";

// --- MOBILE-FIRST PREMIUM STYLES ---
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');

.tracker-container {
    background-color: #050505;
    min-height: 100vh;
    font-family: 'Inter', sans-serif;
    color: white;
    padding: 20px;
    padding-bottom: 120px;
    max-width: 600px;
    margin: 0 auto;
    position: relative;
    background-image: radial-gradient(circle at top right, #1a100a 0%, #050505 40%);
}

.loading-screen {
    background: #050505;
    height: 100vh;
    color: #f97316;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

@keyframes pulse-orange {
    0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
    100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}
.pulse-active { animation: pulse-orange 2s infinite; }

@keyframes spin { 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }

.nav-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; padding-top: 10px; }
.back-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; backdrop-filter: blur(10px); }
.order-title { font-size: 20px; font-weight: 900; margin: 0; }
.order-id { font-size: 11px; color: #888; font-weight: 700; margin-top: 2px; }

.status-card {
    background: #111;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 30px 20px;
    margin-bottom: 25px;
    text-align: center;
    position: relative;
    overflow: hidden;
}
.status-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #888; font-weight: 800; margin-bottom: 5px; }
.status-value { font-size: 28px; font-weight: 900; color: white; margin-bottom: 5px; }
.status-sub { color: #f97316; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; }

.stepper-wrapper {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 0 10px 30px 10px;
}
.progress-bg { position: absolute; top: 15px; left: 0; width: 100%; height: 4px; background: #222; z-index: 0; border-radius: 10px; }
.progress-fill { position: absolute; top: 15px; left: 0; height: 4px; background: #f97316; z-index: 0; transition: width 0.5s ease; border-radius: 10px; }

.step-item { z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 50px; }
.step-icon {
    width: 34px; height: 34px;
    border-radius: 50%;
    background: #111;
    border: 2px solid #333;
    color: #555;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px;
    transition: all 0.3s;
}
.step-icon.active { border-color: #f97316; color: white; background: #f97316; }
.step-label { font-size: 10px; font-weight: 700; color: #555; text-align: center; transition: color 0.3s; }
.step-label.active { color: white; }

.receipt-card {
    background: #111;
    border-radius: 20px;
    padding: 20px;
    border: 1px solid #222;
}
.receipt-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px dashed #333; padding-bottom: 15px; }

.receipt-download-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(249, 115, 22, 0.05);
    border: 1px solid rgba(249, 115, 22, 0.2);
    padding: 12px 15px;
    border-radius: 15px;
    margin-bottom: 15px;
}
.download-text { font-size: 13px; font-weight: 700; color: #f97316; }
.btn-download-mini {
    background: #f97316;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.item-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
.item-qty { color: #f97316; font-weight: 800; margin-right: 8px; }
.item-name { color: #ddd; font-weight: 500; }
.item-price { color: white; font-weight: 700; }

.note-box {
    background: rgba(249, 115, 22, 0.1);
    border: 1px solid rgba(249, 115, 22, 0.2);
    padding: 10px;
    border-radius: 10px;
    margin-top: 15px;
    font-size: 12px;
    color: #f97316;
    display: flex; gap: 8px;
}

.total-row { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 15px; border-top: 1px solid #222; align-items: center; }
.total-label { font-size: 12px; font-weight: 800; color: #888; text-transform: uppercase; }
.total-amount { font-size: 20px; font-weight: 900; color: white; }

.sticky-footer {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 600px;
    background: rgba(5,5,5,0.95);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-top: 1px solid #222;
    display: flex; gap: 12px;
    z-index: 100;
}

.btn-call {
    flex: 1;
    background: #1a1a1a;
    color: white;
    border: 1px solid #333;
    height: 50px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer;
}
.btn-status {
    flex: 1;
    background: #f97316;
    color: white;
    border: none;
    height: 50px;
    border-radius: 14px;
    font-weight: 800;
    font-size: 13px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3);
}
`;

const OrderTracker = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [callStatus, setCallStatus] = useState("Call Waiter"); 
    const [isCalling, setIsCalling] = useState(false);

    useEffect(() => {
        const fetchOrderData = async () => {
            try {
                // Fetch specific order
                const res = await axios.get(`${API_BASE}/orders/track/${id}`);
                setOrder(res.data);
                
                // Fetch restaurant branding for the PDF generator
                const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.owner}`);
                setRestaurant(resInfo.data);
            } catch (e) { 
                console.error("Fetch Error:", e);
            }
        };

        fetchOrderData();
        
        // --- REAL-TIME UPDATES VIA SOCKET ---
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // HANDLER: Generate the Centered Digital Receipt
    const handleDownloadReceipt = () => {
        if (order && restaurant) {
            generateCustomerReceipt(order, restaurant);
        } else {
            alert("Syncing order data... please wait.");
        }
    };

    // HANDLER: Notify staff for help
    const handleCallWaiter = async () => {
        if (!order || isCalling) return;
        
        setIsCalling(true);
        setCallStatus("Requesting...");
        
        try {
            await axios.post(`${API_BASE}/orders/calls`, {
                restaurantId: order.owner,
                tableNumber: order.tableNumber,
                type: "help"
            });
            setCallStatus("Staff Notified ✓");
            setTimeout(() => {
                setCallStatus("Call Waiter");
                setIsCalling(false);
            }, 5000);
        } catch (e) {
            alert("Failed to notify staff.");
            setCallStatus("Call Waiter");
            setIsCalling(false);
        }
    };

    const stages = [
        { id: "PLACED", label: "Sent", icon: <FaCheck /> },
        { id: "COOKING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaConciergeBell /> },
        { id: "SERVED", label: "Served", icon: <FaCheckCircle /> }
    ];

    if (!order) return (
        <>
            <style>{styles}</style>
            <div className="loading-screen">
                <FaSpinner className="spin" size={30} />
                <span>Syncing Live Order...</span>
            </div>
        </>
    );

    // Status Mapping logic
    const currentStatus = order.status === "PLACED" ? "PLACED" : (order.status === "Cooking" ? "COOKING" : (order.status === "Ready" ? "READY" : "SERVED"));
    const activeIndex = stages.findIndex(s => s.id === currentStatus);
    const progressWidth = (activeIndex / (stages.length - 1)) * 100;

    const isPaid = order.paymentStatus === "Paid";
    const isCash = order.paymentMethod === "Cash";

    return (
        <>
            <style>{styles}</style>
            <div className="tracker-container">
                
                {/* 1. NAVIGATION HEADER */}
                <div className="nav-header">
                    <button onClick={() => navigate(-1)} className="back-btn"><FaArrowLeft /></button>
                    <div>
                        <h1 className="order-title">Track Order</h1>
                        <div className="order-id">ID: #{order._id.slice(-6).toUpperCase()} • Table {order.tableNumber}</div>
                    </div>
                </div>

                {/* 2. CURRENT STATUS CARD */}
                <div className={`status-card ${currentStatus !== 'SERVED' ? 'pulse-active' : ''}`}>
                    <div className="status-label">CURRENT STATUS</div>
                    <div className="status-value" style={{ color: currentStatus === 'SERVED' ? '#22c55e' : 'white'}}>
                        {currentStatus === "PLACED" ? "ORDER SENT" : 
                         currentStatus === "COOKING" ? "PREPARING" : 
                         currentStatus === "READY" ? "READY AT COUNTER" : "ENJOY MEAL"}
                    </div>
                    <div className="status-sub">
                        {currentStatus === "SERVED" ? 
                            <><FaCheckCircle/> Order Finished</> : 
                            <><FaClock/> Live from Kitchen</>
                        }
                    </div>
                </div>

                {/* 3. STEPPER PROGRESS */}
                <div className="stepper-wrapper">
                    <div className="progress-bg"></div>
                    <div className="progress-fill" style={{ width: `${progressWidth}%` }}></div>
                    
                    {stages.map((stage, i) => (
                        <div key={stage.id} className="step-item">
                            <div className={`step-icon ${i <= activeIndex ? 'active' : ''}`}>
                                {stage.icon}
                            </div>
                            <div className={`step-label ${i <= activeIndex ? 'active' : ''}`}>
                                {stage.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 4. RECEIPT & SUMMARY CARD */}
                <div className="receipt-card">
                    <div className="receipt-header">
                        <span style={{fontWeight:'800', color:'#888', fontSize:'11px', textTransform:'uppercase'}}>ORDER SUMMARY</span>
                        <FaReceipt color="#444"/>
                    </div>

                    {/* RECEIPT DOWNLOAD QUICK ACTION */}
                    <div className="receipt-download-box">
                        <span className="download-text">Digital Bill Receipt</span>
                        <button onClick={handleDownloadReceipt} className="btn-download-mini">
                            <FaDownload size={14}/>
                        </button>
                    </div>
                    
                    {order.items.map((item, i) => (
                        <div key={i} className="item-row">
                            <div>
                                <span className="item-qty">{item.quantity}x</span>
                                <span className="item-name">{item.name}</span>
                            </div>
                            <span className="item-price">₹{item.price * item.quantity}</span>
                        </div>
                    ))}

                    {/* CHEF NOTES DISPLAY */}
                    {order.note && (
                        <div className="note-box">
                            <FaExclamationCircle style={{minWidth: '12px', marginTop:'2px'}}/> 
                            <span>Chef Note: "{order.note}"</span>
                        </div>
                    )}

                    <div className="total-row">
                        <div className="total-label">{isPaid ? "TOTAL PAID" : "TOTAL TO PAY"}</div>
                        <div className="total-amount" style={{ color: isPaid ? '#22c55e' : 'white' }}>
                            ₹{order.totalAmount}
                        </div>
                    </div>

                    {/* PAYMENT INSTRUCTION FOR CASH CLIENTS */}
                    {isCash && !isPaid && (
                        <div style={{ marginTop: '15px', background: '#222', padding: '12px', borderRadius: '12px', display:'flex', alignItems:'center', gap:'10px' }}>
                            <div style={{background:'#f97316', padding:'8px', borderRadius:'50%', display:'flex'}}><FaMoneyBillWave size={12} color="white"/></div>
                            <div>
                                <div style={{fontSize:'12px', fontWeight:'bold', color:'white'}}>Pay Cash at Counter</div>
                                <div style={{fontSize:'10px', color:'#888'}}>Download the receipt above for checkout</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. STICKY ACTION FOOTER */}
                <div className="sticky-footer">
                    <button 
                        onClick={handleCallWaiter} 
                        className="btn-call" 
                        disabled={isCalling} 
                        style={{opacity: isCalling ? 0.7 : 1}}
                    >
                        {isCalling ? <FaSpinner className="spin"/> : <FaPhoneAlt />} {callStatus}
                    </button>
                    
                    <button onClick={handleDownloadReceipt} className="btn-status">
                        <FaDownload /> SAVE RECEIPT
                    </button>
                </div>

            </div>
        </>
    );
};

export default OrderTracker;