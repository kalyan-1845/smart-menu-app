import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
    restaurantName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // --- Role-Based Passwords (Added for Waiter/Chef) ---
    waiterPassword: { 
        type: String, 
        default: "bitebox18" 
    },
    chefPassword: { 
        type: String, 
        default: "bitebox18" 
    },
    // ----------------------------------------------------
    trialEndsAt: {
        type: Date
    },
    isPro: {
        type: Boolean,
        default: false
    },
    subscriptionId: { // Optional: For future Razorpay/Stripe integration
        type: String
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// 🔒 Middleware: Hash password before saving
ownerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Method: Check if entered password matches hashed password
ownerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;