import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 
import compression from 'compression'; // ✅ 1. Speed Boost Import

// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js'; 
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; 

const app = express();
const httpServer = createServer(app);

// ✅ 2. ACTIVATE COMPRESSION (Makes data 70% smaller/faster)
app.use(compression());

// ============================================================
// ☢️ NUCLEAR CORS FIX (ALLOWS EVERYONE)
// ============================================================
app.use(cors({
    origin: true, // ✅ Allows any Netlify/Localhost link
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// --- MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter); 

// --- SOCKET.IO SETUP ---
const io = new Server(httpServer, {
    cors: {
        origin: "*", // ✅ Allows sockets from anywhere
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// CRITICAL: Attach Socket to App
app.set('socketio', io); 
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
    // console.log(`🔌 Client Connected: ${socket.id}`); // Commented out for speed

    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
    });

    socket.on('join-super-admin', () => {
        socket.join('super-admin-room');
    });

    socket.on('disconnect', () => {
        // console.log('❌ Client Disconnected');
    });
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

// ============================================================
// ⏰ KEEP ALIVE (PREVENTS SERVER SLEEPING)
// ============================================================
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 

// Ping every 10 minutes (600,000 ms) to keep Render awake
setInterval(() => {
    https.get(pingUrl, (res) => {
        console.log("⏰ Keep-Alive Ping sent.");
    }).on("error", (e) => {
        console.error("Ping failed:", e.message);
    });
}, 600000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 BiteBox Server running on port ${PORT}`);
});