import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        restaurantName: {
            type: String,
            required: true,
        },
        isOwner: {
            type: Boolean,
            required: true,
            default: true, // All users registered here are owners/restaurant accounts
        },
        // Optional: Token for simplicity, though best practice uses JWT outside the model
        ownerToken: {
            type: String,
        },
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

// Middleware to hash the password before saving (pre-save hook)
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password in the database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('Owner', userSchema);

export default User;