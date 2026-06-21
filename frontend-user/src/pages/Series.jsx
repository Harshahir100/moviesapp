// frontend-user/src/pages/Series.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSeries } from '../services/api';
import SeriesCard from '../components/common/SeriesCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Tv, Filter, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Series = () => {
    const [series, setSeries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: 'all',
        sort: 'popularity',
    });

    useEffect(() => {
        fetchSeries();
    }, [filters]);

    const fetchSeries = async () => {
        setLoading(true);
        try {
            const params = {
                category: filters.category !== 'all' ? filters.category : null,
                sort: filters.sort,
                limit: 30,
            };
            const response = await getSeries(params);
            setSeries(response.data || []);
        } catch (error) {
            console.error('Error fetching series:', error);
            toast.error('Failed to load series');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        setFilters({
            category: 'all',
            sort: 'popularity',
        });
    };

    const categories = ['all', 'hollywood', 'bollywood', 'south', 'k-drama', 'anime'];

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                        <Tv size={28} className="text-[#e50914]" />
                        <span>TV Series</span>
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {series.length} series found
                    </p>
                </div>
                
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
                <div className="bg-[#1a1a2e] rounded-xl border border-gray-800 p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-semibold">Filter Series</h3>
                        <button onClick={clearFilters} className="text-gray-400 hover:text-white text-sm flex items-center space-x-1">
                            <X size={16} />
                            <span>Clear All</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#e50914]"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                            <select
                                value={filters.sort}
                                onChange={(e) => handleFilterChange('sort', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#e50914]"
                            >
                                <option value="popularity">Popularity</option>
                                <option value="rating">Rating</option>
                                <option value="latest">Latest</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Series Grid - Using SeriesCard instead of MovieCard */}
            {series.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                    {series.map((show) => (
                        <SeriesCard key={show.id} series={show} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📺</div>
                    <p className="text-gray-400 text-lg">No series found</p>
                    <p className="text-gray-500 text-sm mt-2">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
};

export default Series;