import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 
import compression from 'compression'; 

// --- IMPORT MODELS (Needed for Debugging) ---
import Owner from './models/Owner.js'; // ✅ ADDED THIS

// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();
const httpServer = createServer(app);

// 🚀 INDUSTRIAL UPGRADE: COMPRESSION
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

// 🛡️ Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 2000, 
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many orders from this IP, please wait a moment."
});
app.use("/api/", limiter); 

// 🔌 Socket.io Setup
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    pingTimeout: 60000, 
    pingInterval: 25000
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 🏗️ DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 100,            
    minPoolSize: 10,             
    socketTimeoutMS: 45000,      
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log("✅ High-Scale MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Error:", err));


// =============================================================
// 🛑 DEBUG ROUTE: CHECK DATABASE (ADDED HERE)
// =============================================================
app.get('/api/check-db', async (req, res) => {
    try {
        const users = await Owner.find({});
        res.json({
            count: users.length,
            message: "Here is the raw data from MongoDB",
            users: users
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// =============================================================


// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('BiteBox API v4 (Debug Mode) is Running...'));

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Server Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- SOCKETS ---
io.on('connection', (socket) => {
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

    socket.on("chef-ready-alert", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId).emit("chef-ready-alert", data);
        }
    });
});

// --- SELF PING ---
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {}).on("error", (e) => {});
}, 840000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 High-Performance Server running on port ${PORT}`);
});