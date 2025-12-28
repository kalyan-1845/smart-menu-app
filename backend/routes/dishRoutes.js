import express from "express";
const router = express.Router();

let dishes = [];

router.post("/", (req, res) => {
  dishes.push(req.body);
  res.json({ msg: "Dish added" });
});

router.get("/", (req, res) => res.json(dishes));
export default router;
