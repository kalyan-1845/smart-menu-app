export const authorize = (roles = []) => {
    return (req, res, next) => {
        // req.user is populated by your existing JWT protect middleware
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: "Access Denied: You do not have permission for this." 
            });
        }
        next();
    };
};

// --- USAGE IN ROUTES ---
// router.get('/expenses', protect, authorize(['OWNER']), getExpenses);
// router.get('/kitchen', protect, authorize(['OWNER', 'CHEF']), getKitchenOrders);