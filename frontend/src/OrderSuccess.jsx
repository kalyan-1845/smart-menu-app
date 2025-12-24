import React, { useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

/**
 * OrderSuccess Component
 * Displays a digital receipt after a successful order submission.
 * Features: Image download, high-resolution rendering, and dynamic navigation.
 */
const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    
    // Retrieve order data passed from the Cart navigation state
    const order = location.state?.order;

    // --- LOGIC: Download Receipt as PNG ---
    const downloadReceipt = async () => {
        const element = receiptRef.current;
        if (!element) return;

        try {
            // scale: 2 ensures text remains sharp on high-density mobile screens
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 2, 
                logging: false,
                useCORS: true // Essential if your dish images are from an external URL
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            // File naming based on Order ID suffix
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
            // Checks if it was a table order or a takeaway to return to the right view
            if (table && table !== "Takeaway") {
                navigate(`/menu/${restaurantId}/${table}`);
            } else {
                navigate(`/menu/${restaurantId}`);
            }
        } else {
            navigate("/"); 
        }
    };

    // Handle case where user refreshes the page and loses state
    if (!order) {
        return (
            <div style={{ height: '100vh', background: '#0d0d0d', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <h2 style={{ fontWeight: 'bold' }}>Receipt Expired</h2>
                <p style={{ color: '#555', fontSize: '14px' }}>Please check your Order History.</p>
                <Link to="/" style={{ color: '#f97316', textDecoration: 'none', marginTop: '15px', fontWeight: 'bold' }}>Back to Home</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0d0d0d', color: 'white', padding: '20px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Inter', sans-serif" }}>
            
            {/* 1. Success Indicator */}
            <div style={{ width: '75px', height: '75px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', boxShadow: '0 0 30px rgba(34, 197, 120, 0.3)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '-0.5px' }}>ORDER SUCCESS!</h1>
            <p style={{ color: '#888', marginBottom: '35px', fontSize: '15px' }}>Your food is being prepared.</p>

            {/* 2. DIGITAL RECEIPT CARD */}
            <div ref={receiptRef} style={{ width: '100%', background: 'white', color: 'black', borderRadius: '28px', padding: '30px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                
                {/* Visual Identity Header */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '10px', background: 'linear-gradient(90deg, #ea580c, #f97316)' }}></div>

                <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px dashed #eee', paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '900', margin: 0, color: '#111', letterSpacing: '2px' }}>TAX INVOICE</h2>
                    <p style={{ fontSize: '10px', color: '#999', marginTop: '8px', fontFamily: 'monospace' }}>ID: {order._id?.toUpperCase()}</p>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>{new Date().toLocaleString()}</p>
                </div>

                {/* Info Grid */}
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                        <span style={{ color: '#777' }}>Guest Name</span>
                        <span style={{ fontWeight: '800' }}>{order.customerName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                        <span style={{ color: '#777' }}>Station</span>
                        <span style={{ fontWeight: '800', color: '#f97316' }}>{order.tableNumber === "Takeaway" ? "🛍️ Takeaway" : `🍽️ Table ${order.tableNumber}`}</span>
                    </div>
                </div>

                {/* Items Breakdown */}
                <div style={{ marginBottom: '25px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '900', color: '#bbb', marginBottom: '12px', borderBottom: '1px solid #f5f5f5', paddingBottom: '5px' }}>ORDER DETAILS</p>
                    {order.items.map((item, index) => (
                        <div key={index} style={{ marginBottom: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700' }}>{item.quantity} × {item.name}</span>
                                <span style={{ fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                            </div>
                            {/* Rendering Customizations/Specs */}
                            {item.customizations?.length > 0 && (
                                <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0 0', fontWeight: 'bold', fontStyle: 'italic' }}>
                                    Note: {item.customizations.join(", ")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Payment Summary */}
                <div style={{ borderTop: '2px solid #111', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '15px', fontWeight: '900' }}>GRAND TOTAL</span>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#111' }}>₹{order.totalAmount}</span>
                </div>

                {/* Decorative Receipt Bottom */}
                <div style={{ marginTop: '25px', height: '40px', background: 'repeating-linear-gradient(to right, #000 0px, #000 1px, #fff 1px, #fff 5px)', opacity: 0.1 }}></div>
            </div>

            {/* 3. Primary Actions */}
            <div style={{ width: '100%', marginTop: '35px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <button 
                    onClick={downloadReceipt}
                    style={{ width: '100%', background: '#22c55e', color: 'white', padding: '20px', borderRadius: '20px', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '15px', boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)' }}
                >
                    DOWNLOAD RECEIPT 📥
                </button>

                <button 
                    onClick={handleOrderMore} 
                    style={{ width: '100%', background: '#1a1a1a', color: 'white', padding: '20px', borderRadius: '20px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', fontSize: '15px' }}
                >
                    ADD MORE ITEMS 🍕
                </button>
            </div>

            <p style={{ marginTop: '30px', fontSize: '12px', color: '#444', textAlign: 'center', fontWeight: 'bold' }}>
                Powered by Smart Menu Cloud v2.0
            </p>
        </div>
    );
};

export default OrderSuccess;