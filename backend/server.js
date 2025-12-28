import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import https from "https"; 
import compression from 'compression'; 

// --- IMPORT ROUTES ---
import authRoutes from './routes/authRoutes.js'; 
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; 

const app = express();
const httpServer = createServer(app);

// ✅ 1. SPEED BOOST
app.use(compression());

// ✅ 2. NUCLEAR CORS FIX (Allows all connections)
app.use(cors({
    origin: true, 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json({ limit: '10mb' })); 

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter); 

const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

app.set('socketio', io); 
app.use((req, res, next) => {
    req.io = io;
    next();
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/support', supportRoutes); 

app.get('/', (req, res) => res.send('BiteBox Smart Menu API Active'));

io.on('connection', (socket) => {
    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
    });

    socket.on('join-super-admin', () => {
        socket.join('super-admin-room');
    });
});

app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

// ✅ 3. KEEP ALIVE (Server never sleeps)
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {
        console.log("⏰ Ping Sent");
    }).on("error", (e) => {});
}, 600000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 BiteBox Server running on port ${PORT}`);
});