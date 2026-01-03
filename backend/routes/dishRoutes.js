import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';
import { protect } from '../middleware/authMiddleware.js'; // Assuming you have this

const router = express.Router();

// Public Routes
router.get('/:restaurantId', getDishes); // This handles /api/menu/kalyanresto1
router.post('/:dishId/review', addDishReview);

// Protected Routes (Needs Login)
router.post('/', protect, createDish);
router.put('/:id', protect, updateDish);
router.delete('/:id', protect, deleteDish);

export default router;