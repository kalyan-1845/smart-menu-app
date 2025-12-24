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
    const [paymentStatus, setPaymentStatus] = useState("pending"); 
    const [customerUpi, setCustomerUpi] = useState(""); 
    const [showPinPad, setShowPinPad] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    const [extraItem, setExtraItem] = useState(null); 
    const [eta, setEta] = useState(25); 

    // Upsell Data matching your screenshot
    const upsellItems = [
        { id: 101, name: "Choco Lava", price: 120, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&q=80" },
        { id: 102, name: "Gulab Jamun", price: 80, img: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=200&q=80" },
        { id: 103, name: "Vanilla Scoop", price: 60, img: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=200&q=80" }
    ];

    // --- 1. DATA FETCHING & REAL-TIME SOCKETS ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
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
        
        // Listen for Staff Confirmation
        socket.on("payment-confirmed-by-staff", (data) => {
            if (data.orderId === id) handleSuccessfulPayment();
        });

        // Listen for Kitchen Progress Updates
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- 2. CALCULATE TOTALS ---
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
    };

    const handleAddUpsell = (item) => {
        setExtraItem(item);
        if(paymentStatus === "completed") setPaymentStatus("pending");
    };

    const handleAppPayment = (appName) => {
        if (!order || !restaurant) return;
        const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${restaurant.username}&am=${totalPayableNow}&cu=INR&tn=Bill#${id.slice(-4)}`;
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
            customerUpi: customerUpi 
        });
    };

    const verifyWaiterPin = () => {
        if (waiterPin === "bb1972") { 
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("staff-cash-collected", { orderId: id, amount: totalPayableNow });
            handleSuccessfulPayment();
        } else {
            alert("❌ Incorrect PIN");
            setWaiterPin("");
        }
    };

    // UI Formatting for Tracker Steps
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const isActive = (step) => ["PLACED", "COOKING", "READY", "SERVED"].indexOf(currentStatus) >= step;

    if (!order) return <div className="loading-screen">Syncing Kitchen...</div>;

    return (
        <div className="tracker-container">
            <h1 className="main-title">Order Tracker</h1>

            {/* ORDER INFO CARD */}
            <div className="info-card">
                <div className="flex-between">
                    <div>
                        <p className="label">ORDER ID</p>
                        <h2 className="order-id">#{order._id.slice(-6).toUpperCase()}</h2>
                        <p className="label">Table {order.tableNumber}</p>
                    </div>
                    <div className="eta-box">
                        <FaClock /> {eta} MINS
                    </div>
                </div>
            </div>

            {/* PROGRESS STEPPER */}
            <div className="stepper">
                <div className="step-item">
                    <div className={`step-circle ${isActive(0) ? 'active' : ''}`}><FaCheck /></div>
                    <span className={`step-label ${isActive(0) ? 'active' : ''}`}>CONFIRMED</span>
                </div>
                <div className="step-item">
                    <div className={`step-circle ${isActive(1) ? 'active' : ''}`}><FaUtensils /></div>
                    <span className={`step-label ${isActive(1) ? 'active' : ''}`}>COOKING</span>
                </div>
                <div className={`step-item`}>
                    <div className={`step-circle ${isActive(2) ? 'active' : ''}`}><FaClock /></div>
                    <span className={`step-label ${isActive(2) ? 'active' : ''}`}>READY</span>
                </div>
                <div className={`step-item`}>
                    <div className={`step-circle ${isActive(3) ? 'active' : ''}`}><FaConciergeBell /></div>
                    <span className={`step-label ${isActive(3) ? 'active' : ''}`}>SERVED</span>
                </div>
            </div>

            {/* SWEET CRAVINGS SECTION */}
            <h3 className="section-title">Sweet Cravings?</h3>
            {upsellItems.map(item => (
                <div key={item.id} className="upsell-card">
                    <img src={item.img} alt="" className="upsell-img" />
                    <div style={{ flex: 1 }}>
                        <p className="item-name">{item.name}</p>
                        <p className="orange-text">₹{item.price}</p>
                    </div>
                    <button className="add-btn" onClick={() => handleAddUpsell(item)}><FaPlus /> Add</button>
                </div>
            ))}

            {/* SCAN TO PAY SECTION */}
            <div className="qr-section">
                <div className="flex-between">
                    <h3 className="section-title">Scan to Pay</h3>
                    <button className="split-btn">Split Bill</button>
                </div>
                
                {paymentStatus === "completed" && totalPayableNow === 0 ? (
                    <div className="status-banner green"><FaCheckCircle /> All Bills Paid</div>
                ) : (
                    <div className="qr-card">
                        <QRCodeSVG value={`upi://pay?pa=${restaurant?.upiId}&am=${totalPayableNow}`} size={100} />
                        <div>
                            <h1 className="qr-price">₹{totalPayableNow}</h1>
                            <p className="label">UPI ID: {restaurant?.upiId}</p>
                            <div className="payment-apps">
                                <FaGoogle onClick={() => handleAppPayment()} />
                                <FaMobileAlt onClick={() => handleAppPayment()} />
                                <FaWallet onClick={() => setPaymentStatus("cash_mode")} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIONS */}
            <div className="action-buttons">
                <button className="btn-staff" onClick={() => setShowPinPad(true)}><FaLock /> Waiter PIN</button>
                <Link to="/" className="back-link"><FaArrowLeft /> Order More</Link>
            </div>

            {/* WAITER PIN MODAL */}
            {showPinPad && (
                <div className="pin-overlay">
                    <div className="pin-modal">
                        <h3>Staff Verification</h3>
                        <input 
                            type="password" 
                            placeholder="Enter PIN" 
                            value={waiterPin}
                            onChange={(e) => setWaiterPin(e.target.value)}
                        />
                        <button onClick={verifyWaiterPin}>Confirm Payment</button>
                        <button onClick={() => setShowPinPad(false)} className="close-btn">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderTracker;