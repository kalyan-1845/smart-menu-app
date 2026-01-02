import React, { useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaCheckCircle, FaDownload, FaUtensils, FaHome, FaStar } from "react-icons/fa";
import FeedbackModal from "../components/FeedbackModal";

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const order = location.state?.order;

    // ✅ INTERNAL STYLES - This prevents the "styles is not defined" error
    const s = {
        container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        receipt: { width: '100%', background: 'white', color: 'black', borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden', border: '1px solid #333' },
        btnGreen: { width: '100%', background: '#22c55e', color: 'black', padding: '18px', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' },
        btnDark: { width: '100%', background: '#1a1a1a', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '10px' }
    };

    const downloadReceipt = async () => {
        if (!receiptRef.current) return;
        try {
            const canvas = await html2canvas(receiptRef.current, { backgroundColor: "#ffffff", scale: 2 });
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `Receipt_${order?._id?.slice(-5)}.png`;
            link.click();
        } catch (e) { alert("Please take a screenshot."); }
    };

    if (!order) return <div style={s.container}><h2>Order Not Found</h2><Link to="/">Go Home</Link></div>;

    return (
        <div style={s.container}>
            <FaCheckCircle size={50} color="#22c55e" style={{margin: '20px 0'}} />
            <h1 style={{fontWeight: '900'}}>ORDER PLACED!</h1>

            {/* Receipt Card */}
            <div ref={receiptRef} style={s.receipt}>
                <div style={{textAlign:'center', borderBottom:'1px dashed #ccc', paddingBottom: '10px', marginBottom: '15px'}}>
                    <h3 style={{margin:0}}>BITEBOX RECEIPT</h3>
                    <small>#{order._id?.slice(-6).toUpperCase()}</small>
                </div>
                {order.items.map((item, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom: '5px'}}>
                        <span>{item.name} x{item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                    </div>
                ))}
                <div style={{marginTop: '20px', paddingTop: '10px', borderTop: '2px solid #000', display:'flex', justifyContent:'space-between', fontWeight:'900'}}>
                    <span>TOTAL</span>
                    <span>₹{order.totalAmount}</span>
                </div>
            </div>

            {/* Feedback Section */}
            <div style={{width:'100%', marginTop:'20px', background:'#111', padding:'15px', borderRadius:'15px'}}>
                <p style={{fontSize:'12px', color:'#f97316', fontWeight:'900'}}>RATE YOUR FOOD</p>
                <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
                    {order.items.map((item, i) => (
                        <button key={i} onClick={() => { setSelectedDish(item); setShowFeedback(true); }} style={{background:'#222', color:'white', border:'none', padding:'5px 10px', borderRadius:'8px', fontSize:'11px'}}>
                            ⭐ {item.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{width:'100%', marginTop:'20px', display:'flex', flexDirection:'column', gap:'10px'}}>
                <button onClick={downloadReceipt} style={s.btnGreen}><FaDownload/> SAVE RECEIPT</button>
                <button onClick={() => navigate(`/menu/${order.owner}`)} style={s.btnDark}><FaUtensils/> ORDER MORE</button>
            </div>

            {showFeedback && <FeedbackModal dish={selectedDish} onClose={() => setShowFeedback(false)} />}
        </div>
    );
};

export default OrderSuccess;