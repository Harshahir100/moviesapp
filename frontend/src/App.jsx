// frontend-admin/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Film, Tv, BookmarkCheck, Upload, LogOut } from 'lucide-react';
import Login from './components/Login';
import MoviePanel from './components/MoviePanel';
import SeriesPanel from './components/SeriesPanel';
import LibraryPanel from './components/LibraryPanel';
import ManualUpload from './components/ManualUpload';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [activeTab, setActiveTab] = useState('movie');

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser');
        
        if (token && user) {
            setIsAuthenticated(true);
            setAdminUser(JSON.parse(user));
        }
    }, []);

    // Handle login
    const handleLogin = (user) => {
        setIsAuthenticated(true);
        setAdminUser(user);
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        setIsAuthenticated(false);
        setAdminUser(null);
        window.location.reload();
    };

    // If not authenticated, show login
    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    const tabs = [
        { id: 'movie', label: 'Movies', icon: Film },
        { id: 'series', label: 'TV Series', icon: Tv },
        { id: 'library', label: 'Library', icon: BookmarkCheck },
        { id: 'manual', label: 'Manual Upload', icon: Upload },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-50 glass border-b border-gray-700">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-600 rounded-xl">
                                <Film className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Magnet Fetcher</h1>
                                <p className="text-xs text-gray-400">
                                    Admin Panel • {adminUser?.username}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            {/* Tab Navigation */}
                            <div className="flex space-x-2 bg-gray-800 rounded-xl p-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center space-x-2 px-5 py-2 rounded-lg transition-all duration-200 ${
                                                activeTab === tab.id
                                                    ? 'bg-red-600 text-white shadow-lg'
                                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                            }`}
                                        >
                                            <Icon size={18} />
                                            <span className="font-medium">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-all"
                            >
                                <LogOut size={18} />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                {activeTab === 'movie' && <MoviePanel />}
                {activeTab === 'series' && <SeriesPanel />}
                {activeTab === 'library' && <LibraryPanel />}
                {activeTab === 'manual' && <ManualUpload />}
            </main>

            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1f2937',
                        color: '#fff',
                        border: '1px solid #374151',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10b981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </div>
    );
}

export default App;