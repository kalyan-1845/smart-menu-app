import express from 'express';
import { 
    getDishes, 
    addDishReview,   // <--- MUST MATCH EXACTLY with the controller you just sent
    createDish, 
    updateDish, 
    deleteDish 
} from '../controllers/dishController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/', getDishes); 
router.post('/rate/:dishId', addDishReview); // <--- Matches the import

// Admin (Protected)
router.post('/', protect, createDish);
router.put('/:id', protect, updateDish);
router.delete('/:id', protect, deleteDish);

export default router;