import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    broadcastMessage: { type: String, default: "" }
});

// Helper to ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ maintenanceMode: false });
    }
    return settings;
};

export default mongoose.models.Settings || mongoose.model('Settings', settingsSchema);