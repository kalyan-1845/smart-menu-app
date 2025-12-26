import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
    // ✅ Changed ref from 'User' to 'Owner'
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
    restaurantName: { type: String, required: true },
    subject: { type: String, required: true },
    status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
    messages: [
        {
            sender: { type: String, enum: ['OWNER', 'SUPERADMIN'] },
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

export default mongoose.model('SupportTicket', supportTicketSchema);