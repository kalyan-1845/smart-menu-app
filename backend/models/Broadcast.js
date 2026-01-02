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
    // Enhanced types for better UI filtering
    type: { 
        type: String, 
        enum: ['UPDATE', 'MAINTENANCE', 'PROMO', 'ALERT', 'SYSTEM'], 
        default: 'UPDATE',
        index: true // Faster filtering by category
    },
    sentBy: { 
        type: String, 
        default: 'CEO Control' 
    },
    // Optional: Target specific users (Pro vs Trial)
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

// 🔥 1. AUTO-DELETE ENGINE (TTL INDEX)
// Broadcasts usually become irrelevant after some time.
// This deletes the broadcast automatically after 14 days.
// 14 days = 1,209,600 seconds.
broadcastSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1209600 });

// ⚡ 2. SPEED INDEX
// When dashboards load, they fetch the most recent broadcasts.
broadcastSchema.index({ createdAt: -1 });

const Broadcast = mongoose.models.Broadcast || mongoose.model('Broadcast', broadcastSchema);
export default Broadcast;