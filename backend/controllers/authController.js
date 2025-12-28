// backend/controllers/authController.js
import Owner from '../models/Owner.js';

// ✅ Add this function to find restaurant by Username OR ID
export const getRestaurantPublic = async (req, res) => {
    try {
        const { id } = req.params;
        let restaurant;

        // Check if "id" is a valid Mongo Object ID (24 hex characters)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            restaurant = await Owner.findById(id).select('-password');
        } else {
            // If not an ID, treat it as a Username
            restaurant = await Owner.findOne({ username: id }).select('-password');
        }

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};