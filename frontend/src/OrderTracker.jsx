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
    
    // Statuses: "pending", "input_upi", "cash_mode", "verifying_bg", "completed", "rejected"
    const [paymentStatus, setPaymentStatus] = useState("pending"); 
    const [customerUpi, setCustomerUpi] = useState(""); 
    
    // Waiter PIN State
    const [showPinPad, setShowPinPad] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    
    // Extra Item Logic (Upsell)
    const [extraItem, setExtraItem] = useState(null); 
    const [eta, setEta] = useState(25); 

    // Mock Upsell Data
    const upsellItems = [
        { id: 101, name: "Choco Lava", price: 120, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&q=80" },
        { id: 102, name: "Gulab Jamun", price: 80, img: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=200&q=80" },
        { id: 103, name: "Vanilla Scoop", price: 60, img: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=200&q=80" }
    ];

    // --- DATA FETCHING & SOCKETS ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
                // Set initial payment status based on DB
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
        
        // Listen for Real-time Staff Approvals
        socket.on("payment-confirmed-by-staff", (data) => {
            if (data.orderId === id) handleSuccessfulPayment();
        });

        socket.on("payment-rejected-by-staff", (data) => {
            if (data.orderId === id) {
                setPaymentStatus("rejected");
                alert("Verification Failed. Please check with staff.");
            }
        });

        // Listen for Kitchen Progress Updates
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- 💰 TOTAL CALCULATION LOGIC ---
    // If the main order is unpaid, mainDebt = order total. If paid, mainDebt = 0.
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

    if (!order) return <div className="loading-screen">Loading Your Experience...</div>;

    return (
        <div className="tracker-container">
            <header className="tracker-header">
                <h1>Order Tracker</h1>
                <p>Enjoy your meal at {restaurant?.username || "Our Kitchen"}</p>
            </header>
            
            {/* --- TOP STATUS BANNERS --- */}
            {paymentStatus === "verifying_bg" && (
                <div className="status-banner yellow">
                    <FaHourglassHalf className="spin-slow"/> 
                    <div>
                        <div style={{fontWeight:'bold'}}>Verifying Transaction</div>
                        <div style={{fontSize:'10px'}}>Staff is checking ₹{totalPayableNow}...</div>
                    </div>
                </div>
            )}
            
            {paymentStatus === "completed" && totalPayableNow === 0 && (
                <div className="status-banner green"><FaCheckCircle /> All Bills Paid. Thank you!</div>
            )}

            {/* ORDER HEADER */}
            <div className="card header-card">
                <div>
                    <div className="label">Order ID</div>
                    <div className="value">#{id.slice(-6).toUpperCase()}</div>
                    <div className="sub-value">Table {order.tableNumber}</div>
                </div>
                {currentStatus !== "SERVED" && <div className="eta-badge"><FaClock /> {eta} MINS</div>}
            </div>

            {/* PROGRESS STEPPER */}
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

            {/* UPSELL SECTION */}
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

            {/* PAYMENT COMPONENT - Only shows if debt exists */}
            {totalPayableNow > 0 && paymentStatus !== "verifying_bg" && (
                <div className="payment-root">
                    <div className="split-header">
                        <h3>Payable Amount: <span className="highlight-price">₹{totalPayableNow}</span></h3>
                    </div>

                    {paymentStatus === "cash_mode" ? (
                        <div className="card cash-box">
                            {!showPinPad ? (
                                <>
                                    <h2 className="cash-amount">₹{totalPayableNow}</h2>
                                    <p className="cash-instruction">Hand cash to the waiter.</p>
                                    <button className="waiter-pin-trigger" onClick={() => setShowPinPad(true)}>
                                        <FaLock size={12}/> Waiter PIN Verification
                                    </button>
                                    <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>
                                        Online Payment
                                    </button>
                                </>
                            ) : (
                                <div className="pin-pad-container">
                                    <h3>Staff Only</h3>
                                    <div className="pin-dots">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className={`dot ${waiterPin.length > i ? 'filled' : ''}`}></div>
                                        ))}
                                    </div>
                                    <div className="pin-grid">
                                        {[1,2,3,4,5,6,7,8,9].map(num => (
                                            <button key={num} onClick={() => setWaiterPin(p => p.length < 6 ? p + num : p)}>{num}</button>
                                        ))}
                                        <button className="clear" onClick={() => setWaiterPin("")}>C</button>
                                        <button onClick={() => setWaiterPin(p => p.length < 6 ? p + "0" : p)}>0</button>
                                        <button className="ok" onClick={verifyWaiterPin}>OK</button>
                                    </div>
                                    <button className="cancel-text-btn" onClick={() => {setShowPinPad(false); setWaiterPin("");}}>Back</button>
                                </div>
                            )}
                        </div>
                    ) : paymentStatus === "input_upi" || paymentStatus === "rejected" ? (
                        <div className="card verify-card">
                            {paymentStatus === "rejected" && <p className="err-txt">❌ Verification Failed</p>}
                            <p className="verify-title">Verify UPI Payment</p>
                            <input 
                                type="tel" maxLength="4" placeholder="Last 4 digits of UTR" 
                                value={customerUpi} 
                                onChange={(e) => setCustomerUpi(e.target.value.replace(/\D/g,''))} 
                                className="utr-input"
                            />
                            <button className="btn-primary" onClick={handlePaymentSubmit}>Confirm ₹{totalPayableNow}</button>
                            <button className="cancel-text-btn" onClick={() => setPaymentStatus("pending")}>Cancel</button>
                        </div>
                    ) : (
                        <div className="card payment-card">
                            <div className="payment-apps-row">
                                <button className="app-btn gpay" onClick={() => handleAppPayment("gpay")}><FaGoogle /> GPay</button>
                                <button className="app-btn phonepe" onClick={() => handleAppPayment("phonepe")}><FaMobileAlt /> PhonePe</button>
                            </div>
                            <div className="payment-apps-row" style={{marginTop:'10px'}}>
                                <button className="app-btn generic" onClick={() => handleAppPayment("generic")}><FaWallet /> UPI</button>
                                <button className="app-btn cash" onClick={() => setPaymentStatus("cash_mode")}><FaMoneyBillWave /> Cash</button>
                            </div>
                            <div className="divider-text">OR SCAN QR</div>
                            <div className="qr-layout">
                                <div className="qr-box"><QRCodeSVG value={qrLink} size={90} /></div>
                                <div className="qr-info">
                                    <p className="upi-id">{restaurant?.upiId}</p>
                                    <p className="qr-total">Pay: ₹{totalPayableNow}</p>
                                </div>
                            </div>
                            <button onClick={() => setPaymentStatus("input_upi")} className="verify-trigger-btn">Already Paid? Verify</button>
                        </div>
                    )}
                </div>
            )}
            
            {/* BASKET SUMMARY */}
            <div className="card basket-card">
                <p className="section-label">Order Summary</p>
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
                                <span className="b-status">(New Item)</span>
                            </div>
                            <span className="b-price">₹{extraItem.price}</span>
                        </div>
                    )}
                </div>
                <div className="grand-total-row">
                    <span>Grand Total</span>
                    <span className="final-price">₹{totalPayableNow + (isMainPaidInDB ? order.totalAmount : 0)}</span>
                </div>
            </div>

            <div className="action-row">
                <button className="action-btn download" onClick={() => alert("Bill downloading...")}><FaDownload /> Receipt</button>
                <button className="action-btn help" onClick={() => alert("Staff called!")}><FaPhoneAlt /> Staff</button>
            </div>
            
            <Link to="/" className="back-link"><FaArrowLeft /> Back to Menu</Link>
        </div>
    );
};

export default OrderTracker;