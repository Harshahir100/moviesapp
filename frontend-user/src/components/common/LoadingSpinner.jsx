// src/components/common/LoadingSpinner.jsx
import React from 'react';

const LoadingSpinner = ({ size = 'md' }) => {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-12 h-12',
        lg: 'w-20 h-20',
    };
    
    return (
        <div className="flex justify-center items-center py-12">
            <div className={`${sizes[size]} border-4 border-netflix-red border-t-transparent rounded-full animate-spin`}></div>
        </div>
    );
};

export default LoadingSpinner;