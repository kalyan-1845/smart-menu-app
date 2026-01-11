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
import broadcastRoutes from "./routes/broadcastRoutes.js";

const app = express();

// ✅ TRUST PROXY (Critical for Render/Railway)
app.set("trust proxy", 1);

const httpServer = createServer(app);

// ✅ KEEP-ALIVE (Prevents random disconnects)
httpServer.keepAliveTimeout = 120 * 1000;
httpServer.headersTimeout = 120 * 1000;

app.use(compression());

// ☢️ NUCLEAR CORS: Allow EVERYTHING (Fixes mobile/network handshake issues)
app.use(cors({
  origin: true, // Reflects the request origin
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
  max: 3000, // High limit for busy restaurants
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// 🔌 SOCKET.IO SETUP
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for sockets
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

// --- 🛠️ INLINE ROUTES (Direct Fixes) ---

// 1. UPDATE STATUS
app.put("/api/orders/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Dynamic Model Loading
    let Order;
    try { Order = mongoose.model("Order"); } 
    catch { Order = mongoose.model("Order", new mongoose.Schema({}, { strict: false })); }

    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });

    if (order) {
      io.to(order.restaurantId).emit("new-order", order);
      if (status === "Ready") io.to(order.restaurantId).emit("chef-ready-alert", order);
    }
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 2. STEALTH EMAIL
app.post("/api/reports/stealth-send", async (req, res) => {
  res.json({ success: true, message: "Report Queued" });
});

// 3. MARK DOWNLOADED
app.put("/api/orders/mark-downloaded", async (req, res) => {
  try {
    const { restaurantId } = req.body;
    const Order = mongoose.model("Order");

    await Order.updateMany(
      { restaurantId, status: { $in: ["Served", "Paid", "Cancelled"] } },
      { $set: { status: "Archived" } }
    );

    io.to(restaurantId).emit("new-order");
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// --- STANDARD ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/broadcast", broadcastRoutes);

app.get("/", (req, res) => res.send("Kovixa API v9 (Stable) Running ✅"));

// --- SOCKET EVENTS ---
io.on("connection", (socket) => {
  const rid = socket.handshake.query.restaurantId;
  if (rid) socket.join(rid);

  socket.on("join-restaurant", (id) => socket.join(id));
  socket.on("call-waiter", (data) => {
    if (data.restaurantId) io.to(data.restaurantId).emit("new-waiter-call", data);
  });
  socket.on("new-order", (data) => {
    if (data.restaurantId) io.to(data.restaurantId).emit("new-order", data);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});