// backend/src/controllers/searchController.js
import pool from '../config/database.js';

export class SearchController {
    
    // Global search for movies and series
    static async search(req, res) {
        try {
            const { q, limit = 30 } = req.query;
            
            if (!q || q.trim().length < 2) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Search query must be at least 2 characters' 
                });
            }
            
            const searchTerm = `%${q.trim()}%`;
            const exactMatch = q.trim();
            const startMatch = `${q.trim()}%`;
            const limitNum = parseInt(limit) || 30;
            
            // Search in movies
            const moviesQuery = `
                SELECT 
                    m.id,
                    m.tmdb_id,
                    m.title,
                    m.original_title,
                    m.overview,
                    m.poster_path,
                    m.release_date as date,
                    m.vote_average,
                    m.popularity,
                    'movie' as media_type,
                    COALESCE(COUNT(mt.id), 0) as torrent_count
                FROM tmdb_movies m
                LEFT JOIN movie_torrents mt ON m.id = mt.movie_id
                WHERE m.title ILIKE $1 OR m.original_title ILIKE $1
                GROUP BY m.id
                ORDER BY 
                    CASE 
                        WHEN m.title ILIKE $2 THEN 1
                        WHEN m.title ILIKE $3 THEN 2
                        ELSE 3
                    END,
                    m.popularity DESC NULLS LAST
                LIMIT $4
            `;
            
            // Search in series
            const seriesQuery = `
                SELECT 
                    w.id,
                    w.tmdb_id,
                    w.title,
                    w.original_title,
                    w.overview,
                    w.poster_path,
                    w.first_air_date as date,
                    w.vote_average,
                    w.popularity,
                    'tv' as media_type,
                    COALESCE(COUNT(DISTINCT fst.id) + COUNT(DISTINCT set.id), 0) as torrent_count
                FROM tmdb_webseries w
                LEFT JOIN full_season_torrents fst ON w.id = fst.webseries_id
                LEFT JOIN single_episode_torrents set ON w.id = set.webseries_id
                WHERE w.title ILIKE $1 OR w.original_title ILIKE $1
                GROUP BY w.id
                ORDER BY 
                    CASE 
                        WHEN w.title ILIKE $2 THEN 1
                        WHEN w.title ILIKE $3 THEN 2
                        ELSE 3
                    END,
                    w.popularity DESC NULLS LAST
                LIMIT $4
            `;
            
            const [moviesResult, seriesResult] = await Promise.all([
                pool.query(moviesQuery, [searchTerm, exactMatch, startMatch, limitNum]),
                pool.query(seriesQuery, [searchTerm, exactMatch, startMatch, limitNum])
            ]);
            
            // Combine results
            const results = [...moviesResult.rows, ...seriesResult.rows];
            
            // Sort by relevance
            results.sort((a, b) => {
                const aTitle = (a.title || '').toLowerCase();
                const bTitle = (b.title || '').toLowerCase();
                const query = q.toLowerCase();
                
                // Exact match
                const aExact = aTitle === query;
                const bExact = bTitle === query;
                if (aExact && !bExact) return -1;
                if (bExact && !aExact) return 1;
                
                // Starts with
                const aStarts = aTitle.startsWith(query);
                const bStarts = bTitle.startsWith(query);
                if (aStarts && !bStarts) return -1;
                if (bStarts && !aStarts) return 1;
                
                // Sort by torrent count
                return (b.torrent_count || 0) - (a.torrent_count || 0);
            });
            
            res.json({ 
                success: true, 
                data: results.slice(0, limitNum),
                total: results.length,
                query: q
            });
            
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to search: ' + error.message 
            });
        }
    }
}