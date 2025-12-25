import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  trialEndsAt: { type: Date, required: true },
  isPro: { type: Boolean, default: false },
  
  // Staff Passwords
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" }
}, { timestamps: true });

// Encrypt password before saving
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password method
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ FIX: Check if model exists before creating
const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
export default Owner;