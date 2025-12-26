import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // Unique identifiers for the restaurant login
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  
  // Restaurant branding used across the Menu and Dashboards
  restaurantName: { type: String, required: true },
  
  // Trial logic for the 60-day MVP startup phase
  trialEndsAt: { type: Date, required: true },
  isPro: { type: Boolean, default: false },
  
  /**
   * 🔑 STAFF PASSWORDS
   * Used for the Chef and Waiter login flow you requested.
   * Default is set to 'bitebox18' for easy first-time onboarding.
   */
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" },

  // Field for Web Push notifications (linked to orderRoutes.js logic)
  pushSubscription: { type: String } 
}, { 
  // Tracks account creation and last update
  timestamps: true 
});

/**
 * 🔒 PASSWORD ENCRYPTION
 * Automatically hashes the owner's main password before saving to the database.
 */
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * 🛡️ MATCH PASSWORD METHOD
 * Used during the login process to verify the owner's credentials.
 */
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * 🏗️ EXPORT MODEL
 * Includes the "Exists" check to prevent crashes during hot-reloads.
 */
const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
export default Owner;