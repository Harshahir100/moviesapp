// frontend-user/src/components/common/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Film, Home, Tv } from 'lucide-react';

const Header = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-sm border-b border-gray-800">
            <div className="container mx-auto px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="p-1.5 bg-[#e50914] rounded-lg">
                            <Film className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white hidden sm:block">
                            <span className="text-[#e50914]">Magnet</span>Fetcher
                        </span>
                    </Link>

                    {/* Navigation */}
                    <nav className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-1">
                            <Home size={16} />
                            <span>Home</span>
                        </Link>
                        <Link to="/movies" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-1">
                            <Film size={16} />
                            <span>Movies</span>
                        </Link>
                        <Link to="/series" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-1">
                            <Tv size={16} />
                            <span>Series</span>
                        </Link>
                        <div className="h-4 w-px bg-gray-700"></div>
                        <Link to="/category/hollywood" className="text-sm text-gray-400 hover:text-white transition-colors">Hollywood</Link>
                        <Link to="/category/bollywood" className="text-sm text-gray-400 hover:text-white transition-colors">Bollywood</Link>
                        <Link to="/category/south" className="text-sm text-gray-400 hover:text-white transition-colors">South</Link>
                        <Link to="/category/k-drama" className="text-sm text-gray-400 hover:text-white transition-colors">K-Drama</Link>
                    </nav>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="hidden md:flex items-center bg-gray-800 rounded-full px-4 py-1.5 border border-gray-700 focus-within:border-[#e50914] transition-colors">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search movies, series..."
                            className="bg-transparent text-white text-sm outline-none w-48 lg:w-64"
                        />
                        <button type="submit" className="text-gray-400 hover:text-white ml-2">
                            <Search size={16} />
                        </button>
                    </form>

                    {/* Mobile Menu Button - Simple */}
                    <button
                        onClick={() => document.getElementById('mobileMenu').classList.toggle('hidden')}
                        className="md:hidden text-gray-300 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div id="mobileMenu" className="hidden md:hidden mt-4 pt-4 border-t border-gray-800 space-y-3">
                    <Link to="/" className="block text-gray-300 hover:text-white py-1">Home</Link>
                    <Link to="/movies" className="block text-gray-300 hover:text-white py-1">Movies</Link>
                    <Link to="/series" className="block text-gray-300 hover:text-white py-1">TV Series</Link>
                    <div className="pt-2 border-t border-gray-800 space-y-2">
                        <Link to="/category/hollywood" className="block text-sm text-gray-400 hover:text-white py-1">Hollywood</Link>
                        <Link to="/category/bollywood" className="block text-sm text-gray-400 hover:text-white py-1">Bollywood</Link>
                        <Link to="/category/south" className="block text-sm text-gray-400 hover:text-white py-1">South</Link>
                        <Link to="/category/k-drama" className="block text-sm text-gray-400 hover:text-white py-1">K-Drama</Link>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;