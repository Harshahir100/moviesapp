// backend/src/controllers/torrentController.js (Updated)
import { TorrentScraper } from '../services/torrentScraper.js';
import { TMDBService } from '../services/tmdbService.js';
import DatabaseService from '../services/databaseService.js';

export class TorrentController {
    static async searchTorrents(req, res) {
        try {
            const { query, language = 'all' } = req.query;
            
            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required' });
            }
            
            const torrents = await TorrentScraper.searchTorrents(query, language);
            const optimizedTorrents = torrents.slice(0, 50);
            
            res.json({ success: true, data: optimizedTorrents });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Failed to fetch torrents' });
        }
    }
    
    static async saveContent(req, res) {
        try {
            const { tmdbData, torrents, mediaType, categoryId } = req.body;
            
            if (!tmdbData || !tmdbData.id) {
                return res.status(400).json({ error: 'Invalid TMDB data' });
            }
            
            if (!torrents || torrents.length === 0) {
                return res.status(400).json({ error: 'No torrents to save' });
            }
            
            // Save TMDB content
            const tmdbId = await DatabaseService.saveTMDBContent(tmdbData, mediaType, categoryId);
            
            // Save each torrent
            const savedTorrents = [];
            for (const torrent of torrents.slice(0, 20)) {
                const torrentId = await DatabaseService.saveTorrent({
                    tmdb_id: tmdbId,
                    magnet_link: torrent.magnetLink,
                    title: torrent.title,
                    size: torrent.size,
                    quality: torrent.quality,
                    resolution: torrent.resolution,
                    is_hindi_dub: torrent.isHindiDub || false,
                    is_dual_audio: torrent.language === 'Dual Audio',
                    source: torrent.source,
                    seeders: torrent.seeders,
                    leechers: torrent.leechers,
                    language: torrent.language
                });
                savedTorrents.push(torrentId);
            }
            
            res.json({ 
                success: true, 
                message: `Successfully saved ${savedTorrents.length} torrent(s)`,
                savedCount: savedTorrents.length
            });
        } catch (error) {
            console.error('Save error:', error);
            res.status(500).json({ error: 'Failed to save content: ' + error.message });
        }
    }
    
    static async searchDatabase(req, res) {
        try {
            const { q, type, category } = req.query;
            const results = await DatabaseService.searchContent({
                search: q,
                media_type: type,
                category: category
            });
            res.json({ success: true, data: results });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Failed to search database' });
        }
    }
    
    static async getContent(req, res) {
        try {
            const { tmdbId } = req.params;
            const content = await DatabaseService.getContentWithTorrents(parseInt(tmdbId));
            res.json({ success: true, data: content });
        } catch (error) {
            console.error('Fetch error:', error);
            res.status(500).json({ error: 'Failed to fetch content' });
        }
    }
}