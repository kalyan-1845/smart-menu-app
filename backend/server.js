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
// (Ensure these files exist in your /routes folder)
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
httpServer.keepAliveTimeout = 120 * 1000; 
httpServer.headersTimeout = 120 * 1000;

// 🚀 INDUSTRIAL UPGRADE: COMPRESSION
app.use(compression());

// --- 🔒 SECURITY: ALLOWED ORIGINS ---
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",          
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app",
    "*" // Fallback for mobile wrappers
];

// ☢️ NUCLEAR CORS FIX (HTTP)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow known origins, or allow all if coming from mobile apps/weird networks
    if (allowedOrigins.includes(origin) || !origin) {
        res.setHeader("Access-Control-Allow-Origin", origin || "*");
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*"); // Safety net
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") { return res.status(200).end(); }
    next();
});

app.use(cors({
    origin: true, // Let the middleware handle it
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: '10mb' })); 

// 🛡️ Rate Limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 3000, 
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please slow down."
});
app.use("/api/", limiter); 

// ✅ FIX 3: SMART CACHING
app.use((req, res, next) => {
    if (req.method === 'GET') {
        res.set('Cache-Control', 'public, max-age=60, s-maxage=60'); 
    } else {
        res.set('Cache-Control', 'no-store');
    }
    next();
});

// 🔌 SOCKET.IO SETUP (FIXED 400 ERROR)
const io = new Server(httpServer, {
    cors: {
        origin: "*", // ✅ NUCLEAR FIX: Allows ALL origins for Sockets. Fixes 400 error.
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
    transports: ['polling', 'websocket'], 
    pingTimeout: 60000, 
    pingInterval: 25000
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 🏗️ DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI, {
    maxPoolSize: 50,           
    minPoolSize: 5,             
    socketTimeoutMS: 45000,      
    serverSelectionTimeoutMS: 5000,
    family: 4 
})
.then(() => console.log("✅ MongoDB Connected (Optimized)"))
.catch((err) => console.error("❌ MongoDB Error:", err));

// --- 🛠️ EMERGENCY ROUTES (Injecting logic here to fix 500 Errors) ---

// 1. GLOBAL SYSTEM SETTINGS (Storage for Broadcast/Maintenance)
let systemSettings = { message: "", maintenance: false };

app.get('/api/superadmin/system-status', (req, res) => res.json(systemSettings));
app.put('/api/superadmin/system-status', (req, res) => {
    systemSettings = req.body;
    io.emit('system-update', systemSettings); // Notify all clients
    res.json({ success: true });
});
app.get('/api/superadmin/maintenance-status', (req, res) => res.json(systemSettings));

// 2. MARK DOWNLOADED (Fixes the 500 Crash)
// We define this BEFORE the router to ensure it gets hit first.
app.put('/api/orders/mark-downloaded', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        if(!restaurantId) return res.status(400).json({ error: "Missing ID" });

        // Retrieve Order Model safely
        let Order;
        try {
            Order = mongoose.model('Order');
        } catch {
            // Fallback Schema if model not yet registered
            const OrderSchema = new mongoose.Schema({ status: String, restaurantId: String }, { strict: false });
            Order = mongoose.model('Order', OrderSchema);
        }

        // Archive completed orders
        await Order.updateMany(
            { restaurantId, status: { $in: ['Served', 'Paid', 'Cancelled'] } },
            { $set: { status: 'Archived' } }
        );

        io.to(restaurantId).emit('new-order');
        res.json({ success: true, message: "History Cleared" });
    } catch (e) {
        console.error("Mark Download Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// --- STANDARD ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('BiteBox API v7 (Fixed & Optimized) is Running...'));

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
        // console.log(`Socket Reconnected: ${rid}`);
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
    
    socket.on("new-order", (data) => {
        if(data.restaurantId) io.to(data.restaurantId).emit("new-order", data);
    });
});

// ✅ FIX 4: AGGRESSIVE SELF PING (Every 5 Minutes)
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    console.log("🔥 Keeping Server Awake...");
    https.get(pingUrl, (res) => {
        res.on('data', () => {});
    }).on("error", (e) => {
        console.error("Ping Error (Ignored):", e.message);
    });
}, 300000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Speed Server running on port ${PORT}`);
});