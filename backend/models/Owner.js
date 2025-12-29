import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // --- 1. IDENTITY & LOGIN ---
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },

  // --- 2. SUPER ADMIN CONTROLS (🔥 NEW & CRITICAL) ---
  // This lets the system know if this is YOU (superadmin) or a Client (admin)
  role: { 
    type: String, 
    enum: ['admin', 'superadmin'], 
    default: 'admin' 
  },
  // This is the "Kill Switch" for the restaurant
  isActive: { type: Boolean, default: true },

  // --- 3. RESTAURANT BRANDING ---
  restaurantName: { type: String, required: true },

  // --- 4. SUBSCRIPTION & BILLING ---
  trialEndsAt: { type: Date, required: true },
  isPro: { type: Boolean, default: false },

  // --- 5. STAFF ACCESS (Your Custom Logic) ---
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" },

  // --- 6. NOTIFICATIONS ---
  pushSubscription: { type: String }

}, { 
  timestamps: true 
});

// --- PASSWORD ENCRYPTION ---
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- PASSWORD VERIFICATION ---
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ⚠️ IMPORTANT: We use 'User' as the model name internally to match your Super Admin logic, 
// even though the file is Owner.js. This prevents "Missing Schema" errors.
const Owner = mongoose.models.User || mongoose.model('User', ownerSchema);

export default Owner;