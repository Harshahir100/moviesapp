// frontend-user/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMovies } from '../services/api';
import MovieCard from '../components/common/MovieCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Play, TrendingUp, Sparkles } from 'lucide-react';

const categories = [
    { name: 'Hollywood', slug: 'hollywood', icon: '🎬' },
    { name: 'Bollywood', slug: 'bollywood', icon: '🇮🇳' },
    { name: 'South', slug: 'south', icon: '🎭' },
    { name: 'K-Drama', slug: 'k-drama', icon: '🇰🇷' },
];

const Home = () => {
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [latestMovies, setLatestMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovies();
    }, []);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            const trending = await getMovies({ sort: 'popularity', limit: 8 });
            setTrendingMovies(trending.data || []);
            const latest = await getMovies({ sort: 'latest', limit: 8 });
            setLatestMovies(latest.data || []);
        } catch (error) {
            console.error('Error fetching movies:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner size="lg" />;
    }

    return (
        <div>
            {/* Hero Section - As per Image 1 */}
            <section className="relative h-[60vh] md:h-[70vh] flex items-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a1a] via-[#0a0a1a]/80 to-transparent z-10"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent z-10"></div>
                {trendingMovies[0]?.poster_path && (
                    <img
                        src={`https://image.tmdb.org/t/p/original${trendingMovies[0]?.backdrop_path || trendingMovies[0]?.poster_path}`}
                        alt="Featured"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
                <div className="container mx-auto px-4 relative z-20">
                    <div className="max-w-2xl">
                        <span className="inline-block px-3 py-1 bg-[#e50914]/20 text-[#e50914] text-sm font-semibold rounded-full mb-4">
                            🔥 Featured
                        </span>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                            {trendingMovies[0]?.title || trendingMovies[0]?.name || 'Welcome to MagnetFetcher'}
                        </h1>
                        <p className="text-gray-300 text-base md:text-lg mb-6 line-clamp-3">
                            {trendingMovies[0]?.overview || 'Discover and download your favorite movies and TV series.'}
                        </p>
                        <Link
                            to={`/movie/${trendingMovies[0]?.id || ''}`}
                            className="inline-flex items-center space-x-2 px-8 py-3 bg-[#e50914] hover:bg-red-700 rounded-full text-white font-semibold transition-all transform hover:scale-105"
                        >
                            <Play size={20} />
                            <span>Watch Now</span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="container mx-auto px-4 py-8">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Categories</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                    {categories.map((cat) => (
                        <Link
                            key={cat.slug}
                            to={`/category/${cat.slug}`}
                            className="group relative overflow-hidden rounded-xl bg-[#1a1a2e] border border-gray-800 hover:border-[#e50914] transition-all h-24 md:h-32 flex items-center justify-center"
                        >
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl mb-1">{cat.icon}</div>
                                <h3 className="text-white font-semibold text-sm md:text-base group-hover:text-[#e50914] transition-colors">
                                    {cat.name}
                                </h3>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-[#e50914]/0 to-[#e50914]/0 group-hover:from-[#e50914]/10 transition-all"></div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Trending Movies - As per Image 1 */}
            <section className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
                        <TrendingUp size={22} className="text-[#e50914]" />
                        <span>Trending Now</span>
                    </h2>
                    <Link to="/movies" className="text-[#e50914] hover:text-red-400 text-sm">
                        View All →
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {trendingMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </section>

            {/* Latest Movies */}
            <section className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white flex items-center space-x-2">
                        <span>🎬</span>
                        <span>Latest Movies</span>
                    </h2>
                    <Link to="/movies" className="text-[#e50914] hover:text-red-400 text-sm">
                        View All →
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {latestMovies.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;