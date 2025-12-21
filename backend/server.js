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

// --- 🔒 SECURITY CONFIGURATION (CORS) ---
// ✅ FIXED: Cleaned the allowed origins to remove mangled strings
const allowedOrigins = [
    "http://localhost:5173",           // Local development
    "https://smartmenuss.netlify.app"   // Your live Netlify website
];

// Initialize Socket.io with clean CORS
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// 1. MIDDLEWARE
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json()); // Allow reading JSON body data

// 2. SOCKET MIDDLEWARE
// Attach socket instance to every request so routes can trigger real-time alerts
app.use((req, res, next) => {
    req.io = io;
    next();
});

// 3. DATABASE CONNECTION
// Ensure your Render Environment Variable 'MONGO_URI' is active
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smartmenu")
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// 4. ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);

// 5. TEST ROUTE
app.get('/', (req, res) => {
    res.send('Smart Menu API is Live...');
});

// 6. SOCKET CONNECTION LOGGING
io.on('connection', (socket) => {
    console.log('⚡ Client Connected: ' + socket.id);
    
    // Listen for manual resolving of waiter calls from the dashboard
    socket.on("resolve-call", (data) => {
        io.emit("call-resolved", data);
    });

    socket.on('disconnect', () => {
        console.log('⚡ Client Disconnected');
    });
});

// 7. START SERVER
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});