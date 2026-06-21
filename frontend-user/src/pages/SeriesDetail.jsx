// frontend-user/src/pages/SeriesDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSeriesDetails } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Star, Calendar, Tv, ArrowLeft, Download, Copy, Check, TrendingUp, Users, HardDrive, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const SeriesDetail = () => {
    const { id } = useParams();
    const [series, setSeries] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedSeasons, setExpandedSeasons] = useState({});
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        fetchSeriesDetails();
    }, [id]);

    const fetchSeriesDetails = async () => {
        setLoading(true);
        try {
            const response = await getSeriesDetails(id);
            console.log('Series Data:', response.data);
            setSeries(response.data);
        } catch (error) {
            console.error('Error fetching series details:', error);
            toast.error('Failed to load series details');
        } finally {
            setLoading(false);
        }
    };

    const toggleSeason = (seasonNumber) => {
        setExpandedSeasons(prev => ({
            ...prev,
            [seasonNumber]: !prev[seasonNumber]
        }));
    };

    const copyMagnet = (magnet, index) => {
        if (!magnet) return;
        navigator.clipboard.writeText(magnet).then(() => {
            setCopied(index);
            toast.success('Magnet link copied!');
            setTimeout(() => setCopied(null), 2000);
        }).catch(() => {
            toast.error('Failed to copy');
        });
    };

    const openMagnet = (magnet) => {
        if (!magnet) return;
        window.open(magnet, '_blank');
        toast.success('Opening magnet link...');
    };

    // Safe data functions - Using title column
    const getTitle = () => {
        if (!series) return 'Unknown Series';
        return series.title || series.name || 'Unknown Series';
    };

    const getVoteAverage = () => {
        if (series?.vote_average === null || series?.vote_average === undefined) return 'N/A';
        const num = parseFloat(series.vote_average);
        return isNaN(num) ? 'N/A' : num.toFixed(1);
    };

    const getYear = () => {
        if (!series?.first_air_date) return 'N/A';
        return series.first_air_date.split('-')[0] || 'N/A';
    };

    const getSeasonsCount = () => {
        return series?.number_of_seasons || series?.seasons?.length || 0;
    };

    const getEpisodesCount = () => {
        return series?.number_of_episodes || 0;
    };

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    if (!series) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <p className="text-gray-400 text-lg">Series not found</p>
                <Link to="/series" className="text-[#e50914] hover:text-red-400 mt-4 inline-block">
                    Back to Series
                </Link>
            </div>
        );
    }

    const torrents = series.torrents || [];

    return (
        <div className="container mx-auto px-4 py-6">
            <Link to="/series" className="inline-flex items-center space-x-1 text-gray-400 hover:text-white text-sm mb-4 transition-colors">
                <ArrowLeft size={16} />
                <span>Back</span>
            </Link>

            {/* Series Header */}
            <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                    <div className="md:col-span-1">
                        {series.poster_path ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${series.poster_path}`}
                                alt={getTitle()}
                                className="w-full rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="w-full h-80 bg-gray-800 rounded-lg flex items-center justify-center">
                                <Tv size={48} className="text-gray-600" />
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-2 space-y-3">
                        {/* Title - Using title column */}
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{getTitle()}</h1>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center space-x-1 text-yellow-500">
                                <Star size={16} fill="currentColor" />
                                <span className="text-white font-semibold">{getVoteAverage()}</span>
                            </div>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-400">{getYear()}</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-400">{getSeasonsCount()} Seasons</span>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-400">{getEpisodesCount()} Episodes</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {series.genres?.map((genre) => (
                                <span key={genre.id} className="px-2 py-0.5 bg-gray-800 rounded-full text-xs text-gray-300 border border-gray-700">
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        <p className="text-gray-300 text-sm leading-relaxed">{series.overview || 'No overview available.'}</p>
                    </div>
                </div>
            </div>

            {/* Seasons & Episodes */}
            {series.seasons && series.seasons.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-bold text-white mb-4">Seasons & Episodes</h2>
                    <div className="space-y-3">
                        {series.seasons.map((season) => (
                            <div key={season.season_number} className="bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
                                <button
                                    onClick={() => toggleSeason(season.season_number)}
                                    className="w-full flex items-center justify-between p-3 hover:bg-gray-800/30 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <span className="text-white font-semibold">
                                            Season {season.season_number}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            {season.episode_count || 0} episodes
                                        </span>
                                    </div>
                                    {expandedSeasons[season.season_number] ? (
                                        <ChevronUp size={18} className="text-gray-400" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-400" />
                                    )}
                                </button>
                                
                                {expandedSeasons[season.season_number] && season.episodes && season.episodes.length > 0 && (
                                    <div className="border-t border-gray-800 p-3 space-y-2 max-h-96 overflow-y-auto">
                                        {season.episodes.map((episode) => (
                                            <div key={episode.episode_number} className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-colors">
                                                <div>
                                                    <span className="text-xs font-medium text-gray-400">
                                                        E{episode.episode_number}
                                                    </span>
                                                    <span className="text-sm text-white ml-2">
                                                        {episode.episode_title || episode.name || `Episode ${episode.episode_number}`}
                                                    </span>
                                                </div>
                                                {episode.torrents && episode.torrents.length > 0 && (
                                                    <span className="text-xs text-green-500">
                                                        {episode.torrents.length} torrents
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Torrents Section */}
            {torrents.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                        <Download size={20} className="text-[#e50914]" />
                        <span>Download Torrents</span>
                        <span className="text-sm text-gray-400 font-normal">
                            ({torrents.length})
                        </span>
                    </h2>

                    {['4K', '1080p', '720p', '480p'].map((quality) => {
                        const qualityTorrents = torrents.filter(t => t.quality === quality);
                        if (qualityTorrents.length === 0) return null;

                        return (
                            <div key={quality} className="mb-4 bg-[#1a1a2e] rounded-xl border border-gray-800 overflow-hidden">
                                <div className="flex items-center space-x-3 px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                                        quality === '4K' ? 'bg-purple-600' :
                                        quality === '1080p' ? 'bg-blue-600' :
                                        quality === '720p' ? 'bg-green-600' : 'bg-yellow-600'
                                    }`}>
                                        {quality}
                                    </span>
                                    <span className="text-gray-400 text-xs">
                                        {qualityTorrents.length} torrents
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-800">
                                    {qualityTorrents.map((torrent, index) => (
                                        <div key={torrent.id || index} className="p-3 hover:bg-gray-800/30 transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-medium truncate">
                                                        {torrent.title || torrent.torrent_title || 'Unknown Torrent'}
                                                    </p>
                                                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                                                        {torrent.size && (
                                                            <span className="flex items-center space-x-1">
                                                                <HardDrive size={12} />
                                                                <span>{torrent.size}</span>
                                                            </span>
                                                        )}
                                                        <span className="flex items-center space-x-1">
                                                            <TrendingUp size={12} className="text-green-500" />
                                                            <span>{torrent.seeders || 0}</span>
                                                        </span>
                                                        <span className="flex items-center space-x-1">
                                                            <Users size={12} className="text-yellow-500" />
                                                            <span>{torrent.leechers || 0}</span>
                                                        </span>
                                                        {torrent.is_hindi_dubbed && (
                                                            <span className="text-green-500">🇮🇳 Hindi</span>
                                                        )}
                                                        {torrent.torrent_type === 'season' && (
                                                            <span className="text-blue-400">Season Pack</span>
                                                        )}
                                                        {torrent.torrent_type === 'episode' && torrent.episode_number && (
                                                            <span className="text-purple-400">E{torrent.episode_number}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 flex-shrink-0">
                                                    <button
                                                        onClick={() => copyMagnet(torrent.magnet_link || torrent.magnetLink, index)}
                                                        className="flex items-center space-x-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs transition-colors"
                                                    >
                                                        {copied === index ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                                        <span>{copied === index ? 'Copied' : 'Copy'}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => openMagnet(torrent.magnet_link || torrent.magnetLink)}
                                                        className="flex items-center space-x-1 px-3 py-1 bg-[#e50914] hover:bg-red-700 rounded text-white text-xs font-medium transition-colors"
                                                    >
                                                        <Download size={14} />
                                                        <span>Download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SeriesDetail;