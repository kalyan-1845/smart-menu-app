import 'dotenv/config'; // Must stay at the very top
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

// --- INITIALIZATION ---
const app = express();
const httpServer = createServer(app);

// --- 🔒 SECURITY: RATE LIMITER ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
    message: "Too many requests from this IP, please try again later."
});

// --- 🔒 SECURITY: CORS CONFIG ---
// Add ALL your frontend URLs here
const allowedOrigins = [
    "http://localhost:5173",           // Local development
    "https://smartmenuss.netlify.app", // Your Main Netlify Site
    // Add any other deployment URLs if you have them (e.g., https://your-custom-domain.com)
];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// --- 1. MIDDLEWARE ---
app.use(limiter); 

app.use(cors({ 
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin); // Helpful for debugging
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    credentials: true 
}));

// Increase payload limit for image uploads
app.use(express.json({ limit: '10mb' })); 

// Attach Socket.io to req so routes can use it
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 2. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Engine: Connected"))
    .catch((err) => console.error("❌ Database Engine Error:", err));

// --- 3. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

// Test Route
app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.8 Active...'));

// --- 4. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Global Error:", err); // Log the error to server console
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 5. SOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Connection Established: ${socket.id}`);

    // Allow owners to join their private room
    socket.on('join-owner-room', (ownerId) => {
        socket.join(ownerId);
        console.log(`🏠 Owner joined private room: ${ownerId}`);
    });

    // Handle call resolutions
    socket.on("resolve-call", (data) => {
        io.emit("call-resolved", data);
    });

    socket.on('disconnect', () => console.log('⚡ Connection Terminated'));
});

// --- 6. START SERVER ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Production Server running on port ${PORT}`);
});

// --- 7. SELF-PING (KEEP ALIVE) ---
// This prevents Render free tier from sleeping
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 

setInterval(() => {
    https.get(renderUrl, (res) => {
        console.log(`Self-ping sent to ${renderUrl} - Status: ${res.statusCode}`);
    }).on("error", (e) => {
        console.error(`Self-ping error: ${e.message}`);
    });
}, 840000); // Ping every 14 minutes