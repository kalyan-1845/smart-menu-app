import Inventory from '../models/Inventory.js';

// --- 1. ADD NEW RAW MATERIAL ---
export const addInventoryItem = async (req, res) => {
    try {
        const { itemName, currentStock, unit, lowStockThreshold, restaurantId } = req.body;
        
        const newItem = await Inventory.create({ 
            itemName, 
            currentStock: Number(currentStock), 
            unit, 
            lowStockThreshold: Number(lowStockThreshold), 
            owner: restaurantId // Linking to the restaurant ID
        });
        
        res.status(201).json(newItem);
    } catch (error) {
        console.error("Add Inventory Error:", error);
        res.status(400).json({ message: "Failed to add item." });
    }
};

// --- 2. UPDATE STOCK LEVEL (Restock) ---
export const updateStock = async (req, res) => {
    try {
        const { currentStock } = req.body;
        const item = await Inventory.findByIdAndUpdate(
            req.params.id, 
            { currentStock: Number(currentStock) }, 
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
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: "Restaurant ID required" });

        const items = await Inventory.find({ owner: restaurantId });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};