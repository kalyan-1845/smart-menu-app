import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  broadcastMessage: { type: String, default: "" },
});

// Helper to always get the single settings document
settingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) return settings;
  return await this.create({});
};

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;