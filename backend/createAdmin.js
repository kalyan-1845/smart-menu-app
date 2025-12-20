import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Owner from './models/Owner.js';
import connectDB from './config/db.js';

dotenv.config();

const createOwner = async () => {
  try {
    // 👇 THIS IS THE FIX: We wait for the connection first!
    await connectDB(); 

    // Check if admin already exists
    await Owner.deleteMany(); 
    
    const admin = await Owner.create({
      username: "admin",
      password: "password123" // You can change this if you want
    });

    console.log(`✅ Admin Created: ${admin.username} / password123`);
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

createOwner();