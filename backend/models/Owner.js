const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ownerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  restaurantName: {
    type: String,
    required: true
  },
  restaurantType: {
    type: String,
    enum: ['fine-dining', 'casual', 'fast-food', 'cafe', 'bar'],
    default: 'casual'
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  subscription: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  subscriptionExpiry: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['owner', 'super-admin'],
    default: 'owner'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
ownerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
ownerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Owner', ownerSchema);