// backend/src/controllers/tmdbController.js
import { TMDBService } from '../services/tmdbService.js';

export class TMDBController {
    
    // Search TMDB
    static async search(req, res) {
        try {
            const { query, type = 'all' } = req.query;
            
            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            
            const results = await TMDBService.searchMulti(query, type);
            res.json({ success: true, data: results });
        } catch (error) {
            console.error('TMDB search error:', error);
            res.status(500).json({ error: 'Failed to search TMDB' });
        }
    }
    
    // Get TMDB details with season episodes
    static async getDetails(req, res) {
        try {
            const { mediaType, tmdbId } = req.params;
            
            if (!tmdbId || !mediaType) {
                return res.status(400).json({ error: 'TMDB ID and media type are required' });
            }
            
            let details;
            let seasonEpisodes = [];
            
            if (mediaType === 'movie') {
                details = await TMDBService.getMovieDetails(tmdbId);
            } else if (mediaType === 'tv') {
                details = await TMDBService.getTVDetails(tmdbId);
                
                // Fetch all seasons episodes for TV series
                if (details && details.seasons) {
                    for (const season of details.seasons) {
                        if (season.season_number > 0) {
                            try {
                                const seasonData = await TMDBService.getTVSeasonEpisodes(tmdbId, season.season_number);
                                if (seasonData && seasonData.episodes) {
                                    seasonEpisodes.push(...seasonData.episodes.map(ep => ({
                                        ...ep,
                                        season_number: season.season_number
                                    })));
                                }
                            } catch (error) {
                                console.log(`Error fetching season ${season.season_number}:`, error.message);
                                // Continue with other seasons
                            }
                        }
                    }
                }
            } else {
                return res.status(400).json({ error: 'Invalid media type. Use "movie" or "tv"' });
            }
            
            res.json({ 
                success: true, 
                data: details, 
                seasonEpisodes: seasonEpisodes 
            });
        } catch (error) {
            console.error('TMDB details error:', error);
            res.status(500).json({ error: 'Failed to fetch details: ' + error.message });
        }
    }
}