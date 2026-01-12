import mongoose from 'mongoose';

const inventorySchema = mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Owner', 
        required: true 
    },
    itemName: { type: String, required: true },
    currentStock: { type: Number, required: true },
    unit: { type: String, default: "kg" },
    lowStockThreshold: { type: Number, default: 5 }
}, { timestamps: true });

// Prevent model overwrite error during reloads
const Inventory = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
export default Inventory;