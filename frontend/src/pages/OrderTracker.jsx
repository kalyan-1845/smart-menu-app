import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { generateCustomerReceipt } from "../utils/receiptGenerator"; //
import { 
    FaUtensils, FaClock, FaArrowLeft, FaPhoneAlt, 
    FaDownload, FaCheckCircle, FaSpinner, FaReceipt
} from "react-icons/fa";

const OrderTracker = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const API_BASE = "https://smart-menu-backend-5ge7.onrender.com/api";
    
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null); 
    const [isCalling, setIsCalling] = useState(false);

    useEffect(() => {
        const fetchOrderAndBranding = async () => {
            try {
                // Get order details via ID from URL
                const res = await axios.get(`${API_BASE}/orders/track/${id}`);
                setOrder(res.data);
                
                // Fetch restaurant branding specifically for the PDF receipt
                const resInfo = await axios.get(`${API_BASE}/auth/restaurant/${res.data.owner}`);
                setRestaurant(resInfo.data);
            } catch (e) { console.error("Sync Error", e); }
        };

        fetchOrderAndBranding();
        
        // Socket for live kitchen-to-customer updates
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) setOrder(updatedOrder);
        });

        return () => socket.disconnect();
    }, [id]);

    // --- HANDLER: DOWNLOAD BITEBOX RECEIPT ---
    const handleDownload = () => {
        if (order && restaurant) {
            // Generates the centered logo + centered URL receipt
            generateCustomerReceipt(order, restaurant); 
        } else {
            alert("Preparing your receipt...");
        }
    };

    if (!order) return <div style={styles.loader}><FaSpinner className="spin"/> Loading Tracker...</div>;

    return (
        <div style={styles.container}>
            <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            
            <div style={styles.header}>
                <button onClick={() => navigate(-1)} style={styles.backBtn}><FaArrowLeft /></button>
                <h1 style={styles.title}>Order Tracker</h1>
            </div>

            {/* QUICK RECEIPT ACCESS: Customer shows this at counter */}
            <div style={styles.downloadCard}>
                <div style={styles.receiptInfo}>
                    <FaReceipt color="#f97316" />
                    <div>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>View Billing Receipt</p>
                        <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>ID: #{order._id.slice(-6).toUpperCase()}</p>
                    </div>
                </div>
                <button onClick={handleDownload} style={styles.miniDownloadBtn}>
                    <FaDownload />
                </button>
            </div>

            {/* LIVE KITCHEN STATUS VISUAL */}
            <div style={styles.statusBox}>
                <div style={styles.pulseDot}></div>
                <h2 style={styles.statusText}>
                    {order.status === "PLACED" ? "ORDER RECEIVED" : 
                     order.status === "Cooking" ? "PREPARING FOOD" : 
                     order.status === "Ready" ? "READY AT COUNTER" : "ENJOY YOUR MEAL"}
                </h2>
                <p style={styles.subStatus}>Live updates from BiteBox Kitchen</p>
            </div>

            {/* LEAN FOOTER: No "Wait for Waiter" - encourage self-service */}
            <div style={styles.footer}>
                <button onClick={handleDownload} style={styles.secondaryBtn}>
                    <FaDownload /> RECEIPT PDF
                </button>
                <button style={styles.primaryBtn} onClick={() => navigate(`/menu/${order.owner}`)}>
                    <FaUtensils /> ORDER MORE
                </button>
            </div>
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#050505', color: 'white', padding: '20px', paddingBottom: '120px', fontFamily: 'Inter, sans-serif' },
    loader: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#f97316', background: '#000' },
    header: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' },
    backBtn: { background: '#111', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    title: { fontSize: '20px', fontWeight: '900', margin: 0 },
    downloadCard: { background: '#111', padding: '15px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', border: '1px solid #222' },
    receiptInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    miniDownloadBtn: { background: '#f97316', border: 'none', color: 'black', width: '35px', height: '35px', borderRadius: '8px', cursor: 'pointer' },
    statusBox: { textAlign: 'center', padding: '50px 20px', background: 'radial-gradient(circle, #1a100a 0%, #050505 100%)', borderRadius: '24px', border: '1px solid #1a1a1a' },
    statusText: { fontSize: '22px', fontWeight: '900', margin: '15px 0 5px 0' },
    subStatus: { color: '#f97316', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' },
    pulseDot: { width: '12px', height: '12px', background: '#f97316', borderRadius: '50%', margin: '0 auto', boxShadow: '0 0 15px #f97316' },
    footer: { position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'rgba(5,5,5,0.98)', borderTop: '1px solid #222', display: 'flex', gap: '10px', zIndex: 100 },
    secondaryBtn: { flex: 1, background: '#111', color: 'white', border: '1px solid #333', padding: '16px', borderRadius: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '13px' },
    primaryBtn: { flex: 1, background: '#f97316', color: 'black', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '900', fontSize: '13px', display: 'flex', justifyContent: 'center', gap: '8px' }
};

export default OrderTracker;