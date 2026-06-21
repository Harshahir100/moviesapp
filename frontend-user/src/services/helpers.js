// src/services/helpers.js
export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toFullYear();
};

export const formatRuntime = (minutes) => {
    if (!minutes) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const getRatingColor = (rating) => {
    if (rating >= 8) return 'text-green-500';
    if (rating >= 6) return 'text-yellow-500';
    return 'text-red-500';
};

export const truncateText = (text, maxLength = 150) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

export const getQualityBadge = (quality) => {
    const qualities = {
        '4K': 'bg-purple-600',
        '1080p': 'bg-blue-600',
        '720p': 'bg-green-600',
        '480p': 'bg-yellow-600',
        'Unknown': 'bg-gray-600'
    };
    return qualities[quality] || 'bg-gray-600';
};