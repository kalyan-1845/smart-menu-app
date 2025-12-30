import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    // ... your existing schema fields ...
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    // ...
}, { timestamps: true });

// ✅ ADD THESE INDEXES FOR SPEED
// This makes finding orders for a specific restaurant instant
orderSchema.index({ restaurantId: 1 }); 
// This makes sorting by newest orders instant
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;