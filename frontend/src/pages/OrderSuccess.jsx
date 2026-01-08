import React, { useRef, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaCheckCircle, FaDownload, FaUtensils, FaReceipt, FaStar } from "react-icons/fa";
import FeedbackModal from "../components/FeedbackModal";

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    const [showFeedback, setShowFeedback] = useState(false);
    const [selectedDish, setSelectedDish] = useState(null);
    const order = location.state?.order;

    const s = {
        container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        receipt: { width: '100%', background: 'white', color: 'black', borderRadius: '4px', padding: '30px', position: 'relative', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
        btnGreen: { width: '100%', background: '#22c55e', color: 'black', padding: '18px', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
        btnDark: { width: '100%', background: '#1a1a1a', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }
    };

    const downloadReceipt = async () => {
        if (!receiptRef.current) return;
        try {
            // Scale 2 makes the image clear (retina quality)
            const canvas = await html2canvas(receiptRef.current, { backgroundColor: "#ffffff", scale: 3 });
            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = `BiteBox_Receipt_${order?._id?.slice(-5)}.png`;
            link.click();
        } catch (e) { alert("Snapshot failed. Please take a screenshot."); }
    };

    if (!order) return <div style={s.container}><h2>Order Not Found</h2><Link to="/" style={{color:'#f97316'}}>Return to Menu</Link></div>;

    return (
        <div style={s.container}>
            <FaCheckCircle size={60} color="#22c55e" style={{margin: '20px 0'}} />
            <h1 style={{fontWeight: '900', fontSize: '24px', marginBottom: '25px'}}>ORDER CONFIRMED</h1>

            {/* Receipt Card */}
            <div ref={receiptRef} style={s.receipt}>
                <div style={{textAlign:'center', borderBottom:'2px dashed #000', paddingBottom: '15px', marginBottom: '20px'}}>
                    <h2 style={{margin:0, letterSpacing:'2px'}}>KOVIXA</h2>
                    <p style={{margin:0, fontSize:'12px', fontWeight:'700'}}>TAX INVOICE</p>
                    <small style={{color:'#666'}}>{new Date().toLocaleString()}</small>
                </div>

                <div style={{marginBottom:'15px'}}>
                    <p style={{margin:0, fontSize:'14px'}}><strong>Table:</strong> {order.tableNum}</p>
                    <p style={{margin:0, fontSize:'14px'}}><strong>Order ID:</strong> #{order._id?.slice(-8).toUpperCase()}</p>
                </div>

                {order.items.map((item, i) => (
                    <div key={i} style={{display:'flex', justifyContent:'space-between', marginBottom: '8px', fontSize:'15px'}}>
                        <span>{item.name} <small>x{item.quantity}</small></span>
                        <span style={{fontWeight:'600'}}>₹{item.price * item.quantity}</span>
                    </div>
                ))}

                <div style={{marginTop: '25px', paddingTop: '15px', borderTop: '2px solid #000', display:'flex', justifyContent:'space-between', fontSize:'20px', fontWeight:'900'}}>
                    <span>TOTAL</span>
                    <span>₹{order.totalAmount}</span>
                </div>

                <div style={{textAlign:'center', marginTop:'30px', opacity:0.5}}>
                    <p style={{fontSize:'10px', margin:0}}>THANK YOU FOR VISITING!</p>
                </div>
            </div>

            {/* Feedback Section */}
            <div style={{width:'100%', marginTop:'25px', background:'#111', padding:'20px', borderRadius:'24px', border: '1px solid #222'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                    <FaStar color="#f97316" />
                    <p style={{fontSize:'13px', fontWeight:'900', margin:0}}>RATE YOUR DISHES</p>
                </div>
                <div style={{display:'flex', gap:'10px', overflowX:'auto', paddingBottom:'5px'}}>
                    {order.items.map((item, i) => (
                        <button key={i} onClick={() => { setSelectedDish(item); setShowFeedback(true); }} 
                                style={{background:'#1a1a1a', color:'white', border:'1px solid #333', padding:'8px 15px', borderRadius:'12px', fontSize:'12px', whiteSpace:'nowrap'}}>
                            {item.name}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{width:'100%', marginTop:'25px', display:'flex', flexDirection:'column', gap:'12px'}}>
                <button onClick={downloadReceipt} style={s.btnGreen}><FaDownload/> DOWNLOAD PNG RECEIPT</button>
                <button onClick={() => navigate(`/menu/${order.restaurantId}`)} style={s.btnDark}><FaUtensils/> ORDER MORE ITEMS</button>
            </div>

            {showFeedback && <FeedbackModal dish={selectedDish} onClose={() => setShowFeedback(false)} />}
        </div>
    );
};

export default OrderSuccess;