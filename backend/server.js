import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";

// --- IMPORT ROUTES ---
import authRoutes from "./routes/authRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js"; 
// Note: If you don't have notificationRoutes.js separately, remove the line below.
// Broadcasts are now handled inside superAdminRoutes.js
// import broadcastRoutes from "./routes/notificationRoutes.js"; 

const app = express();
const httpServer = createServer(app);

// --- 🚀 DATABASE CONNECTION (CRITICAL FIX) ---
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://placeholder:password@cluster.mongodb.net/test";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    // process.exit(1); // Optional: Crash if DB fails
  });

// --- MIDDLEWARE ---
app.set("trust proxy", 1);
app.use(compression());
app.use(cors({
  origin: true, // Allow all origins (Mobile/Web)
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
app.use(express.json({ limit: "10mb" }));

// --- 🔌 SOCKET.IO SETUP ---
const io = new Server(httpServer, {
  cors: { origin: "*", credentials: true },
  pingTimeout: 60000,
});

// ✅ INJECT SOCKET IO (CRITICAL FIX)
// This allows your routes (like orderRoutes) to use 'req.io'
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- SOCKET EVENTS ---
io.on("connection", (socket) => {
  // Join Restaurant Room
  const rid = socket.handshake.query.restaurantId;
  if (rid) socket.join(rid);

  socket.on("join-restaurant", (id) => {
    socket.join(id);
    console.log(`Socket ${socket.id} joined room: ${id}`);
  });
  
  // Real-time Waiter Calls
  socket.on("call-waiter", (data) => {
    if (data.restaurantId) io.to(data.restaurantId).emit("new-waiter-call", data);
  });
});

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/inventory", inventoryRoutes); 
// app.use("/api/broadcast", broadcastRoutes); // Enable only if you have this file

// Health Check
app.get("/", (req, res) => res.send("Kovixa API v99 (Stable) Running ✅"));

const PORT = process.env.PORT || 8080; // Railway uses 8080 default
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});