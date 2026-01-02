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
import menuRoutes from './routes/menuRoutes.js'; 

const app = express();

// 🔴 CRITICAL FIX FOR RENDER: TRUST PROXY
// This fixes the "ERR_ERL_UNEXPECTED_X_FORWARDED_FOR" crash
app.set('trust proxy', 1);

const httpServer = createServer(app);

// ==========================================
// 🟢 CORS CONFIGURATION
// ==========================================
const allowedOrigins = [
    "http://localhost:5173",           
    "http://localhost:3000",
    "https://smartmenuss.netlify.app"
];

// Regex to match ANY Netlify deploy preview
const deployPreviewPattern = /^https:\/\/.*--smartmenuss\.netlify\.app$/;

const isOriginAllowed = (origin) => {
    if (!origin) return true; // Allow backend-to-backend calls (no origin)
    return allowedOrigins.includes(origin) || deployPreviewPattern.test(origin);
};

// 1. MANUAL HEADERS (SAFE MODE)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // 🛑 Strictly check if origin exists before setting it
    if (origin && isOriginAllowed(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

// 2. CORS LIBRARY
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.log("🚫 Blocked by CORS:", origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: '10mb' })); 

// Rate Limiter (Now safe with trust proxy enabled)
const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    standardHeaders: true, 
    legacyHeaders: false,
    validate: { xForwardedForHeader: false } // Extra safety to silence proxy warnings
});
app.use(limiter); 

// Socket.io Setup
const io = new Server(httpServer, {
    cors: { 
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE"], 
        credentials: true 
    }
});

// Make 'req.io' available in routes
app.use((req, res, next) => { req.io = io; next(); });

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
app.use('/api/menu', menuRoutes);

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

// --- SOCKETS ---
io.on('connection', (socket) => {
    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId.toString());
        console.log(`User joined private room: ${restaurantId}`);
    });

    socket.on('join-owner-room', (ownerId) => socket.join(ownerId.toString()));

    socket.on("call-waiter", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId.toString()).emit("new-waiter-call", data);
        }
    });

    socket.on("chef-ready-alert", (data) => {
        if (data.restaurantId) {
            io.to(data.restaurantId.toString()).emit("chef-ready-alert", data);
            console.log(`Chef Ready alert emitted to restaurant: ${data.restaurantId}`);
        }
    });

    socket.on("resolve-call", (data) => {
        if(data.restaurantId) {
            io.to(data.restaurantId.toString()).emit("call-resolved", data);
        } else {
            io.emit("call-resolved", data);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// --- SELF PING (Keep Alive) ---
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {}).on("error", (e) => {});
}, 840000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));