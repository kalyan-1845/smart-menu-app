import React from 'react';

/**
 * PaymentModal Component
 * Allows customers to choose between 'Online' and 'Cash' payment methods.
 * Used within the Cart component before finalizing an order.
 */
const PaymentModal = ({ totalAmount, onClose, onConfirm }) => {
    // Helper function to handle selection and close the modal
    const handlePayment = (method) => {
        // Pass 'Online' or 'Cash' back to the parent component (Cart)
        onConfirm(method); 
        onClose();
    };

    return (
        // Modal Overlay with darkened background
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            
            {/* Modal Content Card */}
            <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm transform transition-all border border-gray-100">
                
                <h2 className="text-2xl font-black mb-2 text-gray-900 text-center">Payment Method</h2>
                <p className="text-center text-gray-500 text-sm mb-6">How would you like to pay?</p>
                
                <div className="bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100">
                    <p className="text-sm text-gray-600 mb-1 text-center font-bold uppercase tracking-widest">Total Amount</p>
                    <p className="text-center font-black text-4xl text-red-600">₹{totalAmount}</p>
                </div>

                {/* OPTION 1: ONLINE PAYMENT (Redirects to UPI/Gateway) */}
                <button 
                    onClick={() => handlePayment('Online')}
                    className="w-full bg-[#FF9933] hover:bg-orange-500 text-white py-4 rounded-2xl font-black text-lg mb-4 shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <span>Pay Online Now</span> 💳
                </button>

                {/* OPTION 2: PAY AT COUNTER (Cash) */}
                <button 
                    onClick={() => handlePayment('Cash')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black text-lg mb-6 shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <span>Pay at Counter</span> 💰
                </button>

                {/* CANCEL ACTION */}
                <button 
                    onClick={onClose}
                    className="w-full text-gray-400 hover:text-gray-900 py-2 font-bold text-sm uppercase tracking-widest transition-colors"
                >
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;