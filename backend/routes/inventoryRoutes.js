import express from 'express';
import { 
    addInventoryItem, 
    updateStock, 
    getInventory 
} from '../controllers/inventoryController.js';

const router = express.Router();

// Matches: GET /api/inventory?restaurantId=...
router.get('/', getInventory);

// Matches: POST /api/inventory
router.post('/', addInventoryItem);

// Matches: PUT /api/inventory/:id
router.put('/:id', updateStock);

export default router; // THIS EXPORT IS REQUIRED