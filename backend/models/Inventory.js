import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    itemName: { type: String, required: true }, // e.g., "Tomato"
    currentStock: { type: Number, required: true }, // e.g., 50
    unit: { type: String, default: "kg" }, // kg, pcs, liters
    // Add these fields to your Inventory Schema
costPerUnit: { type: Number, default: 0 }, // e.g., ₹200 for 1kg Chicken
// This allows the system to calculate: (0.5kg chicken * ₹200) = ₹100 cost for the dish.
    lowStockThreshold: { type: Number, default: 5 } // Alert owner when below this
}, { timestamps: true });
  
export default mongoose.model('Inventory', inventorySchema);