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

// ✅ 1. TRUST PROXY (Required for Render)
app.set('trust proxy', 1);

// --- 🔒 2. CORS CONFIG (MUST BE FIRST) ---
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app",
];

// ✅ CORRECT ORDER: CORS IS NOW AT THE TOP
app.use(cors({ 
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        const isNetlifyPreview = /\.netlify\.app$/.test(origin);
        if (allowedOrigins.indexOf(origin) !== -1 || isNetlifyPreview) {
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

// --- 🔒 3. RATE LIMITER (NOW SECOND) ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later."
});
app.use(limiter); 

// --- 4. JSON PARSER ---
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

app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.9 Active...'));

// --- 7. ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 8. SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log(`⚡ Connection Established: ${socket.id}`);
    socket.on('join-owner-room', (ownerId) => socket.join(ownerId));
    socket.on("resolve-call", (data) => io.emit("call-resolved", data));
    socket.on('disconnect', () => console.log('⚡ Disconnected'));
});

// --- 9. START SERVER ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Production Server running on port ${PORT}`);
});

// --- 10. SELF-PING ---
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(renderUrl, (res) => {
        // console.log(`Ping: ${res.statusCode}`);
    }).on("error", (e) => console.error(`Ping Error: ${e.message}`));
}, 840000);