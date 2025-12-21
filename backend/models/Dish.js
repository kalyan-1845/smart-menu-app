import mongoose from 'mongoose';

/**
 * Dish Model
 * Represents a menu item with its customizations, stock availability,
 * and link to the raw inventory (recipe).
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
    index: true // Faster searching by category
  },
  image: { 
    type: String 
  },
  description: { 
    type: String 
  },

  // 🔴 AVAILABILITY TOGGLE:
  // Used by the Chef Dashboard to manually mark items as "Sold Out"
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

  // 📦 RECIPE / INVENTORY LINK: 
  // Links raw materials. Every order subtracts these amounts from 'Inventory'
  recipe: [
    {
      ingredientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory', 
        required: true 
      },
      quantityNeeded: { 
        type: Number, 
        required: true,
        default: 1 
      }
    }
  ],

  // 🔒 OWNER LINK:
  // Multi-tenant security for different restaurant owners
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }
}, { 
  timestamps: true // Automatically manages createdAt and updatedAt
});

export default mongoose.model('Dish', dishSchema);