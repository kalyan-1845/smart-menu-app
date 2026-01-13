import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ownerSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // ✅ Added Phone Number Field
  phoneNumber: { type: String, default: "" },

  isPro: { type: Boolean, default: false },
  trialEndsAt: { type: Date },
  
  // Push Notifications
  pushSubscriptions: { type: Array, default: [] },
  
  // CEO Notes (For your Super Admin Dashboard)
  ceoNotes: { type: String, default: "" },
  
  // Settings (Menu On/Off, etc.)
  settings: {
    menuActive: { type: Boolean, default: true }
  }
}, { timestamps: true });

// 🔒 1. ENCRYPT PASSWORD BEFORE SAVING
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 2. COMPARE PASSWORD METHOD (Crucial for Login)
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.models.Owner || mongoose.model("Owner", ownerSchema);
export default Owner;