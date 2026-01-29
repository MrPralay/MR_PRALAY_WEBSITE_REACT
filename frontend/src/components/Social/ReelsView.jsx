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
            { threshold: 0.7 }
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
        <div className="relative w-full h-screen snap-center flex items-center justify-center p-4">
            {/* The Floating Neural Tablet */}
            <div className="relative w-full max-w-2xl h-[92vh] flex items-center justify-center bg-[#050505] rounded-[3.5rem] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.9)] border border-white/10 group">
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

                {/* Left Side Overlay (Bottom Aligned HUD) */}
                <div className="absolute bottom-12 left-10 right-20 z-20">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="story-ring p-[2px] cursor-pointer shadow-lg">
                            <img
                                src={post.user?.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                className="w-11 h-11 rounded-full object-cover border-2 border-black"
                                alt={post.user?.username}
                            />
                        </div>
                        <h4 className="text-white font-bold text-sm tracking-tight hover:text-emerald-400 transition-colors cursor-pointer text-shadow-lg">{post.user?.username}</h4>
                        <button className="px-5 py-2 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-wider rounded-xl hover:bg-emerald-400 transition-all ml-2 shadow-lg shadow-emerald-500/20">
                            Follow
                        </button>
                    </div>
                    <p className="text-white text-[15px] font-medium pr-12 line-clamp-2 leading-relaxed mb-5 drop-shadow-2xl">{post.caption}</p>
                    <div className="flex items-center gap-4 text-emerald-400 font-mono text-[9px] uppercase tracking-[0.2em]">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-emerald-500/20 shadow-2xl">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                            Neural Phase Locked
                        </div>
                    </div>
                </div>

                {/* Right Side Interaction HUD (Vertical Floating HUD) */}
                <div className="absolute bottom-14 right-8 z-20 flex flex-col items-center gap-7">
                    {/* Like Action */}
                    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsLiked(!isLiked)}>
                        <motion.div
                            whileTap={{ scale: 0.7 }}
                            className={`p-4 rounded-2xl backdrop-blur-xl border border-white/5 transition-all ${isLiked ? 'text-red-500 bg-red-500/10' : 'text-white bg-white/5 hover:bg-white/10'}`}
                        >
                            <Heart size={28} fill={isLiked ? "currentColor" : "none"} className="drop-shadow-2xl" />
                        </motion.div>
                        <span className="text-[11px] text-white font-extrabold drop-shadow-lg">{Math.floor(Math.random() * 5000)}</span>
                    </div>

                    {/* Comment Action */}
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/5 text-white transition-all hover:bg-white/10">
                            <MessageCircle size={28} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-extrabold drop-shadow-lg">{Math.floor(Math.random() * 200)}</span>
                    </div>

                    {/* Share Action */}
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/5 text-white transition-all hover:bg-white/10">
                            <Share2 size={28} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-extrabold drop-shadow-lg">Link</span>
                    </div>

                    {/* Bookmark Action */}
                    <div className="flex flex-col items-center gap-2 group cursor-pointer" onClick={() => setIsSaved(!isSaved)}>
                        <div className={`p-4 rounded-2xl backdrop-blur-xl border border-white/5 transition-all ${isSaved ? 'text-amber-500 bg-amber-500/10' : 'text-white bg-white/5 hover:bg-white/10'}`}>
                            <Bookmark size={28} fill={isSaved ? "currentColor" : "none"} className="drop-shadow-2xl" />
                        </div>
                        <span className="text-[11px] text-white font-extrabold drop-shadow-lg">Vault</span>
                    </div>

                    {/* More Menu */}
                    <div className="p-4 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/5 text-white cursor-pointer hover:bg-white/10 group-hover:rotate-90 transition-all">
                        < MoreHorizontal size={24} />
                    </div>

                    {/* Profile Link Animated Avatar */}
                    <div className="w-12 h-12 rounded-2xl border-2 border-emerald-500/30 overflow-hidden mt-2 p-[2px] bg-black/40 backdrop-blur-md">
                        <img src={post.user?.profileImage} className="w-full h-full rounded-xl object-cover animate-spin-slow" alt="mini" />
                    </div>
                </div>

                {/* Big Double-Tap Heart Overlay */}
                <AnimatePresence>
                    {showHeart && (
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 0 }}
                            animate={{ scale: 1.5, opacity: 1, y: -20 }}
                            exit={{ scale: 2, opacity: 0, y: -40 }}
                            className="absolute pointer-events-none z-40 text-red-500 drop-shadow-[0_0_80px_rgba(239,68,68,0.8)]"
                        >
                            <Heart size={160} fill="currentColor" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Top Interaction Layer (Ambient HUD) */}
                <div className="absolute top-10 left-10 right-10 z-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                        <h2 className="text-white text-xl font-black uppercase tracking-widest drop-shadow-2xl opacity-90">TV Matrix</h2>
                    </div>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-4 rounded-2xl bg-black/40 backdrop-blur-xl text-white border border-white/10 hover:bg-emerald-500 hover:text-black transition-all shadow-2xl"
                    >
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>

                {/* Play/Pause Center Indicator */}
                <AnimatePresence>
                    {!isPlaying && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.2, opacity: 0 }}
                            className="absolute pointer-events-none z-30 bg-black/60 backdrop-blur-3xl p-12 rounded-[2.5rem] border border-white/5"
                        >
                            <Play size={64} className="text-white ml-2" fill="white" />
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
