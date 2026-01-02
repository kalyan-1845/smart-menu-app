// backend/controllers/authController.js
import Owner from '../models/Owner.js';

/**
 * 🌐 GET RESTAURANT PUBLIC DATA
 * Optimized for high-speed URL resolution (Username or ID)
 */
export const getRestaurantPublic = async (req, res) => {
    try {
        const { id } = req.params;
        let restaurant;

        // 🧠 PERFORMANCE: Check cache-friendly Username first
        // Most public traffic will use the /menu/:username route
        const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

        // .lean() is 3x faster as it skips Mongoose overhead
        // .select() only the 4 fields the frontend actually needs
        const projection = 'restaurantName username isPro status ratings';

        if (isMongoId) {
            restaurant = await Owner.findById(id).select(projection).lean();
        } else {
            restaurant = await Owner.findOne({ username: id }).select(projection).lean();
        }

        // 🛡️ SECURITY & SUSPENSION GUARD
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant Not Found" });
        }

        if (restaurant.status === 'suspended') {
            return res.status(403).json({ 
                status: "suspended",
                message: "This menu is temporarily unavailable. Contact owner." 
            });
        }

        // ⚡ SPEED BOOST: Browser Caching
        // Tells the customer's phone to "remember" this restaurant info for 5 minutes
        res.set('Cache-Control', 'public, max-age=300');
        
        res.json(restaurant);
    } catch (error) {
        console.error("Critical URL Resolution Error:", error.message);
        res.status(500).json({ message: "Server Node Error" });
    }
};