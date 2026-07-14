// src/components/MoviePanel.jsx
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Download, Save, Star, Calendar, Clock, Film, ExternalLink, Filter, X, TrendingUp, Users, HardDrive } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const MoviePanel = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [torrents, setTorrents] = useState([]);
    const [selectedTorrents, setSelectedTorrents] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [language, setLanguage] = useState('all');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchMode, setSearchMode] = useState('auto');

    // Search TMDB for movies
    const searchTMDB = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/movies/search/tmdb`, {
                params: { query, type: 'movie' }
            });
            setSuggestions(response.data.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search movies');
        }
    };

    // Search torrents with language filter
    const searchTorrentsWithLanguage = async (query, lang) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/movies/search/torrents`, {
                params: { query, language: lang }
            });
            
            console.log('Torrents found:', response.data);
            setTorrents(response.data.data || []);
            setSelectedTorrents(new Set());
            
            if (response.data.data?.length === 0) {
                if (lang === 'hindi') {
                    toast.error('No Hindi dubbed torrents found. Try English or All filter.', {
                        duration: 5000,
                        icon: '🔍'
                    });
                } else if (lang === 'english') {
                    toast.error('No English torrents found. Try All filter.', {
                        duration: 4000
                    });
                } else {
                    toast(`No torrents found for this movie`, { icon: '🔍' });
                }
            } else {
                toast.success(`Found ${response.data.data.length} torrent(s)`);
            }
        } catch (error) {
            console.error('Torrent search error:', error);
            toast.error(error.response?.data?.error || 'Failed to fetch torrents');
            setTorrents([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle movie selection
    const handleMovieSelect = async (movie) => {
        setSelectedMovie(movie);
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchQuery(movie.title);
        setLoading(true);
        setSelectedTorrents(new Set());

        try {
            // Create search term with year for better results
            const year = movie.release_date ? movie.release_date.split('-')[0] : '';
            const searchTerm = `${movie.title} ${year}`.trim();
            
            // Search with current language filter
            await searchTorrentsWithLanguage(searchTerm, language);
        } catch (error) {
            toast.error('Failed to fetch torrents');
        } finally {
            setLoading(false);
        }
    };

    // Handle language change
    const handleLanguageChange = async (newLanguage) => {
        setLanguage(newLanguage);
        
        if (selectedMovie) {
            const year = selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : '';
            const searchTerm = `${selectedMovie.title} ${year}`.trim();
            await searchTorrentsWithLanguage(searchTerm, newLanguage);
        }
    };

    // Toggle torrent selection
    const toggleTorrent = (index) => {
        const newSelected = new Set(selectedTorrents);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedTorrents(newSelected);
    };

    // Select all torrents
    const selectAllTorrents = () => {
        if (selectedTorrents.size === torrents.length) {
            setSelectedTorrents(new Set());
        } else {
            setSelectedTorrents(new Set(torrents.map((_, i) => i)));
        }
    };

    // Save selected torrents
    const saveTorrents = async () => {
        if (!selectedMovie) {
            toast.error('No movie selected');
            return;
        }

        if (selectedTorrents.size === 0) {
            toast.error('Please select at least one torrent');
            return;
        }

        const selectedTorrentsList = Array.from(selectedTorrents).map(i => torrents[i]);
        
        if (!window.confirm(`Save ${selectedTorrentsList.length} torrent(s) to database?`)) {
            return;
        }

        setSaving(true);
        try {
            const response = await axios.post(`${API_URL}/movies/save`, {
                tmdbData: selectedMovie,
                torrents: selectedTorrentsList
            });
            
            if (response.data.success) {
                toast.success(`Successfully saved ${response.data.savedCount} torrent(s)!`);
                setSelectedTorrents(new Set());
                
                // Refresh torrent list to remove saved ones
                const year = selectedMovie.release_date ? selectedMovie.release_date.split('-')[0] : '';
                const searchTerm = `${selectedMovie.title} ${year}`.trim();
                await searchTorrentsWithLanguage(searchTerm, language);
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    // Format file size for display
    const formatSize = (size) => {
        if (!size || size === 'Unknown') return 'Unknown';
        return size;
    };

    // Get quality badge color
    const getQualityColor = (quality) => {
        const colors = {
            '4K': 'bg-purple-600',
            '2160p': 'bg-purple-600',
            '1080p': 'bg-blue-600',
            '720p': 'bg-green-600',
            '480p': 'bg-yellow-600'
        };
        return colors[quality] || 'bg-gray-600';
    };

    return (
        <div className="space-y-6">
            {/* Search Section */}
            <div className="relative">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchTMDB(e.target.value);
                        }}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder="Search for a movie... (e.g., Deadpool, Inception, Avengers)"
                        className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all text-lg pr-36"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                </div>

                {/* Language Filter Buttons */}
                <div className="absolute right-16 top-1/2 transform -translate-y-1/2 flex space-x-2">
                    <button
                        onClick={() => handleLanguageChange('all')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            language === 'all' 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="All Languages"
                    >
                        🌍 All
                    </button>
                    <button
                        onClick={() => handleLanguageChange('hindi')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            language === 'hindi' 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="Hindi Dubbed Only"
                    >
                        🇮🇳 Hindi
                    </button>
                    <button
                        onClick={() => handleLanguageChange('english')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            language === 'english' 
                                ? 'bg-red-600 text-white shadow-lg' 
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                        title="English Only"
                    >
                        🇬🇧 English
                    </button>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto animate-fadeIn">
                        {suggestions.map((movie) => (
                            <div
                                key={movie.id}
                                onClick={() => handleMovieSelect(movie)}
                                className="flex items-center space-x-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-0 group"
                            >
                                {movie.poster_path ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                                        alt={movie.title}
                                        className="w-12 h-16 object-cover rounded group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                                        <Film size={24} className="text-gray-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                                        {movie.title} ({movie.release_date?.split('-')[0] || 'N/A'})
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        ⭐ {movie.vote_average?.toFixed(1) || 'N/A'} • 
                                        {movie.media_type === 'movie' ? ' Movie' : ' TV Series'}
                                    </p>
                                </div>
                                <ExternalLink size={16} className="text-gray-500 group-hover:text-red-400" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Movie Details */}
            {selectedMovie && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Movie Poster & Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 sticky top-4">
                            {selectedMovie.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`}
                                    alt={selectedMovie.title}
                                    className="w-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-96 bg-gray-700 flex items-center justify-center">
                                    <Film size={64} className="text-gray-500" />
                                </div>
                            )}
                            <div className="p-5 space-y-4">
                                <h2 className="text-2xl font-bold text-white">{selectedMovie.title}</h2>
                                
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex items-center space-x-1 text-yellow-500">
                                            <Star size={16} fill="currentColor" />
                                            <span className="text-white font-semibold">{selectedMovie.vote_average?.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-gray-400">
                                            <Calendar size={16} />
                                            <span>{selectedMovie.release_date?.split('-')[0] || 'N/A'}</span>
                                        </div>
                                        {selectedMovie.runtime && (
                                            <div className="flex items-center space-x-1 text-gray-400">
                                                <Clock size={16} />
                                                <span>{selectedMovie.runtime} min</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                                    {selectedMovie.overview || 'No overview available.'}
                                </p>
                                
                                <div className="pt-4 border-t border-gray-700">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Total Torrents Found:</span>
                                        <span className="text-white font-semibold">{torrents.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-gray-400">Hindi Dubbed:</span>
                                        <span className="text-green-500 font-semibold">
                                            {torrents.filter(t => t.isHindiDubbed).length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Torrents List */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Available Torrents</h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        {language === 'hindi' ? '🎬 Showing Hindi Dubbed torrents only' : 
                                         language === 'english' ? '🎬 Showing English torrents only' : 
                                         '🎬 Showing all torrents'}
                                    </p>
                                </div>
                                
                                <div className="flex space-x-3">
                                    {torrents.length > 0 && (
                                        <button
                                            onClick={selectAllTorrents}
                                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors text-sm"
                                        >
                                            {selectedTorrents.size === torrents.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={saveTorrents}
                                        disabled={saving || selectedTorrents.size === 0}
                                        className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-all transform hover:scale-105"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>Save Selected ({selectedTorrents.size})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-gray-700 rounded-lg p-4 animate-pulse">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="h-5 bg-gray-600 rounded w-3/4 mb-3"></div>
                                                    <div className="flex gap-2">
                                                        <div className="h-4 bg-gray-600 rounded w-16"></div>
                                                        <div className="h-4 bg-gray-600 rounded w-20"></div>
                                                        <div className="h-4 bg-gray-600 rounded w-24"></div>
                                                    </div>
                                                </div>
                                                <div className="h-8 bg-gray-600 rounded w-20"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : torrents.length > 0 ? (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {torrents.map((torrent, index) => (
                                        <div
                                            key={index}
                                            className={`bg-gray-700 rounded-lg p-4 transition-all duration-200 ${
                                                selectedTorrents.has(index) ? 'ring-2 ring-red-500 bg-gray-650' : 'hover:bg-gray-650'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTorrents.has(index)}
                                                            onChange={() => toggleTorrent(index)}
                                                            className="w-5 h-5 rounded border-gray-500 text-red-600 focus:ring-red-500 cursor-pointer"
                                                        />
                                                        <h4 className="font-semibold text-white line-clamp-2 text-sm">
                                                            {torrent.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 ml-8">
                                                        {torrent.quality && torrent.quality !== 'Unknown' && (
                                                            <span className={`px-2 py-1 ${getQualityColor(torrent.quality)} rounded text-xs font-mono`}>
                                                                🎬 {torrent.quality}
                                                            </span>
                                                        )}
                                                        {torrent.isHindiDubbed && (
                                                            <span className="px-2 py-1 bg-green-600 rounded text-xs font-medium">
                                                                🇮🇳 Hindi Dubbed
                                                            </span>
                                                        )}
                                                        {torrent.size && torrent.size !== 'Unknown' && (
                                                            <span className="px-2 py-1 bg-purple-600 rounded text-xs flex items-center gap-1">
                                                                <HardDrive size={12} />
                                                                {formatSize(torrent.size)}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-green-800 rounded text-xs flex items-center gap-1">
                                                            <TrendingUp size={12} />
                                                            {torrent.seeders || 0}
                                                        </span>
                                                        <span className="px-2 py-1 bg-yellow-800 rounded text-xs flex items-center gap-1">
                                                            <Users size={12} />
                                                            {torrent.leechers || 0}
                                                        </span>
                                                        {torrent.source && (
                                                            <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                                                                📡 {torrent.source}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {torrent.sizeBytes > 0 && (
                                                        <div className="ml-8 mt-2 text-xs text-gray-400">
                                                            Size: {formatSize(torrent.size)} ({torrent.sizeBytes} bytes)
                                                        </div>
                                                    )}
                                                </div>
                                                <a
                                                    href={torrent.magnetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white transition-colors flex-shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Copy Magnet Link"
                                                >
                                                    <Download size={14} />
                                                    <span>Magnet</span>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <p className="text-gray-400 text-lg">No torrents found</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        {language === 'hindi' 
                                            ? 'Try changing to "All" filter or search for a different movie' 
                                            : 'Try changing the language filter or search for a different movie'}
                                    </p>
                                    {language === 'hindi' && (
                                        <p className="text-gray-500 text-xs mt-3">
                                            💡 Tip: Not all movies have Hindi dubbed versions available
                                        </p>
                                    )}
                                </div>
                            )}
                            
                            {torrents.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
                                    💡 Tip: Select multiple torrents to save them at once. Higher seeders = faster download
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoviePanel;