import mongoose from 'mongoose';

const callSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Owner', 
    required: true,
    index: true 
  },
  
  tableNumber: { 
    type: String, 
    required: true 
  },
  
  // 'bill' = Request Bill, 'help' = Call Waiter, 'water' = Water Bottle
  type: { 
    type: String, 
    enum: ['bill', 'help', 'water'], 
    default: 'help' 
  },
  
  status: { 
    type: String, 
    enum: ['pending', 'resolved'], 
    default: 'pending' 
  }
}, { timestamps: true });

// Auto-delete resolved calls after 24 hours to keep DB fast
callSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Call = mongoose.models.Call || mongoose.model('Call', callSchema);
export default Call;