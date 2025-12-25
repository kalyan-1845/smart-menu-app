import mongoose from 'mongoose';

/**
 * Dish Model (Simplified v2.8)
 * Represents a menu item with its customizations and manual availability.
 * Removed recipe/inventory link to match the new streamlined system.
 */
const dishSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    index: true 
  },
  image: { 
    type: String 
  },
  description: { 
    type: String 
  },

  // 🔴 AVAILABILITY TOGGLE:
  // Used by the Chef Dashboard to manually mark items as "Sold Out"
  // This is the primary way stock is managed in the new system.
  isAvailable: { 
    type: Boolean, 
    default: true 
  },

  // 🟢 CUSTOMIZATIONS: 
  // Options like "No Onion", "Extra Spicy", "Eggless"
  specifications: [
    {
      label: { type: String }, 
      isAdded: { type: Boolean, default: false } 
    }
  ],

  // 🔒 OWNER LINK:
  // Ensures multi-tenant security for different restaurant owners.
  // This ID must match the Owner's ID who created the dish.
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }
}, { 
  timestamps: true // Manages createdAt (for "New Item" badges) and updatedAt
});

// ✅ Correct way
export default mongoose.models.Order || mongoose.model('Order', orderSchema);