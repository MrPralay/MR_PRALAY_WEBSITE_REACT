import React, { useState, useRef, useEffect } from 'react';
import { Share2, Heart, MessageCircle, MoreHorizontal, Send, ChevronDown, Camera, Music, Search } from 'lucide-react';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobileReels = ({ posts }) => {
    // Mock Reels Data (Fallback)
    const mockReels = [
        { id: 'mock1', mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4', user: { username: 'neon_vibes', profileImage: 'https://i.pravatar.cc/150?u=neon' }, caption: 'City lights 🌃 #night #vibes', _count: { likes: 1200, comments: 128 }, isLiked: false },
        { id: 'mock2', mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4', user: { username: 'nature_lover', profileImage: 'https://i.pravatar.cc/150?u=nature' }, caption: 'Spring is here! 🌸', _count: { likes: 850, comments: 64 }, isLiked: true },
        { id: 'mock3', mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mother-with-her-little-daughter-eating-a-marshmallow-in-nature-39764-large.mp4', user: { username: 'family_first', profileImage: 'https://i.pravatar.cc/150?u=fam' }, caption: 'Sweet moments ❤️', _count: { likes: 22000, comments: 340 }, isLiked: false },
    ];

    const realVideoPosts = posts ? posts.filter(p => p.type === 'VIDEO') : [];
    const displayReels = realVideoPosts.length > 0 ? realVideoPosts : mockReels;

    return (
        <div className="bg-black h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide pb-16">
            {/* Header Overlay */}
            <div className="fixed top-0 left-0 right-0 z-20 flex justify-between items-center p-4 pt-4">
                <h2 className="font-bold text-xl drop-shadow-md">Reels</h2>
                <Camera size={26} className="drop-shadow-md" />
            </div>

            {displayReels.map((reel) => (
                <ReelItem key={reel.id} reel={reel} />
            ))}
        </div>
    );
};

const ReelItem = ({ reel }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLiked, setIsLiked] = useState(reel.isLiked || false);

    // Intersection Observer for Auto-play/Pause
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(() => { });
                        setIsPlaying(true);
                    } else {
                        videoRef.current?.pause();
                        setIsPlaying(false);
                        if (videoRef.current) videoRef.current.currentTime = 0;
                    }
                });
            },
            { threshold: 0.6 }
        );
        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);

    const togglePlay = () => {
        if (isPlaying) {
            videoRef.current?.pause();
        } else {
            videoRef.current?.play().catch(() => { });
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="relative w-full h-screen snap-start bg-gray-900 border-b border-white/5">
            <video
                ref={videoRef}
                src={reel.mediaUrl || reel.url}
                className="w-full h-full object-cover"
                loop
                playsInline
                muted // Muted by default for auto-play policy
                onClick={togglePlay}
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none"></div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col gap-6 items-center z-10 text-white">
                <div className="flex flex-col items-center gap-1">
                    <Heart
                        size={28}
                        className={`cursor-pointer transition-transform active:scale-75 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
                        onClick={() => setIsLiked(!isLiked)}
                    />
                    <span className="text-xs font-semibold">{reel._count?.likes || reel.likes || 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    <MessageCircle size={28} className="-rotate-90" />
                    <span className="text-xs font-semibold">{reel._count?.comments || reel.comments || 0}</span>
                </div>
                <Send size={28} />
                <MoreHorizontal size={28} />
                <div className="w-8 h-8 rounded-lg border-2 border-white overflow-hidden bg-gray-900">
                    {isVideo(reel.user?.profileImage || reel.user?.image) ? (
                        <video
                            src={reel.user?.profileImage || reel.user?.image}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img src={reel.user?.profileImage || reel.user?.image || `https://ui-avatars.com/api/?name=${reel.user?.username || 'User'}&background=random`} className="w-full h-full object-cover" />
                    )}
                </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 bottom-24 z-10 text-white max-w-[80%]">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white bg-gray-900">
                        {isVideo(reel.user?.profileImage || reel.user?.image) ? (
                            <video
                                src={reel.user?.profileImage || reel.user?.image}
                                className="w-full h-full object-cover"
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img src={reel.user?.profileImage || reel.user?.image || `https://ui-avatars.com/api/?name=${reel.user?.username || 'User'}&background=random`} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <span className="font-semibold text-sm">{reel.user?.username || reel.user}</span>
                    <button className="border border-white/40 rounded-lg px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">Follow</button>
                </div>
                <p className="text-sm mb-3 line-clamp-2">{reel.caption || reel.desc}</p>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full w-max">
                    <Music size={12} />
                    <div className="text-xs overflow-hidden w-24">
                        <div className="whitespace-nowrap animate-marquee">Original Audio - {reel.user?.username || reel.user}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileReels;
