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
    
    // Payment Status Options: "pending", "input_upi", "cash_mode", "verifying_bg", "completed", "rejected"
    const [paymentStatus, setPaymentStatus] = useState("pending"); 
    const [customerUpi, setCustomerUpi] = useState(""); 
    
    // Waiter PIN State
    const [showPinPad, setShowPinPad] = useState(false);
    const [waiterPin, setWaiterPin] = useState("");
    
    // Extra Item Logic
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
            } catch (e) { console.error(e); }
        };

        fetchOrderDetails();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        
        // Listen for Approval
        socket.on("payment-confirmed-by-staff", (data) => {
            if (data.orderId === id) {
                handleSuccessfulPayment();
            }
        });

        // Listen for Rejection
        socket.on("payment-rejected-by-staff", (data) => {
            if (data.orderId === id) {
                setPaymentStatus("rejected");
                alert("Payment Verification Failed. Please check transaction details.");
            }
        });

        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id, extraItem]);

    // --- HELPER: CALCULATE TOTAL ---
    // This solves the "Skipping" issue. It sums up everything owed.
    const isMainPaid = order?.paymentStatus === 'Paid' || paymentStatus === 'completed';
    const mainDebt = isMainPaid ? 0 : order?.totalAmount || 0;
    const extraDebt = extraItem ? extraItem.price : 0;
    const totalPayable = mainDebt + extraDebt;

    // --- HELPER FUNCTIONS ---

    const handleSuccessfulPayment = () => {
        if(extraItem) {
            // Add extra item to list visually
            setOrder(prev => ({
                ...prev, 
                items: [...prev.items, { ...extraItem, quantity: 1 }],
                totalAmount: prev.totalAmount + extraItem.price,
                paymentStatus: 'Paid' // Ensure we mark as paid locally
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
        setPaymentStatus("pending"); 
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    };

    const handleAppPayment = (appName) => {
        if (!order || !restaurant) return;
        
        const note = extraItem ? `Order #${id.slice(-4)} + ${extraItem.name}` : `Order #${id.slice(-4)}`;
        const upiLink = `upi://pay?pa=${restaurant.upiId}&pn=${restaurant.username}&am=${totalPayable}&cu=INR&tn=${note}`;
        
        window.location.href = upiLink;
        setPaymentStatus("input_upi");
    };

    const handlePaymentSubmit = () => {
        if (!customerUpi.trim()) { alert("Please enter the last 4 digits of UTR"); return; }
        
        setPaymentStatus("verifying_bg");
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        // Sends TOTAL amount + Extra item details
        socket.emit("customer-payment-claim", { 
            orderId: id, 
            amount: totalPayable, // Sending Grand Total
            customerUpi: customerUpi, 
            extraItemName: extraItem ? extraItem.name : null 
        });
    };

    const verifyWaiterPin = () => {
        // Waiter PIN check (e.g., 1234)
        if (waiterPin === "1234") {
            const socket = io("https://smart-menu-backend-5ge7.onrender.com");
            socket.emit("staff-cash-collected", { 
                orderId: id, 
                amount: totalPayable, // Waiter collected EVERYTHING
                collectedBy: "Waiter_PIN",
                extraItemName: extraItem ? extraItem.name : null // Add item if it was pending
            });
            
            handleSuccessfulPayment();
            alert(`Confirmed receipt of ₹${totalPayable} Cash`);
        } else {
            alert("❌ Incorrect PIN");
            setWaiterPin("");
        }
    };

    const generateCustomerReceipt = () => { alert("Downloading Receipt..."); };

    // --- UI CALCULATIONS ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheck /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaClock /> },
        { id: "SERVED", label: "Served", icon: <FaConciergeBell /> }
    ];
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const currentStepIndex = stages.findIndex(s => s.id === normalizedStatus);
    
    const qrLink = `upi://pay?pa=${restaurant?.upiId}&pn=Resto&am=${totalPayable}&cu=INR`;

    if (!order) return <div className="loading-screen">Loading Order...</div>;

    // Show payment section if there is ANY debt (Main or Extra)
    const showPaymentSection = totalPayable > 0 && paymentStatus !== "verifying_bg";

    return (
        <div className="tracker-container">
            <h1>Order Tracker</h1>
            
            {/* --- STATUS BANNERS --- */}
            {paymentStatus === "verifying_bg" && (
                <div className="status-banner yellow">
                    <FaHourglassHalf className="spin-slow"/> 
                    <div>
                        <div style={{fontWeight:'bold'}}>Payment Submitted</div>
                        <div style={{fontSize:'10px'}}>Staff is verifying... (Food is being prepared)</div>
                    </div>
                </div>
            )}
            
            {paymentStatus === "completed" && totalPayable === 0 && (
                <div className="status-banner green"><FaCheckCircle /> Payment Received!</div>
            )}

            {/* HEADER CARD */}
            <div className="card header-card">
                <div>
                    <div className="label">Order ID</div>
                    <div className="value">#{id.slice(-6).toUpperCase()}</div>
                    <div className="sub-value">Table {order.tableNumber}</div>
                </div>
                {currentStatus !== "SERVED" && <div className="eta-badge"><FaClock /> {eta} MINS</div>}
            </div>

            {/* TRACKER */}
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

            {/* UPSELLS */}
            {currentStatus !== "SERVED" && (
                <>
                    <h3>Sweet Cravings?</h3>
                    <div className="cravings-list">
                        {upsellItems.map((item, idx) => (
                            <div key={idx} className="upsell-item">
                                <div className="upsell-left">
                                    <img src={item.img} alt={item.name} className="upsell-img" />
                                    <div className="upsell-info"><p className="item-name">{item.name}</p><p className="item-price">₹{item.price}</p></div>
                                </div>
                                <button className="add-btn" onClick={() => handleAddUpsell(item)}><FaPlus size={10}/> Add</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* PAYMENT SECTION */}
            {showPaymentSection && (
                <>
                    <div className="split-header">
                        <h3>
                            Total Payable: <span style={{color: '#FF5200', marginLeft:'5px'}}>₹{totalPayable}</span>
                        </h3>
                    </div>

                    {/* --- MODE 1: CASH / WAITER PIN --- */}
                    {paymentStatus === "cash_mode" ? (
                        <div className="card" style={{padding: '30px', textAlign: 'center', border: '2px dashed #fff'}}>
                            {!showPinPad ? (
                                <>
                                    <h2 style={{margin: '0 0 10px 0', color: '#FF5200'}}>₹{totalPayable}</h2>
                                    <p style={{fontSize: '12px', color: '#aaa', marginBottom: '20px'}}>Please hand cash to the waiter.</p>
                                    
                                    <button 
                                        onClick={() => setShowPinPad(true)}
                                        style={{background:'#333', border:'1px solid #555', padding:'12px', borderRadius:'10px', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', color:'white', fontWeight:'bold'}}
                                    >
                                        <FaLock size={12}/> Staff Only: Confirm Receipt
                                    </button>

                                    <button style={{background:'transparent', border:'none', color:'#FF5200', textDecoration:'underline', marginTop:'20px', fontSize:'12px'}} onClick={() => setPaymentStatus("pending")}>
                                        Cancel / Pay Online
                                    </button>
                                </>
                            ) : (
                                /* PIN PAD */
                                <div>
                                    <h3 style={{marginBottom:'15px'}}>Enter Staff PIN</h3>
                                    <div style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'20px'}}>
                                        {[1,2,3,4].map((_, i) => (
                                            <div key={i} style={{width:'15px', height:'15px', borderRadius:'50%', background: waiterPin.length > i ? '#FF5200' : '#333', border:'1px solid #555'}}></div>
                                        ))}
                                    </div>
                                    <div className="pin-grid">
                                        {[1,2,3,4,5,6,7,8,9].map(num => (
                                            <button key={num} className="pin-btn" onClick={() => setWaiterPin(prev => (prev.length < 4 ? prev + num : prev))}>{num}</button>
                                        ))}
                                        <button className="pin-btn" style={{color:'#FF5200'}} onClick={() => setWaiterPin("")}>C</button>
                                        <button className="pin-btn" onClick={() => setWaiterPin(prev => (prev.length < 4 ? prev + "0" : prev))}>0</button>
                                        <button className="pin-btn" style={{background:'#FF5200', color:'white'}} onClick={verifyWaiterPin}>OK</button>
                                    </div>
                                    <button style={{marginTop:'15px', background:'transparent', border:'none', color:'#888', fontSize:'12px'}} onClick={() => {setShowPinPad(false); setWaiterPin("");}}>Cancel</button>
                                </div>
                            )}
                        </div>
                    ) : paymentStatus === "input_upi" || paymentStatus === "rejected" ? (
                        /* --- MODE 2: UTR INPUT (ONLINE) --- */
                        <div className="card" style={{padding: '20px', border: paymentStatus === 'rejected' ? '1px solid red' : '1px solid #FF5200'}}>
                            {paymentStatus === "rejected" && <p style={{color: 'red', fontSize:'12px', marginBottom:'10px', textAlign:'center'}}>❌ Failed. Check Transaction ID.</p>}
                            <p style={{textAlign:'center', fontSize:'14px'}}>Verify Payment for <b>₹{totalPayable}</b></p>
                            <p style={{fontSize:'11px', color:'#aaa', marginBottom:'5px'}}>Enter last 4 digits of UTR / Transaction ID:</p>
                            
                            <input 
                                type="tel" maxLength="4" placeholder="e.g. 8821" 
                                value={customerUpi} 
                                onChange={(e) => setCustomerUpi(e.target.value.replace(/\D/g,''))} 
                                className="upi-input-field" 
                                style={{fontSize: '20px', letterSpacing: '5px'}} 
                            />
                            
                            <button className="btn-download" onClick={handlePaymentSubmit} style={{width: '100%', marginTop: '15px'}}>{paymentStatus === 'rejected' ? "Retry" : "Verify Payment"}</button>
                            <button style={{background:'none', border:'none', color:'#aaa', width:'100%', marginTop:'10px', fontSize:'12px'}} onClick={() => { setExtraItem(null); setPaymentStatus("pending"); }}>Cancel</button>
                        </div>
                    ) : (
                        /* --- MODE 3: MENU --- */
                        <div className="card payment-card">
                            <div className="payment-apps-row">
                                <button className="app-btn gpay" onClick={() => handleAppPayment("gpay")}><FaGoogle /> GPay</button>
                                <button className="app-btn phonepe" onClick={() => handleAppPayment("phonepe")}><FaMobileAlt /> PhonePe</button>
                            </div>
                            <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                                <button className="app-btn fampay" style={{margin:0}} onClick={() => handleAppPayment("generic")}><FaWallet /> Other</button>
                                <button className="app-btn" style={{margin:0, background: '#333', border: '1px solid #555'}} onClick={() => setPaymentStatus("cash_mode")}><FaMoneyBillWave /> Cash</button>
                            </div>
                            <div className="divider-text">OR SCAN QR</div>
                            <div className="qr-layout">
                                <div className="qr-box"><QRCodeSVG value={qrLink} size={85} /></div>
                                <div className="qr-info"><p style={{color: '#fff', fontWeight: 'bold'}}>{restaurant?.upiId}</p><p className="total-items-count">Total: ₹{totalPayable}</p></div>
                            </div>
                            <button onClick={() => setPaymentStatus("input_upi")} style={{marginTop:'15px', background:'#333', color:'#fff', border:'1px solid #555', padding:'10px', borderRadius:'10px', width:'100%'}}>Verify Online Payment</button>
                        </div>
                    )}
                </>
            )}
            
            {/* Basket Section */}
            <div className="card">
                <p className="label" style={{marginBottom: '15px'}}>Your Basket</p>
                {order.items.map((item, idx) => (
                    <div key={idx} className="basket-item">
                        <div><div className="basket-name">{item.name}</div><div className="basket-qty">Qty: {item.quantity}</div></div>
                        <div className="basket-price">₹{item.price * item.quantity}</div>
                    </div>
                ))}
                {extraItem && (
                    <div className="basket-item" style={{opacity: 0.6}}>
                        <div><div className="basket-name">{extraItem.name} (Pending)</div><div className="basket-qty">Qty: 1</div></div>
                        <div className="basket-price">₹{extraItem.price}</div>
                    </div>
                )}
                <div className="total-row">
                    <span className="grand-total-label">Grand Total</span>
                    <span className="total-price">₹{totalPayable + (isMainPaid ? order.totalAmount : 0)}</span>
                </div>
            </div>

            <div className="action-row">
                <button className="btn-download" onClick={generateCustomerReceipt}><FaDownload /> Digital Bill</button>
                <button className="btn-staff" onClick={() => alert("Staff Notified!")}><FaPhoneAlt /> Staff</button>
            </div>
            
             <Link to="/" className="footer-link"><FaArrowLeft /> Back to Menu</Link>
        </div>
    );
};

export default OrderTracker;