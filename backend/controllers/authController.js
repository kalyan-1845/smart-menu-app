// backend/controllers/authController.js

// ✅ Add this function to find restaurant by Username
export const getRestaurantPublic = async (req, res) => {
    try {
        const { id } = req.params;
        let restaurant;

        // Check if the "id" is a Mongo Object ID (24 chars) or a Username
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            restaurant = await Owner.findById(id).select('-password');
        } else {
            restaurant = await Owner.findOne({ username: id }).select('-password');
        }

        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json(restaurant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};