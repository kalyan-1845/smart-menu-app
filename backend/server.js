import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 

// --- IMPORT ROUTES ---
// ✅ All routes linked to your BiteBox MVP structure
import authRoutes from './routes/authRoutes.js'; 
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; 

const app = express();
const httpServer = createServer(app);

// --- 🔒 SECURITY: ALLOWED ORIGINS ---
// Updated to include your production Netlify URL
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app"
];

// ============================================================
// ☢️ NUCLEAR CORS FIX (LAYER 1: MANUAL HEADERS)
// Ensures cross-origin requests work across all mobile browsers
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
// 🛡️ STANDARD CORS (LAYER 2: LIBRARY BACKUP)
// ============================================================
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

// Rate limiter set for busy restaurant hours
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter); 

// --- SOCKET.IO SETUP ---
// Critical for live Chef/Waiter notifications
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Attach Socket to Request for use in Controllers (e.g., when a new order is placed)
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
app.use('/api/support', supportRoutes); 

app.get('/', (req, res) => res.send('BiteBox Smart Menu API Active'));

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log(`🔌 Client Connected: ${socket.id}`);

    // Multi-tenant room logic: Ensures orders only go to the correct restaurant
    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
        console.log(`User joined restaurant room: ${restaurantId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Client Disconnected');
    });
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- SELF PING (Render Keep-Alive) ---
// Prevents the server from sleeping on free hosting like Render
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {
        console.log("Ping sent to keep server awake");
    }).on("error", (e) => {
        console.error("Ping error");
    });
}, 840000); // 14 minutes

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 BiteBox Server running on port ${PORT}`);
});