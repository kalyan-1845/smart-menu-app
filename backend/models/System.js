import mongoose from 'mongoose';

const systemSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g., "maintenance"
  value: { type: Boolean, default: false },            // e.g., true/false
  message: { type: String, default: "System under maintenance" }
});

const System = mongoose.models.System || mongoose.model('System', systemSchema);
export default System;