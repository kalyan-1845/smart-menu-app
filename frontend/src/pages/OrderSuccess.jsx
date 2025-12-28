import React, { useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import { FaCheckCircle, FaDownload, FaUtensils, FaHome, FaInfoCircle } from "react-icons/fa";

/**
 * OrderSuccess Component
 * Displays a digital receipt after a successful order.
 * Allows customers to download the receipt as an image for verification.
 */
const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const receiptRef = useRef(null); 
    
    // Retrieve order details passed from Cart.jsx state
    const order = location.state?.order;

    // --- LOGIC: Download Receipt as PNG ---
    const downloadReceipt = async () => {
        const element = receiptRef.current;
        if (!element) return;

        try {
            // High-Res Capture Settings for Mobile
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 3, // Sharpness for high-res mobile displays
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            
            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `BiteBox_Receipt_${order?._id?.slice(-5).toUpperCase()}.png`;
            link.click();
        } catch (error) {
            console.error("Receipt Generation Failed:", error);
            alert("Please take a manual screenshot of this receipt.");
        }
    };

    // --- LOGIC: Return to Menu ---
    const handleOrderMore = () => {
        const restaurantId = order?.owner;
        const table = order?.tableNumber;

        if (restaurantId) {
            // Navigates back to the correct restaurant menu
            navigate(table && table !== "Takeaway" ? `/menu/${restaurantId}/${table}` : `/menu/${restaurantId}`);
        } else {
            navigate("/");
        }
    };

    if (!order) {
        return (
            <div style={styles.errorContainer}>
                <FaUtensils size={50} color="#333" style={{marginBottom:'20px'}}/>
                <h2 style={{ fontWeight: '900', fontSize: '20px' }}>Order Not Found</h2>
                <p style={{color: '#666', fontSize: '13px', marginBottom: '30px'}}>Session expired. Please start a new order.</p>
                <Link to="/" style={styles.primaryBtn}>
                    <FaHome style={{marginRight:'8px'}}/> Back to Home
                </Link>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Success Animation Area */}
            <div style={styles.successIconWrapper}>
                <FaCheckCircle size={40} color="#22c55e" />
            </div>

            <h1 style={styles.mainTitle}>ORDER PLACED!</h1>
            <p style={styles.subTitle}>
                Kitchen has received your order.<br/>
                <span style={{color: '#f97316', fontWeight: 'bold'}}>Estimated Time: 15-20 Mins</span>
            </p>

            {/* DIGITAL RECEIPT: The Downloadable Target */}
            <div ref={receiptRef} style={styles.receiptCard}>
                <div style={styles.receiptHeaderStrip}></div>

                <div style={styles.receiptTop}>
                    <h2 style={styles.officialLabel}>OFFICIAL RECEIPT</h2>
                    <p style={styles.orderIdText}>ORDER #{order._id?.slice(-6).toUpperCase()}</p>
                    <p style={styles.timestamp}>{new Date().toLocaleString()}</p>
                </div>

                <div style={styles.infoGrid}>
                    <div>
                        <p style={styles.smallLabel}>GUEST</p>
                        <p style={styles.infoValue}>{order.customerName}</p>
                    </div>
                    <div style={{textAlign: 'right'}}>
                        <p style={styles.smallLabel}>LOCATION</p>
                        <p style={{ ...styles.infoValue, color: '#f97316' }}>
                            {order.tableNumber === "Takeaway" ? "Takeaway" : `Table ${order.tableNumber}`}
                        </p>
                    </div>
                </div>

                <div style={styles.itemsList}>
                    {order.items.map((item, index) => (
                        <div key={index} style={styles.itemRow}>
                            <span>
                                <strong style={{color: '#f97316'}}>x{item.quantity}</strong> {item.name}
                            </span>
                            <strong>₹{item.price * item.quantity}</strong>
                        </div>
                    ))}
                </div>

                <div style={styles.totalFooter}>
                    <div>
                        <p style={styles.smallLabelWhite}>GRAND TOTAL</p>
                        <p style={styles.paymentMethod}>
                            {order.paymentMethod === 'CASH' ? 'Pay at Counter' : 'Paid via UPI'}
                        </p>
                    </div>
                    <span style={styles.totalAmount}>₹{order.totalAmount}</span>
                </div>
            </div>

            {/* CTA BUTTONS */}
            <div style={styles.actionBox}>
                <button onClick={downloadReceipt} style={styles.downloadBtn}>
                    <FaDownload /> SAVE RECEIPT
                </button>

                <button onClick={handleOrderMore} style={styles.orderMoreBtn}>
                    <FaUtensils /> ADD MORE FOOD
                </button>
                
                <p style={styles.footerInfo}>
                    <FaInfoCircle /> Please keep this receipt until served.
                </p>
            </div>
        </div>
    );
};

// --- STYLES ---
const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Inter, sans-serif' },
    errorContainer: { height: '100vh', background: '#050505', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' },
    successIconWrapper: { marginTop: '30px', width: '70px', height: '70px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', border: '1px solid rgba(34, 197, 94, 0.2)' },
    mainTitle: { fontSize: '24px', fontWeight: '900', margin: '0 0 5px 0' },
    subTitle: { color: '#888', marginBottom: '30px', fontSize: '13px', textAlign: 'center', lineHeight: '1.5' },
    receiptCard: { width: '100%', maxWidth: '380px', background: 'white', color: 'black', borderRadius: '20px', padding: '25px', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' },
    receiptHeaderStrip: { position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', background: '#f97316' },
    receiptTop: { textAlign: 'center', borderBottom: '2px dashed #eee', paddingBottom: '15px', marginBottom: '20px' },
    officialLabel: { fontSize: '14px', fontWeight: '900', color: '#111', margin: 0 },
    orderIdText: { fontSize: '11px', color: '#888', fontWeight: 'bold', margin: '4px 0' },
    timestamp: { fontSize: '9px', color: '#bbb' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f9f9f9', padding: '12px', borderRadius: '12px', marginBottom: '20px' },
    smallLabel: { fontSize: '8px', color: '#aaa', fontWeight: '900', marginBottom: '2px' },
    smallLabelWhite: { fontSize: '8px', color: 'rgba(255,255,255,0.6)', fontWeight: '900', marginBottom: '2px' },
    infoValue: { fontSize: '13px', fontWeight: 'bold' },
    itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '10px' },
    totalFooter: { background: '#111', margin: '0 -25px -25px -25px', padding: '20px 25px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    paymentMethod: { fontSize: '10px', fontWeight: 'bold', color: '#4ade80' },
    totalAmount: { fontSize: '26px', fontWeight: '900' },
    actionBox: { width: '100%', maxWidth: '380px', marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px' },
    downloadBtn: { width: '100%', background: '#22c55e', color: 'black', padding: '15px', borderRadius: '12px', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    orderMoreBtn: { width: '100%', background: '#1a1a1a', color: 'white', padding: '15px', borderRadius: '12px', fontWeight: '900', border: '1px solid #333', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' },
    footerInfo: { textAlign: 'center', fontSize: '10px', color: '#444', marginTop: '15px' },
    primaryBtn: { background: '#f97316', color: 'white', padding: '12px 25px', borderRadius: '10px', textDecoration: 'none', fontWeight: 'bold' }
};

export default OrderSuccess;