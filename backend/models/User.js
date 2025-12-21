import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Model
 * Includes Role-Based Access (RBAC) and Subscription/Trial Tracking.
 */
const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Please provide a username"],
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
        },
        // 🛡️ ROLE SYSTEM: Defines what the user can see/do
        role: { 
            type: String, 
            enum: ['OWNER', 'CHEF', 'WAITER'], 
            default: 'WAITER' 
        },
        // 🏪 RESTAURANT LINK: Digital fence for multi-tenancy
        restaurantId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Restaurant', 
            required: true 
        },
        restaurantName: {
            type: String,
            required: true,
        },

        // 💰 SAAS SUBSCRIPTION LOGIC
        isPro: {
            type: Boolean,
            default: false // Becomes true after they pay ₹999/mo
        },
        trialEndsAt: { 
            type: Date, 
            // Automatically sets expiry to 120 days (4 months) from registration
            default: () => new Date(Date.now() + 120 * 24 * 60 * 60 * 1000) 
        }
    },
    {
        timestamps: true, 
    }
);

// --- 🔒 PASSWORD SECURITY ---

/**
 * Middleware: Hash the password before saving.
 */
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Method: Compare entered password with hashed DB password.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;