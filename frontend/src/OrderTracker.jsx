import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // Added Link import
import axios from "axios";
import io from "socket.io-client";

const OrderTracker = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await axios.get(`https://smart-menu-backend-5ge7.onrender.com/api/orders/track/${id}`);
        setOrder(response.data);
      } catch (err) {
        setError("Order not found or link is invalid.");
        console.error(err);
      }
    };
    
    fetchOrder(); // Initial fetch

    // 1. Real-Time Socket Connection
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
        <div className="text-center p-8 bg-[#181D2A] rounded-xl shadow-2xl">
          <h1 className="text-4xl font-extrabold text-red-500 mb-4">Error 🚨</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0F18] text-white">
        <p className="text-xl text-gray-400">Loading Order Status...</p>
      </div>
    );
  }
  
  // Logic to determine the active step
  const statusSteps = ["PLACED", "COOKING", "READY", "SERVED"];
  const currentStepIndex = statusSteps.indexOf(order.status);
  
  // Custom status for the PENDING_PAYMENT state
  const isPendingPayment = order.status === "PENDING_PAYMENT";
  
  return (
    <div className="min-h-screen bg-[#0A0F18] text-white p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-[#FF9933] mb-2">Order Tracker</h1>
        <p className="text-gray-400 mb-8">Order #<span className="font-mono">{order._id.slice(-6)}</span> for Table {order.tableNumber}</p>

        {/* Payment Alert (NEW FEATURE: PENDING PAYMENT) */}
        {isPendingPayment && (
            <div className="bg-[#FF9933]/20 border border-[#FF9933] p-4 rounded-xl mb-8 shadow-lg">
                <h2 className="text-2xl font-bold text-[#FF9933]">💰 Payment Required!</h2>
                <p className="text-white mt-1">Please pay ₹{order.totalAmount} at the counter. Your order is **pending kitchen processing** until payment is confirmed by staff.</p>
                
                {/* Link back to the shop directory */}
                <Link to="/" className="text-sm text-white bg-red-600 px-4 py-2 mt-3 inline-block rounded-lg hover:bg-red-500 transition">
                    Find another Shop
                </Link>
            </div>
        )}

        {/* Status Timeline */}
        <div className="bg-[#181D2A] p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold mb-6 text-white">Preparation Status</h2>
            
            {statusSteps.map((status, index) => {
                // If payment is pending, only show the PLACED step as active/pending
                const isActive = !isPendingPayment && index === currentStepIndex;
                const isComplete = !isPendingPayment && index < currentStepIndex;
                const isWaiting = isPendingPayment && status === "PLACED"; // Show PLACED as waiting if payment is pending
                
                return (
                    <div key={status} className="flex items-start mb-6 last:mb-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 mt-1 flex-shrink-0
                            ${isComplete ? 'bg-[#138808] text-white' : 
                              isActive ? 'bg-[#FF9933] text-white animate-pulse' : 
                              isWaiting ? 'bg-[#FF9933]/50 text-gray-200' :
                              'bg-gray-600 text-gray-300'}`}>
                            {isComplete ? '✓' : index + 1}
                        </div>
                        <div className="flex-grow">
                            <h3 className={`text-xl font-bold ${isActive || isWaiting ? 'text-white' : 'text-gray-400'}`}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                                {isWaiting && <span className="text-sm text-[#FF9933] font-normal ml-2">(Awaiting Payment Confirmation)</span>}
                            </h3>
                            <p className="text-gray-500 text-sm">
                                {status === "PLACED" && "Your order has been received by the system."}
                                {status === "COOKING" && "The Chef is currently preparing your delicious food."}
                                {status === "READY" && "Your order is ready to be picked up by the waiter."}
                                {status === "SERVED" && "Enjoy your meal! Order is complete."}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Order Details */}
        <div className="bg-[#181D2A] p-6 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-white">Order Items</h2>
            <div className="space-y-3">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2">
                        <span className="text-lg text-gray-300">{item.name} <span className="text-[#FF9933]">x{item.quantity}</span></span>
                        <span className="font-bold text-lg text-white">₹{item.price * item.quantity}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                <span className="text-xl font-extrabold text-[#FF9933]">Total Amount</span>
                <span className="text-2xl font-extrabold text-white">₹{order.totalAmount}</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OrderTracker;