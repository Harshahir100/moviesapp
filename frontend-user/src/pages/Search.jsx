// src/pages/Search.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchContent } from '../services/api';
import MovieCard from '../components/common/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search as SearchIcon, Film, Tv } from 'lucide-react';
import toast from 'react-hot-toast';

const Search = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        if (query) {
            performSearch();
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const response = await searchContent(query);
            setResults(response.data || []);
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Failed to search');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(item => {
        if (filter === 'movie') return item.media_type === 'movie' || !item.media_type;
        if (filter === 'tv') return item.media_type === 'tv';
        return true;
    });

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center space-x-3 mb-6">
                <SearchIcon size={28} className="text-netflix-red" />
                <h1 className="text-2xl font-bold text-white">
                    Search Results for "{query}"
                </h1>
            </div>

            {results.length > 0 ? (
                <>
                    {/* Filter Tabs */}
                    <div className="flex space-x-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === 'all' ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            All ({results.length})
                        </button>
                        <button
                            onClick={() => setFilter('movie')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                                filter === 'movie' ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            <Film size={16} />
                            <span>Movies ({results.filter(r => r.media_type === 'movie' || !r.media_type).length})</span>
                        </button>
                        <button
                            onClick={() => setFilter('tv')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${
                                filter === 'tv' ? 'bg-netflix-red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                            }`}
                        >
                            <Tv size={16} />
                            <span>TV Series ({results.filter(r => r.media_type === 'tv').length})</span>
                        </button>
                    </div>

                    {/* Results Grid */}
                    {filteredResults.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                            {filteredResults.map((item) => (
                                <MovieCard key={item.id} movie={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-400">No {filter} results found</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-400 text-lg">No results found for "{query}"</p>
                    <p className="text-gray-500 text-sm mt-2">Try searching with different keywords</p>
                </div>
            )}
        </div>
    );
};

export default Search;