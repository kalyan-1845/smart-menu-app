import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import dishRoutes from "./routes/dishRoutes.js";
import broadcastRoutes from "./routes/broadcastRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/orders", orderRoutes);
app.use("/dishes", dishRoutes);
app.use("/broadcasts", broadcastRoutes);
app.use("/support", supportRoutes);
app.use("/superadmin", superAdminRoutes);

app.listen(5000, () => console.log("Server running on 5000"));
