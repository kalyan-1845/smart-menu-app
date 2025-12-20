import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  tableNumber: { type: String, required: true },
  items: [
    {
      name: String,
      quantity: Number,
      price: Number,
      // 🟢 NEW: Stores the customer's specific requests for this item
      customizations: [String] 
    }
  ],
  totalAmount: Number,
  paymentMethod: String,
  status: { type: String, default: "PLACED" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', orderSchema);