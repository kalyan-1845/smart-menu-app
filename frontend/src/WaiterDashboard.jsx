import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { FaUserTie, FaCheckCircle, FaMoneyBillWave, FaClock, FaUser, FaBell, FaReceipt, FaTint, FaLock } from "react-icons/fa";
import { generateCustomerReceipt } from "./ReceiptGenerator"; // Import your utility

const WaiterDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [calls, setCalls] = useState([]);
    const [restaurantData, setRestaurantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [visibleServedIds, setVisibleServedIds] = useState([]);

    // 🔐 Security State
    const [securityModal, setSecurityModal] = useState({ show: false, type: "", orderId: null });
    const [pin, setPin] = useState("");

    const ownerId = localStorage.getItem("ownerId");
    const token = localStorage.getItem("ownerToken");
    const notifSound = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    const fetchData = async () => {
        if (!ownerId || !token) { navigate("/login"); return; }
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const nameRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${ownerId}`, config);
            setRestaurantData(nameRes.data);

            const orderRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders?restaurantId=${ownerId}`, config);
            const activeOrders = orderRes.data.filter(o => o.status !== "SERVED" || visibleServedIds.includes(o._id));
            setOrders(activeOrders.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)));

            const callRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/calls?restaurantId=${ownerId}`, config);
            setCalls(callRes.data);
            setLoading(false);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        fetchData();
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (data) => { if(data.owner === ownerId) fetchData(); });
        socket.on("new-waiter-call", (data) => { if(data.restaurantId === ownerId) fetchData(); });
        return () => socket.disconnect();
    }, [ownerId, visibleServedIds]);

    // 🔒 Security Logic
    const handleActionClick = (type, id) => {
        setPin("");
        setSecurityModal({ show: true, type, orderId: id });
    };

    const confirmSecurityAction = async (e) => {
        e.preventDefault();
        if (pin !== "bb1972") return alert("Invalid Staff PIN!");

        const { type, orderId } = securityModal;
        setSecurityModal({ ...securityModal, show: false });

        if (type === "PAY") {
            const targetOrder = orders.find(o => o._id === orderId);
            generateCustomerReceipt(targetOrder, restaurantData); // 🖨️ Auto Print
            await updateOrderStatus(orderId, "Paid");
        } else if (type === "SERVE") {
            await updateOrderStatus(orderId, "SERVED");
            setVisibleServedIds(prev => [...prev, orderId]);
            setTimeout(() => setVisibleServedIds(prev => prev.filter(id => id !== orderId)), 180000);
        }
        fetchData();
    };

    const updateOrderStatus = async (id, status) => {
        await axios.put(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}`, 
            { status }, { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    if (loading) return <div style={styles.loading}><div style={styles.spinner}></div></div>;

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <h1><FaUserTie color="#3b82f6"/> Staff Station</h1>
                <p>{restaurantData?.restaurantName} • Live Sync</p>
            </div>

            {/* Requests */}
            <div style={styles.callsSection}>
                {calls.map(call => (
                    <div key={call._id} style={styles.callCard}>
                        <span>Table {call.tableNumber}: {call.type.toUpperCase()}</span>
                        <button onClick={() => fetchData()} style={styles.resolveBtn}>DONE</button>
                    </div>
                ))}
            </div>

            {/* Orders */}
            <div style={styles.grid}>
                {orders.map(order => (
                    <div key={order._id} style={{
                        ...styles.card, 
                        border: order.status === "READY" ? "2px solid #f97316" : "1px solid #222",
                        boxShadow: order.status === "READY" ? "0 0 15px rgba(249, 115, 22, 0.3)" : "none"
                    }}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.tableTitle}>Table {order.tableNumber}</h2>
                            {order.status === "READY" && <span style={styles.readyTag}>READY TO SERVE</span>}
                        </div>
                        
                        <div style={styles.itemsList}>
                            {order.items.map((item, i) => (
                                <div key={i}>{item.name} x{item.quantity}</div>
                            ))}
                        </div>

                        <div style={styles.actionRow}>
                            {order.status !== "SERVED" && (
                                <>
                                    {order.status !== "Paid" && (
                                        <button onClick={() => handleActionClick("PAY", order._id)} style={styles.btnPay}>
                                            <FaMoneyBillWave/> PAY & BILL
                                        </button>
                                    )}
                                    <button onClick={() => handleActionClick("SERVE", order._id)} style={styles.btnServe}>
                                        <FaCheckCircle/> SERVE
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 🔐 PIN MODAL */}
            {securityModal.show && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <FaLock size={30} color="#f97316"/>
                        <h3>Staff Verification</h3>
                        <p>Enter PIN to {securityModal.type === "PAY" ? "confirm payment" : "mark as served"}</p>
                        <form onSubmit={confirmSecurityAction}>
                            <input 
                                type="password" 
                                autoFocus 
                                value={pin} 
                                onChange={e => setPin(e.target.value)} 
                                style={styles.pinInput}
                            />
                            <div style={{display:'flex', gap: '10px'}}>
                                <button type="button" onClick={() => setSecurityModal({show:false})} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.confirmBtn}>Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { minHeight: '100vh', background: '#000', color: 'white', padding: '20px' },
    header: { borderBottom: '1px solid #222', paddingBottom: '20px', marginBottom: '30px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
    card: { background: '#0a0a0a', borderRadius: '20px', padding: '20px' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    readyTag: { background: '#f97316', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' },
    actionRow: { display: 'flex', gap: '10px', marginTop: '20px' },
    btnPay: { flex: 1, background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontWeight: 'bold' },
    btnServe: { flex: 1, background: '#14532d', color: 'white', border: 'none', borderRadius: '10px', padding: '12px', cursor: 'pointer', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: '#111', padding: '30px', borderRadius: '24px', textAlign: 'center', width: '300px', border: '1px solid #333' },
    pinInput: { width: '100%', padding: '12px', background: '#000', border: '1px solid #333', color: 'white', borderRadius: '10px', margin: '20px 0', textAlign: 'center', fontSize: '20px' },
    confirmBtn: { flex: 1, background: '#f97316', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
    cancelBtn: { flex: 1, background: '#333', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
    spinner: { width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' },
};

export default WaiterDashboard;