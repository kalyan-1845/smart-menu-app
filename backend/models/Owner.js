// models/Owner.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ownerSchema = new mongoose.Schema({
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, default: "" }, 
  isPro: { type: Boolean, default: false },
  trialEndsAt: { type: Date },
  pushSubscriptions: { type: Array, default: [] },
  ceoNotes: { type: String, default: "" },
  settings: { menuActive: { type: Boolean, default: true } }
}, { timestamps: true });

// 1. Encrypt Password
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 2. THIS FIXES THE 500 ERROR 👇
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.models.Owner || mongoose.model("Owner", ownerSchema);
export default Owner;