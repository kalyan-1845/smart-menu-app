import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaArrowLeft, FaPhoneAlt, FaMoneyBillWave, FaDownload, FaFileDownload
} from "react-icons/fa";

// --- YOUR CSS STYLES (Injected) ---
const styles = `
/* Base Reset */
.tracker-container {
    background-color: #050505;
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: white;
    padding: 20px;
    padding-bottom: 100px;
    max-width: 600px;
    margin: 0 auto;
}

.loading-screen {
    background: #050505;
    height: 100vh;
    color: #FF5200;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 2px;
}

/* Headings */
h1 { font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; }
h3 { font-size: 16px; font-weight: 800; margin: 0 0 15px 0; color: #e5e5e5; text-transform: uppercase; letter-spacing: 1px; }

/* Cards */
.card {
    background-color: #121212;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 25px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* 1. Header Card */
.header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: center;
}
.label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #888; font-weight: 800; margin-bottom: 8px; }
.value { font-size: 32px; font-weight: 900; color: #FF5200; line-height: 1; }
.sub-value { color: #666; font-size: 12px; margin-top: 8px; font-weight: 600; }

.eta-badge {
    background: rgba(255, 82, 0, 0.1);
    border: 1px solid rgba(255, 82, 0, 0.3);
    color: #FF5200;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 6px;
}

/* 2. Stepper Layout */
.stepper-wrapper {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin: 20px 10px 40px 10px;
}
.progress-bg { position: absolute; top: 18px; left: 0; width: 100%; height: 3px; background: #222; z-index: 0; border-radius: 10px; }
.progress-fill { position: absolute; top: 18px; left: 0; height: 3px; background: #FF5200; z-index: 0; transition: width 0.5s ease; border-radius: 10px; box-shadow: 0 0 10px rgba(255, 82, 0, 0.5); }

.step-item { z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 60px; }
.step-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #121212;
    border: 2px solid #333;
    color: #555;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px;
    transition: all 0.3s;
}
.step-icon.active {
    border-color: #FF5200;
    color: white;
    background: #FF5200;
    box-shadow: 0 0 15px rgba(255, 82, 0, 0.4);
    transform: scale(1.1);
}
.step-label { font-size: 9px; text-transform: uppercase; font-weight: 800; color: #555; text-align: center; }
.step-label.active { color: white; }

/* 3. Basket Summary */
.basket-card .section-label { margin-bottom: 20px; font-weight: 900; color: #666; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }

.basket-row { display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #222; }
.basket-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }

.b-name { font-weight: 700; font-size: 14px; color: #e5e5e5; }
.b-qty { font-size: 14px; color: #FF5200; font-weight: 800; margin-right: 10px; }
.b-price { font-weight: 700; font-size: 14px; color: white; }

.grand-total-row { 
    display: flex; 
    justify-content: space-between; 
    margin-top: 20px; 
    border-top: 1px solid #333; 
    padding-top: 20px; 
    align-items: center;
}
.total-label { font-size: 12px; font-weight: 800; text-transform: uppercase; color: #888; }
.final-price { color: #FF5200; font-size: 22px; font-weight: 900; }
.final-price.paid { color: #22c55e; }

/* 4. Action Buttons */
.action-row { display: flex; gap: 15px; margin-top: 10px; }

.action-btn {
    height: 55px;
    border-radius: 16px;
    font-weight: 800;
    font-size: 12px;
    text-transform: uppercase;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    cursor: pointer;
    border: none;
    transition: transform 0.2s;
    letter-spacing: 0.5px;
}
.action-btn:active { transform: scale(0.96); }

.action-btn.call {
    flex: 1;
    background: #1a1a1a;
    color: white;
    border: 1px solid #333;
}
.action-btn.call:hover { background: #222; border-color: #555; }

.action-btn.pay {
    flex: 1;
    background: #FF5200;
    color: white;
    box-shadow: 0 4px 15px rgba(255, 82, 0, 0.3);
}

/* Nav */
.nav-header { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
.back-btn { background: #1a1a1a; border: none; color: white; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
.back-btn:hover { background: #333; }
.order-id { font-size: 11px; color: #666; font-weight: 700; margin-top: 4px; }
`;

const OrderTracker = () => {
    const { id } = useParams();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    // --- STATE ---
    const [order, setOrder] = useState(null);
    const [eta, setEta] = useState(25);
    const [callStatus, setCallStatus] = useState("Call Waiter"); 

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await axios.get(`${API_BASE}/orders/track/${id}`);
                setOrder(res.data);
            } catch (e) { console.error("Fetch Error:", e); }
        };

        fetchOrder();
        
        // Socket for Live Updates
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- HANDLER: CALL WAITER ---
    const handleCallWaiter = async () => {
        if (!order) return;
        setCallStatus("Requesting...");
        try {
            await axios.post(`${API_BASE}/orders/calls`, {
                restaurantId: order.owner,
                tableNumber: order.tableNumber,
                type: "help" // Generic help request
            });
            setCallStatus("Waiter Notified ✓");
            setTimeout(() => setCallStatus("Call Waiter"), 5000); // Reset after 5s
        } catch (e) {
            alert("Failed to notify staff.");
            setCallStatus("Call Waiter");
        }
    };

    // --- STAGES CONFIG ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheck /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaConciergeBell /> },
        { id: "SERVED", label: "Served", icon: <FaCheckCircle /> }
    ];

    if (!order) return (
        <>
            <style>{styles}</style>
            <div className="loading-screen">Syncing Order...</div>
        </>
    );

    // Logic for Stepper
    const currentStatus = order.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const activeIndex = stages.findIndex(s => s.id === normalizedStatus);
    const progressWidth = (activeIndex / (stages.length - 1)) * 100;

    const isPaid = order.paymentStatus === "Paid";
    const isCash = order.paymentMethod === "CASH";

    return (
        <>
            <style>{styles}</style>
            <div className="tracker-container">
                
                {/* 1. NAV HEADER */}
                <div className="nav-header">
                    <Link to={`/menu/${order.owner}/${order.tableNumber}`} className="back-btn">
                        <FaArrowLeft />
                    </Link>
                    <div>
                        <h1>Order Status</h1>
                        <div className="order-id">ID: #{order._id.slice(-6).toUpperCase()}</div>
                    </div>
                </div>

                {/* 2. ETA / STATUS CARD */}
                <div className="card">
                    <div style={{textAlign: 'center', padding: '10px 0'}}>
                        {currentStatus === "SERVED" ? (
                            <>
                                <div style={{color: '#22c55e', fontSize: '18px', fontWeight: '900', textTransform:'uppercase', marginBottom: '5px'}}>Order Completed</div>
                                <div className="sub-value">Served at Table {order.tableNumber}</div>
                            </>
                        ) : (
                            <>
                                <div className="label">Estimated Time</div>
                                <div className="value">{eta} mins</div>
                                <div className="sub-value">Kitchen is preparing your food</div>
                            </>
                        )}
                    </div>
                </div>

                {/* 3. STEPPER */}
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

                {/* 4. BILL SUMMARY */}
                <div className="card basket-card">
                    <div className="section-label">Order Details</div>
                    
                    {order.items.map((item, i) => (
                        <div key={i} className="basket-row">
                            <div>
                                <span className="b-qty">{item.quantity}x</span>
                                <span className="b-name">{item.name}</span>
                            </div>
                            <span className="b-price">₹{item.price * item.quantity}</span>
                        </div>
                    ))}

                    <div className="grand-total-row">
                        <div className="total-label">
                            {isPaid ? "Total Paid" : "Total To Pay"}
                        </div>
                        <div className={`final-price ${isPaid ? 'paid' : ''}`}>
                            ₹{order.totalAmount}
                        </div>
                    </div>
                    
                    {/* Cash Payment Notice */}
                    {isCash && !isPaid && (
                        <div style={{marginTop: '15px', background: '#222', padding: '12px', borderRadius: '12px', display:'flex', alignItems:'center', gap:'10px'}}>
                            <div style={{background:'#f97316', padding:'8px', borderRadius:'50%', display:'flex'}}><FaMoneyBillWave size={12}/></div>
                            <div>
                                <div style={{fontSize:'12px', fontWeight:'bold', color:'white'}}>Pay Cash at Counter</div>
                                <div style={{fontSize:'10px', color:'#888'}}>Please pay to finalize.</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. ACTIONS */}
                <div className="action-row">
                    <button onClick={handleCallWaiter} className="action-btn call">
                        <FaPhoneAlt /> {callStatus}
                    </button>
                    
                    {/* Optional: Add Download Receipt or another action here */}
                    <button className="action-btn pay" style={{background: '#222', border: '1px solid #333', color: '#888', cursor:'default'}}>
                        <FaClock /> Kitchen Live
                    </button>
                </div>

            </div>
        </>
    );
};

export default OrderTracker;