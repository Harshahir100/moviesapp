// frontend-admin/src/components/Login.jsx
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Lock, User, LogIn, Shield } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username || !password) {
            toast.error('Please enter username and password');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            if (response.data.success) {
                // Store token and user data
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.user));
                
                toast.success('Login successful!');
                
                // Call onLogin callback to show admin panel
                if (onLogin) {
                    onLogin(response.data.user);
                }
            } else {
                toast.error(response.data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="flex justify-center">
                        <div className="p-3 bg-red-600 rounded-2xl">
                            <Shield size={40} className="text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mt-4">Admin Panel</h1>
                    <p className="text-gray-400 mt-2">Sign in to manage your content</p>
                </div>

                {/* Login Form */}
                <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter username"
                                    className="w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-500" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                            {/* <div className="text-right mt-2">
                                <span className="text-xs text-gray-500">
                                    Default: admin / admin123
                                </span>
                            </div> */}
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-all transform hover:scale-[1.02]"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Logging in...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>

                        {/* Demo Credentials */}
                        {/* <div className="text-center text-xs text-gray-500 border-t border-gray-700 pt-4">
                            <p>Demo Credentials:</p>
                            <p className="text-gray-400">Username: <span className="text-red-400">admin</span> | Password: <span className="text-red-400">admin123</span></p>
                        </div> */}
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    &copy; {new Date().getFullYear()} Magnet Fetcher Admin Panel
                </p>
            </div>
        </div>
    );
};

export default Login;