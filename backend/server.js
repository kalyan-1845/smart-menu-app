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
import broadcastRoutes from "./routes/notificationRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// 📶 PWA/OFFLINE OPTIMIZATION: Set Cache Headers
app.use((req, res, next) => {
  // Tells the browser to allow background syncing and local caching
  res.set('Cache-Control', 'no-store'); 
  next();
});

app.use(express.json({ limit: "10mb" }));

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/inventory", inventoryRoutes);

// ✅ HEALTH CHECK (Required for Railway to stay "Active")
app.get("/", (req, res) => res.status(200).send("Kovixa API v10 (Stable) ✅"));

// --- SOCKET EVENTS ---
const io = new Server(httpServer, {
  cors: { origin: "*", credentials: true },
  pingTimeout: 60000, // Longer timeout for spotty restaurant WiFi
});

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

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ DB Connected"))
  .catch((err) => console.log("❌ DB Error", err));

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});