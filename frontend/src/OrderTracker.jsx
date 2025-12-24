import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaDownload, FaPhoneAlt, FaArrowLeft
} from "react-icons/fa";

import "./OrderTracker.css";

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
        
        // Listen for Kitchen Progress Updates
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
    
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const normalizedStatus = currentStatus === "COOKING" ? "PREPARING" : currentStatus;
    const currentStepIndex = stages.findIndex(s => s.id === normalizedStatus);

    if (!order) return <div className="loading-screen">Loading Your Experience...</div>;

    return (
        <div className="tracker-container">
            <header className="tracker-header">
                <h1>Order Tracker</h1>
                <p>Enjoy your meal at {restaurant?.username || "Our Kitchen"}</p>
            </header>
            
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
                </div>
                <div className="grand-total-row">
                    <span>Grand Total</span>
                    <span className="final-price">₹{order.totalAmount}</span>
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