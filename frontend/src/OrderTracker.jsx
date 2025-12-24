import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { FaCheck, FaUtensils, FaClock, FaConciergeBell, FaArrowLeft, FaPhoneAlt } from "react-icons/fa";
import "./OrderTracker.css"; // Ensure you have your basic CSS or delete this line if using inline styles below

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
                // 1. Get Order
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
                // 2. Get Restaurant Details (for Name/Phone)
                if(res.data && res.data.owner) {
                    const restRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${res.data.owner}`);
                    setRestaurant(restRes.data);
                }
            } catch (e) { 
                console.error("Fetch Error:", e); 
            }
        };

        fetchOrderDetails();
        
        // Real-time Updates
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
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
    
    // Calculate Progress
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const currentStepIndex = stages.findIndex(s => s.id === normalizedStatus);

    if (!order) return <div style={{ minHeight: '100vh', background: '#050505', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>Loading Order...</div>;

    return (
        <div style={{ 
            minHeight: '100vh', background: '#050505', color: 'white', 
            padding: '15px', maxWidth: '600px', margin: '0 auto', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}>
            
            {/* 1. HEADER (Matches Cart.js) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                {/* FIX: Redirects to /menu/{restaurantId} instead of just / */}
                <Link to={`/menu/${order.owner}`} style={{ border: 'none', color: 'white', background: '#1a1a1a', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}>
                    <FaArrowLeft />
                </Link>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: '900', margin: 0 }}>Order Status</h1>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>ID: #{order._id.slice(-6).toUpperCase()}</p>
                </div>
            </div>

            {/* 2. ESTIMATED TIME CARD */}
            <div style={{ background: '#111', padding: '25px', borderRadius: '24px', marginBottom: '25px', border: '1px solid #1a1a1a', textAlign: 'center' }}>
                {currentStatus === "SERVED" ? (
                    <div>
                        <h2 style={{ color: '#22c55e', margin: '0 0 5px 0' }}>Enjoy your meal!</h2>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Served at table {order.tableNumber}</p>
                    </div>
                ) : (
                    <>
                        <p style={{ color: '#888', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>ESTIMATED TIME</p>
                        <h2 style={{ fontSize: '32px', margin: 0, color: '#f97316', fontWeight: '900' }}>{eta} mins</h2>
                        <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>Kitchen is preparing your food</p>
                    </>
                )}
            </div>

            {/* 3. VERTICAL PROGRESS TRACKER */}
            <div style={{ padding: '0 10px', marginBottom: '30px' }}>
                {stages.map((stage, index) => {
                    const isActive = index <= currentStepIndex;
                    const isCompleted = index < currentStepIndex;
                    
                    return (
                        <div key={stage.id} style={{ display: 'flex', gap: '20px', minHeight: '60px' }}>
                            {/* Line & Dot */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ 
                                    width: '30px', height: '30px', borderRadius: '50%', 
                                    background: isActive ? '#f97316' : '#1a1a1a', 
                                    border: isActive ? 'none' : '1px solid #333',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? 'white' : '#666', zIndex: 2
                                }}>
                                    {isCompleted ? <FaCheck size={12}/> : stage.icon}
                                </div>
                                {index !== stages.length - 1 && (
                                    <div style={{ width: '2px', flex: 1, background: isActive ? '#f97316' : '#222', margin: '5px 0' }}></div>
                                )}
                            </div>
                            
                            {/* Text */}
                            <div style={{ paddingTop: '5px' }}>
                                <h4 style={{ margin: 0, color: isActive ? 'white' : '#555', fontSize: '14px' }}>{stage.label}</h4>
                                {isActive && index === currentStepIndex && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#f97316', fontWeight: 'bold' }}>In Progress...</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 4. BILL SUMMARY */}
            <div style={{ background: '#111', padding: '20px', borderRadius: '24px', border: '1px solid #1a1a1a' }}>
                <p style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px' }}>ORDER SUMMARY</p>
                
                {order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: '#f97316', fontWeight: 'bold', fontSize: '13px' }}>{item.quantity}x</span>
                            <span style={{ fontSize: '13px', color: '#ddd' }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                    </div>
                ))}
                
                <div style={{ height: '1px', background: '#222', margin: '15px 0' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Total Paid</span>
                    <span style={{ fontSize: '18px', fontWeight: '900', color: '#f97316' }}>₹{order.totalAmount}</span>
                </div>
            </div>

            {/* 5. CALL STAFF BUTTON */}
            <button onClick={() => alert("Staff has been notified!")} 
                style={{ 
                    marginTop: '25px', width: '100%', padding: '15px', borderRadius: '16px', 
                    background: '#1a1a1a', border: '1px solid #333', color: 'white', 
                    fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    cursor: 'pointer'
                }}>
                <FaPhoneAlt size={14} /> Call Waiter
            </button>

        </div>
    );
};

export default OrderTracker;