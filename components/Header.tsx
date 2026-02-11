import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 py-4 shadow-md">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 
            Custom Logo Image 
            1. Place your image file in the public folder and name it 'logo.png'
            2. Or update the src below to your specific URL/path
          */}
          <img 
            src="/images/logo.png" 
            alt="Pidgix Logo" 
            className="w-10 h-10 rounded-lg shadow-lg object-contain bg-gray-800 border border-gray-700"
            onError={(e) => {
              // Fallback to a placeholder if the image is missing
              e.currentTarget.onerror = null; 
              e.currentTarget.src = "https://placehold.co/100x100/008751/FFFFFF?text=PX";
            }}
          />
          
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Pidgix
            </h1>
            <p className="text-xs text-gray-400">Naija Pidgin Translator</p>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="bg-gray-800 px-3 py-1 rounded-full text-xs font-medium border border-gray-700 text-gray-300">
            Na We Dey Run Am
          </span>
        </div>
      </div>
    </header>
  );
};