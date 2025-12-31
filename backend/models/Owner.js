import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // --- 🏢 RESTAURANT IDENTITY ---
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },

  // --- 📈 SAAS ANALYTICS ---
  // Added this so the SuperAdmin SalesSummary can track performance
  totalRevenue: { type: Number, default: 0 },

  // --- 📧 OPTIONAL CONTACT ---
  email: { 
    type: String, 
    unique: true, 
    sparse: true // Allows multiple owners to have NO email without collision
  },
  
  // --- 🎁 BUSINESS MODEL ---
  // Defaulting to year 9999 makes the "Trial" effectively infinite
  trialEndsAt: { 
    type: Date,
    default: () => new Date("9999-12-31") 
  },
  isPro: { type: Boolean, default: true }, 

  // --- 👨‍🍳 STAFF ACCESS CONTROL ---
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" },
  
  // For Push Notifications (Alerts)
  pushSubscription: { type: String } 

}, { timestamps: true });

// --- 🔐 SECURITY: PASSWORD HASHING ---
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
      return next();
  }
  
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
  } catch (error) {
      next(error);
  }
});

// Method to verify passwords during login
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);

export default Owner;