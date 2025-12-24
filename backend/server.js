import 'dotenv/config'; // Loads your MONGO_URI and other secrets
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 

// --- 1. ROUTE IMPORTS ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();
const httpServer = createServer(app);

// ✅ Required for Rate Limiting to work correctly on Render/Netlify
app.set('trust proxy', 1);

// --- 🔒 SECURITY: RATE LIMITER ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true, 
    legacyHeaders: false, 
    message: "Too many requests from this IP, please try again later."
});

// --- 🔒 SECURITY: CORS CONFIG ---
// This fixes the "Blocked by CORS" error on your Netlify frontend
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// --- 2. MIDDLEWARE ---
app.use(limiter); 

app.use(cors({ 
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);
        
        // Dynamic check for main domains or Netlify preview subdomains
        const isNetlifyPreview = /\.netlify\.app$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isNetlifyPreview) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    credentials: true 
}));

app.use(express.json({ limit: '10mb' })); // Allows image uploads up to 10mb

// Attach Socket.io to request so routes can trigger real-time events
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Engine: Connected"))
    .catch((err) => console.error("❌ Database Engine Error:", err));

// --- 4. API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

// Health Check
app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.8 Active...'));

// --- 5. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Global Error Log:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 6. SOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Socket Connected: ${socket.id}`);

    // Kitchen/Waiter joining their specific restaurant room
    socket.on('join-owner-room', (ownerId) => {
        socket.join(ownerId);
        console.log(`🏠 Room Joined: ${ownerId}`);
    });

    // Real-time table assistance resolution
    socket.on("resolve-call", (data) => {
        io.emit("call-resolved", data);
    });

    socket.on('disconnect', () => console.log('⚡ Socket Disconnected'));
});

// --- 7. START SERVER ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Production Server running on port ${PORT}`);
});

// --- 8. SELF-PING (RENDER KEEP-ALIVE) ---
// This prevents Render's free tier from going to sleep every 15 minutes
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 

setInterval(() => {
    https.get(renderUrl, (res) => {
        console.log(`Self-ping - Status: ${res.statusCode}`);
    }).on("error", (e) => {
        console.error(`Self-ping failed: ${e.message}`);
    });
}, 840000); // Sends a ping every 14 minutes

// --- 9. GRACEFUL SHUTDOWN ---
process.on('SIGINT', async () => {
    console.log("Shutting down gracefully...");
    await mongoose.connection.close();
    process.exit(0);
});