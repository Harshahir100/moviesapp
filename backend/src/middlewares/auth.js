// backend/src/middlewares/auth.js
import { AuthService } from '../services/authService.js';

export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }
    
    const result = AuthService.verifyToken(token);
    
    if (!result.valid) {
        if (result.error === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please login again.' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid token' 
        });
    }
    
    req.admin = result.decoded;
    next();
};