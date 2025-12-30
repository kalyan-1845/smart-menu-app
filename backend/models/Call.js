const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  callId: {
    type: String,
    unique: true,
    required: true
  },
  tableNumber: String,
  customerName: String,
  callType: {
    type: String,
    enum: ['waiter', 'bill', 'assistance', 'order'],
    default: 'waiter'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner',
    required: true
  },
  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Owner'
  },
  calledAt: {
    type: Date,
    default: Date.now
  },
  acknowledgedAt: Date,
  completedAt: Date,
  notes: String
});

callSchema.pre('save', function(next) {
  if (!this.callId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.callId = `CALL${timestamp}${random}`;
  }
  next();
});

module.exports = mongoose.model('Call', callSchema);