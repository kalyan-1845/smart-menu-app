import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  image: String,
  description: String,
  // 🟢 NEW: Array of customization options for this specific recipe
  specifications: [
    {
      label: { type: String }, // e.g., "No Onion", "Eggless", "Extra Cheese"
      isAdded: { type: Boolean, default: false } 
    }
  ],
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true 
  }
});

export default mongoose.model('Dish', dishSchema);