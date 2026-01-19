import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ownerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  restaurantName: { type: String, required: true },
  phoneNumber: { type: String },
  isPro: { type: Boolean, default: false }, // Crucial for the "PREMIUM DASHBOARD" badge
  createdAt: { type: Date, default: Date.now }
});

// Encryption Middleware
ownerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password Check Helper
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.model("Owner", ownerSchema);
export default Owner;