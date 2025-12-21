import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { QRCodeSVG } from "qrcode.react"; 
import { 
    FaStar, FaHistory, FaReceipt, FaBullhorn, FaArrowLeft, 
    FaCheckCircle, FaUtensils, FaFire, FaClock, FaDownload 
} from "react-icons/fa";
import { generateCustomerReceipt } from "./ReceiptGenerator";

/**
 * OrderTracker Component
 * Provides real-time visibility, instant UPI payments, and feedback loop.
 */
const OrderTracker = () => {
    const { id } = useParams(); // Order ID from URL
    const [order, setOrder] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState({ rating: 5, comment: "" });
    const [submitted, setSubmitted] = useState(false);

    // --- 1. DATA FETCHING & REAL-TIME SYNC ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                // Fetch specific Order data
                const res = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
                setOrder(res.data);
                
                // Fetch Restaurant Info for the UPI ID and Name
                const restRes = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/auth/restaurant/${res.data.owner}`);
                setRestaurant(restRes.data);

                // Update Local Order History
                const savedHistory = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
                if (id && !savedHistory.includes(id)) {
                    const newHistory = [id, ...savedHistory].slice(0, 10);
                    localStorage.setItem("smartMenu_History", JSON.stringify(newHistory));
                    setHistory(newHistory);
                } else {
                    setHistory(savedHistory);
                }
            } catch (e) {
                console.error("Order Sync Error:", e);
            }
        };

        fetchOrderDetails();

        // Socket.io Connection for live status changes from the Chef
        const socket = io("https://smart-menu-backend-5ge7.onrender.com");
        socket.on("order-updated", (updatedOrder) => {
            if (updatedOrder._id === id) {
                setOrder(updatedOrder);
                // Notification sound if status becomes READY
                if (updatedOrder.status.toUpperCase() === "READY") {
                    new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
                }
            }
        });

        return () => socket.disconnect();
    }, [id]);

    // --- 2. PROGRESS MAP LOGIC ---
    const stages = [
        { id: "PLACED", label: "Confirmed", icon: <FaCheckCircle /> },
        { id: "PREPARING", label: "Cooking", icon: <FaUtensils /> },
        { id: "READY", label: "Ready", icon: <FaFire /> },
        { id: "SERVED", label: "Served", icon: <FaClock /> }
    ];
    
    // Normalize status to match stage IDs
    const currentStatus = order?.status?.toUpperCase() || "PLACED";
    const currentStageIndex = stages.findIndex(s => s.id === currentStatus || (currentStatus === "COOKING" && s.id === "PREPARING"));

    // --- 3. HANDLERS ---
    const submitReview = async () => {
        if (!feedback.comment.trim()) return alert("Please add a quick comment!");
        try {
            await axios.post(`https://smart-menu-backend-5ge7.onrender.com/api/orders/${id}/review`, feedback);
            setSubmitted(true);
            alert("Thank you for your feedback! ❤️");
        } catch (e) {
            alert("Submission failed. Please try again.");
        }
    };

    const notifyStaff = async (type) => {
        try {
            await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders/call-waiter", {
                restaurantId: order.owner,
                tableNumber: order.tableNumber,
                type: type
            });
            alert(`✅ Staff notified for ${type === 'bill' ? 'the bill' : 'assistance'}!`);
        } catch (err) {
            alert("Staff notification failed. Please wave to a waiter.");
        }
    };

    if (!order) {
        return (
            <div className="min-h-screen bg-[#080808] flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[2px]">
                Connecting to Kitchen...
            </div>
        );
    }

    // UPI Link for QR Generation
    // Format: upi://pay?pa=[VPA]&pn=[NAME]&am=[AMOUNT]&cu=INR
    const upiID = restaurant?.upiId || localStorage.getItem("restaurantUPI");
    const upiLink = `upi://pay?pa=${upiID}&pn=${restaurant?.username}&am=${order.totalAmount}&cu=INR`;

    return (
        <div className="min-h-screen bg-[#080808] text-white p-6 font-sans relative pb-40">
            <div className="max-w-xl mx-auto">
                
                {/* 1. HEADER */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-[#FF9933]">Order Tracker</h1>
                        <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">ID: #{id.slice(-6).toUpperCase()}</p>
                    </div>
                    <Link to="/">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-gray-400 relative">
                            <FaHistory />
                            {history.length > 0 && <span className="absolute -top-1 -right-1 bg-[#FF9933] text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{history.length}</span>}
                        </div>
                    </Link>
                </header>

                {/* 2. LIVE PROGRESS MAP (Visual Stepper) */}
                <div className="bg-[#111] p-8 rounded-[40px] border border-gray-800 mb-6 shadow-2xl overflow-hidden relative">
                    <div className="flex justify-between items-center mb-10">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[3px]">Live Journey</span>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-ping ${currentStatus === 'SERVED' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                            <span className={`text-[10px] font-black uppercase ${currentStatus === 'SERVED' ? 'text-green-500' : 'text-orange-500'}`}>
                                {currentStatus === 'SERVED' ? 'Completed' : 'Active'}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between relative px-2">
                        {/* Progress Line Tracks */}
                        <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-800 z-0"></div>
                        <div 
                            className="absolute top-5 left-10 h-0.5 bg-[#FF9933] z-0 transition-all duration-1000 ease-out" 
                            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 80}%` }}
                        ></div>

                        {stages.map((stage, index) => (
                            <div key={stage.id} className="z-10 flex flex-col items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-700 ${index <= currentStageIndex ? 'bg-[#FF9933] text-black shadow-[0_0_20px_rgba(255,153,51,0.4)]' : 'bg-gray-900 text-gray-600'}`}>
                                    {stage.icon}
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-tighter ${index <= currentStageIndex ? 'text-white' : 'text-gray-700'}`}>{stage.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                

                {/* 3. DYNAMIC UPI QR CODE (Conditional) */}
                {order.paymentMethod === "UPI" && currentStatus !== "SERVED" && (
                    <div className="bg-white p-8 rounded-[40px] mb-6 text-center shadow-2xl transform hover:scale-[1.01] transition">
                        <p className="text-black text-[10px] font-black uppercase tracking-[3px] mb-6">Scan to Pay Restaurant</p>
                        <div className="flex justify-center mb-6">
                            <QRCodeSVG value={upiLink} size={200} level={"H"} includeMargin={true} />
                        </div>
                        <h2 className="text-black text-4xl font-black tracking-tighter">₹{order.totalAmount}</h2>
                        <p className="text-gray-400 text-[10px] font-bold mt-2 italic uppercase">Payable to: {restaurant?.username}</p>
                    </div>
                )}

                {/* 4. RECEIPT SUMMARY & PDF DOWNLOAD */}
                <div className="bg-[#111] p-8 rounded-[40px] border border-gray-800 mb-8 shadow-xl">
                    <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest mb-6">Your Basket</h3>
                    <div className="space-y-4">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start border-b border-white/5 pb-4">
                                <div>
                                    <p className="font-bold text-gray-200">{item.name}</p>
                                    <p className="text-[10px] text-orange-500 font-black uppercase">Qty: {item.quantity} • Table {order.tableNumber}</p>
                                </div>
                                <span className="font-mono font-bold">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-dashed border-gray-800">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-2xl font-black text-white">₹{order.totalAmount}</span>
                            <span className="bg-orange-500/10 text-orange-500 px-4 py-1 rounded-full text-[10px] font-black uppercase">
                                {order.paymentMethod}
                            </span>
                        </div>

                        {/* 🟢 PDF DOWNLOAD TRIGGER */}
                        <button 
                            onClick={() => generateCustomerReceipt(order, restaurant)}
                            className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[2px] flex items-center justify-center gap-3 hover:bg-[#FF9933] hover:text-black transition-all"
                        >
                            <FaDownload /> Download Digital Bill
                        </button>
                    </div>
                </div>

                {/* 5. FEEDBACK SYSTEM (Post-Meal) */}
                {currentStatus === "SERVED" && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-1000">
                        {!submitted ? (
                            <div className="bg-[#111] p-8 rounded-[40px] border border-gray-800 mb-20 shadow-2xl">
                                <h3 className="text-xl font-black mb-2">How was your meal?</h3>
                                <p className="text-gray-500 text-xs mb-6 font-bold uppercase tracking-widest">Help us improve</p>
                                
                                <div className="flex gap-3 mb-8">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button 
                                            key={star} 
                                            onClick={() => setFeedback({...feedback, rating: star})} 
                                            className={`text-4xl transition-all ${feedback.rating >= star ? 'text-yellow-500 scale-110 drop-shadow-lg' : 'text-gray-800 hover:text-gray-600'}`}
                                        >
                                            ★
                                        </button>
                                    ))}
                                </div>

                                <textarea 
                                    placeholder="Food quality, staff behavior, etc..." 
                                    className="w-full bg-black border border-gray-800 p-5 rounded-3xl text-sm mb-6 outline-none focus:border-[#FF9933] transition h-32 text-white"
                                    onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
                                />
                                <button 
                                    onClick={submitReview} 
                                    className="w-full bg-[#FF9933] text-black font-black py-5 rounded-[20px] shadow-xl hover:bg-orange-400 transition uppercase tracking-widest text-xs"
                                >
                                    Submit Review
                                </button>
                            </div>
                        ) : (
                            <div className="text-center bg-green-500/10 border border-green-500/20 p-10 rounded-[40px] mb-20">
                                <p className="text-green-500 font-black uppercase tracking-widest">Feedback Received! Thank you ❤️</p>
                            </div>
                        )}
                    </div>
                )}

                {/* 6. QUICK ACTION FLOATERS */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 flex gap-4 z-[100]">
                    <button 
                        onClick={() => notifyStaff("bill")} 
                        className="flex-1 bg-white text-black h-20 rounded-[30px] shadow-2xl flex flex-col items-center justify-center gap-1 border-4 border-[#080808] active:scale-95 transition"
                    >
                        <FaReceipt className="text-xl" />
                        <span className="text-[9px] font-black uppercase">Get Bill</span>
                    </button>
                    <button 
                        onClick={() => notifyStaff("help")} 
                        className="flex-1 bg-[#FF9933] text-black h-20 rounded-[30px] shadow-2xl flex flex-col items-center justify-center gap-1 border-4 border-[#080808] active:scale-95 transition"
                    >
                        <FaBullhorn className="text-xl" />
                        <span className="text-[9px] font-black uppercase">Call Staff</span>
                    </button>
                </div>

                <div className="text-center pb-10 opacity-30">
                    <Link to="/" className="text-white text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-8">
                        ← Back to Menu
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default OrderTracker;