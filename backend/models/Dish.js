import mongoose from 'mongoose';

/**
 * Dish Model (Enterprise v3.0)
 * Represents a menu item with real-time stock and multi-tenant isolation.
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
    min: 0 // Prevents accidental negative pricing
  },
  
  // Categorization for the high-speed menu scroller
  category: { 
    type: String, 
    required: true, 
    index: true,
    trim: true
  },
  
  image: { 
    type: String,
    default: "" // Ensures no 'undefined' errors in the frontend
  },
  
  description: { 
    type: String,
    trim: true
  },

  /**
   * 🔴 REAL-TIME AVAILABILITY
   * Indexed for instant menu filtering when the Chef toggles stock.
   */
  isAvailable: { 
    type: Boolean, 
    default: true,
    index: true 
  },

  /**
   * 🛠️ CUSTOMIZATIONS
   * Standardized for the frontend "Specifications" drawer.
   */
  specifications: [
    {
      label: { type: String, trim: true }, 
      isAdded: { type: Boolean, default: false } 
    }
  ],

  /**
   * 🔒 MULTI-TENANT LINK
   * restaurantId matches the field name in the Order model for consistency.
   */
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true,
    alias: 'owner' // Allows you to use both 'owner' or 'restaurantId' in queries
  }
}, { 
  timestamps: true 
});

// --- 🚀 PRO PERFORMANCE INDEXING ---
// Speeds up category-based menu rendering for specific restaurants
dishSchema.index({ restaurantId: 1, category: 1 });

// Speeds up "In-Stock Only" menu views
dishSchema.index({ restaurantId: 1, isAvailable: 1 });

/**
 * 🏗️ EXPORT MODEL
 */
const Dish = mongoose.models.Dish || mongoose.model('Dish', dishSchema);
export default Dish;