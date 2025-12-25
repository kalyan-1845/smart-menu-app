import mongoose from 'mongoose';

// 1. Define the Schema for BiteBox Smart Menu
// Optimized for Dine-In only flow
const orderSchema = new mongoose.Schema({
  // Link to the specific restaurant owner
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true, 
    index: true 
  },
  
  // Table Number is mandatory for the Dine-In MVP
  tableNum: { 
    type: String, 
    required: true 
  },
  
  // List of food items ordered by the customer
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    _id: { type: String } // Matches the dish ID from the database
  }],
  
  // Financial totals calculated at the time of order
  totalAmount: { 
    type: Number, 
    required: true 
  },
  
  // The 'Arrangement' status used by Chef and Waiter dashboards
  // Flow: Pending -> Cooking -> Ready -> Served -> Paid (Offline)
  status: { 
    type: String, 
    enum: ['Pending', 'Cooking', 'Ready', 'Served', 'Paid'], 
    default: 'Pending' 
  },
  
  // Optional name for personalizing the order
  customerName: { 
    type: String, 
    default: "Guest" 
  }
}, { 
  // Automatically tracks 'createdAt' (Order Time) and 'updatedAt'
  timestamps: true 
});

/**
 * 2. Export the Model
 * Includes an "exists" check to prevent model recompilation errors during 
 * development/hot-reloads.
 */
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
export default Order;