import mongoose from 'mongoose';

/**
 * Dish Model (Simplified v2.8)
 * Represents a menu item with manual availability.
 */
const dishSchema = new mongoose.Schema({
  // The display name of the food item
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  
  // Pricing for the Dine-In MVP
  price: { 
    type: Number, 
    required: true 
  },
  
  // Categorization (e.g., Starters, Main Course) for the menu scroller
  category: { 
    type: String, 
    required: true, 
    index: true 
  },
  
  // Optional image URL for the dish
  image: { 
    type: String 
  },
  
  // Short detail about the ingredients or taste
  description: { 
    type: String 
  },

  /**
   * 🔴 AVAILABILITY TOGGLE
   * Critical Feature: Used by the Chef Dashboard to manually mark items 
   * as "Sold Out" in real-time if the kitchen runs out of ingredients.
   */
  isAvailable: { 
    type: Boolean, 
    default: true 
  },

  /**
   * 🛠️ SPECIFICATIONS / CUSTOMIZATIONS
   * Allows customers to see specific options (e.g., "Extra Spicy", "No Onion").
   */
  specifications: [
    {
      label: { type: String }, 
      isAdded: { type: Boolean, default: false } 
    }
  ],

  /**
   * 🔒 OWNER LINK
   * Multi-tenant security ensures that dishes only appear for the correct restaurant.
   */
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }
}, { 
  // Automatically tracks when dishes are added or edited
  timestamps: true 
});

/**
 * 🏗️ EXPORT MODEL
 * Uses the existence check to prevent compilation errors during server restarts.
 */
export default mongoose.models.Dish || mongoose.model('Dish', dishSchema);