import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import rateLimit from "express-rate-limit";
import compression from "compression";

// --- IMPORT ROUTES ---
import authRoutes from "./routes/authRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import broadcastRoutes from "./routes/notificationRoutes.js"; // ✅ Updated to match file name if you named it notificationRoutes.js

const app = express();

// ✅ TRUST PROXY (Critical for Render/Railway)
app.set("trust proxy", 1);

const httpServer = createServer(app);

// ✅ KEEP-ALIVE (Prevents random disconnects)
httpServer.keepAliveTimeout = 120 * 1000;
httpServer.headersTimeout = 120 * 1000;

app.use(compression());

// ☢️ NUCLEAR CORS: Allow EVERYTHING
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

// ✅ Force OPTIONS to always succeed immediately
app.options("*", (req, res) => res.sendStatus(200));

app.use(express.json({ limit: "10mb" }));

// 🛡️ Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, 
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// 🔌 SOCKET.IO SETUP
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- 🏗️ DATABASE CONNECTION ---
mongoose
  .connect(process.env.MONGO_URI, {
    maxPoolSize: 50,
    minPoolSize: 5,
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
    family: 4,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- STANDARD ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes); // ✅ This handles status updates & archiving now
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/broadcast", broadcastRoutes); // ✅ This handles Push Notifications

// 2. STEALTH EMAIL (Keep this here if you don't have a report route file)
app.post("/api/reports/stealth-send", async (req, res) => {
  // Logic to send email report...
  res.json({ success: true, message: "Report Queued" });
});

app.get("/", (req, res) => res.send("Kovixa API v9 (Stable) Running ✅"));

// --- SOCKET EVENTS ---
io.on("connection", (socket) => {
  // Join Room based on Query (Initial Connection)
  const rid = socket.handshake.query.restaurantId;
  if (rid) socket.join(rid);

  // Manual Join Event
  socket.on("join-restaurant", (id) => {
    socket.join(id);
    console.log(`Socket ${socket.id} joined ${id}`);
  });

  // Waiter/Help Call
  socket.on("call-waiter", (data) => {
    if (data.restaurantId) io.to(data.restaurantId).emit("new-waiter-call", data);
  });

  // New Order
  socket.on("new-order", (data) => {
    if (data.restaurantId) io.to(data.restaurantId).emit("new-order", data);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});