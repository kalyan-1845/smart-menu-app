import express from 'express';
import { 
    getDishes, 
    addDishReview,   // <--- This must match the controller export
    createDish, 
    updateDish, 
    deleteDish 
} from '../controllers/dishController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getDishes); 
router.post('/rate/:dishId', addDishReview); // Used for ratings

// Admin Routes
router.post('/', protect, createDish);
router.put('/:id', protect, updateDish);
router.delete('/:id', protect, deleteDish);

export default router;