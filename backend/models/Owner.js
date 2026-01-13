import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // --- 🏢 RESTAURANT IDENTITY ---
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  
  // --- 📞 CEO CONTACT ---
  phoneNumber: { type: String, default: "" },

  // --- 📈 SAAS ANALYTICS ---
  totalRevenue: { type: Number, default: 0 },

  // --- 📧 OPTIONAL CONTACT ---
  email: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  
  // 🏆 PRO STATUS (Top Level for easier access)
  isPro: { type: Boolean, default: true },

  // --- 🕹️ CEO MASTER SWITCHES (God Mode) ---
  settings: {
    menuActive: { type: Boolean, default: true },  // Turn OFF -> Customers see "Suspended"
    ownerActive: { type: Boolean, default: true }, // Turn OFF -> Blocks Admin Login
    // ❌ REMOVED: chefActive (No longer needed)
  },

  // --- 📓 PRIVATE CEO INTELLIGENCE ---
  ceoNotes: { type: String, default: "" }, 

  // --- 🎁 BUSINESS MODEL ---
  trialEndsAt: { 
    type: Date,
    // ✅ DEFAULT: 100 Years from now (The "Forever" Plan)
    default: () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 100);
        return d;
    }
  },

  // ❌ REMOVED: waiterPassword & chefPassword

  // ✅ PUSH NOTIFICATIONS (For Order Alerts)
  pushSubscriptions: { 
    type: [Object], 
    default: [] 
  } 

}, { timestamps: true });

// --- 🔐 SECURITY: PASSWORD HASHING ---
ownerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) { next(error); }
});

// --- 🔑 CHECK PASSWORD METHOD ---
ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
export default Owner;