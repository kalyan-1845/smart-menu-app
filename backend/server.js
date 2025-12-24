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

// ✅ CRITICAL FOR RENDER DEPLOYMENTS
app.set('trust proxy', 1);

// --- 🔒 SECURITY: RATE LIMITER ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, // Increased limit to prevent blocking legitimate traffic during testing
    standardHeaders: true, 
    legacyHeaders: false, 
});

// --- 🔒 SECURITY: CORS CONFIG ---
const allowedOrigins = [
    "http://localhost:5173",           
    "https://smartmenuss.netlify.app", // Your Main Netlify Site
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
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // Allow specific origins OR any Netlify preview deployment
        const isNetlify = /\.netlify\.app$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isNetlify) {
            callback(null, true);
        } else {
            console.log("Blocked by CORS:", origin);
            callback(new Error('CORS Policy: Origin not allowed'));
        }
    }, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Explicit methods
    allowedHeaders: ["Content-Type", "Authorization"] // Explicit headers
}));

// Handle Preflight Requests explicitly
app.options('*', cors());

app.use(express.json({ limit: '10mb' })); 

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 2. DATABASE ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Database Engine: Connected"))
    .catch((err) => console.error("❌ Database Engine Error:", err));

// --- 3. ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.get('/', (req, res) => res.send('Smart Menu Cloud API v2.8 Active...'));

// --- 4. ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error("Global Error:", err.message); 
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

// --- 5. SOCKETS ---
io.on('connection', (socket) => {
    console.log(`⚡ Socket: ${socket.id}`);
    socket.on('join-owner-room', (id) => socket.join(id));
    socket.on("resolve-call", (data) => io.emit("call-resolved", data));
    socket.on('disconnect', () => console.log('⚡ Disconnected'));
});

// --- 6. SERVER START ---
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// --- 7. SELF-PING ---
const renderUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(renderUrl, (res) => {
        // console.log(`Self-ping: ${res.statusCode}`); // Commented out to reduce logs
    }).on("error", (e) => console.error(`Ping Error: ${e.message}`));
}, 840000); 

// --- 8. SHUTDOWN ---
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});