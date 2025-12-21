import React, { useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";

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
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 2, // High resolution for mobile clarity
                logging: false,
                useCORS: true
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
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
            // ✅ Clean navigation to bypass staff login redirects
            if (table && table !== "Takeaway") {
                navigate(`/menu/${restaurantId}/${table}`);
            } else {
                navigate(`/menu/${restaurantId}`);
            }
        } else {
            navigate("/"); // Fallback to root
        }
    };

    if (!order) {
        return (
            <div style={{ height: '100vh', background: '#0d0d0d', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                <h2 style={{ fontWeight: 'bold' }}>Order Data Unavailable</h2>
                <Link to="/" style={{ color: '#f97316', textDecoration: 'none', marginTop: '15px', fontWeight: 'bold' }}>Return to Main Menu</Link>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#0d0d0d', color: 'white', padding: '20px', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'sans-serif' }}>
            
            {/* Success Visual */}
            <div style={{ width: '70px', height: '70px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)' }}>
                <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0', letterSpacing: '1px' }}>ORDER PLACED!</h1>
            <p style={{ color: '#888', marginBottom: '30px', fontSize: '14px' }}>The kitchen has received your request.</p>

            {/* DIGITAL RECEIPT CARD */}
            <div ref={receiptRef} style={{ width: '100%', background: 'white', color: 'black', borderRadius: '24px', padding: '30px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.6)' }}>
                
                {/* Visual Header Strip */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: '#f97316' }}></div>

                <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px dashed #ddd', paddingBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '900', margin: 0, color: '#111' }}>DIGITAL RECEIPT</h2>
                    <p style={{ fontSize: '10px', color: '#999', marginTop: '5px', fontFamily: 'monospace' }}>ORDER ID: {order._id?.toUpperCase()}</p>
                    <p style={{ fontSize: '11px', color: '#666' }}>{new Date().toLocaleString()}</p>
                </div>

                {/* Info Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                    <span style={{ color: '#777' }}>Guest:</span>
                    <span style={{ fontWeight: 'bold' }}>{order.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                    <span style={{ color: '#777' }}>Location:</span>
                    <span style={{ fontWeight: 'bold', color: '#f97316' }}>{order.tableNumber === "Takeaway" ? "🛍️ Takeaway" : `🍽️ Table ${order.tableNumber}`}</span>
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '900', color: '#bbb', marginBottom: '10px', borderBottom: '1px solid #eee', letterSpacing: '1px' }}>ORDER SUMMARY</p>
                    {order.items.map((item, index) => (
                        <div key={index} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span style={{ fontWeight: '600' }}>{item.quantity} x {item.name}</span>
                                <span style={{ fontWeight: 'bold' }}>₹{item.price * item.quantity}</span>
                            </div>
                            {item.selectedSpecs?.length > 0 && (
                                <p style={{ fontSize: '10px', color: '#ef4444', margin: '4px 0 0 0', fontWeight: 'bold', fontStyle: 'italic' }}>
                                    Note: {item.selectedSpecs.join(", ")}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div style={{ borderTop: '2px solid #111', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>AMOUNT PAID</span>
                    <span style={{ fontSize: '26px', fontWeight: '900', color: '#111' }}>₹{order.totalAmount}</span>
                </div>

                {/* Barcode Decoration */}
                <div style={{ marginTop: '25px', height: '45px', background: 'repeating-linear-gradient(to right, #000 0px, #000 1px, #fff 1px, #fff 4px)', opacity: 0.15 }}></div>
            </div>

            {/* Action Area */}
            <div style={{ width: '100%', marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                    onClick={downloadReceipt}
                    style={{ width: '100%', background: '#22c55e', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', border: 'none', cursor: 'pointer', fontSize: '14px', transition: '0.2s', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.2)' }}
                >
                    📥 SAVE RECEIPT TO PHONE
                </button>

                <button 
                    onClick={handleOrderMore} 
                    style={{ width: '100%', background: '#1a1a1a', color: 'white', padding: '18px', borderRadius: '18px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', fontSize: '14px', transition: '0.2s' }}
                >
                    ORDER MORE ITEMS
                </button>
            </div>

            <p style={{ marginTop: '25px', fontSize: '11px', color: '#555', textAlign: 'center', lineHeight: '1.5' }}>
                Show this digital receipt to your server for order verification.<br/>
                Thank you for dining with us!
            </p>
        </div>
    );
};

export default OrderSuccess;