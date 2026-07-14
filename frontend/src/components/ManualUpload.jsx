// src/components/ManualUpload.jsx
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
    Search, Upload, Film, Star, Calendar, ExternalLink, 
    Download, Save, Plus, Trash2, Clock, Tv, Layers, Play
} from 'lucide-react';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const ManualUpload = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [movieDetails, setMovieDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadType, setUploadType] = useState('movie');
    const [torrentType, setTorrentType] = useState('season');
    const [seasonNumber, setSeasonNumber] = useState(1);
    const [episodeNumber, setEpisodeNumber] = useState(1);
    const [torrents, setTorrents] = useState([
        { id: 1, title: '', magnetLink: '', size: '', quality: '1080p', language: 'Hindi', isHindiDubbed: true }
    ]);

    // Search TMDB
    const searchTMDB = async (query) => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        try {
            const endpoint = uploadType === 'movie' ? 'movies/search/tmdb' : 'series/search/tmdb';
            const response = await axios.get(`${API_URL}/${endpoint}`, {
                params: { query }
            });
            setSuggestions(response.data.data);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search');
        }
    };

    // Fetch movie/series details
    const fetchDetails = async (item) => {
        setLoading(true);
        try {
            const mediaType = item.media_type || uploadType;
            const response = await axios.get(`${API_URL}/tmdb/details/${mediaType}/${item.id}`);
            setMovieDetails(response.data.data);
            setSelectedMovie(item);
            setSuggestions([]);
            setShowSuggestions(false);
            setSearchQuery(item.title || item.name);
            
            setTorrents([{ 
                id: 1, 
                title: '', 
                magnetLink: '', 
                size: '', 
                quality: '1080p', 
                language: 'Hindi',
                isHindiDubbed: true 
            }]);
            
            toast.success(`${mediaType === 'movie' ? 'Movie' : 'Series'} details loaded!`);
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Failed to fetch details');
        } finally {
            setLoading(false);
        }
    };

    // Add torrent field
    const addTorrentField = () => {
        const newId = torrents.length > 0 ? Math.max(...torrents.map(t => t.id)) + 1 : 1;
        setTorrents([...torrents, { 
            id: newId, 
            title: '', 
            magnetLink: '', 
            size: '', 
            quality: '1080p', 
            language: 'Hindi',
            isHindiDubbed: true 
        }]);
    };

    // Remove torrent field
    const removeTorrentField = (id) => {
        if (torrents.length <= 1) {
            toast.error('At least one torrent is required');
            return;
        }
        setTorrents(torrents.filter(t => t.id !== id));
    };

    // Update torrent field
    const updateTorrent = (id, field, value) => {
        setTorrents(torrents.map(t => 
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    // Save all data
    const saveData = async () => {
        if (!selectedMovie || !movieDetails) {
            toast.error('Please select a movie/series first');
            return;
        }

        const invalidTorrents = torrents.filter(t => !t.magnetLink || !t.title);
        if (invalidTorrents.length > 0) {
            toast.error('Please fill all torrent fields (Title and Magnet Link are required)');
            return;
        }

        const confirmMessage = uploadType === 'movie' 
            ? `Save "${selectedMovie.title}" with ${torrents.length} torrent(s)?`
            : `Save "${selectedMovie.name}" Season ${seasonNumber} with ${torrents.length} torrent(s)?`;

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setSaving(true);
        try {
            const torrentData = torrents.map(t => ({
                magnetLink: t.magnetLink,
                title: t.title,
                size: t.size || 'Unknown',
                quality: t.quality || '1080p',
                isHindiDubbed: t.isHindiDubbed || false,
                language: t.language || 'Hindi',
                seeders: 0,
                leechers: 0,
                source: 'Manual Upload',
                seasonNumber: uploadType === 'tv' ? seasonNumber : null,
                episodeNumber: uploadType === 'tv' && torrentType === 'episode' ? episodeNumber : null,
                torrentType: uploadType === 'tv' ? torrentType : null
            }));

            let endpoint = `${API_URL}/movies/save`;
            if (uploadType === 'tv') {
                endpoint = `${API_URL}/series/save`;
            }

            const payload = {
                tmdbData: movieDetails,
                torrents: torrentData,
                torrentType: uploadType === 'tv' ? torrentType : null,
                seasonNumber: uploadType === 'tv' ? seasonNumber : null,
                episodeNumber: uploadType === 'tv' && torrentType === 'episode' ? episodeNumber : null
            };

            const response = await axios.post(endpoint, payload);

            if (response.data.success) {
                toast.success(`Successfully saved ${torrentData.length} torrent(s)!`);
                setTorrents([{ 
                    id: 1, 
                    title: '', 
                    magnetLink: '', 
                    size: '', 
                    quality: '1080p', 
                    language: 'Hindi',
                    isHindiDubbed: true 
                }]);
                setSeasonNumber(1);
                setEpisodeNumber(1);
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.error || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const getSeasons = () => {
        if (!movieDetails || !movieDetails.seasons) return [];
        return movieDetails.seasons.filter(s => s.season_number > 0);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Upload size={24} />
                    Manual Upload
                </h2>
                <p className="text-purple-100">Search for a movie/TV series and manually add torrent links</p>
            </div>

            {/* Content Type Selector */}
            <div className="flex space-x-4">
                <button
                    onClick={() => {
                        setUploadType('movie');
                        setSelectedMovie(null);
                        setMovieDetails(null);
                        setSearchQuery('');
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        uploadType === 'movie' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    🎬 Movie
                </button>
                <button
                    onClick={() => {
                        setUploadType('tv');
                        setSelectedMovie(null);
                        setMovieDetails(null);
                        setSearchQuery('');
                    }}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                        uploadType === 'tv' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                >
                    📺 TV Series / Web Series
                </button>
            </div>

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
                        placeholder={uploadType === 'movie' 
                            ? "Search for a movie... (e.g., Deadpool, Inception)" 
                            : "Search for a TV series... (e.g., The Boys, Breaking Bad)"}
                        className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all text-lg"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={24} />
                </div>

                {/* Suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-96 overflow-y-auto">
                        {suggestions.map((item) => {
                            const isMovie = item.media_type === 'movie' || uploadType === 'movie';
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => fetchDetails(item)}
                                    className="flex items-center space-x-4 p-4 hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-700 last:border-0 group"
                                >
                                    {item.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                                            alt={item.title || item.name}
                                            className="w-12 h-16 object-cover rounded"
                                        />
                                    ) : (
                                        <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center">
                                            {isMovie ? <Film size={24} className="text-gray-500" /> : <Tv size={24} className="text-gray-500" />}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white">{item.title || item.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            ⭐ {item.vote_average?.toFixed(1) || 'N/A'} • 
                                            {item.release_date || item.first_air_date || 'N/A'} • 
                                            {isMovie ? 'Movie' : 'TV Series'}
                                        </p>
                                    </div>
                                    <ExternalLink size={16} className="text-gray-500 group-hover:text-purple-400" />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                </div>
            )}

            {/* Movie/TV Details */}
            {movieDetails && selectedMovie && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {/* Info Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                        <div className="md:col-span-1">
                            {movieDetails.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${movieDetails.poster_path}`}
                                    alt={movieDetails.title || movieDetails.name}
                                    className="w-full rounded-lg"
                                />
                            ) : (
                                <div className="w-full h-80 bg-gray-700 rounded-lg flex items-center justify-center">
                                    {uploadType === 'movie' ? <Film size={48} className="text-gray-500" /> : <Tv size={48} className="text-gray-500" />}
                                </div>
                            )}
                        </div>
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {movieDetails.title || movieDetails.name}
                                    </h2>
                                    <p className="text-gray-400">
                                        {movieDetails.original_title || movieDetails.original_name}
                                    </p>
                                </div>
                                <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                                    TMDB ID: {movieDetails.id}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center space-x-1 text-yellow-500">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-white">{movieDetails.vote_average?.toFixed(1)}</span>
                                </div>
                                <div className="flex items-center space-x-1 text-gray-400">
                                    <Calendar size={16} />
                                    <span>{movieDetails.release_date || movieDetails.first_air_date || 'N/A'}</span>
                                </div>
                                {movieDetails.runtime && (
                                    <div className="flex items-center space-x-1 text-gray-400">
                                        <Clock size={16} />
                                        <span>{movieDetails.runtime} min</span>
                                    </div>
                                )}
                                {uploadType === 'tv' && movieDetails.number_of_seasons && (
                                    <div className="flex items-center space-x-1 text-gray-400">
                                        <Layers size={16} />
                                        <span>{movieDetails.number_of_seasons} Seasons</span>
                                    </div>
                                )}
                                {uploadType === 'tv' && movieDetails.number_of_episodes && (
                                    <div className="flex items-center space-x-1 text-gray-400">
                                        <Play size={16} />
                                        <span>{movieDetails.number_of_episodes} Episodes</span>
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                                {movieDetails.overview || 'No overview available.'}
                            </p>
                            
                            <div className="flex flex-wrap gap-2">
                                {movieDetails.genres?.slice(0, 5).map((genre) => (
                                    <span key={genre.id} className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            {/* Seasons List for TV Series */}
                            {uploadType === 'tv' && getSeasons().length > 0 && (
                                <div className="mt-2">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Available Seasons:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {getSeasons().map((season) => (
                                            <span key={season.season_number} className="px-3 py-1 bg-gray-700 rounded-full text-xs text-gray-300">
                                                Season {season.season_number} ({season.episode_count || 0} episodes)
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Torrent Upload Section */}
                    <div className="border-t border-gray-700 p-6">
                        {/* TV Series Specific Options */}
                        {uploadType === 'tv' && (
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-white mb-3">Torrent Type</h3>
                                <div className="flex space-x-4 mb-4">
                                    <button
                                        onClick={() => setTorrentType('season')}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                                            torrentType === 'season'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Layers size={18} />
                                        <span>Full Season</span>
                                    </button>
                                    <button
                                        onClick={() => setTorrentType('episode')}
                                        className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all ${
                                            torrentType === 'episode'
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        }`}
                                    >
                                        <Play size={18} />
                                        <span>Single Episode</span>
                                    </button>
                                </div>

                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Season Number *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={seasonNumber}
                                            onChange={(e) => setSeasonNumber(parseInt(e.target.value) || 1)}
                                            className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>
                                    {torrentType === 'episode' && (
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Episode Number *</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={episodeNumber}
                                                onChange={(e) => setEpisodeNumber(parseInt(e.target.value) || 1)}
                                                className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Torrent Fields */}
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <Download size={20} />
                                Add Torrents
                                {uploadType === 'tv' && (
                                    <span className="text-sm text-gray-400 font-normal">
                                        ({torrentType === 'season' ? `Season ${seasonNumber}` : `S${seasonNumber}E${episodeNumber}`})
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={addTorrentField}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
                            >
                                <Plus size={16} />
                                <span>Add Torrent</span>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {torrents.map((torrent) => (
                                <div key={torrent.id} className="bg-gray-700 rounded-lg p-4 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Torrent Title *</label>
                                            <input
                                                type="text"
                                                value={torrent.title}
                                                onChange={(e) => updateTorrent(torrent.id, 'title', e.target.value)}
                                                placeholder="e.g., The.Boys.S01.1080p.Hindi.Dubbed"
                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">Magnet Link *</label>
                                            <input
                                                type="text"
                                                value={torrent.magnetLink}
                                                onChange={(e) => updateTorrent(torrent.id, 'magnetLink', e.target.value)}
                                                placeholder="magnet:?xt=urn:btih:..."
                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-gray-400 mb-1">File Size</label>
                                            <input
                                                type="text"
                                                value={torrent.size}
                                                onChange={(e) => updateTorrent(torrent.id, 'size', e.target.value)}
                                                placeholder="e.g., 2.5 GB"
                                                className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Quality</label>
                                                <select
                                                    value={torrent.quality}
                                                    onChange={(e) => updateTorrent(torrent.id, 'quality', e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                >
                                                    <option value="480p">480p</option>
                                                    <option value="720p">720p</option>
                                                    <option value="1080p">1080p</option>
                                                    <option value="4K">4K</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-400 mb-1">Language</label>
                                                <select
                                                    value={torrent.language}
                                                    onChange={(e) => updateTorrent(torrent.id, 'language', e.target.value)}
                                                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500"
                                                >
                                                    <option value="Hindi">Hindi</option>
                                                    <option value="English">English</option>
                                                    <option value="Dual Audio">Dual Audio</option>
                                                    <option value="Tamil">Tamil</option>
                                                    <option value="Telugu">Telugu</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-4 mt-3">
                                        <label className="flex items-center space-x-2 text-sm text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={torrent.isHindiDubbed}
                                                onChange={(e) => updateTorrent(torrent.id, 'isHindiDubbed', e.target.checked)}
                                                className="rounded border-gray-500 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span>Hindi Dubbed</span>
                                        </label>
                                    </div>

                                    {torrents.length > 1 && (
                                        <button
                                            onClick={() => removeTorrentField(torrent.id)}
                                            className="absolute top-2 right-2 text-red-400 hover:text-red-300 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Save Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={saveData}
                                disabled={saving}
                                className="flex items-center space-x-2 px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-all transform hover:scale-105"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>Save to Database</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManualUpload;