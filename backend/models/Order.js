import mongoose from 'mongoose';

// 1. Define the Schema for BiteBox Smart Menu
const orderSchema = new mongoose.Schema({
  // Link to the specific restaurant owner
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true, 
    index: true 
  },
  
  // Table Number
  tableNum: { 
    type: String, 
    required: true,
    index: true 
  },

  // ✅ FIX 1: Added 'customerId' so we can track who ordered what
  customerId: {
    type: String,
    required: false // Optional for now to prevent crashes
  },
  
  // List of food items ordered
  items: {
    type: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String }, 
        _id: { type: String } 
    }],
    validate: [v => v.length > 0, 'Order must contain at least one item']
  },
  
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // ✅ FIX 2: Updated Enum to accept 'placed' (lowercase) to match the code
  status: { 
    type: String, 
    enum: ['placed', 'Pending', 'Cooking', 'Ready', 'Served', 'Paid', 'Cancelled'], 
    default: 'placed', // Set default to 'placed'
    index: true 
  },
  
  customerName: { 
    type: String, 
    default: "Guest" 
  },

  paymentMethod: {
    type: String,
    enum: ['Online', 'Cash', 'CASH', 'ONLINE'], // Added caps just in case
    default: 'Cash'
  },

  isDownloaded: { 
    type: Boolean, 
    default: false 
  }

}, { 
  timestamps: true, 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true } 
});

// ============================================================
// 🚀 PRO SPEED & AUTO-CLEANUP OPTIMIZATIONS
// ============================================================

// 1. AUTO-DELETE (TTL INDEX)
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// 2. COMPOUND INDEX
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

// 3. INBOX SEARCH OPTIMIZATION
orderSchema.index({ restaurantId: 1, isDownloaded: 1 });

// VIRTUALS
orderSchema.virtual('formattedTime').get(function() {
  if (!this.createdAt) return "";
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;