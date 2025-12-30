import Inventory from '../models/Inventory.js';

// --- 1. ADD NEW RAW MATERIAL ---
export const addInventoryItem = async (req, res) => {
    try {
        const newItem = await Inventory.create({ ...req.body, owner: req.user.id });
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: "Failed to add item." });
    }
};

// --- 2. UPDATE STOCK LEVEL (Restock) ---
export const updateStock = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndUpdate(
            req.params.id, 
            { currentStock: req.body.currentStock }, 
            { new: true }
        );
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: "Update failed." });
    }
};

// --- 3. GET ALL STOCK ---
export const getInventory = async (req, res) => {
    try {
        const items = await Inventory.find({ owner: req.user.id });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};