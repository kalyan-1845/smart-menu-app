import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { FaCheck, FaUtensils, FaClock, FaConciergeBell, FaArrowLeft, FaPhoneAlt, FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";

const OrderTracker = () => {
    const { id } = useParams();
    
    // --- STATE ---
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [eta, setEta] = useState(25); 

    // --- DATA FETCHING & SOCKETS ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
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
        
        // Listen for Real-time Updates (Status or Payment)
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- UI HELPERS ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheck /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaClock /> },
        { id: "SERVED", label: "Served", icon: <FaConciergeBell /> }
    ];
    
    if (!order) return <div style={{ minHeight: '100vh', background: '#050505', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Loading Order...</div>;

    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const currentStepIndex = stages.findIndex(s => s.id === normalizedStatus);
    
    // Payment Logic
    const isPaid = order.paymentStatus === "Paid";
    const isCash = order.paymentMethod === "CASH";

    return (
        <div style={{ 
            minHeight: '100vh', background: '#050505', color: 'white', 
            padding: '20px', paddingBottom: '140px', // Extra padding for bottom banner
            maxWidth: '600px', margin: '0 auto', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            boxSizing: 'border-box'
        }}>
            
            {/* 1. HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <Link to={`/menu/${order.owner}`} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '900', margin: 0 }}>Order Status</h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>ID: #{order._id.slice(-6).toUpperCase()}</p>
                </div>
            </div>

            {/* 2. ESTIMATED TIME CARD (Full Width) */}
            <div style={{ 
                background: '#111', padding: '30px', borderRadius: '24px', 
                marginBottom: '30px', border: '1px solid #1a1a1a', 
                textAlign: 'center', width: '100%', boxSizing: 'border-box' 
            }}>
                {currentStatus === "SERVED" ? (
                    <div>
                        <h2 style={{ color: '#22c55e', margin: '0 0 5px 0' }}>Enjoy your meal!</h2>
                        <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>Served at table {order.tableNumber}</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '10px' }}>ESTIMATED TIME</p>
                        <h2 style={{ fontSize: '42px', margin: 0, color: '#f97316', fontWeight: '900' }}>{eta} mins</h2>
                        <p style={{ color: '#666', fontSize: '14px', marginTop: '8px' }}>Kitchen is preparing your food</p>
                    </>
                )}
            </div>

            {/* 3. PROGRESS TRACKER */}
            <div style={{ padding: '0 10px', marginBottom: '40px' }}>
                {stages.map((stage, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    
                    return (
                        <div key={stage.id} style={{ display: 'flex', gap: '20px', minHeight: '70px' }}>
                            {/* Line & Dot */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '35px', height: '35px', borderRadius: '50%', 
                                    background: isActive ? '#f97316' : '#1a1a1a', 
                                    border: isActive ? 'none' : '1px solid #333',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? 'white' : '#666', zIndex: 2
                                }}>
                                    {isCompleted ? <FaCheck size={14}/> : stage.icon}
                                </div>
                                {index !== stages.length - 1 && (
                                    <div style={{ width: '2px', flex: 1, background: isActive ? '#f97316' : '#222', margin: '5px 0' }}></div>
                                )}
                            </div>
                            
                            {/* Text */}
                            <div style={{ paddingTop: '5px' }}>
                                <h4 style={{ margin: 0, color: isActive ? 'white' : '#555', fontSize: '16px' }}>{stage.label}</h4>
                                {isActive && index === currentStepIndex && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#f97316', fontWeight: 'bold' }}>In Progress...</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. BILL SUMMARY (Full Width) */}
            <div style={{ 
                background: '#111', padding: '25px', borderRadius: '24px', 
                border: '1px solid #1a1a1a', width: '100%', boxSizing: 'border-box' 
            }}>
                <p style={{ color: '#888', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '20px' }}>ORDER SUMMARY</p>
                
                {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '14px' }}>{item.quantity}x</span>
                            <span style={{ fontSize: '14px', color: '#ddd' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                    </div>
                ))}
                
                <div style={{ height: '1px', background: '#222', margin: '20px 0' }}></div>
                
                {/* DYNAMIC PAYMENT STATUS */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: isPaid ? '#22c55e' : '#888' }}>
                        {isPaid ? "Total Paid" : "Total to Pay"}
                    </span>
                    <span style={{ fontSize: '22px', fontWeight: '900', color: isPaid ? '#22c55e' : '#f97316' }}>
                        ₹{order.totalAmount}
                    </span>
                </div>
            </div>

            {/* 5. CALL STAFF BUTTON */}
            <button onClick={() => alert("Staff has been notified!")} 
                style={{ 
                    marginTop: '25px', width: '100%', padding: '18px', borderRadius: '16px', 
                    background: '#1a1a1a', border: '1px solid #333', color: 'white', 
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    cursor: 'pointer', fontSize: '14px'
                }}>
                <FaPhoneAlt size={14} /> Call Waiter
            </button>

            {/* 6. BOTTOM PAYMENT STATUS BAR (Visible if Cash & Not Paid) */}
            {isCash && !isPaid && (
                <div style={{ 
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
                    width: '100%', maxWidth: '600px', 
                    padding: '20px', 
                    background: '#222', borderTop: '1px solid #333', 
                    display: 'flex', alignItems: 'center', gap: '15px',
                    boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ background: '#f97316', padding: '10px', borderRadius: '50%', color: 'white' }}>
                        <FaMoneyBillWave size={20} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white' }}>You chose: Pay Cash</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#aaa' }}>Please pay ₹{order.totalAmount} at the counter.</p>
                    </div>
                </div>
            )}

            {/* 7. PAID CONFIRMATION BAR (Visible if Paid) */}
            {isPaid && (
                <div style={{ 
                    position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
                    width: '100%', maxWidth: '600px', 
                    padding: '20px', 
                    background: '#064e3b', borderTop: '1px solid #059669', 
                    display: 'flex', alignItems: 'center', gap: '15px',
                    boxShadow: '0 -5px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ background: '#34d399', padding: '10px', borderRadius: '50%', color: '#064e3b' }}>
                        <FaCheckCircle size={20} />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'white' }}>Payment Confirmed</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#a7f3d0' }}>Thank you for your payment!</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default OrderTracker;