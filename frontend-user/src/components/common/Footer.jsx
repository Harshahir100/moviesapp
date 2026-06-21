// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Github, Twitter, Youtube, Mail } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-12">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="p-1.5 bg-netflix-red rounded-lg">
                                <Film className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-lg font-bold text-white">
                                <span className="text-netflix-red">Magnet</span>Fetcher
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm">
                            Your ultimate destination for movies and TV series torrents.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-3">Browse</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/movies" className="text-gray-400 hover:text-white transition-colors">Movies</Link></li>
                            <li><Link to="/series" className="text-gray-400 hover:text-white transition-colors">TV Series</Link></li>
                            <li><Link to="/category/hollywood" className="text-gray-400 hover:text-white transition-colors">Hollywood</Link></li>
                            <li><Link to="/category/bollywood" className="text-gray-400 hover:text-white transition-colors">Bollywood</Link></li>
                            <li><Link to="/category/south" className="text-gray-400 hover:text-white transition-colors">South</Link></li>
                            <li><Link to="/category/k-drama" className="text-gray-400 hover:text-white transition-colors">K-Drama</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-3">Categories</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link to="/movies?quality=1080p" className="text-gray-400 hover:text-white transition-colors">1080p</Link></li>
                            <li><Link to="/movies?quality=720p" className="text-gray-400 hover:text-white transition-colors">720p</Link></li>
                            <li><Link to="/movies?quality=4K" className="text-gray-400 hover:text-white transition-colors">4K</Link></li>
                            <li><Link to="/movies?language=Hindi" className="text-gray-400 hover:text-white transition-colors">Hindi Dubbed</Link></li>
                            <li><Link to="/movies?language=English" className="text-gray-400 hover:text-white transition-colors">English</Link></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 className="text-white font-semibold mb-3">Connect</h4>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Github size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Youtube size={20} /></a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors"><Mail size={20} /></a>
                        </div>
                        <p className="text-gray-500 text-xs mt-4">
                            &copy; {new Date().getFullYear()} MagnetFetcher. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;