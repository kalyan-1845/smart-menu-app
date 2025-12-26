import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';

/**
 * 🛡️ STANDARD PROTECT MIDDLEWARE
 * Verifies the JWT token sent in the request header.
 * Ensures only authenticated restaurant owners can access private data.
 */
export const protect = async (req, res, next) => {
    let token;

    // Check if the request contains a Bearer token in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Extract the token from the "Bearer <token>" string
            token = req.headers.authorization.split(' ')[1];
            
            // Verify the token using your secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
            
            // Attach the owner's data to the request object, excluding the password for security
            req.user = await Owner.findById(decoded.id).select('-password');

            // Handle cases where the token is valid but the user no longer exists in the DB
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Move to the next middleware or controller
            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        // Reject requests that provide no token
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};
  
/**
 * 💰 SUBSCRIPTION CHECK MIDDLEWARE
 * Handles the trial logic for your 60-day startup phase.
 * Currently configured for "Free Mode," allowing all access while the 
 * frontend handles expiration warnings.
 */
export const checkSubscription = async (req, res, next) => {
    // In the future, you can add logic here to block API requests 
    // if the trial date (trialEndsAt) has passed.
    // For now, access is granted to maintain service continuity.
    next();
};