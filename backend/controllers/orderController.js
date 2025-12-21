import Order from '../models/Order.js';
import Dish from '../models/Dish.js';
import Inventory from '../models/Inventory.js';

/**
 * PLACE ORDER & AUTO-SUBTRACT STOCK
 * 1. Validates that every ingredient for every dish is in stock.
 * 2. Deducts the exact quantities from the Inventory.
 * 3. Creates the Order and notifies the Chef/Waiter via Socket.io.
 */
export const placeOrder = async (req, res) => {
    const { items, tableNumber, customerName, totalAmount, owner, paymentMethod } = req.body;

    try {
        // --- STEP 1: VALIDATION ---
        // We check ALL items before doing any subtraction to ensure the whole order is possible.
        for (const item of items) {
            const dish = await Dish.findById(item._id).populate('recipe.ingredientId');
            
            if (!dish) continue;

            for (const entry of dish.recipe) {
                const stockItem = entry.ingredientId;
                const totalNeeded = entry.quantityNeeded * item.quantity;

                if (!stockItem || stockItem.currentStock < totalNeeded) {
                    return res.status(400).json({ 
                        message: `Stock Alert: Not enough ${stockItem?.itemName || 'ingredients'} for ${dish.name}.` 
                    });
                }
            }
        }

        // --- STEP 2: INVENTORY SUBTRACTION ---
        // Now that we know everything is in stock, we subtract it.
        for (const item of items) {
            const dish = await Dish.findById(item._id);
            
            for (const entry of dish.recipe) {
                await Inventory.findByIdAndUpdate(entry.ingredientId, {
                    $inc: { currentStock: -(entry.quantityNeeded * item.quantity) }
                });
            }
        }

        // --- STEP 3: CREATE ORDER ---
        const newOrder = new Order({
            customerName,
            tableNumber,
            items,
            totalAmount,
            owner,
            paymentMethod,
            status: "PLACED"
        });

        const savedOrder = await newOrder.save();

        // --- STEP 4: REAL-TIME NOTIFICATION ---
        if (req.io) {
            // Alert Chef of the new order
            req.io.emit('new-order', savedOrder);
            
            // Check for low stock alerts after subtraction
            const lowStockItems = await Inventory.find({ 
                owner, 
                $expr: { $lte: ["$currentStock", "$lowStockThreshold"] } 
            });

            if (lowStockItems.length > 0) {
                // Notifies the Admin Panel specifically
                req.io.emit('low-stock-alert', lowStockItems);
            }
        }

        res.status(201).json(savedOrder);

    } catch (error) {
        console.error("Order Processing Error:", error);
        res.status(500).json({ message: "Failed to process order. Please try again." });
    }
};