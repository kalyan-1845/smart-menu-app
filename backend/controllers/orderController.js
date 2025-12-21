import Inventory from '../models/Inventory.js';

export const placeOrder = async (req, res) => {
    const { items, owner } = req.body;

    try {
        // 1. Loop through items to check stock availability
        for (const item of items) {
            const dish = await Dish.findById(item._id).populate('recipe.ingredientId');
            
            for (const ingredient of dish.recipe) {
                const stockItem = ingredient.ingredientId;
                const totalNeeded = ingredient.quantityNeeded * item.quantity;

                if (stockItem.currentStock < totalNeeded) {
                    return res.status(400).json({ 
                        message: `Insufficient stock for ${dish.name}. Missing: ${stockItem.itemName}` 
                    });
                }
            }
        }

        // 2. If all stock is okay, create order and DEDUCT stock
        const newOrder = await Order.create(req.body);

        for (const item of items) {
            const dish = await Dish.findById(item._id);
            for (const ingredient of dish.recipe) {
                await Inventory.findByIdAndUpdate(ingredient.ingredientId, {
                    $inc: { currentStock: -(ingredient.quantityNeeded * item.quantity) }
                });
            }
        }

        res.status(201).json(newOrder);
    } catch (error) {
        res.status(500).json({ message: "Inventory sync failed." });
    }
};