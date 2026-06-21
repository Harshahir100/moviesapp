// backend/src/services/tmdbService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TMDBService {
    
    // Search movies and TV shows
    static async searchMulti(query, type = 'all') {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
                params: {
                    api_key: TMDB_API_KEY,
                    query: query,
                    language: 'en-US',
                    page: 1
                }
            });
            
            let results = response.data.results;
            
            if (type === 'movie') {
                results = results.filter(item => item.media_type === 'movie');
            } else if (type === 'tv') {
                results = results.filter(item => item.media_type === 'tv');
            }
            
            return results.slice(0, 10);
        } catch (error) {
            console.error('TMDB API Error:', error.message);
            throw error;
        }
    }
    
    // Get movie details
    static async getMovieDetails(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    append_to_response: 'credits,similar,images,release_dates'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB Movie Details Error:', error.message);
            throw error;
        }
    }
    
    // Get TV series details
    static async getTVDetails(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    append_to_response: 'credits,similar,images,content_ratings'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB TV Details Error:', error.message);
            throw error;
        }
    }
    
    // Get TV season episodes (FIXED - This was missing)
    static async getTVSeasonEpisodes(tmdbId, seasonNumber) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${seasonNumber}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB Season Episodes Error:', error.message);
            throw error;
        }
    }
    
    // Get movie credits
    static async getMovieCredits(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB Credits Error:', error.message);
            throw error;
        }
    }
    
    // Get similar movies
    static async getSimilarMovies(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/similar`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    page: 1
                }
            });
            return response.data.results.slice(0, 10);
        } catch (error) {
            console.error('TMDB Similar Movies Error:', error.message);
            throw error;
        }
    }
    
    // Get TV seasons list
    static async getTVSeasons(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US'
                }
            });
            return response.data.seasons || [];
        } catch (error) {
            console.error('TMDB TV Seasons Error:', error.message);
            throw error;
        }
    }
}