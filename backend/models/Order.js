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
  
  // ✅ FIXED: String allows "Parcel", "Takeaway", or "1", "2"
  tableNum: { 
    type: String, 
    required: true,
    index: true 
  },

  // Track specific user (Optional)
  customerId: {
    type: String,
    required: false 
  },
  
  // List of food items
  items: {
    type: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        image: { type: String }, 
        dishId: { type: String } 
    }],
    validate: [v => v.length > 0, 'Order must contain at least one item']
  },
  
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // ✅ FIXED: Default is 'Pending' so Chef sees it immediately
  // Added 'placed' just in case, but 'Pending' is what we use.
  status: { 
    type: String, 
    enum: ['placed', 'Pending', 'Cooking', 'Ready', 'Served', 'Paid', 'Cancelled'], 
    default: 'Pending', 
    index: true 
  },
  
  customerName: { 
    type: String, 
    default: "Guest" 
  },

  // ✅ FIXED: Supports variations of Cash/Online
  paymentMethod: {
    type: String,
    enum: ['Online', 'Cash', 'CASH', 'ONLINE'], 
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

// 1. AUTO-DELETE (TTL INDEX) - Keeps DB clean after 30 days
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// 2. SEARCH OPTIMIZATIONS
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ restaurantId: 1, isDownloaded: 1 });

// VIRTUALS (Formatted Time)
orderSchema.virtual('formattedTime').get(function() {
  if (!this.createdAt) return "";
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Prevents "OverwriteModelError"
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;