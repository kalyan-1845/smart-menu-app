import mongoose from 'mongoose';

const dishSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    // 👇 THIS FIELD IS CRITICAL. Without it, dishes won't show in the menu.
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Owner', 
        required: true 
    }
}, { timestamps: true });

export default mongoose.model('Dish', dishSchema);