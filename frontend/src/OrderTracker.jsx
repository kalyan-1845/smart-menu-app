import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { QRCodeSVG } from "qrcode.react"; 
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaDownload, FaPhoneAlt, FaArrowLeft, FaPlus,
    FaCalculator, FaUserFriends, FaStar
} from "react-icons/fa";

const OrderTracker = () => {
    const { id } = useParams();
    
    // --- STATE ---
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
    const [submitted, setSubmitted] = useState(false);
    const [showSplit, setShowSplit] = useState(false);
    const [splitCount, setSplitCount] = useState(2);
    const [eta, setEta] = useState(25); 

    // --- MOCK UPSELL DATA ---
    const upsellItems = [
        { name: "Choco Lava", price: 120, img: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=200&q=80" },
        { name: "Gulab Jamun", price: 80, img: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=200&q=80" },
        { name: "Vanilla Scoop", price: 60, img: "https://images.unsplash.com/photo-1560008581-09826d1de69e?w=200&q=80" }
    ];

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Replace with your actual API calls
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                const restRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${res.data.owner}`);
                setRestaurant(restRes.data);
            } catch (e) { 
                console.error(e); 
            }
        };
        fetchOrderDetails();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });
        return () => socket.disconnect();
    }, [id]);

    // --- LOGIC ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheck /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaClock /> },
        { id: "SERVED", label: "Served", icon: <FaConciergeBell /> }
    ];

    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const currentStepIndex = stages.findIndex(s => s.id === currentStatus || (currentStatus === "COOKING" && s.id === "PREPARING"));
    const upiLink = `upi://pay?pa=${restaurant?.upiId}&pn=${restaurant?.username}&am=${order?.totalAmount}&cu=INR`;

    if (!order) return <div style={{background: '#000', height: '100vh', color: '#FF5200', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;

    return (
        <div className="tracker-container">
            {/* --- CSS STYLES (Embedded for Instant Styling) --- */}
            <style>{`
                /* Base Reset */
                .tracker-container {
                    background-color: #050505;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    color: white;
                    padding: 20px;
                    padding-bottom: 50px;
                    max-width: 480px;
                    margin: 0 auto;
                }
                
                /* Headings */
                h1 { font-size: 24px; font-weight: 700; margin: 0 0 15px 0; }
                h3 { font-size: 16px; font-weight: 700; margin: 0 0 10px 0; color: #e5e5e5; }
                
                /* Cards */
                .card {
                    background-color: #121212;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    padding: 20px;
                    margin-bottom: 25px;
                    position: relative;
                    overflow: hidden;
                }

                /* 1. Header Card Layout */
                .header-card {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #888; font-weight: 700; margin-bottom: 4px; }
                .value { font-size: 16px; font-weight: 600; }
                .eta-badge {
                    background: rgba(255, 82, 0, 0.1);
                    border: 1px solid rgba(255, 82, 0, 0.3);
                    color: #FF5200;
                    padding: 6px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                /* 2. Stepper Layout */
                .stepper-wrapper {
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 10px 10px 30px 10px;
                }
                .progress-bg { position: absolute; top: 15px; left: 0; width: 100%; height: 3px; background: #333; z-index: 0; }
                .progress-fill { position: absolute; top: 15px; left: 0; height: 3px; background: linear-gradient(90deg, #d34400, #FF5200); z-index: 0; transition: width 0.5s ease; box-shadow: 0 0 10px #FF5200; }
                .step-item { z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; width: 50px; }
                .step-icon {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    background: #121212;
                    border: 2px solid #444;
                    color: #666;
                    display: flex; alignItems: center; justifyContent: center;
                    font-size: 12px;
                    transition: all 0.3s;
                }
                .step-icon.active {
                    border-color: #FF5200;
                    color: #FF5200;
                    background: #1a1a1a;
                    box-shadow: 0 0 15px rgba(255, 82, 0, 0.4);
                    transform: scale(1.1);
                }
                .step-label { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #666; }
                .step-label.active { color: white; }

                /* 3. Sweet Cravings List */
                .upsell-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #181818;
                    border: 1px solid rgba(255,255,255,0.05);
                    padding: 10px;
                    border-radius: 16px;
                    margin-bottom: 10px;
                }
                .upsell-left { display: flex; align-items: center; gap: 12px; }
                .upsell-img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
                .upsell-info p { margin: 0; }
                .add-btn {
                    background: #FF5200;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 800;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 4px;
                }

                /* 4. Scan To Pay Layout */
                .split-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
                .split-toggle { 
                    background: rgba(255,255,255,0.1); border: none; color: #ccc; 
                    padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                }
                .qr-layout { display: flex; gap: 15px; align-items: center; }
                .qr-box { background: white; padding: 8px; border-radius: 12px; }
                .price-large { font-size: 28px; font-weight: 800; margin: 0; line-height: 1; }
                .split-controls { display: flex; align-items: center; gap: 10px; margin: 10px 0; }
                .control-btn { width: 25px; height: 25px; border-radius: 5px; background: #333; color: white; border: none; font-weight: bold; }

                /* 5. Bottom Buttons */
                .action-row { display: flex; gap: 10px; margin-bottom: 25px; }
                .btn-download {
                    flex: 2;
                    background: #FF5200;
                    color: white;
                    height: 50px;
                    border: none;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(255, 82, 0, 0.3);
                }
                .btn-staff {
                    flex: 1;
                    background: #1a1a1a;
                    color: #FF5200;
                    height: 50px;
                    border: 1px solid rgba(255, 82, 0, 0.3);
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 12px;
                    text-transform: uppercase;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    cursor: pointer;
                }

                /* 6. Basket Summary */
                .basket-item { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #222; padding-bottom: 10px; }
                .total-row { display: flex; justify-content: space-between; margin-top: 15px; border-top: 1px dashed #333; padding-top: 15px; }
                .total-price { color: #FF5200; font-size: 20px; font-weight: 900; }

                /* Footer */
                .footer-link { display: flex; align-items: center; justify-content: center; gap: 8px; color: #666; text-decoration: none; font-size: 12px; font-weight: 700; text-transform: uppercase; }
            `}</style>

            {/* --- 1. HEADER CARD --- */}
            <h1>Order Tracker</h1>
            <div className="card header-card">
                <div>
                    <div className="label">Order ID</div>
                    <div className="value">#{id.slice(-6).toUpperCase()}</div>
                    <div style={{color: '#888', fontSize: '12px', marginTop: '4px'}}>Table {order.tableNumber}</div>
                </div>
                {currentStatus !== "SERVED" && (
                    <div className="eta-badge">
                        <FaClock /> {eta} MINS
                    </div>
                )}
            </div>

            {/* --- 2. STEPPER (TRACKING) --- */}
            <div className="stepper-wrapper">
                <div className="progress-bg"></div>
                <div className="progress-fill" style={{ width: `${(currentStepIndex / (stages.length - 1)) * 100}%` }}></div>
                {stages.map((stage, index) => {
                    const isActive = index <= currentStepIndex;
                    return (
                        <div key={stage.id} className="step-item">
                            <div className={`step-icon ${isActive ? 'active' : ''}`}>
                                {stage.icon}
                            </div>
                            <div className={`step-label ${isActive ? 'active' : ''}`}>{stage.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* --- 3. SWEET CRAVINGS (UPSELL) --- */}
            {currentStatus !== "SERVED" && (
                <>
                    <h3>Sweet Cravings?</h3>
                    <div style={{ marginBottom: '30px' }}>
                        {upsellItems.map((item, idx) => (
                            <div key={idx} className="upsell-item">
                                <div className="upsell-left">
                                    <img src={item.img} alt={item.name} className="upsell-img" />
                                    <div className="upsell-info">
                                        <p style={{fontWeight:'700', fontSize:'13px'}}>{item.name}</p>
                                        <p style={{color:'#888', fontSize:'11px'}}>₹{item.price}</p>
                                    </div>
                                </div>
                                <button className="add-btn"><FaPlus size={10}/> Add</button>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* --- 4. SCAN TO PAY --- */}
            {order.paymentMethod === "UPI" && currentStatus !== "SERVED" && (
                <>
                    <div className="split-header">
                        <h3>Scan to Pay</h3>
                        <button className="split-toggle" onClick={() => setShowSplit(!showSplit)}>
                            <FaUserFriends /> {showSplit ? "Close Split" : "Split Bill"}
                        </button>
                    </div>
                    <div className="card qr-layout">
                        <div className="qr-box">
                            <QRCodeSVG value={upiLink} size={85} />
                        </div>
                        <div style={{flex: 1}}>
                            {showSplit ? (
                                <div>
                                    <p className="label">SPLIT AMONGST</p>
                                    <div className="split-controls">
                                        <button className="control-btn" onClick={() => setSplitCount(Math.max(1, splitCount - 1))}>-</button>
                                        <span style={{fontWeight:'bold'}}>{splitCount}</span>
                                        <button className="control-btn" onClick={() => setSplitCount(splitCount + 1)}>+</button>
                                    </div>
                                    <p className="price-large" style={{color: '#FF5200', fontSize: '20px'}}>
                                        ₹{Math.ceil(order.totalAmount / splitCount)} <span style={{fontSize:'10px', color:'#666', fontWeight:'normal'}}>/person</span>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <p className="price-large">₹{order.totalAmount}</p>
                                    <p className="label" style={{marginTop:'5px'}}>UPI: {restaurant?.upiId?.split('@')[0]}</p>
                                    <p style={{fontSize:'10px', color:'#666'}}>Total Items: {order.items.length}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* --- 5. ACTION BUTTONS --- */}
            <div className="action-row">
                <button className="btn-download" onClick={() => generateCustomerReceipt(order, restaurant)}>
                    <FaDownload /> Digital Bill
                </button>
                <button className="btn-staff" onClick={() => alert("Staff Notified!")}>
                    <FaPhoneAlt /> Staff
                </button>
            </div>

            {/* --- 6. BASKET --- */}
            <div className="card">
                <p className="label" style={{marginBottom: '15px'}}>Your Basket</p>
                {order.items.map((item, idx) => (
                    <div key={idx} className="basket-item">
                        <div>
                            <div style={{fontWeight:'600', fontSize:'14px'}}>{item.name}</div>
                            <div style={{fontSize:'10px', color:'#888'}}>Qty: {item.quantity}</div>
                        </div>
                        <div style={{fontWeight:'bold'}}>₹{item.price * item.quantity}</div>
                    </div>
                ))}
                <div className="total-row">
                    <span style={{color:'#888', fontSize:'14px'}}>Grand Total</span>
                    <span className="total-price">₹{order.totalAmount}</span>
                </div>
            </div>

            {/* --- 7. FEEDBACK (After Served) --- */}
            {currentStatus === "SERVED" && (
                <div className="card">
                    <h3 style={{textAlign:'center', marginBottom:'15px'}}>Rate Experience</h3>
                    {!submitted ? (
                        <>
                            <div style={{display:'flex', justifyContent:'center', gap:'10px', marginBottom:'15px'}}>
                                {[1,2,3,4,5].map(star => (
                                    <FaStar 
                                        key={star} 
                                        size={24} 
                                        color={feedback.rating >= star ? "#FF5200" : "#333"}
                                        onClick={() => setFeedback({...feedback, rating: star})}
                                        style={{cursor:'pointer'}}
                                    />
                                ))}
                            </div>
                            <button className="btn-download" style={{width:'100%', height:'40px'}} onClick={() => setSubmitted(true)}>
                                Submit Feedback
                            </button>
                        </>
                    ) : (
                        <div style={{textAlign:'center', color:'#FF5200', fontWeight:'bold'}}>Thanks for your feedback!</div>
                    )}
                </div>
            )}

            {/* --- FOOTER --- */}
            <Link to="/" className="footer-link">
                <FaArrowLeft /> Back to Menu
            </Link>
        </div>
    );
};

export default OrderTracker;