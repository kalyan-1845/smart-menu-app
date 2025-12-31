import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 

// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();
const httpServer = createServer(app);

// --- 🔒 SECURITY: ALLOWED ORIGINS ---
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app"
];

// ============================================================
// ☢️ NUCLEAR CORS FIX (LAYER 1: MANUAL HEADERS) - RETAINED
// ============================================================
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

// ============================================================
// 🛡️ STANDARD CORS (LAYER 2: LIBRARY BACKUP) - RETAINED
// ============================================================
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

// Rate Limiter - Optimized for 1000 users
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, // Increased to support high traffic
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter); 

// Socket.io Setup
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Attach Socket to Request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('API is Running...'));

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- SOCKETS (Isolated Room Logic for 1000 Users) ---
io.on('connection', (socket) => {
    // Allows Owner/Admin to listen for new orders in their specific shop
    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
        console.log(`User joined Shop Room: ${restaurantId}`);
    });

    socket.on('join-owner-room', (ownerId) => socket.join(ownerId));

    // Handle resolve-call events for specific shops
    socket.on("resolve-call", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId).emit("call-resolved", data);
        } else {
            io.emit("call-resolved", data);
        }
    });
});

// --- SELF PING (Keep Alive) - RETAINED ---
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {
        // Keep alive ping
    }).on("error", (e) => {});
}, 840000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});