import React from 'react';
import { Search } from 'lucide-react';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobileSearch = () => {
    // Mock data for search grid
    const exploreItems = Array(20).fill(null).map((_, i) => ({
        id: i,
        type: i % 3 === 0 ? 'video' : 'image', // Mock type
        height: i % 5 === 0 ? 'h-[300px]' : 'aspect-square', // Varied heights for masonry feel
        bg: `bg-gray-${(i % 8 + 1) * 100}`, // random gray
        url: i % 3 === 0 ? 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4' : `https://picsum.photos/seed/${i * 123}/300/300` // Mock image/video
    }));

    return (
        <div className="bg-black min-h-screen text-white pb-20">
            {/* Search Bar */}
            <div className="sticky top-0 bg-black z-30 px-3 py-2">
                <div className="bg-[#262626] rounded-xl flex items-center px-4 py-2 gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-transparent text-white placeholder-gray-400 text-sm w-full focus:outline-none"
                    />
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-3 gap-[1px]">
                {exploreItems.map((item, i) => (
                    <div
                        key={i}
                        className={`relative bg-gray-900 ${item.type === 'video' && i % 10 === 0 ? 'row-span-2 col-span-1' : 'aspect-square'}`}
                    >
                        {isVideo(item.url) || item.type === 'video' ? (
                            <video
                                src={item.url}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={item.url}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                alt={`explore-${i}`}
                            />
                        )}
                        {item.type === 'video' && (
                            <div className="absolute top-2 right-2">
                                <span className="text-white drop-shadow-md text-[10px]">▶</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MobileSearch;
