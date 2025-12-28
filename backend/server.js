import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import https from "https"; 
import compression from 'compression'; 

// --- ROUTES ---
import authRoutes from './routes/authRoutes.js'; 
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js'; // 🆕 ADDED THIS

const app = express();
const httpServer = createServer(app);

// ✅ 1. SPEED BOOST (Faster loading for launch)
app.use(compression());

// ✅ 2. NUCLEAR CORS FIX (Allows all Mobiles & Laptops to connect)
app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
}));
app.options('*', cors()); 

// ✅ 3. INCREASED DATA LIMITS (For uploading food images)
app.use(express.json({ limit: '50mb' })); 

// 🚀 NO RATE LIMITER (Deleted for Launch)
// You will NEVER get Error 429 again.

// ✅ 4. SOCKET.IO SETUP (Real-time Orders)
const io = new Server(httpServer, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: false
    }
});

app.set('socketio', io); 
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Error:", err));

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);

// 🆕 WAITER CALL ROUTES (Fixes 404 Error)
// We mount this BEFORE the old broadcast route to catch "/notify" calls first
app.use('/api/broadcast', notificationRoutes); 
app.use('/api/notification', notificationRoutes); // Handles the fallback URL

// Existing Routes
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/support', supportRoutes); 

app.get('/', (req, res) => res.send('BiteBox Server Ready for Launch 🚀'));

// --- SOCKET EVENTS ---
io.on('connection', (socket) => {
    console.log("New Client Connected:", socket.id);
    socket.on('join-restaurant', (restaurantId) => {
        socket.join(restaurantId);
    });
    socket.on('join-super-admin', () => {
        socket.join('super-admin-room');
    });
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({ message: err.message });
});

// ✅ 5. KEEP ALIVE (Prevents Server Sleeping)
const pingUrl = "https://smart-menu-backend-5ge7.onrender.com/"; 
setInterval(() => {
    https.get(pingUrl, (res) => {}).on("error", (e) => {});
}, 600000); 

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});