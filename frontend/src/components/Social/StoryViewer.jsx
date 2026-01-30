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

    // Mock multiple stories if only one provided, for the 3-bar UI requirement
    const activeStories = stories?.length > 0 ? stories : [
        { id: 1, type: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() },
        { id: 2, type: 'IMAGE', mediaUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&q=80', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() },
        { id: 3, type: 'VIDEO', mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-hologram-interface-907-large.mp4', user: { username: 'synapse_core', image: 'https://i.pravatar.cc/150?u=synapse' }, createdAt: new Date() }
    ];

    // Safety check for index (in case of deletion)
    const safeIndex = Math.min(currentIndex, activeStories.length - 1);
    const currentStory = activeStories[safeIndex >= 0 ? safeIndex : 0];

    // If no stories at all (post-delete edge case), do nothing (parent closes it)
    if (!currentStory && stories?.length === 0) return null;

    // Dynamic Duration Logic
    const [videoDuration, setVideoDuration] = useState(null);
    const effectiveDuration = currentStory?.type === 'VIDEO'
        ? Math.min(videoDuration || 60000, 60000) // Cap at 60s
        : 5000;

    useEffect(() => {
        // Reset loading state when story changes
        setIsMediaLoading(true);
        setShowLoadingUI(false);
        setVideoDuration(null);

        const timer = setTimeout(() => {
            setIsMediaLoading(prev => {
                if (prev) setShowLoadingUI(true);
                return prev;
            });
        }, 100);

        // SAFETY OVERRIDE: If story is stuck for 5s, force clear the loader
        const safetyTimeout = setTimeout(() => setIsMediaLoading(false), 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(safetyTimeout);
        };
    }, [currentStory?.id]);

    // Handle initial load completion
    useEffect(() => {
        if (!isMediaLoading && isFirstStoryLoad) {
            setIsFirstStoryLoad(false);
        }
    }, [isMediaLoading, isFirstStoryLoad]);

    // Neural Re-Link Logic: Auto-retry when connection restored
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

    // Neural Cache Check: Instant detection for pre-fetched media
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

    // Unified Progress & Buffering Logic
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
            // Image Progress Logic
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[70] bg-black flex items-center justify-center md:py-8"
        >
            {/* Mobile Container Ratio */}
            <div className="relative w-full md:max-w-md h-full md:h-[90vh] bg-gray-900 md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col group">

                {/* Story Image/Video Area with Transitions */}
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
                                        // If net is off, wait for online event. If net is on, retry once.
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

                    {/* Neural Loading Spinner - Only shows if it takes too long */}
                    <AnimatePresence>
                        {showLoadingUI && isMediaLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-2xl bg-black/20"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                                    className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full"
                                />
                                <p className="text-white text-[7px] uppercase tracking-[0.4em] font-bold mt-4 animate-pulse">Neural Sync</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none z-10" />

                </div>

                {/* Progress Bars */}
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

                {/* Header Info */}
                <div className="absolute top-8 left-4 right-4 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={currentStory.user?.profileImage || currentStory.user?.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"} className="w-8 h-8 rounded-full border border-white/20" alt="User" />
                        <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-sm tracking-wide">{currentStory.user?.username}</span>
                            <span className="text-gray-400 text-xs font-medium">31s</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 relative">
                        <button
                            className="text-white hover:text-gray-300 transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <MoreHorizontal size={24} />
                        </button>
                        <button onClick={onClose} className="text-white hover:text-gray-300"><X size={24} /></button>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                    className="absolute top-10 right-0 bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-[160px] z-50 flex flex-col"
                                >
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(currentStory.mediaUrl);
                                            setIsMenuOpen(false);
                                            alert("Link Copied!");
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider text-left transition-colors"
                                    >
                                        <Copy size={14} className="text-emerald-500" />
                                        Copy Link
                                    </button>
                                    <div className="h-[1px] bg-white/5" />
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            if (onDelete) onDelete(currentStory.id);
                                        }}
                                        className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider text-left transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Hotspots */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full" onClick={handlePrev} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
                    <div className="w-2/3 h-full" onClick={handleNext} onMouseDown={() => setIsPaused(true)} onMouseUp={() => setIsPaused(false)} onTouchStart={() => setIsPaused(true)} onTouchEnd={() => setIsPaused(false)} />
                </div>

                {/* Footer Controls */}
                <div className="absolute bottom-6 left-4 right-4 z-20 flex items-center gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Send message..."
                            className="w-full bg-transparent border border-white/20 rounded-full py-3 px-6 text-white text-sm placeholder-white/70 focus:outline-none focus:border-white/50 backdrop-blur-md"
                        />
                    </div>

                    <button onClick={() => setIsLiked(!isLiked)} className="text-white hover:scale-110 transition-transform">
                        <Heart size={28} fill={isLiked ? "white" : "none"} />
                    </button>

                    <button className="text-white hover:scale-110 transition-transform">
                        <Send size={24} className="-rotate-45" />
                    </button>
                </div>

                {/* View Count */}
                <div className="absolute bottom-24 right-4 z-20 flex items-center gap-1.5 text-white/50 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                    <Eye size={12} />
                    <span className="text-[10px] font-bold tracking-wider">0 viewers</span>
                </div>

                {/* Volume Control (Moved here to be above hotspots) */}
                {currentStory?.type === 'VIDEO' && (
                    <div
                        className="absolute bottom-32 right-4 z-50 pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setIsMuted(!isMuted)}
                            className="p-2 bg-black/40 rounded-full backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all shadow-lg border border-white/10"
                        >
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default StoryViewer;
