import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    restaurantId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    restaurantName: String,
    amount: { type: Number, required: true },
    method: { type: String, enum: ['UPI', 'CASH', 'TRANSFER'], default: 'UPI' },
    monthsPaid: { type: Number, default: 1 },
    paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);