const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Owner = require('./models/Owner');
const Dish = require('./models/Dish');
const Order = require('./models/Order');

const sampleDishes = [
  {
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken pieces',
    price: 420,
    category: 'main-course',
    cuisine: 'Indian',
    preparationTime: 25,
    isVegetarian: false,
    isSpicy: true,
    isAvailable: true
  },
  {
    name: 'Paneer Tikka',
    description: 'Grilled cottage cheese cubes marinated in spices',
    price: 320,
    category: 'appetizer',
    cuisine: 'Indian',
    preparationTime: 15,
    isVegetarian: true,
    isSpicy: true,
    isAvailable: true
  },
  {
    name: 'Garlic Naan',
    description: 'Soft leavened bread with garlic butter',
    price: 60,
    category: 'main-course',
    cuisine: 'Indian',
    preparationTime: 10,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true
  },
  {
    name: 'Mango Lassi',
    description: 'Refreshing yogurt drink with mango pulp',
    price: 120,
    category: 'beverage',
    cuisine: 'Indian',
    preparationTime: 5,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true
  },
  {
    name: 'Chocolate Brownie',
    description: 'Warm chocolate brownie with ice cream',
    price: 180,
    category: 'dessert',
    cuisine: 'International',
    preparationTime: 10,
    isVegetarian: true,
    isSpicy: false,
    isAvailable: true
  }
];

const sampleOrders = [
  {
    customerName: 'John Doe',
    customerPhone: '9876543210',
    tableNumber: 'Table 5',
    orderType: 'dine-in',
    items: [
      { dishId: null, quantity: 2, price: 420, total: 840 },
      { dishId: null, quantity: 3, price: 60, total: 180 }
    ],
    totalAmount: 1020,
    finalAmount: 1020,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'cash'
  },
  {
    customerName: 'Jane Smith',
    customerPhone: '9876543211',
    orderType: 'delivery',
    items: [
      { dishId: null, quantity: 1, price: 320, total: 320 },
      { dishId: null, quantity: 1, price: 420, total: 420 }
    ],
    totalAmount: 740,
    finalAmount: 740,
    status: 'preparing',
    paymentStatus: 'paid',
    paymentMethod: 'online'
  }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bitebox');
    console.log('✅ Connected to MongoDB for seeding');
    
    // Clear existing data
    await Owner.deleteMany({});
    await Dish.deleteMany({});
    await Order.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Create super admin owner
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    const owner = new Owner({
      email: 'admin@bitebox.com',
      password: hashedPassword,
      name: 'Admin User',
      restaurantName: 'BiteBox HQ',
      phone: '1234567890',
      address: '123 Admin Street, City',
      role: 'super-admin'
    });
    
    await owner.save();
    console.log('👑 Created super admin');
    
    // Create sample dishes
    for (let dish of sampleDishes) {
      dish.restaurantId = owner._id;
      const newDish = new Dish(dish);
      await newDish.save();
      // Update the dishId in sample orders
      sampleDishes[sampleDishes.indexOf(dish)] = newDish;
    }
    console.log('🍽️  Created sample dishes');
    
    // Create sample orders
    for (let order of sampleOrders) {
      order.restaurantId = owner._id;
      // Assign dish IDs to order items
      order.items.forEach((item, index) => {
        if (index < sampleDishes.length) {
          item.dishId = sampleDishes[index]._id;
        }
      });
      const newOrder = new Order(order);
      await newOrder.save();
    }
    console.log('📋 Created sample orders');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Email: admin@bitebox.com');
    console.log('   Password: admin123');
    console.log('\n🚀 Server ready to run!');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();