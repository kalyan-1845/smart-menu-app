import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  // Link to the specific restaurant owner
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true, 
    index: true 
  },
  
  // ✅ Supports "1", "2" OR "Takeaway", "Parcel"
  tableNum: { 
    type: String, 
    required: true,
    index: true 
  },

  // Track specific user (Optional)
  customerId: { type: String, required: false },
  
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
  
  totalAmount: { type: Number, required: true },
  
  // ✅ FIXED: Added 'Completed' so the Admin Panel "Close Table" works
  status: { 
    type: String, 
    enum: ['placed', 'Pending', 'Cooking', 'Ready', 'Served', 'Paid', 'Completed', 'Cancelled'], 
    default: 'Pending', 
    index: true 
  },
  
  customerName: { type: String, default: "Guest" },

  // ✅ FIXED: Supports all casing variations to prevent errors
  paymentMethod: {
    type: String,
    enum: ['Online', 'Cash', 'CASH', 'ONLINE', 'Card', 'UPI'], 
    default: 'Cash'
  },

  isDownloaded: { type: Boolean, default: false }

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
orderSchema.index({ restaurantId: 1, createdAt: -1 }); // Optimized for "Recent Orders" sorting

// VIRTUALS (Formatted Time)
orderSchema.virtual('formattedTime').get(function() {
  if (!this.createdAt) return "";
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// Prevents "OverwriteModelError"
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;