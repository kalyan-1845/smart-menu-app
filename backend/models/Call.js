import mongoose from 'mongoose';

const callSchema = mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true
    },
    tableNumber: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['help', 'bill', 'water'], // Matches the icons: 🛎️, 🧾, 💧
        default: 'help'
    },
    status: {
        type: String,
        default: 'pending'
    }
}, { timestamps: true });

const Call = mongoose.model('Call', callSchema);
export default Call;