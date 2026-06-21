// backend/src/services/authService.js
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 30;

export class AuthService {
    
    // Create admin user (Only for initial setup - run manually)
    static async createAdmin(username, password, email, fullName) {
        const client = await pool.connect();
        try {
            // Check if admin already exists
            const existing = await client.query(
                'SELECT id FROM admins WHERE username = $1 OR email = $2',
                [username, email]
            );
            
            if (existing.rows.length > 0) {
                return { success: false, message: 'Username or email already exists' };
            }
            
            // Hash password with salt
            const salt = await bcrypt.genSalt(12);
            const passwordHash = await bcrypt.hash(password, salt);
            
            const result = await client.query(
                `INSERT INTO admins (username, password_hash, email, full_name) 
                 VALUES ($1, $2, $3, $4) 
                 RETURNING id, username, email, full_name, role`,
                [username, passwordHash, email, fullName]
            );
            
            return { 
                success: true, 
                message: 'Admin created successfully',
                admin: result.rows[0]
            };
            
        } catch (error) {
            console.error('Create admin error:', error);
            return { success: false, message: 'Failed to create admin' };
        } finally {
            client.release();
        }
    }
    
    // Login admin with security features
    static async login(username, password) {
        const client = await pool.connect();
        try {
            // Get admin with lock check
            const result = await client.query(
                `SELECT * FROM admins 
                 WHERE username = $1 AND is_active = true`,
                [username]
            );
            
            if (result.rows.length === 0) {
                return { success: false, message: 'Invalid credentials' };
            }
            
            const admin = result.rows[0];
            
            // Check if account is locked
            if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
                const remainingMinutes = Math.ceil((new Date(admin.locked_until) - new Date()) / 60000);
                return { 
                    success: false, 
                    message: `Account locked. Try again in ${remainingMinutes} minutes` 
                };
            }
            
            // Compare password
            const isValid = await bcrypt.compare(password, admin.password_hash);
            
            if (!isValid) {
                // Increment failed attempts
                const newAttempts = (admin.failed_attempts || 0) + 1;
                let updateQuery = 'UPDATE admins SET failed_attempts = $1 WHERE id = $2';
                let params = [newAttempts, admin.id];
                
                // Lock account if max attempts exceeded
                if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                    const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60000);
                    updateQuery = 'UPDATE admins SET failed_attempts = $1, locked_until = $2 WHERE id = $3';
                    params = [newAttempts, lockUntil, admin.id];
                }
                
                await client.query(updateQuery, params);
                
                return { 
                    success: false, 
                    message: `Invalid credentials. ${MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining` 
                };
            }
            
            // Reset failed attempts on successful login
            await client.query(
                'UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
                [admin.id]
            );
            
            // Generate JWT token
            const token = jwt.sign(
                { 
                    id: admin.id, 
                    username: admin.username, 
                    email: admin.email,
                    role: admin.role 
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRY }
            );
            
            return {
                success: true,
                token: token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    full_name: admin.full_name,
                    role: admin.role
                }
            };
            
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Server error' };
        } finally {
            client.release();
        }
    }
    
    // Verify token
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    
    // Middleware for protected routes
    static authMiddleware(req, res, next) {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Access denied. No token provided.' 
            });
        }
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.admin = decoded;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
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
    }
    
    // Change password
    static async changePassword(adminId, oldPassword, newPassword) {
        const client = await pool.connect();
        try {
            const result = await client.query(
                'SELECT password_hash FROM admins WHERE id = $1',
                [adminId]
            );
            
            if (result.rows.length === 0) {
                return { success: false, message: 'Admin not found' };
            }
            
            const isValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
            
            if (!isValid) {
                return { success: false, message: 'Current password is incorrect' };
            }
            
            const salt = await bcrypt.genSalt(12);
            const newHash = await bcrypt.hash(newPassword, salt);
            
            await client.query(
                'UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [newHash, adminId]
            );
            
            return { success: true, message: 'Password changed successfully' };
            
        } catch (error) {
            console.error('Change password error:', error);
            return { success: false, message: 'Failed to change password' };
        } finally {
            client.release();
        }
    }
}