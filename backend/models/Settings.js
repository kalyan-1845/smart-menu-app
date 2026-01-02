import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    maintenanceMode: { type: Boolean, default: false },
    broadcastMessage: { type: String, default: "" }
});

export default mongoose.model('Settings', settingsSchema);