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
  timestamps: true, // This automatically creates 'createdAt' and 'updatedAt'
  toJSON: { virtuals: true }, // ✅ Added: Ensures virtuals are sent to frontend
  toObject: { virtuals: true } // ✅ Added: Ensures virtuals work in console logs
});

// ============================================================
// 🚀 PRO SPEED & AUTO-CLEANUP OPTIMIZATIONS
// ============================================================

// 🔥 1. THE AUTO-DELETE ENGINE (TTL INDEX)
// Automatically deletes orders 30 days after creation to keep the DB lean.
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

// ⚡ 2. COMPOUND INDEX FOR ADMIN/CHEF DASHBOARD
// This handles the "Show me all active orders for My Restaurant, newest first" query.
orderSchema.index({ restaurantId: 1, status: 1, createdAt: -1 });

// 🎯 3. INBOX SEARCH OPTIMIZATION
// Specifically for the "Download PDF & Clear" feature.
orderSchema.index({ restaurantId: 1, isDownloaded: 1 });

// ✅ ADDED: HIGH-PERFORMANCE VIRTUALS
// This makes the mobile app faster by pre-formatting the time on the server
orderSchema.virtual('formattedTime').get(function() {
  if (!this.createdAt) return "";
  return this.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

/**
 * 2. Export the Model
 */
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;