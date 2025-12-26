import mongoose from 'mongoose';

/**
 * 🛎️ SERVICE CALL SCHEMA
 * Powers the real-time request system for the Waiter Dashboard.
 * Designed specifically for the BiteBox Dine-In MVP.
 */
const callSchema = mongoose.Schema({
    // Link to the specific restaurant owner
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Owner',
        required: true,
        index: true // Indexed for faster lookup in busy restaurants
    },
    
    // The table where the customer clicked the 'Bell' icon
    tableNumber: {
        type: String,
        required: true
    },
    
    // Defines the type of help needed. 
    // Matches the icons in the Waiter Station: help (🛎️), bill (🧾), water (💧).
    type: {
        type: String,
        enum: ['help', 'bill', 'water'], 
        default: 'help'
    },
    
    // Status used to manage active vs resolved calls on the dashboard
    status: {
        type: String,
        enum: ['pending', 'resolved'],
        default: 'pending'
    }
}, { 
    // Automatically tracks when the customer called (createdAt) 
    // and when the waiter clicked 'DONE' (updatedAt).
    timestamps: true 
});

/**
 * 🏗️ EXPORT MODEL
 * Using the existence check to maintain stability during server reloads.
 */
const Call = mongoose.models.Call || mongoose.model('Call', callSchema);
export default Call;