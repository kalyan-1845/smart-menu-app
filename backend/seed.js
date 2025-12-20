import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Dish from './models/Dish.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const sampleDishes = [
  {
    name: "Masala Chai",
    price: 20,
    category: "Beverages",
    description: "Authentic Indian spiced tea with cardamom and ginger.",
    image: "https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Chicken Biryani",
    price: 250,
    category: "Main Course",
    description: "Aromatic basmati rice cooked with tender chicken and spices.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Paneer Butter Masala",
    price: 180,
    category: "Main Course",
    description: "Rich and creamy tomato gravy with soft paneer cubes.",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Veg Burger",
    price: 99,
    category: "Snacks",
    description: "Crispy veg patty with fresh lettuce and cheese.",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Gulab Jamun",
    price: 60,
    category: "Dessert",
    description: "Soft milk dumplings soaked in sugar syrup.",
    image: "https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&w=500&q=60"
  },
  {
    name: "Tandoori Roti",
    price: 25,
    category: "Breads",
    description: "Whole wheat flatbread baked in a clay oven.",
    image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=500&q=60"
  }
];

const importData = async () => {
  try {
    await Dish.deleteMany(); // Clears old data
    await Dish.insertMany(sampleDishes); // Adds new data
    console.log('✅ Menu Loaded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();