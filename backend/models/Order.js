import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    tableNumber: {
      type: String,
      required: true,
    },
    // 🔥 FIX: Defined as flexible array to prevent Mongoose from deleting data
    items: [], 
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String, // 'Cash' or 'Online'
      default: "Cash",
    },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "completed"],
      default: "pending",
    },
    customerName: {
      type: String,
      default: "Guest",
    },
    note: {
      type: String,
    },
  },
  { timestamps: true, strict: false } // ✅ FIX: Allows flexible data saving
);

export default mongoose.model("Order", OrderSchema);