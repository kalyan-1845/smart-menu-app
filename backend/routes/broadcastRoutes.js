import express from "express";
import { sendBroadcast, getBroadcasts } from "../controllers/broadcastController.js";

const router = express.Router();
router.post("/", sendBroadcast);
router.get("/", getBroadcasts);
export default router;
