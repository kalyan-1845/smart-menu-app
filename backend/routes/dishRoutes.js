import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';

// Note: If you have an auth middleware, import it here:
// import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();

// ==========================================
// ✅ THE MISSING FIX IS HERE 👇
// ==========================================
router.get('/', getDishes); 
// 👆 This line allows "?restaurantId=kalyanresto1" to work

// This handles the other style "/kalyanresto1"
router.get('/:restaurantId', getDishes); 

// Review Route
router.post('/:dishId/review', addDishReview);

// Protected Routes (Uncomment if you use them)
// router.post('/', protect, createDish);
// router.put('/:id', protect, updateDish);
// router.delete('/:id', protect, deleteDish);

export default router;