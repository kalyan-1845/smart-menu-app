import express from 'express';
import { getDishes, addDishReview, createDish, updateDish, deleteDish } from '../controllers/dishController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 🌐 Public
router.get('/', getDishes); 
router.post('/rate/:dishId', addDishReview);

// 🏗️ Admin (Protected)
router.post('/', protect, createDish);
router.put('/:id', protect, updateDish);
router.delete('/:id', protect, deleteDish);

export default router;