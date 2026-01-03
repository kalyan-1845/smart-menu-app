import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';

const router = express.Router();

// =======================================================
// ✅ THIS IS THE FIX
// You were missing this line. It allows "?restaurantId=..."
// =======================================================
router.get('/', getDishes); 

// This handles the other style "/kalyanresto1"
router.get('/:restaurantId', getDishes); 

// Review Route
router.post('/:dishId/review', addDishReview);

// Admin Routes (Keep your protection middleware if you have it)
// router.post('/', protect, createDish);
// router.put('/:id', protect, updateDish);
// router.delete('/:id', protect, deleteDish);

export default router;