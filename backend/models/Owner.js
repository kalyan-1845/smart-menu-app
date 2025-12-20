import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = mongoose.Schema({
    restaurantName: { 
        type: String, 
        required: [true, "Restaurant name is required"],
        trim: true
    },
    username: {
        type: String,
        required: [true, "Username is required"],
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
    
    // 💰 SUBSCRIPTION & TRIAL TRACKING
    subscription: {
        plan: { 
            type: String, 
            default: 'free_trial' 
        },
        trialEndsAt: { 
            type: Date 
        }, 
        isPaid: { 
            type: Boolean, 
            default: false 
        } 
    }
}, {
    timestamps: true,
});

/**
 * 🔒 PASSWORD ENCRYPTION
 * Automatically hashes the password before saving to the database.
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
 * Compares the plain text password from login with the hashed password in DB.
 */
ownerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.model('Owner', ownerSchema);

export default Owner;