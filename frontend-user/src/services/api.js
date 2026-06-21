// frontend-user/src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Get all movies with filters
export const getMovies = async (params = {}) => {
    try {
        const response = await api.get('/movies/list', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching movies:', error);
        return { data: [] };
    }
};

// Get movie details with torrents
export const getMovieDetails = async (id) => {
    try {
        const response = await api.get(`/movies/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return { data: null };
    }
};

// Get all series with filters
export const getSeries = async (params = {}) => {
    try {
        const response = await api.get('/series/list', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching series:', error);
        return { data: [] };
    }
};

// Get series details with seasons and episodes
export const getSeriesDetails = async (id) => {
    try {
        const response = await api.get(`/series/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching series details:', error);
        return { data: null };
    }
};

// Search content
export const searchContent = async (query) => {
    try {
        const response = await api.get('/search', { params: { q: query } });
        return response.data;
    } catch (error) {
        console.error('Error searching:', error);
        return { data: [] };
    }
};