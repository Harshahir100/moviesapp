// frontend-user/src/components/common/SeriesCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Tv } from 'lucide-react';

const SeriesCard = ({ series }) => {
    const getTitle = () => {
        return series.title || series.name || 'Unknown Series';
    };

    const getYear = () => {
        if (!series.first_air_date) return 'N/A';
        return series.first_air_date.split('-')[0] || 'N/A';
    };

    const getVoteAverage = () => {
        if (series.vote_average === null || series.vote_average === undefined) return null;
        const num = parseFloat(series.vote_average);
        return isNaN(num) ? null : num;
    };

    return (
        <Link to={`/series/${series.id}`} className="block group">
            <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a] hover:border-[#e50914] transition-all hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-[#e50914]/10">
                <div className="relative aspect-[2/3] overflow-hidden bg-gray-800">
                    {series.poster_path ? (
                        <img
                            src={`https://image.tmdb.org/t/p/w300${series.poster_path}`}
                            alt={getTitle()}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Tv size={40} className="text-gray-600" />
                        </div>
                    )}
                    
                    {getVoteAverage() !== null && (
                        <div className="absolute bottom-2 left-2 flex items-center space-x-1 px-2 py-0.5 bg-black/70 rounded-lg">
                            <Star size={12} className="text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold text-white">{getVoteAverage().toFixed(1)}</span>
                        </div>
                    )}
                    
                    {series.hindi_dubbed_count > 0 && (
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-emerald-600/80 text-[10px] font-semibold rounded">
                            🇮🇳 Hindi
                        </div>
                    )}
                    
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#e50914]/80 text-[10px] font-semibold rounded">
                        📺 Series
                    </div>
                </div>
                
                <div className="p-2.5">
                    <h3 className="font-semibold text-white text-sm line-clamp-1 group-hover:text-[#e50914] transition-colors">
                        {getTitle()}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-0.5">
                        <span>{getYear()}</span>
                        {series.torrent_count > 0 && (
                            <span className="text-gray-500">{series.torrent_count} torrents</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default SeriesCard;