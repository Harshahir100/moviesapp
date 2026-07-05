// backend/src/services/tmdbService.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export class TMDBService {
  // Search movies and TV shows
  static async searchMulti(query, type = "all") {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: "en-US",
          page: 1,
        },
      });

      let results = response.data.results;

      if (type === "movie") {
        results = results.filter((item) => item.media_type === "movie");
      } else if (type === "tv") {
        results = results.filter((item) => item.media_type === "tv");
      }

      return results.slice(0, 10);
    } catch (error) {
      console.error("TMDB API Error:", error.message);
      throw error;
    }
  }

  // Get movie details with all extra fields
  static async getMovieDetailsWithAll(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          append_to_response:
            "credits,similar,images,release_dates,keywords,translations",
        },
      });
      return response.data;
    } catch (error) {
      console.error("TMDB Movie Details Error:", error.message);
      throw error;
    }
  }

  // Get TV details with all extra fields
  static async getTVDetailsWithAll(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          append_to_response:
            "credits,similar,images,content_ratings,keywords,translations",
        },
      });
      return response.data;
    } catch (error) {
      console.error("TMDB TV Details Error:", error.message);
      throw error;
    }
  }

  // Get movie details (existing)
  static async getMovieDetails(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          append_to_response: "credits,similar,images,release_dates",
        },
      });
      return response.data;
    } catch (error) {
      console.error("TMDB Movie Details Error:", error.message);
      throw error;
    }
  }

  // Get TV series details (existing)
  static async getTVDetails(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
          append_to_response: "credits,similar,images,content_ratings",
        },
      });
      return response.data;
    } catch (error) {
      console.error("TMDB TV Details Error:", error.message);
      throw error;
    }
  }

  // Get TV season episodes
  static async getTVSeasonEpisodes(tmdbId, seasonNumber) {
    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("TMDB Season Episodes Error:", error.message);
      throw error;
    }
  }

  // Get movie credits
  static async getMovieCredits(tmdbId) {
    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/movie/${tmdbId}/credits`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("TMDB Credits Error:", error.message);
      throw error;
    }
  }

  // Get similar movies
  static async getSimilarMovies(tmdbId) {
    try {
      const response = await axios.get(
        `${TMDB_BASE_URL}/movie/${tmdbId}/similar`,
        {
          params: {
            api_key: TMDB_API_KEY,
            language: "en-US",
            page: 1,
          },
        },
      );
      return response.data.results.slice(0, 10);
    } catch (error) {
      console.error("TMDB Similar Movies Error:", error.message);
      throw error;
    }
  }

  // Get TV seasons list
  static async getTVSeasons(tmdbId) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
        params: {
          api_key: TMDB_API_KEY,
          language: "en-US",
        },
      });
      return response.data.seasons || [];
    } catch (error) {
      console.error("TMDB TV Seasons Error:", error.message);
      throw error;
    }
  }

  // ============ EXTRACTOR METHODS FOR EXTRA DETAILS ============

  // Extract director from credits
  // backend/src/services/tmdbService.js (Add these extractors if not present)

  // Extract director from credits
  static extractDirector(credits) {
    if (!credits || !credits.crew) return null;
    const director = credits.crew.find((person) => person.job === "Director");
    return director ? director.name : null;
  }

  // Extract writer from credits
  static extractWriter(credits) {
    if (!credits || !credits.crew) return null;
    const writer = credits.crew.find(
      (person) =>
        person.job === "Writer" ||
        person.job === "Screenplay" ||
        person.department === "Writing",
    );
    return writer ? writer.name : null;
  }

  // Extract creator for TV series
  static extractCreator(credits) {
    if (!credits || !credits.crew) return null;
    const creator = credits.crew.find((person) => person.job === "Creator");
    return creator ? creator.name : null;
  }

  // Extract countries
  static extractCountries(details) {
    if (!details || !details.production_countries) return [];
    return details.production_countries.map((c) => c.name);
  }

  // Extract original language
  static extractOriginalLanguage(details) {
    return details.original_language || "en";
  }

  // Extract runtime/duration
  static extractRuntime(details) {
    return details.runtime || 0;
  }

  // Extract genres
  static extractGenres(details) {
    if (!details || !details.genres) return [];
    return details.genres.map((g) => ({ id: g.id, name: g.name }));
  }
}
