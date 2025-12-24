import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { QRCodeSVG } from "qrcode.react"; 
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaDownload, FaPhoneAlt, FaArrowLeft, FaPlus,
    FaGoogle, FaMobileAlt, FaWallet, 
    FaCheckCircle, FaHourglassHalf, FaMoneyBillWave, FaLock
} from "react-icons/fa";

import "./OrderTracker.css";

const OrderTracker = () => {
    const { id } = useParams();
    
    // --- STATE ---
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    
    // Payment Status: "pending", "input_upi", "cash_mode", "verifying_bg", "completed", "rejected"
    const [paymentStatus, setPaymentStatus] = useState("pending"); 
    const [customerUpi, setCustomerUpi] = useState(""); 
    
    // Waiter PIN State
    const [showPinPad, setShowPinPad] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    
    // Upsell Logic
    const [extraItem, setExtraItem] = useState(null); 
    const [eta, setEta] = useState(25); 

    // Mock Upsell Data
    const upsellItems = [
        { id: 101, name: "Choco Lava", price: 120, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&q=80" },
        { id: 102, name: "Gulab Jamun", price: 80, img: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=200&q=80" },
        { id: 103, name: "Vanilla Scoop", price: 60, img: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=200&q=80" }
    ];

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
                // If main order is paid, update local status
                if(res.data.paymentStatus === 'Paid') setPaymentStatus("completed");

                if(res.data && res.data.owner) {
                    const restRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${res.data.owner}`);
                    setRestaurant(restRes.data);
                }
            } catch (e) { console.error("Fetch error", e); }
        };

        fetchOrderDetails();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        
        // Listen for Staff Confirmation
        socket.on("payment-confirmed-by-staff", (data) => {
            if (data.orderId === id) handleSuccessfulPayment();
        });

        // Listen for Rejection
        socket.on("payment-rejected-by-staff", (data) => {
            if (data.orderId === id) {
                setPaymentStatus("rejected");
                alert("Payment Verification Failed. Please check transaction details.");
            }
        });

        // Listen for Kitchen Updates
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- CALCULATE TOTAL ---
    const isMainPaidInDB = order?.paymentStatus === 'Paid';
    const mainDebt = (isMainPaidInDB || paymentStatus === "completed") ? 0 : (order?.totalAmount || 0);
    const extraDebt = extraItem ? extraItem.price : 0;
    const totalPayableNow = mainDebt + extraDebt;

    // --- HANDLERS ---
    const handleSuccessfulPayment = () => {
        if(extraItem) {
            setOrder(prev => ({
                ...prev, 
                items: [...prev.items, { ...extraItem, quantity: 1 }],
                totalAmount: prev.totalAmount + extraItem.price,
                paymentStatus: 'Paid'
            }));
            setExtraItem(null);
        } else {
             setOrder(prev => ({ ...prev, paymentStatus: 'Paid' }));
        }
        setPaymentStatus("completed");
        setShowPinPad(false);
        setCustomerUpi("");
    };

    const handleAddUpsell = (item) => {
        setExtraItem(item);
        if(paymentStatus === "completed") setPaymentStatus("pending");
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    };

    const handleAppPayment = (appName) => {
        if (!order || !restaurant) return;
        const note = `Order #${id.slice(-4)}`;
        const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${restaurant.username}&am=${totalPayableNow}&cu=INR&tn=${note}`;
        window.location.href = upiLink;
        setPaymentStatus("input_upi");
    };

    const handlePaymentSubmit = () => {
        if (customerUpi.length < 4) { alert("Please enter the last 4 digits of UTR"); return; }
        setPaymentStatus("verifying_bg");
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.emit("customer-payment-claim", { 
            orderId: id, 
            amount: totalPayableNow,
            customerUpi: customerUpi, 
            extraItemName: extraItem ? extraItem.name : null 
        });
    };

    const verifyWaiterPin = () => {
        if (waiterPin === "bb1972") {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("staff-cash-collected", { 
                orderId: id, 
                amount: totalPayableNow,
                collectedBy: "Staff_PIN",
                extraItemName: extraItem ? extraItem.name : null 
            });
            handleSuccessfulPayment();
        } else {
            alert("❌ Incorrect PIN");
            setWaiterPin("");
        }
    };

    // --- UI HELPERS ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheck /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaClock /> },
        { id: "SERVED", label: "Served", icon: <FaConciergeBell /> }
    ];
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const currentStepIndex = stages.findIndex(s => s.id === normalizedStatus);
    const qrLink = `upi://pay?pa=${restaurant?.upiId}&pn=Resto&am=${totalPayableNow}&cu=INR`;

    if (!order) return <div className="loading-screen">Loading Order...</div>;

    return (
        <div className="tracker-container">
            <h1 style={{margin: '0 0 5px 0', fontSize:'28px'}}>Order Tracker</h1>
            
            {/* 1. INFO CARD */}
            <div className="card header-card">
                <div>
                    <div className="label">Order ID: #{id.slice(-6).toUpperCase()}</div>
                    <div className="value">Table: {order.tableNumber}</div>
                </div>
                {currentStatus !== "SERVED" && <div className="eta-badge"><FaClock /> ETA: {eta} mins</div>}
            </div>

            {/* 2. PROGRESS STEPPER */}
            <div className="stepper-wrapper">
                <div className="progress-bg"></div>
                <div className="progress-fill" style={{ width: `${(currentStepIndex / (stages.length - 1)) * 100}%` }}></div>
                {stages.map((stage, index) => {
                    const isActive = index <= currentStepIndex;
                    return (
                        <div key={stage.id} className="step-item">
                            <div className={`step-icon ${isActive ? 'active' : ''}`}>{stage.icon}</div>
                            <div className={`step-label ${isActive ? 'active' : ''}`}>{stage.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* 3. SWEET CRAVINGS (Upsell) */}
            {currentStatus !== "SERVED" && (
                <>
                    <h3 className="section-title">Sweet Cravings?</h3>
                    <div className="cravings-list">
                        {upsellItems.map((item, idx) => (
                            <div key={idx} className="upsell-item">
                                <div className="upsell-left">
                                    <img src={item.img} alt={item.name} className="upsell-img" />
                                    <div className="upsell-info">
                                        <p className="item-name">{item.name}</p>
                                        <p className="item-price">₹{item.price}</p>
                                    </div>
                                </div>
                                <button className="add-btn" onClick={() => handleAddUpsell(item)}>
                                    <FaPlus size={10}/> Add
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* 4. PAYMENT SECTION (Shows if there is debt) */}
            {totalPayableNow > 0 && paymentStatus !== "verifying_bg" && (
                <div className="payment-root">
                    <h3 className="section-title">Scan to Pay</h3>
                    
                    {/* MODE: CASH */}
                    {paymentStatus === "cash_mode" ? (
                        <div className="card cash-box">
                            {!showPinPad ? (
                                <>
                                    <h2 className="cash-amount">₹{totalPayableNow}</h2>
                                    <p className="cash-instruction">Hand cash to waiter.</p>
                                    <button className="waiter-pin-trigger" onClick={() => setShowPinPad(true)}>
                                        <FaLock size={12}/> Staff Confirm
                                    </button>
                                    <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>Cancel</button>
                                </>
                            ) : (
                                <div className="pin-pad-container">
                                    <h3>Staff Verification</h3>
                                    <div className="pin-grid">
                                        {[1,2,3,4,5,6,7,8,9].map(num => (
                                            <button key={num} className="pin-btn" onClick={() => setWaiterPin(p => p.length < 4 ? p + num : p)}>{num}</button>
                                        ))}
                                        <button className="pin-btn clear" onClick={() => setWaiterPin("")}>C</button>
                                        <button className="pin-btn" onClick={() => setWaiterPin(p => p.length < 4 ? p + "0" : p)}>0</button>
                                        <button className="pin-btn ok" onClick={verifyWaiterPin}>OK</button>
                                    </div>
                                    <button className="cancel-text-btn" onClick={() => {setShowPinPad(false); setWaiterPin("");}}>Back</button>
                                </div>
                            )}
                        </div>
                    ) : paymentStatus === "input_upi" || paymentStatus === "rejected" ? (
                        /* MODE: UTR INPUT */
                        <div className="card verify-card">
                            {paymentStatus === "rejected" && <p style={{color:'red', textAlign:'center', fontSize:'12px'}}>❌ Verification Failed</p>}
                            <p className="verify-title">Enter Payment Ref (UTR)</p>
                            <input 
                                type="tel" maxLength="4" placeholder="Last 4 digits" 
                                value={customerUpi} 
                                onChange={(e) => setCustomerUpi(e.target.value.replace(/\D/g,''))} 
                                className="utr-input"
                            />
                            <button className="btn-primary" onClick={handlePaymentSubmit}>Verify ₹{totalPayableNow}</button>
                            <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>Cancel</button>
                        </div>
                    ) : (
                        /* MODE: MAIN PAYMENT SCREEN */
                        <div className="card payment-card">
                            <div className="qr-layout">
                                <div className="qr-box"><QRCodeSVG value={qrLink} size={85} /></div>
                                <div className="qr-info">
                                    <p className="price-large">₹{totalPayableNow}</p>
                                    <p className="upi-id">{restaurant?.upiId}</p>
                                </div>
                            </div>

                            {/* PAYMENT BUTTONS (RESTORED) */}
                            <div className="payment-apps-row">
                                <button className="app-btn gpay" onClick={() => handleAppPayment("gpay")}><FaGoogle /> GPay</button>
                                <button className="app-btn phonepe" onClick={() => handleAppPayment("phonepe")}><FaMobileAlt /> PhonePe</button>
                            </div>
                            <div className="payment-apps-row" style={{marginTop:'10px'}}>
                                <button className="app-btn generic" onClick={() => handleAppPayment("generic")}><FaWallet /> Other</button>
                                <button className="app-btn cash" onClick={() => setPaymentStatus("cash_mode")}><FaMoneyBillWave /> Cash</button>
                            </div>

                            <button onClick={() => setPaymentStatus("input_upi")} className="verify-trigger-btn">
                                Already Paid? Enter UTR
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 5. FOOTER ACTIONS */}
            <div className="action-row">
                <button className="btn-download" onClick={() => alert("Downloading Bill...")}><FaDownload /> Download Bill</button>
                <button className="btn-staff" onClick={() => alert("Staff Called")}><FaPhoneAlt /> Call Staff</button>
            </div>

            {/* 6. BASKET SUMMARY */}
            <div className="card basket-card">
                <p className="label">Your Basket</p>
                <div className="basket-items-list">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="basket-row">
                            <span className="b-name">{item.name} <span className="b-qty">x{item.quantity}</span></span>
                            <span className="b-price">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {extraItem && (
                        <div className="basket-row pending">
                            <span className="b-name">{extraItem.name} <span className="b-status">(Adding)</span></span>
                            <span className="b-price">₹{extraItem.price}</span>
                        </div>
                    )}
                </div>
                <div className="grand-total-row">
                    <span>Grand Total</span>
                    <span className="final-price">₹{totalPayableNow + (isMainPaidInDB ? order.totalAmount : 0)}</span>
                </div>
            </div>

            <Link to="/" className="back-link"><FaArrowLeft /> Back to Menu</Link>
        </div>
    );
};

export default OrderTracker;