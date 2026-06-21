// backend/src/controllers/seriesController.js
import pool from "../config/database.js";
import { TMDBService } from "../services/tmdbService.js";

export class SeriesController {
  // Search TMDB for series (for admin panel)
  static async searchTMDB(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const results = await TMDBService.searchMulti(query, "tv");
      res.json({ success: true, data: results });
    } catch (error) {
      console.error("TMDB search error:", error);
      res.status(500).json({ error: "Failed to search TMDB" });
    }
  }

  // Get all series with filters
  static async getSeriesList(req, res) {
    try {
      const {
        category,
        sort = "popularity",
        limit = 30,
        offset = 0,
      } = req.query;

      let query = `
                SELECT 
                    w.id,
                    w.tmdb_id,
                    w.title,
                    w.original_title,
                    w.overview,
                    w.poster_path,
                    w.backdrop_path,
                    w.first_air_date,
                    w.number_of_seasons,
                    w.number_of_episodes,
                    w.vote_average,
                    w.vote_count,
                    w.popularity,
                    w.status,
                    'tv' as media_type,
                    COUNT(DISTINCT fst.id) + COUNT(DISTINCT set.id) as torrent_count,
                    COUNT(DISTINCT fst.id) FILTER (WHERE fst.is_hindi_dubbed = true) + 
                    COUNT(DISTINCT set.id) FILTER (WHERE set.is_hindi_dubbed = true) as hindi_dubbed_count
                FROM tmdb_webseries w
                LEFT JOIN full_season_torrents fst ON w.id = fst.webseries_id
                LEFT JOIN single_episode_torrents set ON w.id = set.webseries_id
                WHERE 1=1
            `;

      const params = [];
      let paramCounter = 1;

      if (category && category !== "all") {
        query += ` AND LOWER(w.title) LIKE $${paramCounter}`;
        params.push(`%${category}%`);
        paramCounter++;
      }

      query += ` GROUP BY w.id`;

      if (sort === "popularity") {
        query += ` ORDER BY w.popularity DESC NULLS LAST`;
      } else if (sort === "rating") {
        query += ` ORDER BY w.vote_average DESC NULLS LAST`;
      } else if (sort === "latest") {
        query += ` ORDER BY w.first_air_date DESC NULLS LAST`;
      }

      query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ error: "Failed to fetch series" });
    }
  }

  // Save or Update Series from TMDB (with number_of_seasons)
  static async saveSeries(req, res) {
    const client = await pool.connect();

    try {
      const {
        tmdbData,
        torrents,
        torrentType,
        seasonNumber,
        episodeNumber,
        category,
      } = req.body;

      if (!tmdbData || !tmdbData.id) {
        return res.status(400).json({ error: "Invalid TMDB data" });
      }

      // Get full TV details from TMDB using existing service
      let fullTvDetails = null;
      try {
        fullTvDetails = await TMDBService.getTVDetails(tmdbData.id);
        console.log(`📺 TMDB Data: ${fullTvDetails.name}`);
        console.log(`   Seasons: ${fullTvDetails.number_of_seasons}`);
        console.log(`   Episodes: ${fullTvDetails.number_of_episodes}`);
      } catch (error) {
        console.error("Error fetching TV details from TMDB:", error);
        // Use provided data if TMDB fetch fails
        fullTvDetails = tmdbData;
      }

      await client.query("BEGIN");

      // Check if series exists
      const existingSeries = await client.query(
        "SELECT id FROM tmdb_webseries WHERE tmdb_id = $1",
        [fullTvDetails.id],
      );

      let seriesId;

      if (existingSeries.rows.length === 0) {
        // INSERT new series with number_of_seasons from TMDB
        const insertSeries = await client.query(
          `INSERT INTO tmdb_webseries (
                        tmdb_id, title, original_title, overview, poster_path, 
                        backdrop_path, first_air_date, last_air_date,
                        number_of_seasons, number_of_episodes,
                        vote_average, vote_count, popularity, status,
                        original_language, in_production
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                     RETURNING id`,
          [
            fullTvDetails.id,
            fullTvDetails.name || "Unknown",
            fullTvDetails.original_name || null,
            fullTvDetails.overview || "",
            fullTvDetails.poster_path || null,
            fullTvDetails.backdrop_path || null,
            fullTvDetails.first_air_date || null,
            fullTvDetails.last_air_date || null,
            fullTvDetails.number_of_seasons || 0,
            fullTvDetails.number_of_episodes || 0,
            fullTvDetails.vote_average || 0,
            fullTvDetails.vote_count || 0,
            fullTvDetails.popularity || 0,
            fullTvDetails.status || "Unknown",
            fullTvDetails.original_language || "en",
            fullTvDetails.in_production || false,
          ],
        );
        seriesId = insertSeries.rows[0].id;
        console.log(`✅ New series inserted: ${fullTvDetails.name}`);
        console.log(`   Number of Seasons: ${fullTvDetails.number_of_seasons}`);
        console.log(
          `   Number of Episodes: ${fullTvDetails.number_of_episodes}`,
        );
      } else {
        // UPDATE existing series with number_of_seasons from TMDB
        seriesId = existingSeries.rows[0].id;

        await client.query(
          `UPDATE tmdb_webseries SET
                        title = $1,
                        original_title = $2,
                        overview = $3,
                        poster_path = $4,
                        backdrop_path = $5,
                        first_air_date = $6,
                        last_air_date = $7,
                        number_of_seasons = $8,
                        number_of_episodes = $9,
                        vote_average = $10,
                        vote_count = $11,
                        popularity = $12,
                        status = $13,
                        original_language = $14,
                        in_production = $15,
                        updated_at = CURRENT_TIMESTAMP
                     WHERE id = $16`,
          [
            fullTvDetails.name || "Unknown",
            fullTvDetails.original_name || null,
            fullTvDetails.overview || "",
            fullTvDetails.poster_path || null,
            fullTvDetails.backdrop_path || null,
            fullTvDetails.first_air_date || null,
            fullTvDetails.last_air_date || null,
            fullTvDetails.number_of_seasons || 0,
            fullTvDetails.number_of_episodes || 0,
            fullTvDetails.vote_average || 0,
            fullTvDetails.vote_count || 0,
            fullTvDetails.popularity || 0,
            fullTvDetails.status || "Unknown",
            fullTvDetails.original_language || "en",
            fullTvDetails.in_production || false,
            seriesId,
          ],
        );
        console.log(`✅ Series updated: ${fullTvDetails.name}`);
        console.log(`   Number of Seasons: ${fullTvDetails.number_of_seasons}`);
        console.log(
          `   Number of Episodes: ${fullTvDetails.number_of_episodes}`,
        );
      }

      // Save seasons from TMDB using getTVSeasons or from fullTvDetails
      if (fullTvDetails.seasons && fullTvDetails.seasons.length > 0) {
        for (const season of fullTvDetails.seasons) {
          if (season.season_number > 0) {
            await client.query(
              `INSERT INTO seasons (
                                webseries_id, season_number, season_name, 
                                overview, poster_path, air_date, episode_count
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                             ON CONFLICT (webseries_id, season_number) 
                             DO UPDATE SET
                                season_name = EXCLUDED.season_name,
                                overview = EXCLUDED.overview,
                                poster_path = EXCLUDED.poster_path,
                                air_date = EXCLUDED.air_date,
                                episode_count = EXCLUDED.episode_count`,
              [
                seriesId,
                season.season_number,
                season.name || `Season ${season.season_number}`,
                season.overview || "",
                season.poster_path || null,
                season.air_date || null,
                season.episode_count || 0,
              ],
            );
          }
        }
        console.log(`✅ ${fullTvDetails.seasons.length} seasons saved`);
      } else {
        // If seasons not in fullTvDetails, fetch separately
        try {
          const seasons = await TMDBService.getTVSeasons(fullTvDetails.id);
          if (seasons && seasons.length > 0) {
            for (const season of seasons) {
              if (season.season_number > 0) {
                await client.query(
                  `INSERT INTO seasons (
                                        webseries_id, season_number, season_name, 
                                        overview, poster_path, air_date, episode_count
                                     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                                     ON CONFLICT (webseries_id, season_number) 
                                     DO UPDATE SET
                                        season_name = EXCLUDED.season_name,
                                        overview = EXCLUDED.overview,
                                        poster_path = EXCLUDED.poster_path,
                                        air_date = EXCLUDED.air_date,
                                        episode_count = EXCLUDED.episode_count`,
                  [
                    seriesId,
                    season.season_number,
                    season.name || `Season ${season.season_number}`,
                    season.overview || "",
                    season.poster_path || null,
                    season.air_date || null,
                    season.episode_count || 0,
                  ],
                );
              }
            }
            console.log(`✅ ${seasons.length} seasons saved from getTVSeasons`);
          }
        } catch (error) {
          console.log("No seasons found separately");
        }
      }

      // Save torrents
      let savedCount = 0;
      if (torrents && torrents.length > 0) {
        for (const torrent of torrents.slice(0, 30)) {
          let result;

          if (torrentType === "season") {
            result = await client.query(
              `INSERT INTO full_season_torrents (
                                webseries_id, season_number, magnet_link, 
                                torrent_title, file_size_text, file_size_bytes, 
                                seeders, leechers, is_hindi_dubbed, source_site, quality
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                             ON CONFLICT (magnet_link) DO NOTHING
                             RETURNING id`,
              [
                seriesId,
                seasonNumber || 1,
                torrent.magnetLink,
                torrent.title.substring(0, 500),
                torrent.size || "Unknown",
                torrent.sizeBytes || 0,
                torrent.seeders || 0,
                torrent.leechers || 0,
                torrent.isHindiDubbed || false,
                torrent.source || "Manual Upload",
                torrent.quality || "1080p",
              ],
            );
          } else {
            result = await client.query(
              `INSERT INTO single_episode_torrents (
                                webseries_id, season_number, episode_number, 
                                magnet_link, torrent_title, file_size_text, file_size_bytes, 
                                seeders, leechers, is_hindi_dubbed, source_site, quality
                             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                             ON CONFLICT (magnet_link) DO NOTHING
                             RETURNING id`,
              [
                seriesId,
                seasonNumber || 1,
                episodeNumber || 1,
                torrent.magnetLink,
                torrent.title.substring(0, 500),
                torrent.size || "Unknown",
                torrent.sizeBytes || 0,
                torrent.seeders || 0,
                torrent.leechers || 0,
                torrent.isHindiDubbed || false,
                torrent.source || "Manual Upload",
                torrent.quality || "1080p",
              ],
            );
          }

          if (result.rows[0]) {
            savedCount++;
          }
        }
      }

      await client.query("COMMIT");
      res.json({
        success: true,
        message: `Successfully saved ${savedCount} torrent(s)`,
        savedCount: savedCount,
        seriesId: seriesId,
        number_of_seasons: fullTvDetails.number_of_seasons || 0,
        number_of_episodes: fullTvDetails.number_of_episodes || 0,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save: " + error.message });
    } finally {
      client.release();
    }
  }

  // Get series details
  static async getSeriesDetails(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;

      // Get series details
      const seriesResult = await pool.query(
        `SELECT * FROM tmdb_webseries WHERE id = $1`,
        [id],
      );

      if (seriesResult.rows.length === 0) {
        return res.status(404).json({ error: "Series not found" });
      }

      const series = seriesResult.rows[0];

      // Get torrents
      const torrentsResult = await pool.query(
        `
                SELECT 
                    'season' as torrent_type,
                    fst.id,
                    fst.season_number,
                    NULL as episode_number,
                    fst.torrent_title as title,
                    fst.magnet_link,
                    fst.file_size_text as size,
                    fst.quality_id as quality,
                    fst.seeders,
                    fst.leechers,
                    fst.is_hindi_dubbed,
                    fst.source_site as source
                FROM full_season_torrents fst
                WHERE fst.webseries_id = $1
                
                UNION ALL
                
                SELECT 
                    'episode' as torrent_type,
                    set.id,
                    set.season_number,
                    set.episode_number,
                    set.torrent_title as title,
                    set.magnet_link,
                    set.file_size_text as size,
                    set.quality_id as quality,
                    set.seeders,
                    set.leechers,
                    set.is_hindi_dubbed,
                    set.source_site as source
                FROM single_episode_torrents set
                WHERE set.webseries_id = $1
                `,
        [id],
      );

      // Get seasons with episodes
      const seasonsResult = await pool.query(
        `
SELECT
    s.*,
    (
        SELECT json_agg(
            json_build_object(
                'id', set.id,
                'season_number', set.season_number,
                'episode_number', set.episode_number,
                'title', set.torrent_title,
                'magnet_link', set.magnet_link,
                'size', set.file_size_text,
                'quality_id', set.quality_id,
                'seeders', set.seeders,
                'leechers', set.leechers,
                'is_hindi_dubbed', set.is_hindi_dubbed
            )
        )
        FROM single_episode_torrents set
        WHERE set.season_number = s.season_number
        AND set.webseries_id = s.webseries_id
    ) as episodes
FROM seasons s
WHERE s.webseries_id = $1
ORDER BY s.season_number
`,
        [id],
      );

      const response = {
        ...series,
        torrents: torrentsResult.rows || [],
        seasons: seasonsResult.rows || [],
      };

      res.json({ success: true, data: response });
    } catch (error) {
      console.error("Error fetching series details:", error);
      res.status(500).json({ error: "Failed to fetch series details" });
    } finally {
      client.release();
    }
  }
}
