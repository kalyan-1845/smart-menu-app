import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['UPDATE', 'MAINTENANCE', 'PROMO'], default: 'UPDATE' },
    sentBy: String,
}, { timestamps: true });

export default mongoose.model('Broadcast', broadcastSchema);