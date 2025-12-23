import 'dotenv/config'; // Must stay at the very top for VAPID/DB keys
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

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
// Fixed to include your specific Netlify preview URL
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
    "https://694915c413d9f40008f38924--smartmenuss.netlify.app" // Added this to fix your error
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
        // Allow requests with no origin (like mobile apps) or if in allowedOrigins
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    credentials: true 
}));

app.use(express.json({ limit: '10mb' })); 

// Attach Socket.io to req
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
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 5. SOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Connection Established: ${socket.id}`);

    socket.on('join-owner-room', (ownerId) => {
        socket.join(ownerId);
        console.log(`🏠 Owner joined private room: ${ownerId}`);
    });

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



// --- PASTE THIS AT THE BOTTOM OF YOUR SERVER FILE ---

const https = require("https");

const url = "https://smart-menu-backend-5ge7.onrender.com/api/products"; 

// Ping the server every 14 minutes (840,000 ms) 
// Render sleeps after 15 mins of inactivity, so 14 mins is safe.
setInterval(() => {
  https.get(url, (res) => {
    console.log(`Self-ping sent to ${url} - Status: ${res.statusCode}`);
  }).on("error", (e) => {
    console.error(`Self-ping error: ${e.message}`);
  });
}, 840000); 

// ----------------------------------------------------