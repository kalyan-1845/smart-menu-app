import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // ✅ CLEAN URL FIX: Removed '...localhost:5000' to prevent 404 errors
        const response = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
        setOrder(response.data);
      } catch (err) {
        // ✅ ERROR LOGGING FIX: Construct a readable message based on your diagnostic reference
        const errorMessage = err.response
          ? err.response.data?.message || "Order not found or link is invalid."
          : err.request
          ? "Server is not reachable. Is the backend awake on Render?"
          : `Error: ${err.message}`;

        console.error(`Order tracking failed: ${errorMessage}`, err);
        setError(errorMessage);
      }
    };
    
    fetchOrder(); 

    // ✅ CLEAN SOCKET FIX: Points directly to your production backend
    const socket = io("https://smart-menu-backend-5ge7.onrender.com");

    // Listen for status updates specifically for this order
    socket.on("order-updated", (updatedOrder) => {
      if (updatedOrder._id === id) {
        setOrder(updatedOrder);
      }
    });

    return () => socket.disconnect();
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F18] text-white">
        <div className="text-center p-8 bg-[#181D2A] rounded-xl shadow-2xl border border-red-500/50">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4">Error 🚨</h1>
          <p className="text-gray-400">{error}</p>
          <Link to="/" className="mt-6 inline-block text-[#FF9933] hover:underline">Return to Menu</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0F18] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#FF9933] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl text-gray-400">Locating your order...</p>
      </div>
    );
  }
  
  const statusSteps = ["PLACED", "COOKING", "READY", "SERVED"];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isPendingPayment = order.status === "PENDING_PAYMENT";
  
  return (
    <div className="min-h-screen bg-[#0A0F18] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-[#FF9933] mb-2">Order Tracker</h1>
        <p className="text-gray-400 mb-8">Order #<span className="font-mono">{order._id.slice(-6).toUpperCase()}</span> for Table {order.tableNumber}</p>

        {/* Payment Alert */}
        {isPendingPayment && (
            <div className="bg-[#FF9933]/20 border border-[#FF9933] p-6 rounded-xl mb-8 shadow-lg animate-pulse">
                <h2 className="text-2xl font-bold text-[#FF9933]">💰 Payment Required!</h2>
                <p className="text-white mt-2">Please pay <strong>₹{order.totalAmount}</strong> at the counter. Your order is pending kitchen processing until confirmed by staff.</p>
                <Link to="/" className="text-sm text-white bg-red-600 px-4 py-2 mt-4 inline-block rounded-lg hover:bg-red-500 transition">
                    Cancel & Find Another Shop
                </Link>
            </div>
        )}

        {/* Status Timeline */}
        <div className="bg-[#181D2A] p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold mb-8 text-white">Preparation Status</h2>
            
            {statusSteps.map((status, index) => {
                const isActive = !isPendingPayment && index === currentStepIndex;
                const isComplete = !isPendingPayment && index < currentStepIndex;
                const isWaiting = isPendingPayment && status === "PLACED"; 
                
                return (
                    <div key={status} className="flex items-start mb-8 last:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg mr-6 mt-1 flex-shrink-0 transition-colors duration-500
                            ${isComplete ? 'bg-[#138808] text-white' : 
                              isActive ? 'bg-[#FF9933] text-white animate-pulse' : 
                              isWaiting ? 'bg-[#FF9933]/50 text-gray-200' :
                              'bg-gray-700 text-gray-500'}`}>
                            {isComplete ? '✓' : index + 1}
                        </div>
                        <div className="flex-grow">
                            <h3 className={`text-xl font-bold ${isActive || isWaiting || isComplete ? 'text-white' : 'text-gray-500'}`}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                                {isWaiting && <span className="text-sm text-[#FF9933] font-normal block md:inline md:ml-2">(Awaiting Payment Confirmation)</span>}
                            </h3>
                            <p className="text-gray-500 text-sm mt-1">
                                {status === "PLACED" && "Your order has been received by the system."}
                                {status === "COOKING" && "The Chef is currently preparing your delicious food."}
                                {status === "READY" && "Your order is ready to be picked up by the waiter!"}
                                {status === "SERVED" && "Enjoy your meal! Order is complete."}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Order Details */}
        <div className="bg-[#181D2A] p-6 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Bill Summary</h2>
            <div className="space-y-4">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-700/50 pb-3">
                        <div className="flex flex-col">
                            <span className="text-lg text-gray-300 font-medium">{item.name}</span>
                            <span className="text-sm text-[#FF9933]">Quantity: {item.quantity}</span>
                        </div>
                        <span className="font-bold text-lg text-white">₹{item.price * item.quantity}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t-2 border-gray-700">
                <span className="text-xl font-extrabold text-[#FF9933]">Total Payable</span>
                <span className="text-3xl font-extrabold text-white">₹{order.totalAmount}</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OrderTracker;