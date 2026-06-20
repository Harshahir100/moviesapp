import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export class TMDBService {
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
    
    static async getMovieDetails(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    append_to_response: 'credits,similar'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB Movie Details Error:', error.message);
            throw error;
        }
    }
    
    static async getTVDetails(tmdbId) {
        try {
            const response = await axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}`, {
                params: {
                    api_key: TMDB_API_KEY,
                    language: 'en-US',
                    append_to_response: 'credits,similar'
                }
            });
            return response.data;
        } catch (error) {
            console.error('TMDB TV Details Error:', error.message);
            throw error;
        }
    }
}