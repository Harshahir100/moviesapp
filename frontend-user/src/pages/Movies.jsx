// src/pages/Movies.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getMovies } from '../services/api';
import MovieCard from '../components/common/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Filter, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Movies = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        quality: searchParams.get('quality') || 'all',
        language: searchParams.get('language') || 'all',
        sort: 'popularity',
    });

    useEffect(() => {
        fetchMovies();
    }, [slug, filters]);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const params = {
                category: slug,
                quality: filters.quality !== 'all' ? filters.quality : null,
                language: filters.language !== 'all' ? filters.language : null,
                sort: filters.sort,
                limit: 30,
            };
            const response = await getMovies(params);
            setMovies(response.data || []);
        } catch (error) {
            console.error('Error fetching movies:', error);
            toast.error('Failed to load movies');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            quality: 'all',
            language: 'all',
            sort: 'popularity',
        });
    };

    const getCategoryTitle = () => {
        const categoryNames = {
            hollywood: 'Hollywood Movies',
            bollywood: 'Bollywood Movies',
            south: 'South Indian Movies',
            'k-drama': 'K-Drama Series',
        };
        return categoryNames[slug] || 'All Movies';
    };

    const qualities = ['all', '480p', '720p', '1080p', '4K'];
    const languages = ['all', 'Hindi', 'English', 'Tamil', 'Telugu', 'Korean'];

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {getCategoryTitle()}
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {movies.length} movies found
                    </p>
                </div>
                
                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-gray-800 rounded-lg text-white hover:bg-gray-700 transition-colors"
                >
                    <Filter size={18} />
                    <span>Filters</span>
                    <ChevronDown size={16} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-card-bg rounded-xl border border-gray-800 p-6 mb-8 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Filter Movies</h3>
                        <button onClick={clearFilters} className="text-gray-400 hover:text-white text-sm flex items-center space-x-1">
                            <X size={16} />
                            <span>Clear All</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Quality Filter */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Quality</label>
                            <select
                                value={filters.quality}
                                onChange={(e) => handleFilterChange('quality', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-netflix-red"
                            >
                                {qualities.map((q) => (
                                    <option key={q} value={q}>{q === 'all' ? 'All Qualities' : q}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Language Filter */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Language</label>
                            <select
                                value={filters.language}
                                onChange={(e) => handleFilterChange('language', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-netflix-red"
                            >
                                {languages.map((l) => (
                                    <option key={l} value={l}>{l === 'all' ? 'All Languages' : l}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Sort Filter */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-netflix-red"
                            >
                                <option value="popularity">Popularity</option>
                                <option value="rating">Rating</option>
                                <option value="latest">Latest</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Movie Grid */}
            {movies.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {movies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-gray-400 text-lg">No movies found</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
};

export default Movies;