import mongoose from 'mongoose';

/**
 * Dish Model (Enterprise v3.5 - Ratings Integrated)
 * This schema handles food items, pricing, availability, and social proof.
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
   * Optimized for high-speed retrieval on the Menu page.
   */
  ratings: {
    average: { type: Number, default: 4.5, min: 1, max: 5 },
    count: { type: Number, default: 1 }
  },

  /**
   * 💬 CUSTOMER REVIEWS
   * Limited to the most recent ones to keep the document size lean.
   */
  reviews: [{
    customerName: { type: String, default: "Guest" },
    rating: { type: Number, required: true },
    comment: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],

  /**
   * 🏢 RESTAURANT LINK
   * This field is critical. It connects this dish to a specific Owner.
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

// Compound index for the Menu page: Filter by restaurant and sort by rating
dishSchema.index({ restaurantId: 1, "ratings.average": -1 });

// Speed up category and availability filters
dishSchema.index({ restaurantId: 1, category: 1 });
dishSchema.index({ restaurantId: 1, isAvailable: 1 });

/**
 * 🏗️ EXPORT MODEL
 * Prevents re-compilation errors in development.
 */
const Dish = mongoose.models.Dish || mongoose.model('Dish', dishSchema);
export default Dish;