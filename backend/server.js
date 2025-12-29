import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import compression from 'compression'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/Owner.js'; 
import Order from './models/Order.js';

const app = express();
const httpServer = createServer(app);

// ============================================================
// 🚨 CRITICAL: FIXED CORS CONFIGURATION
// ============================================================
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://smart-menu-backend-5ge7.onrender.com'
];

app.use(cors({ 
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type", 
        "Authorization", 
        "X-Requested-With",
        "Accept",
        "Origin",
        "Cache-Control",
        "X-Request-ID"
    ],
    exposedHeaders: ["Content-Length", "X-Request-ID"],
    credentials: true,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle pre-flight requests
app.options('*', cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(compression());

// ============================================================
// 🔓 SUPER-LOGIN ROUTE (NO DATABASE CHECK FOR PASSWORD)
// ============================================================
app.post('/api/super-login', async (req, res) => {
    console.log("------------------------------------------------");
    console.log("🔥 LOGIN REQUEST RECEIVED");
    console.log("👉 Username:", req.body.username);
    console.log("👉 Password:", req.body.password);

    const { username, password } = req.body;

    // 1. HARDCODED CHECK (If this matches, YOU ARE IN.)
    if (username === "srinivas" && password === "bsr18") {
        console.log("✅ CREDENTIALS MATCHED HARDCODED ADMIN.");

        // 2. We still need a valid MongoDB ID for the token to work in the Dashboard
        let user;
        try {
            user = await User.findOne({ username: "srinivas" });
            if (!user) {
                console.log("⚠️ User not in DB. Creating fallback user...");
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash("bsr18", salt);
                user = await User.create({
                    username: "srinivas",
                    email: "srinivas@bitebox.com",
                    password: hash,
                    role: "superadmin",
                    restaurantName: "BiteBox HQ",
                    isActive: true,
                    isPro: true,
                    trialEndsAt: new Date("2030-01-01"),
                    createdAt: new Date()
                });
            }
        } catch (dbError) {
            console.log("❌ DATABASE ERROR (Ignoring to let you in):", dbError.message);
            // Even if DB fails, we mock a user ID so you can login
            user = { _id: "000000000000000000000000", role: "superadmin" };
        }

        // 3. Issue Token
        const token = jwt.sign(
            { 
                id: user._id, 
                username: "srinivas", 
                role: "superadmin",
                email: user.email || "srinivas@bitebox.com"
            }, 
            process.env.JWT_SECRET || "bitebox_secret", 
            { expiresIn: '7d' }
        );

        console.log("🎟️ TOKEN GENERATED. Sending response...");
        console.log("------------------------------------------------");
        
        // Set CORS headers explicitly
        res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        return res.json({ 
            success: true, 
            token, 
            role: "superadmin",
            user: {
                username: "srinivas",
                email: user.email,
                restaurantName: "BiteBox HQ"
            }
        });
    }

    console.log("❌ ACCESS DENIED. Wrong Credentials.");
    console.log("------------------------------------------------");
    res.status(401).json({ success: false, message: "Invalid Credentials" });
});

// ============================================================
// 🚨 CRITICAL FIX: Token Verification Endpoint
// ============================================================
app.get('/api/verify-token', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                valid: false, 
                message: "No token provided" 
            });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "bitebox_secret");
        
        // Check if user is CEO (srinivas) or superadmin
        if (decoded.username === "srinivas" || decoded.role === "superadmin") {
            return res.json({ 
                valid: true, 
                user: decoded,
                role: decoded.role || "superadmin"
            });
        }
        
        res.status(403).json({ 
            valid: false, 
            message: "Not authorized as super admin" 
        });
    } catch (err) {
        console.error("Token verification error:", err.message);
        res.status(401).json({ 
            valid: false, 
            message: "Invalid or expired token" 
        });
    }
});

// ============================================================
// 📊 GET CEO PLATFORM STATS
// ============================================================
app.get('/api/ceo-stats', async (req, res) => {
    try {
        // Verify CEO token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "bitebox_secret");
        
        if (decoded.username !== "srinivas" && decoded.role !== "superadmin") {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Get all partners (restaurant owners)
        const partners = await User.find({ role: 'owner' }).lean();
        
        // Calculate stats
        const totalPartners = partners.length;
        const activePartners = partners.filter(p => p.isActive).length;
        const premiumPartners = partners.filter(p => p.isPro).length;
        
        // Calculate total revenue from orders
        let totalRevenue = 0;
        for (const partner of partners) {
            try {
                const revenueData = await Order.aggregate([
                    { $match: { restaurantId: partner._id } },
                    { $group: { _id: null, total: { $sum: "$totalAmount" } } }
                ]);
                if (revenueData.length > 0) {
                    totalRevenue += revenueData[0].total || 0;
                }
            } catch (err) {
                console.error(`Error calculating revenue for ${partner.username}:`, err.message);
            }
        }

        // Recent partners (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentPartners = await User.find({
            role: 'owner',
            createdAt: { $gte: sevenDaysAgo }
        }).sort({ createdAt: -1 }).limit(10).lean();

        res.json({
            totalPartners,
            activePartners,
            premiumPartners,
            totalRevenue,
            recentPartners: recentPartners.map(p => ({
                _id: p._id,
                restaurantName: p.restaurantName,
                username: p.username,
                isActive: p.isActive,
                isPro: p.isPro,
                createdAt: p.createdAt
            }))
        });
    } catch (error) {
        console.error("CEO Stats Error:", error);
        res.status(500).json({ 
            error: "Failed to fetch stats",
            message: error.message 
        });
    }
});

// ============================================================
// 🚀 HEALTH CHECK ENDPOINT
// ============================================================
app.get('/api/health', (req, res) => {
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        version: '1.0.0'
    });
});

// ============================================================
// 🔧 SYSTEM INFO ENDPOINT
// ============================================================
app.get('/api/system-info', async (req, res) => {
    try {
        // Verify CEO token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "No token provided" });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "bitebox_secret");
        
        if (decoded.username !== "srinivas" && decoded.role !== "superadmin") {
            return res.status(403).json({ error: "Not authorized" });
        }

        const totalUsers = await User.countDocuments({});
        const totalOrders = await Order.countDocuments({});
        const dbStats = await mongoose.connection.db.stats();

        res.json({
            database: {
                totalUsers,
                totalOrders,
                totalCollections: dbStats.collections,
                dataSize: dbStats.dataSize,
                storageSize: dbStats.storageSize
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime()
            }
        });
    } catch (error) {
        console.error("System Info Error:", error);
        res.status(500).json({ error: "Failed to fetch system info" });
    }
});

// ============================================================
// 🎯 TEST ENDPOINT FOR CORS
// ============================================================
app.get('/api/test-cors', (req, res) => {
    console.log("Test CORS endpoint called");
    console.log("Origin:", req.headers.origin);
    console.log("Headers:", req.headers);
    
    res.json({
        message: "CORS test successful!",
        origin: req.headers.origin,
        timestamp: new Date().toISOString(),
        headers: req.headers
    });
});

// --- SOCKET.IO ---
const io = new Server(httpServer, { 
    cors: { 
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
        credentials: true
    } 
});

app.set('socketio', io); 
app.use((req, res, next) => { 
    req.io = io; 
    next(); 
});

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bitebox', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log("✅ MongoDB Connected");
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        console.log("⚠️ Starting in fallback mode...");
    });

// --- ROUTES ---
import authRoutes from './routes/authRoutes.js'; 
import dishRoutes from './routes/dishRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import broadcastRoutes from './routes/broadcastRoutes.js';
import supportRoutes from './routes/supportRoutes.js'; 
import notificationRoutes from './routes/notificationRoutes.js'; 

app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/broadcast', notificationRoutes); 
app.use('/api/notification', notificationRoutes);
app.use('/api/general-broadcast', broadcastRoutes); 
app.use('/api/support', supportRoutes); 

// ============================================================
// 📍 ROOT ENDPOINT
// ============================================================
app.get('/', (req, res) => {
    res.json({
        message: 'BiteBox Server 🚀',
        version: '1.0.0',
        endpoints: {
            ceo: {
                login: 'POST /api/super-login',
                verifyToken: 'GET /api/verify-token',
                stats: 'GET /api/ceo-stats',
                systemInfo: 'GET /api/system-info',
                testCors: 'GET /api/test-cors'
            },
            superAdmin: 'GET /api/superadmin/restaurants',
            health: 'GET /api/health'
        },
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

// ============================================================
// 🎯 SOCKET EVENTS FOR REAL-TIME UPDATES
// ============================================================
io.on('connection', (socket) => {
    console.log('🔌 New client connected:', socket.id);

    socket.on('join-restaurant', (id) => {
        socket.join(`restaurant-${id}`);
        console.log(`Client joined restaurant room: ${id}`);
    });

    socket.on('join-super-admin', () => {
        socket.join('super-admin-room');
        console.log('CEO joined super admin room');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });

    // CEO specific events
    socket.on('ceo-dashboard-update', (data) => {
        socket.to('super-admin-room').emit('dashboard-data', data);
    });
});

// ============================================================
// 🚨 ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error("🚨 Server Error:", err.stack);
    
    // Set CORS headers even for errors
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // Don't expose internal errors in production
    const errorResponse = {
        error: message,
        timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
    }
    
    res.status(statusCode).json(errorResponse);
});

// ============================================================
// 🚀 START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log("=".repeat(50));
    console.log(`🚀 BiteBox Server running on port ${PORT}`);
    console.log(`🌐 Access: http://localhost:${PORT}`);
    console.log("=".repeat(50));
    console.log("📋 Available Routes:");
    console.log(`👉 CEO Login:        POST http://localhost:${PORT}/api/super-login`);
    console.log(`👉 Token Verify:     GET  http://localhost:${PORT}/api/verify-token`);
    console.log(`👉 CEO Stats:        GET  http://localhost:${PORT}/api/ceo-stats`);
    console.log(`👉 CORS Test:        GET  http://localhost:${PORT}/api/test-cors`);
    console.log(`👉 System Health:    GET  http://localhost:${PORT}/api/health`);
    console.log(`👉 Super Admin:      GET  http://localhost:${PORT}/api/superadmin/restaurants`);
    console.log("=".repeat(50));
    console.log("👑 Default CEO Credentials:");
    console.log("   Username: srinivas");
    console.log("   Password: bsr18");
    console.log("=".repeat(50));
    console.log("🛡️  CORS Allowed Origins:");
    allowedOrigins.forEach(origin => console.log(`   ${origin}`));
    console.log("=".repeat(50));
});

// ============================================================
// 🛡️ GRACEFUL SHUTDOWN HANDLER
// ============================================================
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('✅ HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received. Shutting down gracefully...');
    httpServer.close(() => {
        console.log('✅ HTTP server closed');
        mongoose.connection.close(false, () => {
            console.log('✅ MongoDB connection closed');
            process.exit(0);
        });
    });
});

// ============================================================
// 🛠️ GLOBAL HEADERS MIDDLEWARE
// ============================================================
app.use((req, res, next) => {
    // Add CORS headers to all responses
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Expose-Headers', 'Content-Length, X-Request-ID');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});