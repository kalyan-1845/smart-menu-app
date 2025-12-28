import mongoose from "mongoose";
import dotenv from "dotenv";

import Owner from "./models/Owner.js";
import Dish from "./models/Dish.js";

dotenv.config();

/* =========================
   SEED CONFIG
========================= */
const SEED_CONFIG = {
  admin: {
    restaurantName: "BiteBox Demo Restaurant",
    username: "admin",
    email: "admin@bitebox.com",
    password: "password123",
    isPro: true,
  },

  dishes: [
    {
      name: "Masala Chai",
      price: 20,
      category: "Beverages",
      description: "Authentic Indian spiced tea with cardamom and ginger.",
      image:
        "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=500",
    },
    {
      name: "Chicken Biryani",
      price: 250,
      category: "Main Course",
      description:
        "Aromatic basmati rice cooked with tender chicken and spices.",
      image:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
    },
    {
      name: "Veg Burger",
      price: 99,
      category: "Fast Food",
      description: "Crispy veg patty with fresh lettuce and cheese.",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
    },
  ],
};

/* =========================
   SEED FUNCTION
========================= */
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 MongoDB connected for seeding");

    /* ---------- Owner ---------- */
    await Owner.deleteMany({ username: SEED_CONFIG.admin.username });

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 60);

    const owner = await Owner.create({
      ...SEED_CONFIG.admin,
      trialEndsAt,
      status: "Active",
    });

    /* ---------- Dishes ---------- */
    await Dish.deleteMany({ owner: owner._id });

    const dishes = SEED_CONFIG.dishes.map((dish) => ({
      ...dish,
      owner: owner._id,
      isAvailable: true,
    }));

    await Dish.insertMany(dishes);

    console.log("✅ DATABASE SEEDED SUCCESSFULLY");
    console.log("🔐 LOGIN DETAILS");
    console.log("Username: admin");
    console.log("Password: password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ SEEDING FAILED:", error.message);
    process.exit(1);
  }
};

seedDatabase();
