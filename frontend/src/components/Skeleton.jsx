import React from 'react';

const Skeleton = ({ className = '', variant = 'text', width, height, style }) => {
    const baseClass = 'skeleton';
    const variantClass = `skeleton-${variant}`;
    
    const combinedStyle = {
        width,
        height,
        ...style
    };

    return (
        <div 
            className={`${baseClass} ${variantClass} ${className}`} 
            style={combinedStyle}
        />
    );
};

export default Skeleton;
