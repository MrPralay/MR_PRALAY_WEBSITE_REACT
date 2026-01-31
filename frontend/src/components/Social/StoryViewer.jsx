import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, MoreHorizontal, Eye, Trash2, Copy, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StoryViewer = ({ stories, initialStoryIndex = 0, onClose, onDelete }) => {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const [showLoadingUI, setShowLoadingUI] = useState(false);
    const [isFirstStoryLoad, setIsFirstStoryLoad] = useState(true);
    const [retryKey, setRetryKey] = useState(0);
    const videoRef = useRef(null);
    const imgRef = useRef(null);

    const activeStories = stories?.length > 0 ? stories : [
        { id: 1, type: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() },
        { id: 2, type: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() },
        { id: 3, type: 'VIDEO', mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-hologram-interface-907-large.mp4', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() }
    ];

    const safeIndex = Math.min(currentIndex, activeStories.length - 1);
    const currentStory = activeStories[safeIndex >= 0 ? safeIndex : 0];

    if (!currentStory && stories?.length === 0) return null;

    const [videoDuration, setVideoDuration] = useState(null);
    const effectiveDuration = currentStory?.type === 'VIDEO'
        ? Math.min(videoDuration || 60000, 60000)
        : 5000;

    useEffect(() => {
        setIsMediaLoading(true);
        setShowLoadingUI(false);
        setVideoDuration(null);

        const timer = setTimeout(() => {
            setIsMediaLoading(prev => {
                if (prev) setShowLoadingUI(true);
                return prev;
            });
        }, 100);

        const safetyTimeout = setTimeout(() => setIsMediaLoading(false), 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(safetyTimeout);
        };
    }, [currentStory?.id]);

    useEffect(() => {
        if (!isMediaLoading && isFirstStoryLoad) {
            setIsFirstStoryLoad(false);
        }
    }, [isMediaLoading, isFirstStoryLoad]);

    useEffect(() => {
        const handleOnline = () => {
            if (isMediaLoading) {
                setRetryKey(prev => prev + 1);
                if (videoRef.current) videoRef.current.load();
            }
        };
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [isMediaLoading]);

    useEffect(() => {
        if (!currentStory) return;

        const checkLoadingStatus = () => {
            if (currentStory.type === 'IMAGE' && imgRef.current) {
                if (imgRef.current.complete) setIsMediaLoading(false);
            } else if (currentStory.type === 'VIDEO' && videoRef.current) {
                if (videoRef.current.readyState >= 3) setIsMediaLoading(false);
            }
        };

        checkLoadingStatus();
        const t = setTimeout(checkLoadingStatus, 50);
        return () => clearTimeout(t);
    }, [currentStory?.id, retryKey]);

    useEffect(() => {
        if (isPaused || isMediaLoading) {
            if (currentStory?.type === 'VIDEO' && videoRef.current) {
                videoRef.current.pause();
            }
            return;
        }

        if (currentStory?.type === 'VIDEO' && videoRef.current) {
            videoRef.current.play().catch(() => { });

            const updateVideoProgress = () => {
                if (videoRef.current && !isPaused && !isMediaLoading) {
                    const duration = videoRef.current.duration;
                    const currentTime = videoRef.current.currentTime;
                    if (duration) {
                        const calculatedProgress = (currentTime / duration) * 100;
                        setProgress(calculatedProgress);
                        if (calculatedProgress >= 99.9) handleNext();
                    }
                }
            };

            const interval = setInterval(updateVideoProgress, 30);
            return () => clearInterval(interval);
        } else {
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        handleNext();
                        return 100;
                    }
                    return prev + (100 / (effectiveDuration / 50));
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [currentIndex, isPaused, isMediaLoading, effectiveDuration, currentStory?.id]);

    const handleNext = () => {
        if (currentIndex < activeStories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl flex items-center justify-center p-0 md:p-8 perspective-[1500px]"
            >
                {/* 3D Floating Glass Slab Container */}
                <motion.div
                    animate={{
                        rotateY: [-4, 4],
                        rotateX: [2, -2],
                        y: [-10, 10],
                        scale: [1, 1.02]
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                    }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="relative w-full md:max-w-md h-full md:h-[90vh] flex flex-col group"
                >
                    {/* Glass Prism Frame - The Legendary Edge Effect */}
                    <div className="absolute -inset-[2px] rounded-[2rem] md:rounded-[2.2rem] bg-gradient-to-tr from-fuchsia-500/20 via-white/40 to-emerald-500/20 opacity-40 blur-[1px] z-0" />

                    {/* Main Story Content with Refractive Border */}
                    <div className="relative flex-1 bg-black md:rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col z-10 border border-white/10 ring-1 ring-white/5 backdrop-blur-sm">

                        {/* Media Display Area */}
                        <div className="absolute inset-0 z-0 bg-black">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={currentStory.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0"
                                >
                                    {currentStory?.type === 'VIDEO' ? (
                                        <video
                                            ref={videoRef}
                                            key={`video-${currentStory.id}-${retryKey}`}
                                            src={currentStory.mediaUrl}
                                            className={`w-full h-full object-cover transition-opacity duration-200 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`}
                                            autoPlay
                                            loop
                                            muted={isMuted}
                                            playsInline
                                            onLoadedMetadata={(e) => setVideoDuration(e.target.duration * 1000)}
                                            onLoadedData={() => setIsMediaLoading(false)}
                                            onCanPlay={() => setIsMediaLoading(false)}
                                            onWaiting={() => setIsMediaLoading(true)}
                                            onPlaying={() => setIsMediaLoading(false)}
                                            onError={() => {
                                                if (navigator.onLine) setTimeout(() => setRetryKey(k => k + 1), 2000);
                                            }}
                                        />
                                    ) : (
                                        <img
                                            ref={imgRef}
                                            key={`img-${currentStory.id}-${retryKey}`}
                                            src={currentStory.mediaUrl}
                                            className={`w-full h-full object-cover transition-opacity duration-200 ${isMediaLoading ? 'opacity-0' : 'opacity-100'}`}
                                            alt="Story"
                                            onLoad={() => setIsMediaLoading(false)}
                                            onError={() => {
                                                if (navigator.onLine) setTimeout(() => setRetryKey(k => k + 1), 2000);
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Loading State Overlay */}
                            <AnimatePresence>
                                {showLoadingUI && isMediaLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[60] flex flex-col items-center justify-center backdrop-blur-md bg-black/20"
                                    >
                                        <div className="absolute top-8 left-4 right-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3 animate-pulse">
                                                <div className="w-8 h-8 rounded-full bg-white/10" />
                                                <div className="space-y-2">
                                                    <div className="w-20 h-2 bg-white/10 rounded-full" />
                                                    <div className="w-10 h-1.5 bg-white/10 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                            className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full mb-4"
                                        />
                                        <p className="text-white text-[7px] uppercase tracking-[0.4em] font-bold opacity-40">Neural Sync</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Premium Vingette & Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />
                        </div>

                        {/* Top Progress Bars */}
                        <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
                            {activeStories.map((_, idx) => (
                                <div key={idx} className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-white"
                                        initial={{ width: idx < currentIndex ? '100%' : '0%' }}
                                        animate={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
                                        transition={{ ease: 'linear', duration: idx === currentIndex && !isPaused ? 0.05 : 0 }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Story Header */}
                        <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img src={currentStory.user?.profileImage || currentStory.user?.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"} className="w-8 h-8 rounded-full border border-white/20" alt="User" />
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold text-sm tracking-wide">{currentStory.user?.username}</span>
                                    <span className="text-gray-400 text-xs font-medium">31s</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 relative">
                                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white hover:text-gray-300 transition-colors">
                                    <MoreHorizontal size={24} />
                                </button>
                                <button onClick={onClose} className="text-white hover:text-gray-300 transition-colors"><X size={24} /></button>

                                <AnimatePresence>
                                    {isMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                            className="absolute top-10 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[160px] z-50 flex flex-col"
                                        >
                                            <button onClick={() => { navigator.clipboard.writeText(currentStory.mediaUrl); setIsMenuOpen(false); alert("Link Copied!"); }}
                                                className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider text-left transition-colors"
                                            >
                                                <Copy size={14} className="text-emerald-500" /> Copy Link
                                            </button>
                                            <div className="h-[1px] bg-white/5" />
                                            <button onClick={() => { setIsMenuOpen(false); if (onDelete) onDelete(currentStory.id); }}
                                                className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider text-left transition-colors"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Navigation Areas */}
                        <div className="absolute inset-0 z-10 flex">
                            <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
                            <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
                        </div>

                        {/* Control Footer */}
                        <div className="absolute bottom-6 left-4 right-4 z-20 flex items-center gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Send message..."
                                    className="w-full bg-black/20 border border-white/20 rounded-full py-3 px-6 text-white text-sm placeholder-white/70 focus:outline-none focus:border-white/50 backdrop-blur-md"
                                />
                            </div>
                            <button onClick={() => setIsLiked(!isLiked)} className="text-white hover:scale-110 transition-transform">
                                <Heart size={28} fill={isLiked ? "white" : "none"} />
                            </button>
                            <button className="text-white hover:scale-110 transition-transform">
                                <Send size={24} className="-rotate-45" />
                            </button>
                        </div>

                        {/* View Counters */}
                        <div className="absolute bottom-24 right-4 z-20 flex items-center gap-1.5 text-white/50 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                            <Eye size={12} />
                            <span className="text-[10px] font-bold tracking-wider">0 viewers</span>
                        </div>

                        {/* Video Controls */}
                        {currentStory?.type === 'VIDEO' && (
                            <div className="absolute bottom-32 right-4 z-50">
                                <button onClick={() => setIsMuted(!isMuted)} className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white/80 hover:text-white border border-white/10 shadow-lg transition-all">
                                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StoryViewer;
