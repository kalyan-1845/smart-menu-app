import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // --- REQUIRED FIELDS ---
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },

  // --- FREE FOREVER CONFIGURATION ---
  email: { 
    type: String, 
    unique: true, 
    sparse: true // "sparse" means email is optional (no duplicate error if missing)
  },
  
  // Sets expiration date to Dec 31, 9999 (Forever Free)
  trialEndsAt: { 
    type: Date,
    default: () => new Date("9999-12-31") 
  },

  isPro: { type: Boolean, default: true }, // Always Pro features
  
  // --- STAFF ACCESS ---
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" },
  
  pushSubscription: { type: String } 

}, { timestamps: true });

// --- FIXED: PASSWORD ENCRYPTION ---
// We use 'next' to safely tell Mongoose "we are done, proceed to save".
ownerSchema.pre('save', async function (next) {
  // If password is not changed, skip hashing
  if (!this.isModified('password')) {
      return next();
  }
  
  try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next(); // Success! Continue saving.
  } catch (error) {
      next(error); // If error, stop and report it.
  }
});

ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Prevent "OverwriteModelError" if this file loads twice
const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
export default Owner;