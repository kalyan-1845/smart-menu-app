import mongoose from 'mongoose';

/**
 * Order Model
 * Central data structure for tracking sales, customer sentiment, 
 * and kitchen instructions.
 */
const orderSchema = new mongoose.Schema({
  customerName: { 
    type: String, 
    required: true,
    trim: true 
  },
  tableNumber: { 
    type: String, 
    required: true 
  },
  
  // 📝 ITEMS: What the customer actually ordered
  items: [
    {
      dishId: { type: String }, // ✅ Added this (Critical for Chef View)
      name: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
      // 🟢 CUSTOMIZATIONS: Instructions like "Less Salt", "No Onion"
      customizations: [String] 
    }
  ],

  // 💰 FINANCIAL DATA
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // ✅ FIX: Updated Enum to match your Frontend exactly
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'Cash', 'UPI', 'CARD', 'Online', 'Card'], 
    default: 'Online' 
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Cash_Pending', 'Failed'],
    default: 'Pending'
  },

  // 🔄 WORKFLOW STATUS
  // PLACED -> PREPARING -> READY -> SERVED -> COMPLETED -> CANCELLED
  status: { 
    type: String, 
    enum: ["PLACED", "COOKING", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"],
    default: "PLACED",
    uppercase: true
  },

  // ⭐ FEEDBACK: Sentiment tracking for the Owner Portal
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true },
    submittedAt: { type: Date }
  },

  // 🔒 OWNER LINK: Multi-tenant security
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }

}, { 
  timestamps: true // Automatically creates createdAt and updatedAt
});

// Indexes for faster lookups in the Admin Analytics tab
orderSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Order', orderSchema);