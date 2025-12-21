import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    itemName: { type: String, required: true }, // e.g., "Tomato"
    currentStock: { type: Number, required: true }, // e.g., 50
    unit: { type: String, default: "kg" }, // kg, pcs, liters
    lowStockThreshold: { type: Number, default: 5 } // Alert owner when below this
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);