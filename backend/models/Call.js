import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    tableNumber: {
        type: String, // String to handle "5", "5A", "T5"
        required: true
    },
    type: {
        type: String,
        default: 'help' // 'help', 'bill', 'water', etc.
    },
    message: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, { timestamps: true });

export default mongoose.model('Call', CallSchema);