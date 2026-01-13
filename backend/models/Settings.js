import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  // 🛑 The Kill Switch
  maintenanceMode: { type: Boolean, default: false },
  
  // 📢 CEO Announcement
  broadcastMessage: { type: String, default: "" },

  // 🖼️ GLOBAL BANNER (Added this so your dashboard doesn't break)
  globalBanner: { type: String, default: "" }
});

// Helper to always get the single settings document (Singleton Pattern)
settingsSchema.statics.getSettings = async function () {
  const settings = await this.findOne();
  if (settings) return settings;
  return await this.create({});
};

const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
export default Settings;