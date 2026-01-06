import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 
import compression from 'compression'; 

// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();

// ✅ FIX 1: TRUST PROXY (Critical for Render/Heroku)
app.set('trust proxy', 1); 

const httpServer = createServer(app);

// ✅ FIX 2: TURBO KEEP-ALIVE (Fixes Mobile "Network Error" & Lag)
// Render kills connections after 60s. We keep them alive slightly longer to prevent drops.
httpServer.keepAliveTimeout = 120 * 1000; 
httpServer.headersTimeout = 120 * 1000;

// 🚀 INDUSTRIAL UPGRADE: COMPRESSION (Makes JSON responses 70% smaller)
app.use(compression());

// --- 🔒 SECURITY: ALLOWED ORIGINS ---
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",          
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app"
];

// ☢️ NUCLEAR CORS FIX
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") { return res.status(200).end(); }
    next();
});

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: '10mb' })); 

// 🛡️ Rate Limiter (Generous limits to prevent blocking legitimate users)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 3000, // Increased to 3000 to prevent blocking busy restaurants
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please slow down."
});
app.use("/api/", limiter); 

// ✅ FIX 3: SMART CACHING (Speeds up Menu Loading)
// Applies only to GET requests. tells browser: "Don't ask server for 60 seconds"
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=60, s-maxage=60'); 
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
});

// 🔌 Socket.io Setup (Optimized for Mobile)
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['polling', 'websocket'], // Force support for both
    pingTimeout: 60000, 
    pingInterval: 25000
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 🏗️ DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 50, // Reduced slightly to prevent hitting free tier limits            
    minPoolSize: 5,             
    socketTimeoutMS: 45000,      
    serverSelectionTimeoutMS: 5000,
    family: 4 // Force IPv4 (Faster on some networks)
})
.then(() => console.log("✅ MongoDB Connected (Optimized)"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('BiteBox API v6 (Speed Optimized) is Running...'));

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- SOCKET EVENTS ---
io.on('connection', (socket) => {
    const rid = socket.handshake.query.restaurantId;
    if (rid) {
        socket.join(rid);
        console.log(`Socket Reconnected: ${rid}`);
    }

    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
    });

    socket.on('join-owner-room', (ownerId) => socket.join(ownerId));

    socket.on("call-waiter", (data) => {
        if(data.restaurantId) io.to(data.restaurantId).emit("new-waiter-call", data);
    });

    socket.on("resolve-call", (data) => {
        if(data.restaurantId) io.to(data.restaurantId).emit("call-resolved", data);
    });

    socket.on("chef-ready-alert", (data) => {
        if(data.restaurantId) io.to(data.restaurantId).emit("chef-ready-alert", data);
    });
    
    // NEW: Order update relay
    socket.on("new-order", (data) => {
        if(data.restaurantId) io.to(data.restaurantId).emit("new-order", data);
    });
});

// ✅ FIX 4: AGGRESSIVE SELF PING (Every 5 Minutes)
// This keeps the server "Hot" so it never sleeps on Render Free Tier.
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    console.log("🔥 Keeping Server Awake...");
    https.get(pingUrl, (res) => {
        // Just consume the stream to keep it active
        res.on('data', () => {});
    }).on("error", (e) => {
        console.error("Ping Error (Ignored):", e.message);
    });
}, 300000); // 300,000 ms = 5 Minutes

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Speed Server running on port ${PORT}`);
});