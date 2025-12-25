import mongoose from 'mongoose';

// 1. Define the Schema
const orderSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true, index: true },
  tableNum: { type: String, required: true },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    _id: String
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Cooking', 'Ready', 'Served', 'Paid'], default: 'Pending' },
  customerName: { type: String, default: "Guest" }
}, { timestamps: true });

// 2. Export the Model (With the "Exists" check to prevent crashes)
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;