import mongoose from 'mongoose';

// 1. Define the Schema for BiteBox Smart Menu
const orderSchema = new mongoose.Schema({
  // Link to the specific restaurant owner
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true, 
    index: true // High-speed lookup for specific restaurant dashboards
  },
  
  // Table Number is mandatory for the Dine-In flow
  tableNum: { 
    type: String, 
    required: true,
    index: true // Faster lookup for Waiter filtering
  },
  
  // List of food items ordered
  items: {
    type: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String }, // RETAINED: Chef/Waiter can see what the dish looks like
        _id: { type: String } 
    }],
    validate: [v => v.length > 0, 'Order must contain at least one item']
  },
  
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // High-Speed Status Flow
  status: { 
    type: String, 
    enum: ['Pending', 'Cooking', 'Ready', 'Served', 'Paid', 'Cancelled'], 
    default: 'Pending',
    index: true // CRITICAL: Makes the "Live Orders" tab load instantly
  },
  
  customerName: { 
    type: String, 
    default: "Guest" 
  },

  // Tracks payment choice from Cart.jsx
  paymentMethod: {
    type: String,
    enum: ['Online', 'Cash'],
    default: 'Cash'
  },

  // For the Admin Inbox/Receipt feature
  isDownloaded: { 
    type: Boolean, 
    default: false 
  }

}, { 
  timestamps: true 
});

// --- 🚀 PRO SPEED OPTIMIZATION ---
// This index specifically helps the Restaurant Admin Dashboard
// when calculating revenue or fetching active orders.
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

/**
 * 2. Export the Model
 */
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;