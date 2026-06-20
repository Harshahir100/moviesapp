// backend/src/controllers/seriesController.js (Updated)
import { TMDBService } from '../services/tmdbService.js';
import { TorrentScraper } from '../services/torrentScraper.js';
import pool from '../config/database.js';

export class SeriesController {
    static async searchTMDB(req, res) {
        try {
            const { query } = req.query;
            
            if (!query) {
                return res.status(400).json({ error: 'Query parameter required' });
            }
            
            const results = await TMDBService.searchMulti(query, 'tv');
            res.json({ success: true, data: results });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({ error: 'Failed to search TMDB' });
        }
    }
    
    static async saveSeries(req, res) {
        const client = await pool.connect();
        
        try {
            const { tmdbData, torrents, torrentType, seasonNumber, episodeNumber } = req.body;
            
            if (!tmdbData || !tmdbData.id) {
                return res.status(400).json({ error: 'Invalid TMDB data' });
            }
            
            if (!torrents || torrents.length === 0) {
                return res.status(400).json({ error: 'No torrents to save' });
            }
            
            await client.query('BEGIN');
            
            // Check if series exists
            let seriesId;
            const existingSeries = await client.query(
                'SELECT id FROM tmdb_webseries WHERE tmdb_id = $1',
                [tmdbData.id]
            );
            
            if (existingSeries.rows.length === 0) {
                const insertSeries = await client.query(
                    `INSERT INTO tmdb_webseries (tmdb_id, title, original_title, overview, poster_path, 
                     backdrop_path, first_air_date, vote_average, vote_count, popularity)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                     RETURNING id`,
                    [
                        tmdbData.id,
                        tmdbData.name,
                        tmdbData.original_name,
                        tmdbData.overview || '',
                        tmdbData.poster_path || null,
                        tmdbData.backdrop_path || null,
                        tmdbData.first_air_date || null,
                        tmdbData.vote_average || 0,
                        tmdbData.vote_count || 0,
                        tmdbData.popularity || 0
                    ]
                );
                seriesId = insertSeries.rows[0].id;
                console.log(`New series inserted with ID: ${seriesId}`);
            } else {
                seriesId = existingSeries.rows[0].id;
                console.log(`Series already exists with ID: ${seriesId}`);
            }
            
            // Save torrents based on type
            let savedCount = 0;
            for (const torrent of torrents.slice(0, 30)) {
                let result;
                
                if (torrentType === 'season') {
                    result = await client.query(
                        `INSERT INTO full_season_torrents (
                            webseries_id, season_number, magnet_link, 
                            torrent_title, file_size_text, file_size_bytes, seeders, 
                            leechers, is_hindi_dubbed, source_site
                         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                         ON CONFLICT (magnet_link) DO UPDATE SET
                            seeders = EXCLUDED.seeders,
                            leechers = EXCLUDED.leechers,
                            updated_at = CURRENT_TIMESTAMP
                         RETURNING id`,
                        [
                            seriesId,
                            seasonNumber,
                            torrent.magnetLink,
                            torrent.title.substring(0, 500),
                            torrent.size || 'Unknown',
                            torrent.sizeBytes || 0,
                            torrent.seeders || 0,
                            torrent.leechers || 0,
                            torrent.isHindiDubbed || false,
                            torrent.source || 'ThePirateBay'
                        ]
                    );
                } else {
                    result = await client.query(
                        `INSERT INTO single_episode_torrents (
                            webseries_id, season_number, episode_number, 
                            magnet_link, torrent_title, file_size_text, file_size_bytes, 
                            seeders, leechers, is_hindi_dubbed, source_site
                         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                         ON CONFLICT (magnet_link) DO UPDATE SET
                            seeders = EXCLUDED.seeders,
                            leechers = EXCLUDED.leechers,
                            updated_at = CURRENT_TIMESTAMP
                         RETURNING id`,
                        [
                            seriesId,
                            seasonNumber,
                            episodeNumber,
                            torrent.magnetLink,
                            torrent.title.substring(0, 500),
                            torrent.size || 'Unknown',
                            torrent.sizeBytes || 0,
                            torrent.seeders || 0,
                            torrent.leechers || 0,
                            torrent.isHindiDubbed || false,
                            torrent.source || 'ThePirateBay'
                        ]
                    );
                }
                
                if (result.rows[0]) {
                    savedCount++;
                }
            }
            
            await client.query('COMMIT');
            res.json({ 
                success: true, 
                message: `Successfully saved ${savedCount} torrent(s)`,
                savedCount: savedCount,
                seriesId: seriesId
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Save error:', error);
            res.status(500).json({ error: 'Failed to save: ' + error.message });
        } finally {
            client.release();
        }
    }
}