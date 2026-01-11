import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true,
        trim: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['UPDATE', 'MAINTENANCE', 'PROMO', 'ALERT', 'SYSTEM'], 
        default: 'UPDATE',
        index: true 
    },
    sentBy: { 
        type: String, 
        default: 'CEO Control' 
    },
    target: {
        type: String,
        enum: ['ALL', 'PRO', 'TRIAL'],
        default: 'ALL',
        index: true
    }
}, { timestamps: true });

// ============================================================
// 🚀 SCALE & CLEANUP OPTIMIZATIONS
// ============================================================

// 🔥 AUTO-DELETE & SORTING ENGINE
// This SINGLE index handles both:
// 1. Auto-deletion after 14 days (1209600 seconds)
// 2. Fast sorting (MongoDB can traverse this index backwards for "Newest First")
broadcastSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1209600 });

const Broadcast = mongoose.models.Broadcast || mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;