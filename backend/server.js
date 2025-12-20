import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http'; // Required for Socket.io
import { Server } from 'socket.io';  // Required for Real-time features

// Import Routes
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// Load Config
dotenv.config();

// Initialize Express
const app = express();

// Create HTTP Server (wraps Express)
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // Allow your React Frontend
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// 1. MIDDLEWARE
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow reading JSON body data

// 2. SOCKET MIDDLEWARE
// This lets your routes (like orderRoutes) send real-time alerts using 'req.io'
app.use((req, res, next) => {
    req.io = io;
    next();
});

// 3. DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartmenu")
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 4. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);

// 5. TEST ROUTE
app.get('/', (req, res) => {
    res.send('API is running...');
});

// 6. SOCKET CONNECTION CHECK
io.on('connection', (socket) => {
    console.log('⚡ A client connected: ' + socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});