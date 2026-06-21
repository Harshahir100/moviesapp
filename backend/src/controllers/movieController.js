// backend/src/controllers/movieController.js (Updated)
import { TMDBService } from "../services/tmdbService.js";
import { TorrentScraper } from "../services/torrentScraper.js";
import pool from "../config/database.js";

export class MovieController {
  // Search TMDB for movies
  static async searchTMDB(req, res) {
    try {
      const { query, type = "movie" } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const results = await TMDBService.searchMulti(query, type);
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Failed to search TMDB" });
    }
  }

  // Search torrents with enhanced Hindi support
  static async searchTorrents(req, res) {
    try {
      const { query, language = "all" } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      console.log(
        `Searching torrents: Query="${query}", Language="${language}"`,
      );

      const torrents = await TorrentScraper.searchTorrents(query, language);

      // Format response with size information
      const formattedTorrents = torrents.map((t) => ({
        ...t,
        size: t.size || "Unknown",
        sizeBytes: t.sizeBytes || 0,
        displaySize:
          t.size !== "Unknown"
            ? t.size
            : t.sizeBytes > 0
              ? TorrentScraper.formatFileSize(t.sizeBytes)
              : "Unknown",
      }));

      res.json({
        success: true,
        data: formattedTorrents,
        count: formattedTorrents.length,
        searchQuery: query,
        languageFilter: language,
      });
    } catch (error) {
      console.error("Torrent search error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch torrents: " + error.message });
    }
  }

  // Save movie with torrents to database
  static async saveMovie(req, res) {
    const client = await pool.connect();

    try {
      const { tmdbData, torrents } = req.body;

      if (!tmdbData || !tmdbData.id) {
        return res.status(400).json({ error: "Invalid TMDB data" });
      }

      if (!torrents || torrents.length === 0) {
        return res.status(400).json({ error: "No torrents to save" });
      }

      await client.query("BEGIN");

      // Check if movie already exists
      let movieId;
      const existingMovie = await client.query(
        "SELECT id FROM tmdb_movies WHERE tmdb_id = $1",
        [tmdbData.id],
      );

      if (existingMovie.rows.length === 0) {
        // Insert new movie
        const insertMovie = await client.query(
          `INSERT INTO tmdb_movies (tmdb_id, title, original_title, overview, poster_path, 
                     backdrop_path, release_date, runtime, vote_average, vote_count, popularity)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                     RETURNING id`,
          [
            tmdbData.id,
            tmdbData.title || tmdbData.name,
            tmdbData.original_title || tmdbData.original_name,
            tmdbData.overview || "",
            tmdbData.poster_path || null,
            tmdbData.backdrop_path || null,
            tmdbData.release_date || null,
            tmdbData.runtime && tmdbData.runtime > 0 ? tmdbData.runtime : 1,
            tmdbData.vote_average || 0,
            tmdbData.vote_count || 0,
            tmdbData.popularity || 0,
          ],
        );
        movieId = insertMovie.rows[0].id;
        console.log(`New movie inserted with ID: ${movieId}`);
      } else {
        movieId = existingMovie.rows[0].id;
        console.log(`Movie already exists with ID: ${movieId}`);
      }

      // Save torrents
      let savedCount = 0;
      for (const torrent of torrents.slice(0, 30)) {
        // Get quality id
        const qualityResult = await client.query(
          "SELECT id FROM movie_qualities WHERE quality_name = $1",
          [torrent.quality],
        );
        const qualityId = qualityResult.rows[0]?.id || null;

        // Get audio type id
        let audioTypeId = null;
        if (torrent.isHindiDubbed) {
          const audioResult = await client.query(
            "SELECT id FROM audio_types WHERE audio_type = 'Hindi Dubbed'",
          );
          audioTypeId = audioResult.rows[0]?.id || null;
        }

        // Insert torrent
        const result = await client.query(
          `INSERT INTO movie_torrents (
                        movie_id, quality_id, audio_type_id, magnet_link, 
                        torrent_title, file_size_text, file_size_bytes, seeders, 
                        leechers, is_hindi_dubbed, source_site
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                     ON CONFLICT (magnet_link) DO UPDATE SET
                        seeders = EXCLUDED.seeders,
                        leechers = EXCLUDED.leechers,
                        updated_at = CURRENT_TIMESTAMP
                     RETURNING id`,
          [
            movieId,
            qualityId,
            audioTypeId,
            torrent.magnetLink,
            torrent.title.substring(0, 500),
            torrent.size || torrent.displaySize || "Unknown",
            Math.round(Number(torrent.sizeBytes) || 0),
            torrent.seeders || 0,
            torrent.leechers || 0,
            torrent.isHindiDubbed || false,
            torrent.source || "ThePirateBay",
          ],
        );

        if (result.rows[0]) {
          savedCount++;
          console.log(`Torrent saved: ${torrent.title.substring(0, 50)}...`);
        }
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        message: `Successfully saved ${savedCount} torrent(s)`,
        savedCount: savedCount,
        movieId: movieId,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save: " + error.message });
    } finally {
      client.release();
    }
  }

  // Get all saved movies
  static async getMovies(req, res) {
    try {
      const result = await pool.query(`
                SELECT 
                    m.*, 
                    COUNT(mt.id) as torrent_count,
                    COUNT(mt.id) FILTER (WHERE mt.is_hindi_dubbed = true) as hindi_dubbed_count
                FROM tmdb_movies m
                LEFT JOIN movie_torrents mt ON m.id = mt.movie_id
                GROUP BY m.id
                ORDER BY m.created_at DESC
                LIMIT 50
            `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: "Failed to fetch movies" });
    }
  }

  // backend/src/controllers/movieController.js (Add this method)
static async getMovieDetails(req, res) {
    try {
        const { id } = req.params;
        
        const result = await pool.query(`
            SELECT 
                m.*,
                json_agg(
                    json_build_object(
                        'id', t.id,
                        'title', t.torrent_title,
                        'torrent_title', t.torrent_title,
                        'magnet_link', t.magnet_link,
                        'size', t.file_size_text,
                        'quality', t.quality,
                        'seeders', t.seeders,
                        'leechers', t.leechers,
                        'is_hindi_dubbed', t.is_hindi_dubbed,
                        'source', t.source_site
                    )
                ) FILTER (WHERE t.id IS NOT NULL) as torrents
            FROM tmdb_movies m
            LEFT JOIN movie_torrents t ON m.id = t.movie_id
            WHERE m.id = $1
            GROUP BY m.id
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
}
}
