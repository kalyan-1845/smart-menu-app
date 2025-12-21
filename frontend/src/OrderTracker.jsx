import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { FaStar, FaHistory, FaReceipt, FaBullhorn } from "react-icons/fa";

/**
 * OrderTracker Component
 * Provides real-time visibility to customers regarding their food journey.
 * Includes Order History, Staff Notifications, and Post-Meal Ratings.
 */
const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [rating, setRating] = useState(0);
  const [history, setHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15); 

  useEffect(() => {
    // --- 1. HANDLE ORDER HISTORY (localStorage) ---
    const savedHistory = JSON.parse(localStorage.getItem("smartMenu_History") || "[]");
    if (id && !savedHistory.includes(id)) {
        // Keep only the last 10 unique orders in history
        const newHistory = [id, ...savedHistory].slice(0, 10);
        localStorage.setItem("smartMenu_History", JSON.stringify(newHistory));
        setHistory(newHistory);
    } else {
        setHistory(savedHistory);
    }

    // --- 2. INITIAL FETCH ---
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
        setOrder(response.data);
      } catch (err) {
        setError("Order details could not be loaded.");
      }
    };
    fetchOrder(); 

    // --- 3. REAL-TIME SOCKET UPDATES ---
    const socket = io("https://smart-menu-backend-5ge7.onrender.com");
    socket.on("order-updated", (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder); 
        // Play chime when food is marked ready
        if (updatedOrder.status.toUpperCase() === "READY") {
          new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
        }
      }
    });

    return () => socket.disconnect();
  }, [id]);

  // --- STAFF NOTIFICATION LOGIC ---
  const notifyStaff = async (type) => {
    try {
      const message = type === "bill" ? "Requests the BILL 🧾" : "Needs Assistance 🛎️";
      await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders/call-waiter", {
        restaurantId: order.owner,
        tableNumber: order.tableNumber,
        type: type // 'bill' or 'help'
      });
      alert(`✅ Staff notified: ${message}`);
    } catch (err) {
      alert("Staff notification failed. Please wave to a waiter.");
    }
  };

  // --- RATING SUBMISSION ---
  const handleRating = async (val) => {
    setRating(val);
    try {
        // Send to feedback collection in MongoDB
        await axios.post(`https://smart-menu-backend-5ge7.onrender.com/api/feedback`, {
            orderId: id,
            stars: val,
            restaurantId: order.owner
        });
        alert("Thank you for your feedback! ⭐");
    } catch (e) { 
        console.log("Feedback saved locally."); 
    }
  };

  if (!order) return <div className="min-h-screen bg-[#0A0F18] flex items-center justify-center text-white font-black animate-pulse uppercase tracking-[2px]">Syncing Live Status...</div>;

  const currentStatus = order.status.toUpperCase();
  const statusSteps = ["PLACED", "COOKING", "READY", "SERVED"];
  const currentStepIndex = statusSteps.indexOf(currentStatus);

  return (
    <div className="min-h-screen bg-[#0A0F18] text-white p-6 font-sans relative pb-40">
      <div className="max-w-4xl mx-auto">
        
        {/* --- HEADER & HISTORY UI --- */}
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-black text-[#FF9933]">Live Tracker</h1>
                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
            </div>
            <div className="flex gap-2">
                {/* Visual history indicator */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-gray-400 group cursor-pointer relative">
                    <FaHistory />
                    {history.length > 0 && <span className="absolute -top-1 -right-1 bg-[#FF9933] text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">{history.length}</span>}
                </div>
            </div>
        </div>

        {/* --- DYNAMIC CONTENT BASED ON STATUS --- */}
        {currentStatus === "SERVED" ? (
            /* --- POST-MEAL FEEDBACK SCREEN --- */
            <div className="mb-8 bg-green-500/10 border border-green-500/30 p-8 rounded-[40px] text-center shadow-2xl">
                <h2 className="text-2xl font-black text-green-500 mb-2">Bon Appétit! 🍽️</h2>
                <p className="text-gray-400 text-sm mb-6 uppercase tracking-widest font-bold">Rate your experience</p>
                
                {/* Interactive 5-Star Rating */}
                <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar 
                            key={star}
                            onClick={() => handleRating(star)}
                            className={`text-4xl cursor-pointer transition-all duration-300 ${rating >= star ? 'text-yellow-400 scale-110 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-gray-700 hover:text-gray-500'}`}
                        />
                    ))}
                </div>
            </div>
        ) : (
            /* --- LIVE PREPARATION TIMELINE --- */
            <div className="mb-8 bg-[#181D2A] p-8 rounded-[40px] border border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-10">
                   <span className="text-xs font-black uppercase tracking-[3px] text-gray-500">Live Stages</span>
                   <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                       <span className="text-xs font-black uppercase tracking-[3px] text-green-500">Active</span>
                   </div>
                </div>

                

                {statusSteps.map((step, idx) => (
                    <div key={step} className="flex gap-6 mb-8 last:mb-0 relative">
                        {/* Vertical line between steps */}
                        {idx < 3 && <div className={`absolute left-4 top-8 w-0.5 h-10 ${idx < currentStepIndex ? 'bg-green-500' : 'bg-gray-800'}`}></div>}
                        
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black z-10 transition-all duration-700 ${idx <= currentStepIndex ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-gray-800 text-gray-600'}`}>
                            {idx < currentStepIndex ? '✓' : idx + 1}
                        </div>
                        
                        <div>
                            <h3 className={`font-black uppercase tracking-tight text-lg ${idx <= currentStepIndex ? 'text-white' : 'text-gray-700'}`}>{step}</h3>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1 leading-tight">
                                {step === "PLACED" && "System confirmed."}
                                {step === "COOKING" && currentStatus === "COOKING" ? "Chef is hand-crafting your meal now." : step === "COOKING" && idx < currentStepIndex ? "Prepared." : "In queue..."}
                                {step === "READY" && currentStatus === "READY" ? "Hot and waiting for pickup!" : ""}
                                {step === "SERVED" && currentStatus === "SERVED" ? "Order complete." : ""}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- ORDER SUMMARY CARD --- */}
        <div className="bg-[#181D2A] p-8 rounded-[40px] border border-white/5 shadow-2xl mb-8">
            <h2 className="text-xs font-black text-gray-500 uppercase tracking-[5px] mb-8">Receipt Summary</h2>
            <div className="space-y-6">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-gray-200">{item.name}</span>
                            <span className="text-[10px] font-black text-[#FF9933] uppercase">Table {order.tableNumber} • Qty: {item.quantity}</span>
                        </div>
                        <span className="font-mono text-xl text-white">₹{item.price * item.quantity}</span>
                    </div>
                ))}
            </div>
            
            {/* Total Section */}
            <div className="mt-10 pt-8 border-t-2 border-dashed border-gray-800 flex justify-between items-end">
                <div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest block mb-2">Total Payable</span>
                    <span className="text-5xl font-black text-white tracking-tighter">₹{order.totalAmount}</span>
                </div>
                <div className="bg-[#FF9933]/10 px-4 py-2 rounded-2xl border border-[#FF9933]/20 flex flex-col items-end">
                    <span className="text-gray-500 text-[8px] font-black uppercase mb-1">Method</span>
                    <span className="text-[#FF9933] text-[10px] font-black uppercase tracking-widest">{order.paymentMethod}</span>
                </div>
            </div>
        </div>

        {/* --- STICKY QUICK-ACTION BUTTONS --- */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-6 flex gap-4 z-[100]">
            {/* 🧾 Bill Request Button */}
            <button 
                onClick={() => notifyStaff("bill")}
                className="flex-1 bg-white text-black h-20 rounded-[30px] shadow-2xl flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all border-4 border-[#0A0F18]"
            >
                <FaReceipt className="text-xl" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Get Bill</span>
            </button>
            
            {/* 🛎️ Help/Assistance Button */}
            <button 
                onClick={() => notifyStaff("help")}
                className="flex-1 bg-[#FF9933] text-black h-20 rounded-[30px] shadow-2xl flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 transition-all border-4 border-[#0A0F18]"
            >
                <FaBullhorn className="text-xl" />
                <span className="text-[9px] font-black uppercase tracking-tighter">Call Staff</span>
            </button>
        </div>

        {/* --- NAVIGATION FOOTER --- */}
        <div className="mt-20 text-center pb-10">
            <Link to="/" className="text-gray-700 hover:text-[#FF9933] transition-colors text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-8">
                ← Re-open Menu for more
            </Link>
        </div>

      </div>
    </div>
  );
};

export default OrderTracker;