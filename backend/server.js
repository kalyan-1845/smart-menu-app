import 'dotenv/config'; 
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 

// --- ROUTE IMPORTS ---
import authRoutes from './routes/authRoutes.js';
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';

const app = express();
const httpServer = createServer(app);

// ✅ CRITICAL: Trust Proxy for Render
app.set('trust proxy', 1);

// --- 1. SECURITY: CORS (MUST BE FIRST!) ---
// If this is not first, the Rate Limiter will block the "Options" check and cause CORS errors.
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app", // Your Netlify Site
];

app.use(cors({ 
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        // Allow allowedOrigins OR any Netlify subdomain (for previews)
        const isNetlify = /\.netlify\.app$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isNetlify) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle Preflight Requests explicitly
app.options('*', cors());

// --- 2. SECURITY: RATE LIMITER (AFTER CORS) ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 300, // Increased to prevent blocking legitimate traffic
    standardHeaders: true, 
    legacyHeaders: false, 
    message: "Too many requests, please try again later."
});

app.use(limiter); 

// --- 3. STANDARD MIDDLEWARE ---
app.use(express.json({ limit: '10mb' })); 

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 4. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Engine: Connected"))
    .catch((err) => console.error("❌ Database Engine Error:", err));

// --- 5. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.9 Active...'));

// --- 6. ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 7. SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Socket: ${socket.id}`);
    socket.on('join-owner-room', (id) => socket.join(id));
    socket.on("resolve-call", (data) => io.emit("call-resolved", data));
    socket.on('disconnect', () => console.log('⚡ Disconnected'));
});

// --- 8. START SERVER ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// --- 9. SELF-PING ---
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(renderUrl, (res) => {
        // Ping success
    }).on("error", (e) => console.error(`Ping Error: ${e.message}`));
}, 840000); 

// --- 10. GRACEFUL SHUTDOWN ---
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});