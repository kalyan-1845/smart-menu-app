import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 
import compression from 'compression'; // ✅ ADDED for 3x faster data loading
// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();
const httpServer = createServer(app);

// 🚀 INDUSTRIAL UPGRADE: COMPRESSION
// Shrinks JSON data sent to mobile phones (Starters/Main Course lists load faster)
app.use(compression());

// --- 🔒 SECURITY: ALLOWED ORIGINS ---
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app"
];

// ☢️ NUCLEAR CORS FIX (RETAINED)
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

// 🛡️ STANDARD CORS (RETAINED)
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

// 🛡️ Rate Limiter - Industrial Setting
// Prevents API crashes when thousands of customers open the menu at once
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 2000, // Increased for massive scale
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many orders from this IP, please wait a moment."
});
app.use("/api/", limiter); 

// 🔌 Socket.io Setup - High Resiliency
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    pingTimeout: 60000, // ✅ Increased to prevent mobile disconnects
    pingInterval: 25000
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 🏗️ DATABASE: INDUSTRIAL CONNECTION POOLING ---
// This ensures MongoDB can handle thousands of simultaneous orders
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 100,             // Allow 100 simultaneous DB workers
    minPoolSize: 10,              // Always keep 10 connections "Warm"
    socketTimeoutMS: 45000,       // Close dead connections after 45s
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ High-Scale MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);
// Removed the redundant '/api/menu' line here to keep it clean

app.get('/', (req, res) => res.send('BiteBox API v3 Industrial is Running...'));

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- SOCKETS (SaaS Isolated Logic) ---
io.on('connection', (socket) => {
    // 📱 Mobile Socket Fix: Ensures identity persists on reconnection
    const rid = socket.handshake.query.restaurantId;
    if (rid) {
        socket.join(rid);
        console.log(`Auto-Joined Room on Reconnect: ${rid}`);
    }

    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
        console.log(`Connection established for Shop: ${restaurantId}`);
    });

    socket.on('join-owner-room', (ownerId) => socket.join(ownerId));

    socket.on("call-waiter", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId).emit("new-waiter-call", data);
        }
    });

    socket.on("resolve-call", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId).emit("call-resolved", data);
        }
    });

    // 👨‍🍳 Chef Alert Logic
    socket.on("chef-ready-alert", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId).emit("chef-ready-alert", data);
        }
    });
});

// --- SELF PING (Keep Alive) ---
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {
        // Keep alive ping
    }).on("error", (e) => {});
}, 840000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 High-Performance Server running on port ${PORT}`);
});