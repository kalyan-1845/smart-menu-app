const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Owner = require('./models/Owner');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bitebox');
    
    const adminEmail = 'admin@bitebox.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await Owner.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('   You can use the existing credentials');
      process.exit(0);
    }
    
    // Create new admin
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const admin = new Owner({
      email: adminEmail,
      password: hashedPassword,
      name: 'System Administrator',
      restaurantName: 'BiteBox System',
      phone: '0000000000',
      address: 'System Address',
      role: 'super-admin',
      isVerified: true
    });
    
    await admin.save();
    
    console.log('✅ Super Admin created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🚀 Use these credentials to login');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();