import express from "express";
const router = express.Router();

router.post("/restaurant", (req, res) => {
  res.json({ msg: "Restaurant created" });
});

export default router;
