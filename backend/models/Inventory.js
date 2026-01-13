import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  currentStock: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'kg' }, // kg, liters, pcs, etc.
  lowStockThreshold: { type: Number, default: 5 }, // Warning level
  
  // ✅ Linked to the Owner
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true,
    index: true 
  }
}, { timestamps: true });

const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;