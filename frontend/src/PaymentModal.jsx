import React from 'react';

const PaymentModal = ({ totalAmount, onClose, onConfirm }) => {
    // Helper function to handle clicks and pass the method type
    const handlePayment = (method) => {
        onConfirm(method); // Pass 'Online' or 'Cash' back to the Cart component
        onClose();
    };

    return (
        // Modal Overlay
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            
            {/* Modal Content */}
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm transform transition-all">
                
                <h2 className="text-2xl font-black mb-4 text-gray-900">Choose Payment Method</h2>
                <p className="text-lg text-gray-600 mb-6">
                    Total Amount Due: <span className="font-extrabold text-3xl text-red-600">₹{totalAmount}</span>
                </p>

                {/* OPTION 1: ONLINE PAYMENT (Simulated) */}
                <button 
                    onClick={() => handlePayment('Online')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-bold text-lg mb-3 shadow-md shadow-red-500/30 active:scale-95 transition"
                >
                    Pay Online Now 💳
                </button>

                {/* OPTION 2: PAY AT COUNTER */}
                <button 
                    onClick={() => handlePayment('Cash')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold text-lg mb-4 shadow-md shadow-green-500/30 active:scale-95 transition"
                >
                    Pay at Counter (Cash) 💰
                </button>

                <button 
                    onClick={onClose}
                    className="w-full text-gray-600 hover:text-gray-900 py-2 font-semibold transition"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default PaymentModal;