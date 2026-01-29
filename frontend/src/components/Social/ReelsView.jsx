import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Volume2, VolumeX, Play, Pause } from 'lucide-react';

const ReelItem = ({ post }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showHeart, setShowHeart] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (videoRef.current) {
                        if (entry.isIntersecting) {
                            videoRef.current.play().catch(() => { });
                            setIsPlaying(true);
                        } else {
                            videoRef.current.pause();
                            setIsPlaying(false);
                            videoRef.current.currentTime = 0;
                        }
                    }
                });
            },
            { threshold: 0.8 }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => { if (videoRef.current) observer.unobserve(videoRef.current); };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleDoubleTap = (e) => {
        setIsLiked(true);
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 1000);
    };

    return (
        <div className="relative w-full h-[100vh] snap-start flex items-center justify-center bg-black overflow-hidden border-b border-white/5">
            {/* The Video Engine */}
            <div className="relative w-full max-w-2xl h-full flex items-center justify-center bg-black shadow-[0_0_100px_rgba(0,0,0,1)]">
                <video
                    ref={videoRef}
                    src={post.mediaUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted={isMuted}
                    playsInline
                    onClick={togglePlay}
                    onDoubleClick={handleDoubleTap}
                />

                {/* Left Side Overlay (Bottom Aligned) */}
                <div className="absolute bottom-10 left-6 right-20 z-20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="story-ring p-[2px] cursor-pointer">
                            <img
                                src={post.user?.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                className="w-10 h-10 rounded-full object-cover border-2 border-black"
                                alt={post.user?.username}
                            />
                        </div>
                        <h4 className="text-white font-bold text-sm tracking-tight hover:underline cursor-pointer">{post.user?.username}</h4>
                        <button className="px-5 py-1.5 bg-transparent border border-white/60 rounded-lg text-white font-bold text-[11px] uppercase tracking-wider hover:bg-white/10 transition-all ml-1">
                            Follow
                        </button>
                    </div>
                    <p className="text-white text-sm font-medium pr-12 line-clamp-2 leading-relaxed mb-4 drop-shadow-lg">{post.caption}</p>
                    <div className="flex items-center gap-4 text-emerald-400 font-mono text-[9px] uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-emerald-500/20 shadow-xl">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Neural Segment Active
                        </div>
                    </div>
                </div>

                {/* Right Side Interaction HUD (Vertical) */}
                <div className="absolute bottom-12 right-6 z-20 flex flex-col items-center gap-6">
                    {/* Like Action */}
                    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setIsLiked(!isLiked)}>
                        <motion.div
                            whileTap={{ scale: 0.8 }}
                            className={`p-3 rounded-full backdrop-blur-md transition-all ${isLiked ? 'text-red-500' : 'text-white'}`}
                        >
                            <Heart size={32} fill={isLiked ? "currentColor" : "none"} className="drop-shadow-2xl" />
                        </motion.div>
                        <span className="text-[11px] text-white font-bold drop-shadow-lg">{Math.floor(Math.random() * 5000)}</span>
                    </div>

                    {/* Comment Action */}
                    <div className="flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="p-3 text-white transition-all hover:scale-110">
                            <MessageCircle size={32} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-bold drop-shadow-lg">{Math.floor(Math.random() * 200)}</span>
                    </div>

                    {/* Share Action */}
                    <div className="flex flex-col items-center gap-1 group cursor-pointer">
                        <div className="p-3 text-white transition-all hover:scale-110">
                            <Share2 size={32} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-bold drop-shadow-lg">Transmit</span>
                    </div>

                    {/* Bookmark Action */}
                    <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={() => setIsSaved(!isSaved)}>
                        <div className={`p-3 transition-all hover:scale-110 ${isSaved ? 'text-amber-500' : 'text-white'}`}>
                            <Bookmark size={32} fill={isSaved ? "currentColor" : "none"} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-bold drop-shadow-lg">Save</span>
                    </div>

                    {/* Menu Action */}
                    <div className="p-3 text-white cursor-pointer hover:rotate-90 transition-transform">
                        <MoreHorizontal size={28} />
                    </div>

                    {/* User Mini Avatar as bottom icon */}
                    <div className="w-10 h-10 rounded-lg border-2 border-white/20 overflow-hidden mt-4 animate-spin-slow shadow-2xl">
                        <img src={post.user?.profileImage} className="w-full h-full object-cover" alt="mini" />
                    </div>
                </div>

                {/* Big Double-Tap Heart Overlay */}
                <AnimatePresence>
                    {showHeart && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 0 }}
                            animate={{ scale: 1.5, opacity: 1, y: -20 }}
                            exit={{ scale: 2, opacity: 0, y: -40 }}
                            className="absolute pointer-events-none z-40 text-red-500 drop-shadow-[0_0_50px_rgba(239,68,68,0.8)]"
                        >
                            <Heart size={150} fill="currentColor" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Interaction Layer */}
                <div className="absolute top-8 left-8 right-8 z-20 flex justify-between items-start">
                    <h2 className="text-white text-2xl font-bold tracking-tighter drop-shadow-2xl opacity-80">Reels</h2>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 transition-all shadow-2xl"
                    >
                        {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
                    </button>
                </div>

                {/* Play/Pause Center Indicator */}
                <AnimatePresence>
                    {!isPlaying && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="absolute pointer-events-none z-30 bg-black/40 backdrop-blur-2xl p-10 rounded-full border border-white/5"
                        >
                            <Play size={64} className="text-white ml-3" fill="white" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ReelsView = ({ posts, loading }) => {
    // Neural Filter: Only extract video segments for Reels Broadcast
    const reels = posts.filter(post => post.type === 'VIDEO');

    return (
        <div className="relative w-full h-screen overflow-y-scroll snap-y snap-mandatory hide-scrollbar bg-black">
            {loading ? (
                <div className="flex items-center justify-center h-full text-emerald-500 font-bold uppercase tracking-[0.4em] animate-pulse">
                    Synchronizing Reels Matrix...
                </div>
            ) : reels.length > 0 ? (
                reels.map((post) => (
                    <ReelItem key={post.id} post={post} />
                ))
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-[#050505]">
                    <div className="w-24 h-24 bg-emerald-500/5 rounded-full flex items-center justify-center mb-8 border border-emerald-500/10 border-dashed animate-spin-slow">
                        <Play size={40} className="text-emerald-500" />
                    </div>
                    <h2 className="text-white text-3xl font-bold tracking-tighter mb-4">No Neural Reels Yet</h2>
                    <p className="text-gray-500 max-w-sm font-medium">Broadcast your first video to see it appearing in the Synapse TV network.</p>
                </div>
            )}
        </div>
    );
};

export default ReelsView;
