// frontend/src/components/AdminPanel.jsx (optimized save function)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Download, Save, Star, Calendar, Clock, Hash, CheckSquare, Square } from 'lucide-react';
import TMDBService from '../services/tmdbService';
import TorrentService from '../services/torrentService';

const API_URL = 'http://localhost:5000/api';

const AdminPanel = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedContent, setSelectedContent] = useState(null);
    const [torrents, setTorrents] = useState([]);
    const [selectedTorrentIndices, setSelectedTorrentIndices] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [language, setLanguage] = useState('all');
    const [selectAll, setSelectAll] = useState(false);

    const handleSearch = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        try {
            const results = await TMDBService.search(query);
            setSuggestions(results);
        } catch (error) {
            toast.error('Failed to fetch suggestions');
        }
    };

    const handleSuggestionClick = async (item) => {
        setSelectedContent(item);
        setSuggestions([]);
        setSearchQuery(item.title || item.name);
        setLoading(true);
        setSelectedTorrentIndices(new Set());
        setSelectAll(false);
        
        try {
            // Fetch TMDB details
            const details = await TMDBService.getDetails(item.id, item.media_type);
            setSelectedContent(details);
            
            // Fetch torrents with language filter
            const searchTerm = `${details.title || details.name} ${details.release_date ? details.release_date.split('-')[0] : ''}`;
            const torrentResults = await TorrentService.searchTorrents(searchTerm, language);
            
            // Limit torrents to prevent payload issues
            const limitedResults = torrentResults.slice(0, 30);
            setTorrents(limitedResults);
            
            if (limitedResults.length === 0) {
                toast('No torrents found for this content', { icon: '🔍' });
            } else {
                toast.success(`Found ${limitedResults.length} torrents`);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Failed to fetch content details');
        } finally {
            setLoading(false);
        }
    };

    const handleTorrentSelect = (index) => {
        const newSelected = new Set(selectedTorrentIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedTorrentIndices(newSelected);
        setSelectAll(newSelected.size === torrents.length);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTorrentIndices(new Set());
            setSelectAll(false);
        } else {
            const allIndices = new Set(torrents.map((_, index) => index));
            setSelectedTorrentIndices(allIndices);
            setSelectAll(true);
        }
    };

    const handleSaveSelected = async () => {
        if (!selectedContent) {
            toast.error('No content selected');
            return;
        }

        if (selectedTorrentIndices.size === 0) {
            toast.error('Please select at least one torrent');
            return;
        }

        // Get selected torrents
        const selectedTorrentsList = Array.from(selectedTorrentIndices).map(index => torrents[index]);
        
        // Show confirmation
        if (!window.confirm(`Save ${selectedTorrentsList.length} torrent(s) to database?`)) {
            return;
        }

        setSaving(true);
        
        try {
            // Prepare minimal data for saving
            const minimalTmdbData = {
                id: selectedContent.id,
                title: selectedContent.title || selectedContent.name,
                original_title: selectedContent.original_title || selectedContent.original_name,
                overview: selectedContent.overview,
                poster_path: selectedContent.poster_path,
                backdrop_path: selectedContent.backdrop_path,
                release_date: selectedContent.release_date || selectedContent.first_air_date,
                vote_average: selectedContent.vote_average,
                vote_count: selectedContent.vote_count,
                popularity: selectedContent.popularity,
                original_language: selectedContent.original_language,
                genres: selectedContent.genres,
                media_type: selectedContent.media_type || (selectedContent.seasons ? 'tv' : 'movie')
            };
            
            // Prepare minimal torrent data
            const minimalTorrents = selectedTorrentsList.map(torrent => ({
                magnetLink: torrent.magnetLink,
                title: torrent.title.substring(0, 200), // Truncate title
                size: torrent.size,
                quality: torrent.quality,
                language: torrent.language,
                isHindiDub: torrent.isHindiDub,
                seeders: torrent.seeders,
                leechers: torrent.leechers,
                source: torrent.source
            }));
            
            // Save in chunks if too many torrents
            if (minimalTorrents.length > 10) {
                toast.loading(`Saving ${minimalTorrents.length} torrents in batches...`, { duration: 2000 });
            }
            
            const response = await TorrentService.saveContent(minimalTmdbData, minimalTorrents);
            
            if (response.success) {
                toast.success(`Successfully saved ${response.savedCount || minimalTorrents.length} torrent(s)!`);
                setSelectedTorrentIndices(new Set());
                setSelectAll(false);
                
                // Refresh torrent list to show remaining unsaved ones
                const searchTerm = `${selectedContent.title || selectedContent.name}`;
                const refreshedTorrents = await TorrentService.searchTorrents(searchTerm, language);
                setTorrents(refreshedTorrents.slice(0, 30));
            } else {
                toast.error('Failed to save torrents');
            }
        } catch (error) {
            console.error('Save error:', error);
            if (error.response?.status === 413) {
                toast.error('Payload too large. Please select fewer torrents (max 10 at a time).');
            } else {
                toast.error(error.response?.data?.error || 'Failed to save content');
            }
        } finally {
            setSaving(false);
        }
    };

    // Auto-refresh when language changes
    useEffect(() => {
        if (selectedContent && (selectedContent.title || selectedContent.name)) {
            const timeoutId = setTimeout(() => {
                handleSuggestionClick(selectedContent);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [language]);

    return (
        <div className="space-y-8">
            {/* Search Section */}
            <div className="relative">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            handleSearch(e.target.value);
                        }}
                        placeholder="Search for movies or web series..."
                        className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all text-lg"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                </div>
                
                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                        {suggestions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSuggestionClick(item)}
                                className="flex items-center space-x-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-0"
                            >
                                {item.poster_path && (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                        alt={item.title || item.name}
                                        className="w-12 h-16 object-cover rounded"
                                    />
                                )}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white">{item.title || item.name}</h3>
                                    <p className="text-sm text-gray-400">
                                        {item.media_type === 'movie' ? 'Movie' : 'TV Series'} • 
                                        {item.release_date || item.first_air_date}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-1 text-yellow-500">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-sm">{item.vote_average?.toFixed(1)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Content Display */}
            {selectedContent && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Content Details Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 sticky top-4">
                            {selectedContent.poster_path && (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${selectedContent.poster_path}`}
                                    alt={selectedContent.title || selectedContent.name}
                                    className="w-full object-cover"
                                />
                            )}
                            <div className="p-6 space-y-4">
                                <h2 className="text-2xl font-bold text-white">
                                    {selectedContent.title || selectedContent.name}
                                </h2>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-400">
                                    <div className="flex items-center space-x-1">
                                        <Star size={16} className="text-yellow-500" />
                                        <span>{selectedContent.vote_average?.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Calendar size={16} />
                                        <span>
                                            {selectedContent.release_date || selectedContent.first_air_date}
                                        </span>
                                    </div>
                                </div>
                                
                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                                    {selectedContent.overview}
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                    {selectedContent.genres?.slice(0, 5).map((genre) => (
                                        <span key={genre.id} className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Torrents Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                                <div className="flex items-center space-x-4">
                                    <h3 className="text-xl font-bold text-white">Available Torrents</h3>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="px-3 py-1 bg-gray-700 rounded-lg text-sm text-white border border-gray-600"
                                    >
                                        <option value="all">🌍 All Languages</option>
                                        <option value="hindi">🇮🇳 Hindi Dubbed</option>
                                        <option value="english">🇬🇧 English</option>
                                    </select>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                    {torrents.length > 0 && (
                                        <button
                                            onClick={handleSelectAll}
                                            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                                        >
                                            {selectAll ? <CheckSquare size={18} /> : <Square size={18} />}
                                            <span>{selectAll ? 'Deselect All' : 'Select All'}</span>
                                        </button>
                                    )}
                                    
                                    <button
                                        onClick={handleSaveSelected}
                                        disabled={saving || selectedTorrentIndices.size === 0}
                                        className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-semibold transition-colors"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                <span>Save Selected ({selectedTorrentIndices.size})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                                    {torrents.map((torrent, index) => (
                                        <div
                                            key={index}
                                            className={`bg-gray-700 rounded-lg p-4 transition-all ${
                                                selectedTorrentIndices.has(index) ? 'ring-2 ring-red-500 bg-gray-650' : 'hover:bg-gray-650'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedTorrentIndices.has(index)}
                                                            onChange={() => handleTorrentSelect(index)}
                                                            className="w-5 h-5 rounded border-gray-500 text-red-600 focus:ring-red-500 cursor-pointer"
                                                        />
                                                        <h4 className="font-semibold text-white line-clamp-2">
                                                            {torrent.title.length > 150 ? torrent.title.substring(0, 150) + '...' : torrent.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 ml-8">
                                                        {torrent.quality && (
                                                            <span className="px-2 py-1 bg-blue-600 rounded text-xs font-mono">
                                                                {torrent.quality}
                                                            </span>
                                                        )}
                                                        {torrent.language && (
                                                            <span className={`px-2 py-1 rounded text-xs font-mono ${
                                                                torrent.isHindiDub ? 'bg-green-600' : 'bg-purple-600'
                                                            }`}>
                                                                {torrent.language} {torrent.isHindiDub && '(Dubbed)'}
                                                            </span>
                                                        )}
                                                        {torrent.size && (
                                                            <span className="px-2 py-1 bg-gray-600 rounded text-xs">
                                                                💾 {torrent.size}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-1 bg-green-800 rounded text-xs">
                                                            👥 Seeders: {torrent.seeders || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={torrent.magnetLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white transition-colors flex-shrink-0"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Download size={14} />
                                                    <span>Magnet</span>
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {torrents.length === 0 && !loading && (
                                        <div className="text-center py-12 text-gray-400">
                                            <p className="text-lg">No torrents found</p>
                                            <p className="text-sm mt-2">Try different search terms or language filter</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {torrents.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700 text-center text-sm text-gray-400">
                                    Showing {torrents.length} torrents • Select up to 10 at a time for saving
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;