// backend/src/controllers/tmdbController.js
import { TMDBService } from '../services/tmdbService.js';

export class TMDBController {
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
    
    static async getDetails(req, res) {
        try {
            const { tmdbId, mediaType } = req.params;
            const details = await TMDBService.getContentDetails(tmdbId, mediaType);
            
            let seasonEpisodes = [];
            if (mediaType === 'tv') {
                // Fetch all seasons episodes
                for (const season of details.seasons) {
                    if (season.season_number > 0) {
                        const seasonData = await TMDBService.getTVSeasonEpisodes(tmdbId, season.season_number);
                        seasonEpisodes.push(...seasonData.episodes.map(ep => ({
                            ...ep,
                            season_number: season.season_number
                        })));
                    }
                }
            }
            
            res.json({ success: true, data: details, seasonEpisodes });
        } catch (error) {
            console.error('TMDB details error:', error);
            res.status(500).json({ error: 'Failed to fetch details' });
        }
    }
}