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

/**
 * OrderTracker Component
 * Premium real-time tracking interface for customers.
 * Handles Live Kitchen Updates, UPI deep-linking, and Staff Verification.
 */
const OrderTracker = () => {
    const { id } = useParams();
    
    // --- STATE ---
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState("pending"); 
    const [customerUpi, setCustomerUpi] = useState(""); 
    const [showPinPad, setShowPinPad] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    const [extraItem, setExtraItem] = useState(null); 
    const [eta, setEta] = useState(25); 

    // Mock Upsell Data
    const upsellItems = [
        { id: 101, name: "Choco Lava", price: 120, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&q=80" },
        { id: 102, name: "Gulab Jamun", price: 80, img: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=200&q=80" },
        { id: 103, name: "Vanilla Scoop", price: 60, img: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=200&q=80" }
    ];

    // --- 1. DATA FETCHING & SOCKETS ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
                // Set status based on Database state
                if(res.data.paymentStatus === 'Paid') {
                    setPaymentStatus("completed");
                }

                if(res.data && res.data.owner) {
                    const restRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${res.data.owner}`);
                    setRestaurant(restRes.data);
                }
            } catch (e) { 
                console.error("Fetch Error:", e); 
            }
        };

        fetchOrderDetails();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        
        // Listen for Real-time Approvals
        socket.on("payment-confirmed-by-staff", (data) => {
            if (data.orderId === id) handleSuccessfulPayment();
        });

        socket.on("payment-rejected-by-staff", (data) => {
            if (data.orderId === id) {
                setPaymentStatus("rejected");
                alert("Verification Failed. Please check with staff.");
            }
        });

        // Listen for Kitchen Progress
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- 2. DYNAMIC DEBT CALCULATION ---
    const isMainPaidInDB = order?.paymentStatus === 'Paid';
    const mainDebt = (isMainPaidInDB || paymentStatus === "completed") ? 0 : (order?.totalAmount || 0);
    const extraDebt = extraItem ? extraItem.price : 0;
    const totalPayableNow = mainDebt + extraDebt;

    // --- 3. HANDLERS ---
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
        const note = extraItem ? `Bill#${id.slice(-4)}+${extraItem.name}` : `Bill#${id.slice(-4)}`;
        const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${restaurant.username}&am=${totalPayableNow}&cu=INR&tn=${note}`;
        window.location.href = upiLink;
        setPaymentStatus("input_upi");
    };

    const handlePaymentSubmit = () => {
        if (customerUpi.length < 4) { alert("Enter last 4 digits of UTR"); return; }
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

    // UI Logic for Tracker Steps
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

    if (!order) return <div className="loading-screen">Syncing Kitchen Data...</div>;

    return (
        <div className="tracker-container">
            <header className="tracker-header">
                <h1>Order Tracker</h1>
                <p>Dining at {restaurant?.username || "Our Kitchen"}</p>
            </header>
            
            {/* Status Banners */}
            {paymentStatus === "verifying_bg" && (
                <div className="status-banner yellow">
                    <FaHourglassHalf className="spin-slow"/> 
                    <div>
                        <div style={{fontWeight:'bold'}}>Verifying Payment...</div>
                        <div style={{fontSize:'10px'}}>Staff is checking ₹{totalPayableNow}</div>
                    </div>
                </div>
            )}
            
            {paymentStatus === "completed" && totalPayableNow === 0 && (
                <div className="status-banner green"><FaCheckCircle /> Payment Verified. Order is live!</div>
            )}

            {/* Main Order Card */}
            <div className="card header-card">
                <div>
                    <div className="label">Order ID</div>
                    <div className="value">#{id.slice(-6).toUpperCase()}</div>
                    <div className="sub-value">Table {order.tableNumber}</div>
                </div>
                {currentStatus !== "SERVED" && <div className="eta-badge"><FaClock /> {eta} MINS</div>}
            </div>

            {/* Stepper */}
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

            {/* Upsell */}
            {currentStatus !== "SERVED" && (
                <div className="card-upsell">
                    <h3 className="section-title">Sweet Cravings?</h3>
                    <div className="cravings-list">
                        {upsellItems.map((item, idx) => (
                            <div key={idx} className="upsell-item">
                                <div className="upsell-left">
                                    <img src={item.img} alt="" className="upsell-img" />
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
                </div>
            )}

            {/* Payment Section */}
            {totalPayableNow > 0 && paymentStatus !== "verifying_bg" && (
                <div className="payment-root">
                    <h3 className="section-title">Scan to Pay</h3>
                    
                    {paymentStatus === "cash_mode" ? (
                        <div className="card cash-box">
                            {!showPinPad ? (
                                <>
                                    <h2 className="cash-amount">₹{totalPayableNow}</h2>
                                    <p className="cash-instruction">Please hand cash to the waiter.</p>
                                    <button className="waiter-pin-trigger" onClick={() => setShowPinPad(true)}>
                                        <FaLock size={12}/> Waiter Verification
                                    </button>
                                    <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>Pay Online</button>
                                </>
                            ) : (
                                <div className="pin-pad-container">
                                    <div className="pin-grid">
                                        {[1,2,3,4,5,6,7,8,9].map(num => (
                                            <button key={num} onClick={() => setWaiterPin(p => p.length < 6 ? p + num : p)}>{num}</button>
                                        ))}
                                        <button onClick={() => setWaiterPin("")}>C</button>
                                        <button onClick={() => setWaiterPin(p => p.length < 6 ? p + "0" : p)}>0</button>
                                        <button className="ok" onClick={verifyWaiterPin}>OK</button>
                                    </div>
                                    <button className="cancel-text-btn" onClick={() => {setShowPinPad(false); setWaiterPin("");}}>Back</button>
                                </div>
                            )}
                        </div>
                    ) : paymentStatus === "input_upi" || paymentStatus === "rejected" ? (
                        <div className="card verify-card">
                            <p className="verify-title">Verify UPI Transaction</p>
                            <input 
                                type="tel" maxLength="4" placeholder="Last 4 digits of UTR" 
                                value={customerUpi} 
                                onChange={(e) => setCustomerUpi(e.target.value.replace(/\D/g,''))} 
                                className="utr-input"
                            />
                            <button className="btn-primary" style={{width:'100%', padding:'18px', background:'#FF5200', border:'none', borderRadius:'15px', color:'white', fontWeight:'bold'}} onClick={handlePaymentSubmit}>Verify ₹{totalPayableNow}</button>
                            <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>Cancel</button>
                        </div>
                    ) : (
                        <div className="card payment-card">
                            <div className="qr-layout">
                                <div className="qr-box"><QRCodeSVG value={qrLink} size={90} /></div>
                                <div className="qr-info">
                                    <p className="price-large">₹{totalPayableNow}</p>
                                    <p className="upi-id">UPI ID: {restaurant?.upiId}</p>
                                </div>
                            </div>
                            <div className="payment-apps-row">
                                <button className="app-btn gpay" onClick={() => handleAppPayment("gpay")}><FaGoogle /> GPay</button>
                                <button className="app-btn phonepe" onClick={() => handleAppPayment("phonepe")}><FaMobileAlt /> PhonePe</button>
                            </div>
                            <div className="payment-apps-row" style={{marginTop:'10px'}}>
                                <button className="app-btn generic" onClick={() => handleAppPayment("generic")}><FaWallet /> Other</button>
                                <button className="app-btn cash" onClick={() => setPaymentStatus("cash_mode")}><FaMoneyBillWave /> Cash</button>
                            </div>
                            <button onClick={() => setPaymentStatus("input_upi")} className="verify-trigger-btn">Already Paid? Verify Here</button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Basket Summary */}
            <div className="card basket-card">
                <p className="section-label">Basket Items</p>
                <div className="basket-items-list">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="basket-row">
                            <div className="item-meta">
                                <span className="b-name">{item.name}</span>
                                <span className="b-qty">x{item.quantity}</span>
                            </div>
                            <span className="b-price">₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                    {extraItem && (
                        <div className="basket-row pending">
                            <div className="item-meta">
                                <span className="b-name">{extraItem.name}</span>
                                <span className="b-status">(New)</span>
                            </div>
                            <span className="b-price">₹{extraItem.price}</span>
                        </div>
                    )}
                </div>
                <div className="grand-total-row">
                    <span>Total Amount</span>
                    <span className="final-price">₹{totalPayableNow + (isMainPaidInDB ? order.totalAmount : 0)}</span>
                </div>
            </div>

            {/* Footer Buttons */}
            <div className="action-row">
                <button className="btn-download" onClick={() => alert("Digital Bill is generating...")}><FaDownload /> Digital Bill</button>
                <button className="btn-staff" onClick={() => alert("Staff called to table " + order.tableNumber)}><FaPhoneAlt /> Call Staff</button>
            </div>
            
            <Link to="/" className="back-link"><FaArrowLeft /> Return to Menu</Link>
        </div>
    );
};

export default OrderTracker;