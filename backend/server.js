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

const app = express();
const httpServer = createServer(app);

// ✅ MANDATORY for Render: Allows Express to see the real IP behind the proxy
app.set('trust proxy', 1);

// --- 🔒 1. CORS CONFIGURATION (Must be at the top) ---
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
];

app.use(cors({ 
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps/Postman)
        if (!origin) return callback(null, true);
        
        // Allow main domains or Netlify preview links
        const isNetlifyPreview = /\.netlify\.app$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isNetlifyPreview) {
            callback(null, true);
        } else {
            console.log("❌ Blocked by CORS:", origin);
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    optionsSuccessStatus: 200 // Essential for legacy browser support
}));

// --- 🔒 2. RATE LIMITER (After CORS) ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { message: "Too many requests, please try again in 15 minutes." }
});

app.use(limiter); 

// --- 3. STANDARD MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

// --- 4. SOCKET.IO SETUP ---
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Pass Socket.io to every request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 5. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Engine: Connected"))
    .catch((err) => console.error("❌ Database Engine Error:", err));

// --- 6. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.8 Active...'));

// --- 7. GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
    if (err.message === 'CORS Policy: Origin not allowed') {
        return res.status(403).json({ error: err.message });
    }
    
    console.error("Global Error Log:", err.stack); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 8. SOCKET CONNECTION LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Socket Connected: ${socket.id}`);

    socket.on('join-owner-room', (ownerId) => {
        socket.join(ownerId);
        console.log(`🏠 Joined private room: ${ownerId}`);
    });

    socket.on("resolve-call", (data) => {
        io.emit("call-resolved", data);
    });

    socket.on('disconnect', () => console.log('⚡ Socket Disconnected'));
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Smart Menu Server active on port ${PORT}`);
});

// --- 10. SELF-PING (Keep-Alive for Render Free Tier) ---
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(renderUrl, (res) => {
        console.log(`Ping status: ${res.statusCode}`);
    }).on("error", (e) => {
        console.error(`Ping error: ${e.message}`);
    });
}, 840000); // 14 Minutes