// backend/src/services/databaseService.js
import pool from '../config/database.js';

class DatabaseService {
    // Save or update TMDB content
    static async saveTMDBContent(tmdbData, mediaType, categoryId = null) {
        const query = `
            INSERT INTO tmdb_content (
                tmdb_id, media_type, category_id, title, original_title, 
                overview, poster_path, backdrop_path, release_date, first_air_date,
                vote_average, vote_count, popularity, original_language
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (tmdb_id) DO UPDATE SET
                title = EXCLUDED.title,
                overview = EXCLUDED.overview,
                vote_average = EXCLUDED.vote_average,
                vote_count = EXCLUDED.vote_count,
                popularity = EXCLUDED.popularity,
                updated_at = CURRENT_TIMESTAMP
            RETURNING tmdb_id
        `;
        
        const values = [
            tmdbData.id,
            mediaType,
            categoryId,
            tmdbData.title || tmdbData.name,
            tmdbData.original_title || tmdbData.original_name,
            tmdbData.overview,
            tmdbData.poster_path,
            tmdbData.backdrop_path,
            mediaType === 'movie' ? tmdbData.release_date : null,
            mediaType === 'tv' ? tmdbData.first_air_date : null,
            tmdbData.vote_average || 0,
            tmdbData.vote_count || 0,
            tmdbData.popularity || 0,
            tmdbData.original_language || 'en'
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0].tmdb_id;
    }
    
    // Save torrent to database
    static async saveTorrent(torrentData) {
        // First, get or create quality_id
        let qualityId = null;
        if (torrentData.quality) {
            const qualityResult = await pool.query(
                'SELECT id FROM qualities WHERE name = $1',
                [torrentData.quality]
            );
            if (qualityResult.rows.length > 0) {
                qualityId = qualityResult.rows[0].id;
            }
        }
        
        // Get language_id
        let languageId = null;
        if (torrentData.language) {
            const languageResult = await pool.query(
                'SELECT id FROM languages WHERE name ILIKE $1',
                [`%${torrentData.language}%`]
            );
            if (languageResult.rows.length > 0) {
                languageId = languageResult.rows[0].id;
            }
        }
        
        // Get audio_type_id
        let audioTypeId = null;
        if (torrentData.is_hindi_dub) {
            const audioResult = await pool.query(
                "SELECT id FROM audio_types WHERE name = 'Hindi Dubbed'"
            );
            if (audioResult.rows.length > 0) {
                audioTypeId = audioResult.rows[0].id;
            }
        } else if (torrentData.is_dual_audio) {
            const audioResult = await pool.query(
                "SELECT id FROM audio_types WHERE name = 'Dual Audio'"
            );
            if (audioResult.rows.length > 0) {
                audioTypeId = audioResult.rows[0].id;
            }
        }
        
        const query = `
            INSERT INTO torrents (
                tmdb_id, magnet_link, torrent_title, size_text, quality_id,
                quality_text, resolution, audio_type_id, primary_language_id,
                is_hindi_dub, is_dual_audio, source_site, seeders, leechers
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            ON CONFLICT (magnet_link) DO UPDATE SET
                seeders = EXCLUDED.seeders,
                leechers = EXCLUDED.leechers,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        `;
        
        const values = [
            torrentData.tmdb_id,
            torrentData.magnet_link,
            torrentData.title,
            torrentData.size,
            qualityId,
            torrentData.quality,
            torrentData.resolution || torrentData.quality,
            audioTypeId,
            languageId,
            torrentData.is_hindi_dub || false,
            torrentData.is_dual_audio || false,
            torrentData.source || 'ThePirateBay',
            torrentData.seeders || 0,
            torrentData.leechers || 0
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0].id;
    }
    
    // Search content with filters
    static async searchContent(filters) {
        let query = `
            SELECT 
                c.tmdb_id,
                c.media_type,
                c.title,
                c.original_title,
                c.overview,
                c.poster_path,
                c.release_date,
                c.first_air_date,
                c.vote_average,
                c.popularity,
                cat.name as category,
                COUNT(DISTINCT t.id) as torrent_count,
                COUNT(DISTINCT t.id) FILTER (WHERE t.is_hindi_dub = true) as hindi_dub_count
            FROM tmdb_content c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN torrents t ON c.tmdb_id = t.tmdb_id
            WHERE 1=1
        `;
        
        const values = [];
        let paramCounter = 1;
        
        if (filters.search) {
            query += ` AND c.title ILIKE $${paramCounter}`;
            values.push(`%${filters.search}%`);
            paramCounter++;
        }
        
        if (filters.media_type) {
            query += ` AND c.media_type = $${paramCounter}`;
            values.push(filters.media_type);
            paramCounter++;
        }
        
        if (filters.category) {
            query += ` AND cat.slug = $${paramCounter}`;
            values.push(filters.category);
            paramCounter++;
        }
        
        query += ` GROUP BY c.tmdb_id, cat.name ORDER BY c.popularity DESC LIMIT 50`;
        
        const result = await pool.query(query, values);
        return result.rows;
    }
    
    // Get content with all torrents
    static async getContentWithTorrents(tmdbId) {
        const query = `
            SELECT 
                json_build_object(
                    'tmdb_id', c.tmdb_id,
                    'title', c.title,
                    'overview', c.overview,
                    'poster_path', c.poster_path,
                    'release_date', c.release_date,
                    'vote_average', c.vote_average,
                    'category', cat.name
                ) as content,
                json_agg(
                    json_build_object(
                        'id', t.id,
                        'title', t.torrent_title,
                        'magnet_link', t.magnet_link,
                        'size', t.size_text,
                        'quality', COALESCE(q.name, t.quality_text),
                        'seeders', t.seeders,
                        'leechers', t.leechers,
                        'is_hindi_dub', t.is_hindi_dub,
                        'source', t.source_site
                    )
                ) FILTER (WHERE t.id IS NOT NULL) as torrents
            FROM tmdb_content c
            LEFT JOIN categories cat ON c.category_id = cat.id
            LEFT JOIN torrents t ON c.tmdb_id = t.tmdb_id
            LEFT JOIN qualities q ON t.quality_id = q.id
            WHERE c.tmdb_id = $1
            GROUP BY c.tmdb_id, cat.name
        `;
        
        const result = await pool.query(query, [tmdbId]);
        return result.rows[0];
    }
}

export default DatabaseService;