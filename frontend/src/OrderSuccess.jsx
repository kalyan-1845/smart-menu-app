import React, { useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaCheckCircle, FaDownload, FaUtensils, FaHome } from "react-icons/fa";

/**
 * OrderSuccess Component
 * Displays a digital receipt after a successful order.
 * Allows customers to download the receipt as an image for verification.
 */
const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    
    // Retrieve order details passed from Cart.jsx
    const order = location.state?.order;

    // --- LOGIC: Download Receipt as PNG ---
    const downloadReceipt = async () => {
        const element = receiptRef.current;
        if (!element) return;

        try {
            // High-Res Capture Settings
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 3, // Increased scale for sharp mobile text
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            // Uses order ID suffix for the filename
            link.download = `Receipt_${order?._id?.slice(-5).toUpperCase() || "Order"}.png`;
            link.click();
        } catch (error) {
            console.error("Receipt Generation Failed:", error);
            alert("Could not generate image. Please take a manual screenshot instead.");
        }
    };

    // --- LOGIC: Return to Menu ---
    const handleOrderMore = () => {
        const restaurantId = order?.owner;
        const table = order?.tableNumber;

        if (restaurantId) {
            // ✅ Dynamic navigation based on whether it's a table order or takeaway
            if (table && table !== "Takeaway") {
                navigate(`/menu/${restaurantId}/${table}`);
            } else {
                navigate(`/menu/${restaurantId}`);
            }
        } else {
            navigate("/"); // Fallback to root
        }
    };

    // State handling for missing order data (e.g. direct access)
    if (!order) {
        return (
            <div style={{ height: '100vh', background: '#050505', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
                <FaUtensils size={50} color="#333" style={{marginBottom:'20px'}}/>
                <h2 style={{ fontWeight: '900', fontSize: '20px', marginBottom: '10px' }}>Order Data Unavailable</h2>
                <p style={{color: '#666', fontSize: '13px', marginBottom: '30px'}}>Please scan the QR code again or start a new order.</p>
                <Link to="/" style={{ background: '#f97316', color: 'white', textDecoration: 'none', padding: '15px 30px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' }}>
                    <FaHome style={{marginRight:'8px'}}/> Return to Main Menu
                </Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '100px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
            
            {/* 1. Success Icon Visual */}
            <div style={{ marginTop: '30px', width: '80px', height: '80px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                <FaCheckCircle size={40} color="#22c55e" />
            </div>

            <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>ORDER PLACED!</h1>
            <p style={{ color: '#888', marginBottom: '40px', fontSize: '14px', textAlign: 'center' }}>
                Your order has been sent to the kitchen.<br/>
                <span style={{color: '#f97316', fontWeight: 'bold'}}>Estimated Time: 15-20 Mins</span>
            </p>

            {/* 2. DIGITAL RECEIPT CARD (Target for html2canvas) */}
            <div ref={receiptRef} style={{ width: '100%', background: 'white', color: 'black', borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid #333' }}>
                
                {/* Decorative Header Strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: 'repeating-linear-gradient(45deg, #f97316, #f97316 10px, #ea580c 10px, #ea580c 20px)' }}></div>

                <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px dashed #e5e5e5', paddingBottom: '20px', marginTop: '10px' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 5px 0', color: '#111', textTransform: 'uppercase' }}>OFFICIAL RECEIPT</h2>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: '600' }}>ORDER #{order._id?.slice(-6).toUpperCase()}</p>
                    <p style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{new Date().toLocaleString()}</p>
                </div>

                {/* Customer Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px', background: '#f8fafc', padding: '15px', borderRadius: '12px' }}>
                    <div>
                        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>GUEST NAME</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a' }}>{order.customerName}</p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <p style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>SEATING</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#f97316' }}>
                            {order.tableNumber === "Takeaway" ? "Takeaway Order" : `Table ${order.tableNumber}`}
                        </p>
                    </div>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>ITEM</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>PRICE</span>
                    </div>
                    
                    {order.items.map((item, index) => (
                        <div key={index} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{flex: 1, paddingRight: '10px'}}>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{item.name}</span>
                                    <span style={{ fontSize: '12px', color: '#f97316', marginLeft: '6px', fontWeight: 'bold' }}>x{item.quantity}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>₹{item.price * item.quantity}</span>
                            </div>
                            
                            {/* Display Customizations */}
                            {item.selectedSpecs?.length > 0 && (
                                <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                                    + {item.selectedSpecs.join(", ")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Totals Section */}
                <div style={{ background: '#1e293b', margin: '0 -30px -30px -30px', padding: '25px 30px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontSize: '11px', fontWeight: '700', opacity: 0.7, textTransform: 'uppercase' }}>TOTAL AMOUNT</p>
                        <p style={{ fontSize: '11px', fontWeight: '700', color: '#4ade80', marginTop: '4px' }}>
                            {order.paymentMethod === 'CASH' ? 'Pay at Counter' : 'Paid Online'}
                        </p>
                    </div>
                    <span style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>₹{order.totalAmount}</span>
                </div>
            </div>

            {/* 3. Action Buttons */}
            <div style={{ width: '100%', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button 
                    onClick={downloadReceipt}
                    style={{ width: '100%', background: '#22c55e', color: 'black', padding: '18px', borderRadius: '16px', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '14px', transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                    <FaDownload /> SAVE RECEIPT
                </button>

                <button 
                    onClick={handleOrderMore} 
                    style={{ width: '100%', background: '#1a1a1a', color: 'white', padding: '18px', borderRadius: '16px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', fontSize: '14px', transition: '0.2s', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                >
                    <FaUtensils /> ORDER MORE ITEMS
                </button>
            </div>

            <p style={{ marginTop: '30px', fontSize: '11px', color: '#555', textAlign: 'center', lineHeight: '1.6', maxWidth: '300px' }}>
                Please show this digital receipt to the staff if requested. Thank you for dining with us!
            </p>
        </div>
    );
};

export default OrderSuccess;