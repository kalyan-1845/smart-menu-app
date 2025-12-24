import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Owner Model (v2.8)
 * Represents a Restaurant entity. 
 * Includes fields for the 60-day trial and manual extensions.
 */
const ownerSchema = mongoose.Schema({
    restaurantName: { 
        type: String, 
        required: [true, "Restaurant name is required"],
        trim: true
    },
    username: {
        type: String,
        required: [true, "Restaurant ID (username) is required"],
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },

    // 💰 SIMPLIFIED SUBSCRIPTION TRACKING
    // Flattened for easier access in SuperAdmin and Chef dashboards
    isPro: { 
        type: Boolean, 
        default: false 
    },
    trialEndsAt: { 
        type: Date,
        required: true // Set automatically during registration (Day 0 + 60)
    },
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Blocked'],
        default: 'Active'
    }
}, {
    timestamps: true, // Tracks when the account was created
});

/**
 * 🔒 PASSWORD ENCRYPTION
 * Hashes password before saving to the database.
 */
ownerSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * 🔓 PASSWORD VERIFICATION
 * Compares plain text login password with the hashed password in DB.
 */
ownerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;