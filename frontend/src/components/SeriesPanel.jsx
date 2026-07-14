// src/components/SeriesPanel.jsx (Complete Updated Version)
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Download, Save, Star, Calendar, Tv, ExternalLink, Layers, Film, TrendingUp, Users, HardDrive, Filter, X } from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const SeriesPanel = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSeries, setSelectedSeries] = useState(null);
    const [torrents, setTorrents] = useState([]);
    const [selectedTorrents, setSelectedTorrents] = useState(new Set());
    const [torrentType, setTorrentType] = useState('season');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [language, setLanguage] = useState('all');

    // Search TMDB for TV series
    const searchTMDB = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/series/search/tmdb`, {
                params: { query }
            });
            setSuggestions(response.data.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search series');
        }
    };

    // Search torrents with language filter
    const searchTorrentsWithLanguage = async (query, lang) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/movies/search/torrents`, {
                params: { query, language: lang }
            });
            
            setTorrents(response.data.data || []);
            setSelectedTorrents(new Set());
            
            if (response.data.data?.length === 0) {
                if (lang === 'hindi') {
                    toast.error('No Hindi dubbed torrents found. Try English or All filter.', {
                        duration: 5000,
                        icon: '🔍'
                    });
                } else {
                    toast(`No torrents found for this series`, { icon: '🔍' });
                }
            } else {
                toast.success(`Found ${response.data.data.length} torrent(s)`);
            }
        } catch (error) {
            console.error('Torrent search error:', error);
            toast.error('Failed to fetch torrents');
            setTorrents([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle series selection
    const handleSeriesSelect = async (series) => {
        setSelectedSeries(series);
        setSuggestions([]);
        setShowSuggestions(false);
        setSearchQuery(series.name);
        setTorrents([]);
        setSelectedTorrents(new Set());
    };

    // Search torrents for the series
    const searchTorrents = async () => {
        if (!selectedSeries) {
            toast.error('Please select a series first');
            return;
        }

        let searchTerm = `${selectedSeries.name}`;
        if (torrentType === 'season') {
            searchTerm += ` S${seasonNumber.toString().padStart(2, '0')} Complete Season`;
        } else {
            searchTerm += ` S${seasonNumber.toString().padStart(2, '0')}E${episodeNumber.toString().padStart(2, '0')}`;
        }
        
        await searchTorrentsWithLanguage(searchTerm, language);
    };

    // Handle language change
    const handleLanguageChange = async (newLanguage) => {
        setLanguage(newLanguage);
        
        if (selectedSeries) {
            let searchTerm = `${selectedSeries.name}`;
            if (torrentType === 'season') {
                searchTerm += ` S${seasonNumber.toString().padStart(2, '0')} Complete Season`;
            } else {
                searchTerm += ` S${seasonNumber.toString().padStart(2, '0')}E${episodeNumber.toString().padStart(2, '0')}`;
            }
            await searchTorrentsWithLanguage(searchTerm, newLanguage);
        }
    };

    const toggleTorrent = (index) => {
        const newSelected = new Set(selectedTorrents);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedTorrents(newSelected);
    };

    const selectAllTorrents = () => {
        if (selectedTorrents.size === torrents.length) {
            setSelectedTorrents(new Set());
        } else {
            setSelectedTorrents(new Set(torrents.map((_, i) => i)));
        }
    };

    const saveTorrents = async () => {
        if (!selectedSeries) {
            toast.error('No series selected');
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
            const response = await axios.post(`${API_URL}/series/save`, {
                tmdbData: selectedSeries,
                torrents: selectedTorrentsList,
                torrentType,
                seasonNumber,
                episodeNumber: torrentType === 'episode' ? episodeNumber : null
            });
            
            if (response.data.success) {
                toast.success(`Successfully saved ${selectedTorrentsList.length} torrent(s)!`);
                setSelectedTorrents(new Set());
                
                // Refresh torrent list
                await searchTorrents();
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
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
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        searchTMDB(e.target.value);
                    }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Search for a TV series... (e.g., Breaking Bad, The Boys, Game of Thrones)"
                    className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-red-500 transition-all text-lg"
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto animate-fadeIn">
                        {suggestions.map((series) => (
                            <div
                                key={series.id}
                                onClick={() => handleSeriesSelect(series)}
                                className="flex items-center space-x-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-0 group"
                            >
                                {series.poster_path ? (
                                    <img
                                        src={`https://image.tmdb.org/t/p/w92${series.poster_path}`}
                                        alt={series.name}
                                        className="w-12 h-16 object-cover rounded group-hover:scale-105 transition-transform"
                                    />
                                ) : (
                                    <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                                        <Tv size={24} className="text-gray-500" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors">
                                        {series.name} ({series.first_air_date?.split('-')[0] || 'N/A'})
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        ⭐ {series.vote_average?.toFixed(1) || 'N/A'} • TV Series
                                    </p>
                                </div>
                                <ExternalLink size={16} className="text-gray-500 group-hover:text-red-400" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selected Series Details */}
            {selectedSeries && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Series Info */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 sticky top-4">
                            {selectedSeries.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${selectedSeries.poster_path}`}
                                    alt={selectedSeries.name}
                                    className="w-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-96 bg-gray-700 flex items-center justify-center">
                                    <Tv size={64} className="text-gray-500" />
                                </div>
                            )}
                            <div className="p-5 space-y-4">
                                <h2 className="text-2xl font-bold text-white">{selectedSeries.name}</h2>
                                <div className="flex items-center space-x-3 text-sm">
                                    <div className="flex items-center space-x-1 text-yellow-500">
                                        <Star size={16} fill="currentColor" />
                                        <span className="text-white font-semibold">{selectedSeries.vote_average?.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 text-gray-400">
                                        <Calendar size={16} />
                                        <span>{selectedSeries.first_air_date?.split('-')[0] || 'N/A'}</span>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                                    {selectedSeries.overview || 'No overview available.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Torrent Configuration & List */}
                    <div className="lg:col-span-2">
                        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                            {/* Language Filter */}
                            <div className="mb-6 flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleLanguageChange('all')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            language === 'all' 
                                                ? 'bg-red-600 text-white shadow-lg' 
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
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
                                    >
                                        🇮🇳 Hindi Dubbed
                                    </button>
                                    <button
                                        onClick={() => handleLanguageChange('english')}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                            language === 'english' 
                                                ? 'bg-red-600 text-white shadow-lg' 
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        🇬🇧 English
                                    </button>
                                </div>
                            </div>

                            {/* Torrent Type Selector */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-4">Torrent Configuration</h3>
                                <div className="flex space-x-4 mb-4">
                                    <button
                                        onClick={() => setTorrentType('season')}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                                            torrentType === 'season'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Layers size={18} />
                                        <span>Full Season Pack</span>
                                    </button>
                                    <button
                                        onClick={() => setTorrentType('episode')}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                                            torrentType === 'episode'
                                                ? 'bg-red-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Film size={18} />
                                        <span>Single Episode</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2">Season Number</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={seasonNumber}
                                            onChange={(e) => setSeasonNumber(parseInt(e.target.value))}
                                            className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                        />
                                    </div>
                                    {torrentType === 'episode' && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-2">Episode Number</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={episodeNumber}
                                                onChange={(e) => setEpisodeNumber(parseInt(e.target.value))}
                                                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-end">
                                        <button
                                            onClick={searchTorrents}
                                            disabled={loading}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-colors"
                                        >
                                            {loading ? 'Searching...' : 'Search Torrents'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Torrents List */}
                            {torrents.length > 0 && (
                                <>
                                    <div className="flex justify-between items-center mb-4 pt-4 border-t border-gray-700">
                                        <h3 className="text-lg font-semibold text-white">
                                            Found Torrents ({torrents.length})
                                        </h3>
                                        <div className="flex space-x-3">
                                            <button
                                                onClick={selectAllTorrents}
                                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors text-sm"
                                            >
                                                {selectedTorrents.size === torrents.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                            <button
                                                onClick={saveTorrents}
                                                disabled={saving || selectedTorrents.size === 0}
                                                className="flex items-center space-x-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-white font-semibold"
                                            >
                                                {saving ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        <span>Saving...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={18} />
                                                        <span>Save ({selectedTorrents.size})</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {torrents.map((torrent, index) => (
                                            <div
                                                key={index}
                                                className={`bg-gray-700 rounded-lg p-4 transition-all ${
                                                    selectedTorrents.has(index) ? 'ring-2 ring-red-500' : 'hover:bg-gray-650'
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
                                                                    {torrent.size}
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
                                                    </div>
                                                    <a
                                                        href={torrent.magnetLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white transition-colors flex-shrink-0"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Download size={14} />
                                                        <span>Magnet</span>
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {torrents.length === 0 && !loading && selectedSeries && (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🔍</div>
                                    <p className="text-gray-400 text-lg">No torrents found</p>
                                    <p className="text-gray-500 text-sm mt-2">
                                        {language === 'hindi' 
                                            ? 'Try changing to "All" filter or search for a different series' 
                                            : 'Try changing the language filter or search for a different series'}
                                    </p>
                                    <button
                                        onClick={searchTorrents}
                                        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
                                    >
                                        Search Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeriesPanel;