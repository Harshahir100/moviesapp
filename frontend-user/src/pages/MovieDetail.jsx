// frontend-user/src/pages/MovieDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMovieDetails } from '../services/api';  // This will now work
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Star, Calendar, Clock, Film, Download, ArrowLeft, TrendingUp, Users, HardDrive } from 'lucide-react';
import toast from 'react-hot-toast';

const MovieDetail = () => {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovieDetails();
    }, [id]);

    const fetchMovieDetails = async () => {
        setLoading(true);
        try {
            const response = await getMovieDetails(id);
            setMovie(response.data);
        } catch (error) {
            console.error('Error fetching movie details:', error);
            toast.error('Failed to load movie details');
        } finally {
            setLoading(false);
        }
    };

    const openMagnet = (magnet) => {
        if (!magnet) return;
        window.open(magnet, '_blank');
        toast.success('Opening magnet link...');
    };

    // Safe data functions
    const getVoteAverage = () => {
        if (movie?.vote_average === null || movie?.vote_average === undefined) return 'N/A';
        const num = parseFloat(movie.vote_average);
        return isNaN(num) ? 'N/A' : num.toFixed(1);
    };

    const getRuntime = () => {
        if (!movie?.runtime) return 'N/A';
        const num = parseInt(movie.runtime);
        if (isNaN(num)) return 'N/A';
        return `${Math.floor(num / 60)}h ${num % 60}m`;
    };

    const getYear = () => {
        if (!movie?.release_date) return 'N/A';
        return movie.release_date.split('-')[0] || 'N/A';
    };

    const getGenres = () => {
        if (!movie?.genres || movie.genres.length === 0) return [];
        return movie.genres;
    };

    const getTorrents = () => {
        if (!movie?.torrents) return [];
        return movie.torrents;
    };

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    if (!movie) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400 text-lg">Movie not found</p>
                <Link to="/movies" className="text-[#e50914] hover:text-red-400 mt-4 inline-block">
                    Back to Movies
                </Link>
            </div>
        );
    }

    const torrents = getTorrents();

    // Group torrents by quality
    const groupedTorrents = {};
    const qualityOrder = ['4K', '1080p', '720p', '480p'];
    
    torrents.forEach(torrent => {
        const quality = torrent.quality || 'Unknown';
        if (!groupedTorrents[quality]) {
            groupedTorrents[quality] = [];
        }
        groupedTorrents[quality].push(torrent);
    });

    const sortedQualities = Object.keys(groupedTorrents).sort((a, b) => {
        return qualityOrder.indexOf(a) - qualityOrder.indexOf(b);
    });

    return (
        <div className="min-h-screen bg-[#0a0a1a]">
            {/* Back Button */}
            <div className="container mx-auto px-4 pt-6">
                <Link to="/movies" className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-sm transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back</span>
                </Link>
            </div>

            {/* Hero Section - Full Width Poster with Details */}
            <div className="relative w-full min-h-[70vh] flex items-end pb-12">
                {/* Background Poster */}
                {movie.backdrop_path || movie.poster_path ? (
                    <div className="absolute inset-0 z-0">
                        <img
                            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] via-[#0a0a1a]/70 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a] via-transparent to-transparent"></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#1a1a2e] to-[#0a0a1a]"></div>
                )}

                {/* Content */}
                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Poster */}
                        <div className="w-48 md:w-64 flex-shrink-0">
                            {movie.poster_path ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                                    alt={movie.title}
                                    className="w-full rounded-xl shadow-2xl"
                                />
                            ) : (
                                <div className="w-full aspect-[2/3] bg-gray-800 rounded-xl flex items-center justify-center">
                                    <Film size={48} className="text-gray-600" />
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 space-y-4">
                            <h1 className="text-3xl md:text-5xl font-bold text-white">{movie.title}</h1>
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                                <div className="flex items-center space-x-1 text-yellow-500">
                                    <Star size={16} fill="currentColor" />
                                    <span className="text-white font-semibold">{getVoteAverage()}</span>
                                </div>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">{getYear()}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">{getRuntime()}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-300">Movie</span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {getGenres().map((genre) => (
                                    <span key={genre.id} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gray-300 border border-white/5">
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-2xl">
                                {movie.overview || 'No overview available.'}
                            </p>

                            {movie.hindi_dubbed_count > 0 && (
                                <div className="flex items-center space-x-2 text-green-500 text-sm">
                                    <span>🇮🇳</span>
                                    <span>Hindi Dubbed Available</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Torrents Section - Title Up, Download Button Down */}
            <div className="container mx-auto px-4 py-8">
                {torrents.length > 0 ? (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-6">Download Torrents</h2>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {sortedQualities.map((quality) => {
                                const qualityTorrents = groupedTorrents[quality];
                                if (qualityTorrents.length === 0) return null;

                                return (
                                    <div key={quality} className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
                                        {/* Quality Header */}
                                        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-800/50 border-b border-gray-800">
                                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                                                quality === '4K' ? 'bg-purple-600' :
                                                quality === '1080p' ? 'bg-blue-600' :
                                                quality === '720p' ? 'bg-green-600' : 
                                                quality === '480p' ? 'bg-yellow-600' : 'bg-gray-600'
                                            }`}>
                                                {quality}
                                            </span>
                                            <span className="text-gray-400 text-sm">
                                                {qualityTorrents.length} torrents
                                            </span>
                                        </div>
                                        
                                        {/* Torrent List - Title Up, Button Down */}
                                        <div className="divide-y divide-gray-800">
                                            {qualityTorrents.map((torrent, index) => (
                                                <div key={torrent.id || index} className="p-6 hover:bg-gray-800/20 transition-colors">
                                                    {/* Title - Top */}
                                                    <div className="mb-4">
                                                        <p className="text-white text-xl font-semibold">
                                                            {torrent.title || torrent.torrent_title || 'Unknown Torrent'}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                                                            {torrent.size && (
                                                                <span className="flex items-center space-x-1">
                                                                    <HardDrive size={16} />
                                                                    <span className="text-base">{torrent.size}</span>
                                                                </span>
                                                            )}
                                                            <span className="flex items-center space-x-1">
                                                                <TrendingUp size={16} className="text-green-500" />
                                                                <span className="text-base">{torrent.seeders || 0} seeders</span>
                                                            </span>
                                                            <span className="flex items-center space-x-1">
                                                                <Users size={16} className="text-yellow-500" />
                                                                <span className="text-base">{torrent.leechers || 0} leechers</span>
                                                            </span>
                                                            {torrent.is_hindi_dubbed && (
                                                                <span className="text-green-500 text-base">🇮🇳 Hindi Dubbed</span>
                                                            )}
                                                            {torrent.source && (
                                                                <span className="text-gray-500 text-base">Source: {torrent.source}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Download Button - Bottom */}
                                                    <button
                                                        onClick={() => openMagnet(torrent.magnet_link || torrent.magnetLink)}
                                                        className="w-full py-3 bg-[#e50914] hover:bg-red-700 rounded-lg text-white text-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                                                    >
                                                        <Download size={22} />
                                                        <span>Download Magnet</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-12 text-center">
                        <div className="text-6xl mb-4">🔍</div>
                        <p className="text-gray-400 text-lg">No torrents available for this movie</p>
                        <p className="text-gray-500 text-sm mt-2">Check back later or search for another movie</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieDetail;