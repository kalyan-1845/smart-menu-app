import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ownerSchema = new mongoose.Schema({
  // --- 🏢 RESTAURANT IDENTITY ---
  restaurantName: { type: String, required: true },
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  
  // --- 📞 CEO CONTACT (New: For your direct outreach) ---
  phoneNumber: { type: String, default: "" },

  // --- 📈 SAAS ANALYTICS ---
  totalRevenue: { type: Number, default: 0 },

  // --- 📧 OPTIONAL CONTACT ---
  email: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  
  // --- 🕹️ CEO MASTER SWITCHES (God Mode) ---
  // These allow you to turn OFF specific parts of their business
  settings: {
    menuActive: { type: Boolean, default: true },   // You turn this OFF -> Customers see "Suspended"
    chefActive: { type: Boolean, default: true },   // You turn this OFF -> Kitchen Dashboard locks
    ownerActive: { type: Boolean, default: true },  // You turn this OFF -> They can't login to Admin
    isPro: { type: Boolean, default: false }        // Toggle between Free Trial and Paid
  },

  // --- 📓 PRIVATE CEO INTELLIGENCE (New: For your eyes only) ---
  ceoNotes: { type: String, default: "" }, 

  // --- 🎁 BUSINESS MODEL ---
  trialEndsAt: { 
    type: Date,
    default: () => new Date(+new Date() + 7*24*60*60*1000) // Default 7-day trial
  },

  // --- 👨‍🍳 STAFF ACCESS CONTROL ---
  waiterPassword: { type: String, default: "bitebox18" },
  chefPassword: { type: String, default: "bitebox18" },
  
  // ✅ PUSH NOTIFICATIONS
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

ownerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Owner = mongoose.models.Owner || mongoose.model('Owner', ownerSchema);
export default Owner;