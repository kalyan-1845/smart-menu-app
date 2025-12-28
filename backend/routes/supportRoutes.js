import express from "express";
const router = express.Router();

let tickets = [];

router.post("/", (req, res) => {
  tickets.push(req.body);
  res.json({ msg: "Ticket created" });
});

router.get("/", (req, res) => res.json(tickets));
export default router;
