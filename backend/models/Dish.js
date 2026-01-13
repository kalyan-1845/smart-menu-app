import mongoose from 'mongoose';

/**
 * Dish Model (Enterprise v3.5 - Performance Optimized)
 * Optimized for high-concurrency reading (Menu Page).
 */
const dishSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  price: { 
    type: Number, 
    required: true,
    min: 0 
  },
  
  category: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  
  image: { 
    type: String,
    default: "" 
  },
  
  description: { 
    type: String,
    trim: true
  },

  isAvailable: { 
    type: Boolean, 
    default: true,
    index: true 
  },

  specifications: [
    {
      label: { type: String, trim: true }, 
      isAdded: { type: Boolean, default: false } 
    }
  ],

  /**
   * ⭐ RATINGS & SOCIAL PROOF
   * Defaulting to 4.5 gives new items a "fresh & hot" psychological boost.
   */
  ratings: {
    average: { type: Number, default: 4.5, min: 1, max: 5 },
    count: { type: Number, default: 1 }
  },

  /**
   * 💬 CUSTOMER REVIEWS
   * NOTE: The controller MUST limit this array to the last 50 reviews 
   * to prevent the document from exceeding MongoDB's 16MB limit.
   */
  reviews: [{
    customerName: { type: String, default: "Guest" },
    rating: { type: Number, required: true },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],

  /**
   * 🏢 RESTAURANT LINK
   * Critical for multi-tenant isolation.
   */
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true,
    index: true 
  }
}, { 
  timestamps: true 
});

// --- 🚀 PRO PERFORMANCE INDEXING ---

// 1. "Popular Items" Sort (Fastest Menu Render)
dishSchema.index({ restaurantId: 1, "ratings.average": -1 });

// 2. Category Filter (Starters, Main Course, etc.)
dishSchema.index({ restaurantId: 1, category: 1 });

// 3. Availability Filter (Don't show out-of-stock items)
dishSchema.index({ restaurantId: 1, isAvailable: 1 });

/**
 * 🏗️ EXPORT MODEL
 * Prevents "OverwriteModelError" during development hot-reloads.
 */
const Dish = mongoose.models.Dish || mongoose.model('Dish', dishSchema);
export default Dish;