import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/receiptGenerator"; // Import our utility
import { 
    FaCheck, FaUtensils, FaClock, FaConciergeBell, 
    FaArrowLeft, FaPhoneAlt, FaDownload, FaCheckCircle, 
    FaSpinner, FaExclamationCircle, FaReceipt
} from "react-icons/fa";

const OrderTracker = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null); // Added to get branding for PDF
    const [isCalling, setIsCalling] = useState(false);

    useEffect(() => {
        const fetchOrderAndBranding = async () => {
            try {
                const res = await axios.get(`${API_BASE}/orders/track/${id}`);
                setOrder(res.data);
                
                // Fetch restaurant details for the receipt (Logo, Address, etc.)
                const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.owner}`);
                setRestaurant(resInfo.data);
            } catch (e) { console.error("Fetch Error:", e); }
        };

        fetchOrderAndBranding();
        
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- HANDLER: DOWNLOAD RECEIPT ---
    const handleDownload = () => {
        if (order && restaurant) {
            generateCustomerReceipt(order, restaurant); // Uses your centered logo logic
        } else {
            alert("Order data still loading...");
        }
    };

    if (!order) return <div style={styles.loading}>Loading Order...</div>;

    return (
        <div style={styles.container}>
            {/* ... Navigation Header stays same ... */}

            {/* NEW: RECEIPT QUICK ACTION CARD */}
            <div style={styles.receiptActionCard}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={styles.receiptIcon}><FaReceipt /></div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '14px' }}>Digital Order Receipt</h4>
                        <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>Download for counter checkout</p>
                    </div>
                </div>
                <button onClick={handleDownload} style={styles.downloadIconBtn}>
                    <FaDownload />
                </button>
            </div>

            {/* ... Stepper Logic and Order Summary stay same ... */}

            <div style={styles.stickyFooter}>
                <button onClick={handleDownload} style={styles.btnSecondary}>
                    <FaDownload /> SAVE PDF
                </button>
                <button className={styles.btnPrimary}>
                    {order.status === 'READY' ? 'PICK UP NOW' : 'KITCHEN LIVE'}
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '120px' },
    receiptActionCard: { background: '#111', borderRadius: '16px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', border: '1px solid #222' },
    receiptIcon: { width: '40px', height: '40px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    downloadIconBtn: { background: '#f97316', border: 'none', color: 'black', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer' },
    stickyFooter: { position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(5,5,5,0.9)', borderTop: '1px solid #222', display: 'flex', gap: '10px', zIndex: 100 },
    btnSecondary: { flex: 1, background: '#1a1a1a', color: 'white', border: '1px solid #333', borderRadius: '12px', padding: '15px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px' },
    btnPrimary: { flex: 1, background: '#f97316', color: 'black', border: 'none', borderRadius: '12px', padding: '15px', fontWeight: 'bold' }
};