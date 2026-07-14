// frontend/src/services/torrentService.js (updated)
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

class TorrentService {
    static async searchTorrents(query, language = 'all') {
        try {
            const response = await axios.get(`${API_URL}/torrents/search`, {
                params: { query, language },
                timeout: 30000 // 30 second timeout
            });
            return response.data.data || [];
        } catch (error) {
            console.error('Torrent search error:', error);
            if (error.response?.status === 413) {
                throw new Error('Response too large. Please refine your search.');
            }
            throw error;
        }
    }
    
    static async saveContent(tmdbData, torrents, mediaType = 'movie', seasonEpisodes = []) {
        // Validate input size
        if (torrents.length > 20) {
            throw new Error('Too many torrents. Please select maximum 20 at a time.');
        }
        
        // Ensure data is not too large
        const payload = {
            tmdbData: {
                id: tmdbData.id,
                title: tmdbData.title,
                original_title: tmdbData.original_title,
                overview: tmdbData.overview?.substring(0, 1000),
                poster_path: tmdbData.poster_path,
                backdrop_path: tmdbData.backdrop_path,
                release_date: tmdbData.release_date,
                vote_average: tmdbData.vote_average,
                vote_count: tmdbData.vote_count,
                popularity: tmdbData.popularity,
                original_language: tmdbData.original_language,
                genres: tmdbData.genres,
                media_type: mediaType
            },
            torrents: torrents.map(t => ({
                magnetLink: t.magnetLink,
                title: t.title.substring(0, 300),
                size: t.size,
                quality: t.quality,
                language: t.language,
                isHindiDub: t.isHindiDub,
                seeders: t.seeders,
                leechers: t.leechers,
                source: t.source
            })),
            mediaType,
            seasonEpisodes: seasonEpisodes.slice(0, 50) // Limit episodes
        };
        
        const response = await axios.post(`${API_URL}/torrents/save`, payload, {
            timeout: 60000, // 60 second timeout for saving
            maxContentLength: 10 * 1024 * 1024, // 10MB max
            maxBodyLength: 10 * 1024 * 1024
        });
        
        return response.data;
    }
}

export default TorrentService;