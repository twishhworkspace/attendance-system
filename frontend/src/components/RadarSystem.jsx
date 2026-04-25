import React from 'react';

const RadarSystem = () => (
    <div className="radar-container pointer-events-none">
        <div className="radar-sweep"></div>
        <div className="radar-ring w-[100%] h-[100%]"></div>
        <div className="radar-ring w-[70%] h-[70%]"></div>
        <div className="radar-ring w-[40%] h-[40%]"></div>
        <div className="radar-blip top-[20%] left-[30%]" style={{ animationDelay: '0.2s' }}></div>
        <div className="radar-blip top-[60%] left-[80%]" style={{ animationDelay: '1.5s' }}></div>
        <div className="radar-blip top-[80%] left-[10%]" style={{ animationDelay: '2.8s' }}></div>
    </div>
);

export default RadarSystem;
