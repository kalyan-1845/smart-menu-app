import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';
// import { protect } from '../middleware/authMiddleware.js'; // Uncomment if you have this file

const router = express.Router();

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================

// ✅ FIX: This handles "/api/dishes?restaurantId=..."
router.get('/', getDishes); 

// This handles "/api/dishes/kalyanresto1"
router.get('/:restaurantId', getDishes); 

router.post('/:dishId/review', addDishReview);

// ==========================================
// 2. PROTECTED ROUTES (Admin Only)
// ==========================================
// Uncomment these lines if you have the 'protect' middleware working
// router.post('/', protect, createDish);
// router.put('/:id', protect, updateDish);
// router.delete('/:id', protect, deleteDish);

export default router;