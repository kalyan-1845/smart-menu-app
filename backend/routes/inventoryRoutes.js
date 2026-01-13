import express from 'express';
import { addInventoryItem, getInventory, updateStock } from '../controllers/inventoryController.js';

const router = express.Router();

router.post('/', addInventoryItem);       // Matches Admin's handleAddInventory
router.get('/', getInventory);            // Matches Admin's refreshData
router.put('/:id', updateStock);          // Matches Admin's "UPDATE" button

export default router;