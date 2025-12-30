import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Owner from './models/Owner.js';
import Dish from './models/Dish.js';

dotenv.config();

const SEED_CONFIG = {
  admin: {
    restaurantName: "Smart Menu Demo",
    username: "admin",
    email: "admin@smartmenu.com",
    password: "password123",
    isPro: true,
  },
  dishes: [
    {
      name: "Masala Chai",
      price: 20,
      category: "Beverages",
      description: "Authentic Indian spiced tea with cardamom and ginger.",
      image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500",
    },
    {
      name: "Chicken Biryani",
      price: 250,
      category: "Main Course",
      description: "Aromatic basmati rice cooked with tender chicken and spices.",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
    },
    {
      name: "Veg Burger",
      price: 99,
      category: "Snacks",
      description: "Crispy veg patty with fresh lettuce and cheese.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    }
  ]
};

const seedDatabase = async () => {
  try {
    // 1. Connect
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB for seeding...");

    // 2. Clean Existing Data (Optional - be careful in production!)
    await Owner.deleteMany({ username: SEED_CONFIG.admin.username });
    console.log("🧹 Cleaned old admin data.");

    // 3. Setup Trial Expiry (60 Days from today)
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 60);

    // 4. Create Admin
    const admin = await Owner.create({
      ...SEED_CONFIG.admin,
      trialEndsAt: trialDate,
      status: "Active"
    });
    console.log(`👤 Admin created: ${admin.username}`);

    // 5. Link Dishes to Admin ID and Insert
    const dishesWithID = SEED_CONFIG.dishes.map(dish => ({
      ...dish,
      owner: admin._id,
      isAvailable: true
    }));

    await Dish.deleteMany({ owner: admin._id });
    await Dish.insertMany(dishesWithID);
    console.log(`🍔 ${dishesWithID.length} Dishes imported and linked to ${admin.username}`);

    console.log(`
    ✅ SEEDING COMPLETE
    -----------------------------
    Restaurant ID : ${admin.username}
    Password      : password123
    Plan Expiry   : ${admin.trialEndsAt.toDateString()}
    -----------------------------
    `);

    process.exit();
  } catch (error) {
    console.error(`❌ Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();