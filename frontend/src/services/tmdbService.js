// frontend/src/services/tmdbService.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

class TMDBService {
    static async search(query) {
        const response = await axios.get(`${API_URL}/tmdb/search`, {
            params: { query, type: 'all' }
        });
        return response.data.data;
    }
    
    static async getDetails(tmdbId, mediaType) {
        const response = await axios.get(`${API_URL}/tmdb/details/${mediaType}/${tmdbId}`);
        return response.data.data;
    }
}

export default TMDBService;