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
import menuRoutes from './routes/menuRoutes.js'; // Ensure this is imported if you use it

const app = express();
const httpServer = createServer(app);

// ==========================================
// 🟢 CORS FIX: ALLOW ALL NETLIFY PREVIEWS
// ==========================================
const allowedOrigins = [
    "http://localhost:5173",           
    "http://localhost:3000",
    "https://smartmenuss.netlify.app"
];

// Regex to match ANY Netlify deploy preview (e.g., https://123abc--smartmenuss.netlify.app)
const deployPreviewPattern = /^https:\/\/.*--smartmenuss\.netlify\.app$/;

const isOriginAllowed = (origin) => {
    if (!origin) return true; // Allow backend-to-backend calls
    return allowedOrigins.includes(origin) || deployPreviewPattern.test(origin);
};

// 1. MANUAL HEADERS (For strict browsers/mobiles)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (isOriginAllowed(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Origin, X-Requested-With, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

// 2. CORS LIBRARY (The main gatekeeper)
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

// Rate Limiter
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false });
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
// app.use('/api/menu', menuRoutes); // Uncomment if you have this file

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