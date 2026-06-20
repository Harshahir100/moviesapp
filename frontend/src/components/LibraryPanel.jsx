// src/components/LibraryPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Film, Tv, Download, Eye, Trash2, Star, Calendar, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const LibraryPanel = () => {
    const [movies, setMovies] = useState([]);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/movies/list`);
            setMovies(response.data.data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error('Failed to fetch library');
        } finally {
            setLoading(false);
        }
    };

    const viewMovieDetails = async (movie) => {
        setSelectedMovie(movie);
    };

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Content Library</h2>
                <p className="text-red-100">Manage your saved movies and torrents</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-xl overflow-hidden animate-pulse">
                            <div className="h-64 skeleton"></div>
                            <div className="p-4 space-y-3">
                                <div className="h-5 skeleton rounded w-3/4"></div>
                                <div className="h-4 skeleton rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : movies.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {movies.map((movie) => (
                        <div
                            key={movie.id}
                            className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-red-500 transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                            onClick={() => viewMovieDetails(movie)}
                        >
                            {movie.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-full h-80 object-cover group-hover:opacity-75 transition-opacity"
                                />
                            ) : (
                                <div className="w-full h-80 bg-gray-700 flex items-center justify-center">
                                    <Film size={48} className="text-gray-500" />
                                </div>
                            )}
                            <div className="p-4">
                                <h3 className="font-semibold text-white truncate">{movie.title}</h3>
                                <div className="flex justify-between items-center mt-2 text-sm">
                                    <span className="text-gray-400">
                                        {movie.release_date?.split('-')[0] || 'N/A'}
                                    </span>
                                    <div className="flex items-center space-x-1 text-yellow-500">
                                        <Star size={14} fill="currentColor" />
                                        <span>{movie.vote_average?.toFixed(1)}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">
                                        🎬 {movie.torrent_count || 0} torrents
                                    </span>
                                    <button className="text-red-500 group-hover:text-red-400">
                                        <Eye size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-800 rounded-xl">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-400 text-lg">No movies in library yet</p>
                    <p className="text-gray-500 text-sm mt-2">Go to Movies tab and save some torrents</p>
                </div>
            )}

            {/* Movie Details Modal */}
            {selectedMovie && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="sticky top-0 bg-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">{selectedMovie.title}</h2>
                            <button
                                onClick={() => setSelectedMovie(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    {selectedMovie.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w300${selectedMovie.poster_path}`}
                                            alt={selectedMovie.title}
                                            className="w-full rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                                            <Film size={48} className="text-gray-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center space-x-4 mb-4">
                                        <div className="flex items-center space-x-1 text-yellow-500">
                                            <Star size={18} fill="currentColor" />
                                            <span className="text-white">{selectedMovie.vote_average?.toFixed(1)}</span>
                                        </div>
                                        <div className="flex items-center space-x-1 text-gray-400">
                                            <Calendar size={18} />
                                            <span>{selectedMovie.release_date?.split('-')[0] || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <p className="text-gray-300 mb-4 leading-relaxed">
                                        {selectedMovie.overview || 'No overview available.'}
                                    </p>
                                    <div className="bg-gray-800 rounded-lg p-4">
                                        <h3 className="text-white font-semibold mb-3">Torrent Information</h3>
                                        <p className="text-gray-400">
                                            Total Torrents: {selectedMovie.torrent_count || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryPanel;