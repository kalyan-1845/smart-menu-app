import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Owner from './models/Owner.js';

dotenv.config();

const createOwner = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB for Admin setup...");

    // 2. Clear existing owners (Optional - use carefully!)
    // await Owner.deleteMany(); 

    // 3. Set the 60-day trial date for the master admin
    const trialDate = new Date();
    trialDate.setDate(trialDate.getDate() + 60);

    // 4. Create the Admin with required v2.8 fields
    const admin = await Owner.create({
      restaurantName: "Smart Menu HQ",
      username: "admin",
      email: "admin@smartmenu.com",
      password: "password123", // Will be hashed automatically by OwnerSchema.pre('save')
      trialEndsAt: trialDate,
      isPro: true, // Master admin should be PRO
      status: "Active"
    });

    console.log(`
    ✅ MASTER ADMIN CREATED SUCCESSFULLY
    ------------------------------------
    Restaurant : ${admin.restaurantName}
    ID         : ${admin.username}
    Password   : password123
    Trial Ends : ${admin.trialEndsAt.toDateString()}
    ------------------------------------
    `);

    process.exit();
  } catch (error) {
    console.error(`❌ Setup Error: ${error.message}`);
    process.exit(1);
  }
};

createOwner();