import mongoose from 'mongoose';

/**
 * Dish Model (Simplified v2.8)
 * Represents a menu item with manual availability.
 */
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  category: { type: String, required: true, index: true },
  image: { type: String },
  description: { type: String },

  // 🔴 AVAILABILITY TOGGLE:
  // Used by the Chef Dashboard to manually mark items as "Sold Out"
  isAvailable: { type: Boolean, default: true },

  specifications: [
    {
      label: { type: String }, 
      isAdded: { type: Boolean, default: false } 
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
  timestamps: true 
});

export default mongoose.model('Dish', dishSchema);