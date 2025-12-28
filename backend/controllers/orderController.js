import Order from '../models/Order.js';

// @desc    Create new order (BLOCKS ZERO-RUPEE ORDERS)
// @route   POST /api/orders
export const createOrder = async (req, res) => {
    try {
        console.log("📦 Incoming Order Payload:", req.body); // Check your terminal for this log

        // 1. SMART DATA DETECTION
        // We look for 'items', 'cart', or 'cartItems' to ensure we capture the food list.
        const incomingItems = req.body.items || req.body.cart || req.body.cartItems || [];

        // 🛑 STOP INVALID ORDERS
        if (!incomingItems || incomingItems.length === 0) {
            console.error("❌ BLOCKED: Attempted to place an empty order.");
            return res.status(400).json({ 
                success: false, 
                message: "Your cart appears to be empty. Please add items." 
            });
        }

        // 2. MONEY PROTECTION: Auto-Calculate Total
        // If frontend sends 0 or null, we calculate the total manually on the server.
        let finalTotal = req.body.totalAmount;
        
        // Calculate total from items to ensure accuracy
        const calculatedTotal = incomingItems.reduce((acc, item) => {
            const price = Number(item.price) || 0;
            const qty = Number(item.quantity) || 1;
            return acc + (price * qty);
        }, 0);

        // If the frontend sent 0, overwrite it with our calculation
        if (!finalTotal || finalTotal == 0) {
            console.log("⚠️ Frontend sent Total: 0. Auto-correcting to:", calculatedTotal);
            finalTotal = calculatedTotal;
        }

        // 3. CREATE THE ORDER
        const newOrder = new Order({
            restaurantId: req.body.restaurantId,
            tableNumber: req.body.tableNumber,
            items: incomingItems,       // ✅ Forced Correct Items
            totalAmount: finalTotal,    // ✅ Forced Correct Total
            paymentMethod: req.body.paymentMethod || 'Cash',
            status: 'pending',
            note: req.body.note || ''
        });

        const savedOrder = await newOrder.save();

        // 4. NOTIFY RESTAURANT (Socket.io)
        if (req.io) {
            const room = req.body.restaurantId.toString();
            req.io.to(room).emit('new-order', savedOrder);
            console.log(`📡 Socket emitted to Room: ${room}`);
        }

        res.status(201).json({ success: true, order: savedOrder });

    } catch (error) {
        console.error("❌ CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};