import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';

const router = express.Router();

// ==========================================
// ✅ THIS IS THE MISSING PIECE
// ==========================================
router.get('/', (req, res, next) => {
    console.log("🔥 ROOT ROUTE HIT: Query:", req.query);
    getDishes(req, res, next);
});

// This handles the old style "/kalyanresto1"
router.get('/:restaurantId', (req, res, next) => {
    console.log("🔥 PARAM ROUTE HIT: ID:", req.params.restaurantId);
    getDishes(req, res, next);
});

// Review Route
router.post('/:dishId/review', addDishReview);

// 🔒 Protected Routes (Keep these if you have them, otherwise ignore)
// import { protect } from '../middleware/authMiddleware.js';
// router.post('/', protect, createDish);
// router.put('/:id', protect, updateDish);
// router.delete('/:id', protect, deleteDish);

export default router;