import React, { useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaCheckCircle, FaDownload, FaUtensils, FaHome, FaStar } from "react-icons/fa";
import FeedbackModal from "../components/FeedbackModal"; // ✅ Import your fixed modal

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    
    // --- STATE ---
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const order = location.state?.order;

    // --- LOGIC: Download Receipt ---
    const downloadReceipt = async () => {
        const element = receiptRef.current;
        if (!element) return;
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 3, 
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Receipt_${order?._id?.slice(-5).toUpperCase()}.png`;
            link.click();
        } catch (error) {
            alert("Please take a manual screenshot.");
        }
    };

    const handleOrderMore = () => {
        const restaurantId = order?.owner;
        const table = order?.tableNumber;
        if (restaurantId) {
            navigate(table && table !== "Takeaway" ? `/menu/${restaurantId}/${table}` : `/menu/${restaurantId}`);
        } else {
            navigate("/");
        }
    };

    if (!order) {
        return (
            <div style={{ height: '100vh', background: '#050505', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', padding: '20px' }}>
                <FaUtensils size={50} color="#333" style={{marginBottom:'20px'}}/>
                <h2 style={{ fontWeight: '900' }}>Order Data Unavailable</h2>
                <Link to="/" style={{ background: '#f97316', color: 'white', padding: '15px 30px', borderRadius: '12px', marginTop: '20px', textDecoration: 'none' }}>Return to Main Menu</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <div style={{ marginTop: '30px', width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <FaCheckCircle size={40} color="#22c55e" />
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0' }}>ORDER PLACED!</h1>
            <p style={{ color: '#888', marginBottom: '30px', fontSize: '14px', textAlign: 'center' }}>
                Estimated Time: <span style={{color: '#f97316', fontWeight: 'bold'}}>15-20 Mins</span>
            </p>

            {/* ⭐ NEW: FEEDBACK PROMPT SECTION */}
            <div style={{ width: '100%', background: '#111', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #222' }}>
                <p style={{ fontSize: '12px', fontWeight: '900', color: '#f97316', marginBottom: '10px' }}>ENJOYED YOUR FOOD?</p>
                <p style={{ fontSize: '14px', color: '#eee', marginBottom: '15px' }}>Help us grow by rating your items!</p>
                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {order.items.map((item, idx) => (
                        <button 
                            key={idx}
                            onClick={() => { setSelectedDish(item); setShowFeedback(true); }}
                            style={{ background: '#222', border: '1px solid #333', color: 'white', padding: '8px 15px', borderRadius: '10px', fontSize: '11px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <FaStar color="#f97316"/> Rate {item.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* DIGITAL RECEIPT CARD */}
            <div ref={receiptRef} style={{ width: '100%', background: 'white', color: 'black', borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden', border: '1px solid #333' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: 'repeating-linear-gradient(45deg, #f97316, #f97316 10px, #ea580c 10px, #ea580c 20px)' }}></div>
                <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px dashed #e5e5e5', paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900' }}>OFFICIAL RECEIPT</h2>
                    <p style={{ fontSize: '10px', color: '#999' }}>#{order._id?.slice(-6).toUpperCase()}</p>
                </div>
                {/* ... Receipt Content ... */}
                <div style={{ marginBottom: '20px' }}>
                    {order.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700' }}>{item.name} x{item.quantity}</span>
                            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                        </div>
                    ))}
                </div>
                <div style={{ background: '#1e293b', margin: '0 -30px -30px -30px', padding: '25px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>TOTAL PAID</span>
                    <span style={{ fontSize: '28px', fontWeight: '900' }}>₹{order.totalAmount}</span>
                </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ width: '100%', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button onClick={downloadReceipt} style={{ background: '#22c55e', color: 'black', padding: '18px', borderRadius: '16px', fontWeight: '900', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                    <FaDownload /> SAVE RECEIPT
                </button>
                <button onClick={handleOrderMore} style={{ background: '#1a1a1a', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '900', border: '1px solid #333' }}>
                    <FaUtensils /> ORDER MORE
                </button>
            </div>

            {/* FEEDBACK MODAL LOGIC */}
            {showFeedback && (
                <FeedbackModal 
                    dish={selectedDish} 
                    onClose={() => setShowFeedback(false)} 
                />
            )}
        </div>
    );
};

export default OrderSuccess;