// backend/src/controllers/authController.js
import { AuthService } from '../services/authService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

export class AuthController {
    
    // Admin login
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Username and password are required' 
                });
            }
            
            const result = await AuthService.login(username, password);
            
            if (result.success) {
                res.json({
                    success: true,
                    token: result.token,
                    user: result.user,
                    message: 'Login successful'
                });
            } else {
                res.status(401).json({
                    success: false,
                    message: result.message
                });
            }
            
        } catch (error) {
            console.error('Login controller error:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Server error' 
            });
        }
    }
    
    // Verify token
    static async verify(req, res) {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'No token provided' 
                });
            }
            
            const result = AuthService.verifyToken(token);
            
            if (result.valid) {
                res.json({
                    success: true,
                    user: {
                        id: result.decoded.id,
                        username: result.decoded.username,
                        email: result.decoded.email,
                        role: result.decoded.role
                    }
                });
            } else {
                res.status(401).json({ 
                    success: false, 
                    message: result.error 
                });
            }
            
        } catch (error) {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
    }
    
    // Change password
    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const adminId = req.admin.id;
            
            if (!oldPassword || !newPassword) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Old and new password are required' 
                });
            }
            
            if (newPassword.length < 8) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'New password must be at least 8 characters' 
                });
            }
            
            const result = await AuthService.changePassword(adminId, oldPassword, newPassword);
            
            if (result.success) {
                res.json({ success: true, message: result.message });
            } else {
                res.status(400).json({ success: false, message: result.message });
            }
            
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    }
}