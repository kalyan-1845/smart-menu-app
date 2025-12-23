import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaGooglePay, FaWallet, FaMoneyBillWave, FaCreditCard, FaTimes } from "react-icons/fa";
import "./PaymentModal.css"; // Ensure you have your styles

const PaymentModal = ({ cartItems, totalAmount, restaurantId, tableNum, onClose, clearCart }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addedSweets, setAddedSweets] = useState([]);
  
  // Hardcoded Sweets (Upsell Items) matching your screenshot
  const sweetCravings = [
    { _id: "sweet1", name: "Choco Lava", price: 120, image: "https://t3.ftcdn.net/jpg/05/60/70/82/360_F_560708240_pMBa4a6hd1hd3d9.jpg" },
    { _id: "sweet2", name: "Gulab Jamun", price: 80, image: "https://t3.ftcdn.net/jpg/04/93/69/68/360_F_493696884_j8.jpg" },
    { _id: "sweet3", name: "Vanilla Scoop", price: 60, image: "https://t3.ftcdn.net/jpg/02/10/98/95/360_F_210989565_...jpg" }
  ];

  // Function to add sweet to the "Draft" order locally
  const handleAddSweet = (sweet) => {
    // Check if already added to prevent duplicates (optional)
    const exists = addedSweets.find(s => s._id === sweet._id);
    if (!exists) {
      // Add as a cart-like item (quantity 1)
      setAddedSweets([...addedSweets, { ...sweet, quantity: 1, isSweet: true }]);
    }
  };

  // Calculate Final Total (Cart + Added Sweets)
  const sweetsTotal = addedSweets.reduce((acc, item) => acc + item.price, 0);
  const finalPayable = totalAmount + sweetsTotal;

  // --- THE MAIN FUNCTION: CONFIRM ORDER ---
  const handlePayment = async (method) => {
    setLoading(true);

    try {
      // 1. Merge original cart with added sweets
      const finalOrderItems = [...cartItems, ...addedSweets];

      // 2. Create the Order Payload
      const orderData = {
        restaurantId,
        tableNumber: tableNum,
        items: finalOrderItems,
        totalAmount: finalPayable,
        paymentMethod: method, // "Cash", "GPay", etc.
        paymentStatus: method === "Cash" ? "Pending" : "Paid", // Cash is pending, Online is Paid
        customerName: "Guest", // You can add an input for this if needed
        status: "PLACED" // THIS triggers the Chef Dashboard!
      };

      // 3. Send to Backend (Chef only gets it NOW)
      const response = await axios.post("https://smart-menu-backend-5ge7.onrender.com/api/orders", orderData);

      if (response.data && response.data._id) {
        // 4. On Success: Clear Cart & Go to Tracker
        clearCart();
        navigate(`/track/${response.data._id}`);
      }

    } catch (error) {
      console.error("Order Failed:", error);
      alert("Payment Failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <button className="close-btn" onClick={onClose}><FaTimes /></button>
        
        <h2>Sweet Cravings?</h2>
        <p style={{fontSize: '12px', color: '#888', marginBottom: '20px'}}>Add a dessert to complete your meal!</p>

        {/* Sweets Grid */}
        <div className="sweets-list">
          {sweetCravings.map((sweet) => {
            const isAdded = addedSweets.find(s => s._id === sweet._id);
            return (
              <div key={sweet._id} className={`sweet-card ${isAdded ? 'selected' : ''}`}>
                <img src={sweet.image} alt={sweet.name} />
                <div className="sweet-info">
                  <h4>{sweet.name}</h4>
                  <p>₹{sweet.price}</p>
                </div>
                <button 
                  className={`add-btn ${isAdded ? 'added' : ''}`} 
                  onClick={() => handleAddSweet(sweet)}
                >
                  {isAdded ? "Added" : "+ Add"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment Section */}
        <div className="payment-footer">
          <div className="total-row">
            <span>Total Payable:</span>
            <span className="amount">₹{finalPayable}</span>
          </div>

          <div className="payment-options">
            {loading ? (
              <div className="spinner">Processing...</div>
            ) : (
              <>
                <button className="pay-opt gpay" onClick={() => handlePayment('GPay')}>
                   <FaGooglePay /> GPay
                </button>
                <button className="pay-opt phonepe" onClick={() => handlePayment('PhonePe')}>
                   <FaWallet /> PhonePe
                </button>
                <button className="pay-opt cash" onClick={() => handlePayment('Cash')}>
                   <FaMoneyBillWave /> Cash
                </button>
                <button className="pay-opt other" onClick={() => handlePayment('Card')}>
                   <FaCreditCard /> Other
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;