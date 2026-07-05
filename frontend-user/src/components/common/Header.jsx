// frontend-user/src/components/common/Header.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Send, X } from 'lucide-react';

const navLinks = [
    { label: 'HOME', to: '/', icon: '🏠' },
    { label: 'MOVIES', to: '/movies', icon: '🎬', hasDropdown: true },
    { label: 'GENRE', to: '/genre', icon: '🎭', hasDropdown: true },
    { label: 'YEAR', to: '/year', icon: '📅', hasDropdown: true },
    { label: 'QUALITY', to: '/quality', icon: '🎞️', hasDropdown: true },
    { label: 'TV SHOWS', to: '/series', icon: '📺' },
    { label: 'WEB SERIES', to: '/series', icon: '🖥️' },
    { label: 'ANIME', to: '/category/anime' },
];

const quickTags = [
    { label: '18+ Movies', to: '/category/18-plus' },
    { label: 'Bollywood', to: '/category/bollywood' },
    { label: 'Hollywood', to: '/category/hollywood' },
    { label: 'South (Hindi Dubbed)', to: '/category/south' },
    { label: 'Dual Audio', to: '/category/dual-audio' },
    { label: 'WEB Series', to: '/series' },
    { label: 'Korean Drama', to: '/category/k-drama' },
];

const Header = () => {
    const [query, setQuery] = useState('');
    const [showBanner, setShowBanner] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
        // Navigate to search page with query - using /search not /search? (already correct)
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        setQuery('');
        setMobileMenuOpen(false);
    }
};

    return (
        <header className="sticky top-0 z-50 bg-[#1c1c1c]">
            {/* ===== Top bar: logo + search ===== */}
            <div className="bg-[#1c1c1c] border-b border-white/5">
                <div className="container mx-auto px-4 py-3 flex items-center gap-4">
                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen((o) => !o)}
                        aria-label="Toggle menu"
                    >
                        <span className="block w-6 h-0.5 bg-white mb-1.5" />
                        <span className="block w-6 h-0.5 bg-white mb-1.5" />
                        <span className="block w-6 h-0.5 bg-white" />
                    </button>

                    {/* Logo */}
                    <Link to="/" className="flex flex-col leading-none shrink-0">
                        <span className="text-2xl md:text-3xl font-black tracking-tight">
                            <span className="text-white">BOLLY</span>
                            <span className="inline-block bg-[#e50914] text-white px-1.5 ml-0.5 -skew-x-6">
                                FLIX
                            </span>
                        </span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 tracking-widest mt-0.5">
                            WWW.BOLLYFLIX.VIP
                        </span>
                    </Link>

                    {/* Search bar - Desktop */}
                    <form onSubmit={handleSearch} className="flex-1 hidden sm:block">
                        <div className="relative max-w-xl mx-auto">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="What are you looking for?"
                                className="w-full bg-[#2b2b2b] text-white placeholder-gray-400 text-sm rounded-md pl-4 pr-12 py-2.5 border border-white/10 focus:outline-none focus:border-[#e50914] transition-colors"
                            />
                            <button
                                type="submit"
                                aria-label="Search"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-9 flex items-center justify-center bg-[#e50914] hover:bg-red-700 rounded text-white transition-colors"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                    </form>

                    {/* Mobile search icon */}
                    {/* <button 
                        className="sm:hidden ml-auto text-white" 
                        aria-label="Search"
                        onClick={() => {
                            // Focus on mobile search input
                            const mobileInput = document.getElementById('mobileSearchInput');
                            if (mobileInput) mobileInput.focus();
                        }}
                    >
                        <Search size={20} />
                    </button> */}
                </div>

                {/* Mobile search bar (own row) */}
                <form onSubmit={handleSearch} className="sm:hidden px-4 pb-3">
                    <div className="relative">
                        <input
                            id="mobileSearchInput"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="What are you looking for?"
                            className="w-full bg-[#2b2b2b] text-white placeholder-gray-400 text-sm rounded-md pl-4 pr-12 py-2.5 border border-white/10 focus:outline-none focus:border-[#e50914]"
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-9 flex items-center justify-center bg-[#e50914] hover:bg-red-700 rounded text-white"
                        >
                            <Search size={16} />
                        </button>
                    </div>
                </form>
            </div>

            {/* ===== Main nav ===== */}
            <nav className={`bg-[#262626] border-b border-white/5 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
                <div className="container mx-auto px-4">
                    <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-0 md:gap-1 py-1 md:py-0 text-sm font-medium">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <Link
                                    to={link.to}
                                    className="flex items-center gap-1.5 px-3 py-2.5 md:py-3 text-gray-200 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {link.icon && <span className="text-xs">{link.icon}</span>}
                                    <span className="tracking-wide">{link.label}</span>
                                    {link.hasDropdown && <ChevronDown size={12} className="opacity-70" />}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </nav>

            {/* ===== Quick tags strip ===== */}
            <div className="bg-[#1c1c1c] border-b border-white/5 overflow-x-auto">
                <div className="container mx-auto px-4 py-2.5 flex items-center justify-center gap-2 flex-wrap">
                    <a
                        href="https://t.me/"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e9be0] hover:bg-[#1a8bca] text-white text-xs font-semibold rounded-full transition-colors whitespace-nowrap"
                    >
                        <Send size={12} />
                        Join Telegram
                    </a>
                    {quickTags.map((tag) => (
                        <Link
                            key={tag.label}
                            to={tag.to}
                            className="px-3 py-1.5 bg-[#2b2b2b] hover:bg-[#3a3a3a] text-gray-200 text-xs font-medium rounded-full transition-colors whitespace-nowrap"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            {tag.label}
                        </Link>
                    ))}
                </div>
            </div>

            {/* ===== Announcement banner ===== */}
            {showBanner && (
                <div className="bg-[#1d7a3e] text-white">
                    <div className="container mx-auto px-4 py-2 flex items-center justify-center relative">
                        <p className="text-xs md:text-sm font-medium text-center pr-6">
                            Our New Domain is <span className="font-bold">BollyFlix.To</span> | Please Update Your Bookmark
                        </p>
                        <button
                            onClick={() => setShowBanner(false)}
                            aria-label="Dismiss"
                            className="absolute right-4 text-white/80 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;