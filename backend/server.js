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
import broadcastRoutes from "./routes/notificationRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js"; // ✅ ADDED THIS

const app = express();

app.set("trust proxy", 1);
const httpServer = createServer(app);

app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));

app.use(express.json({ limit: "10mb" }));

// --- STANDARD ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/dishes", dishRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/inventory", inventoryRoutes); // ✅ ADDED THIS

app.get("/", (req, res) => res.send("Kovixa API v9 (Stable) Running ✅"));

// --- SOCKET EVENTS ---
const io = new Server(httpServer, {
  cors: { origin: "*", credentials: true }
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

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});