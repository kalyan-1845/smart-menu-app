import mongoose from 'mongoose';

/**
 * Dish Model
 * Represents a menu item with its customizations (specifications) 
 * and its link to the inventory (recipe).
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

  // 🟢 CUSTOMIZATIONS: Options like "No Onion", "Extra Spicy"
  specifications: [
    {
      label: { type: String }, 
      isAdded: { type: Boolean, default: false } 
    }
  ],

  // 📦 RECIPE / INVENTORY LINK: 
  // This tells the system which raw materials are used when this dish is ordered.
  recipe: [
    {
      ingredientId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Inventory', // Links to the Inventory model
        required: true 
      },
      quantityNeeded: { 
        type: Number, 
        required: true,
        default: 1 // Quantity to subtract from stock (e.g., 0.5kg or 1 unit)
      }
    }
  ],

  // 🔒 OWNER LINK:
  // Ensures this dish only shows up for the correct restaurant.
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }
}, { 
  timestamps: true // Tracks when dishes were created or updated
});

export default mongoose.model('Dish', dishSchema);