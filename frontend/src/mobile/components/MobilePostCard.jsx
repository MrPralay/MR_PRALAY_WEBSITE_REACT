import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobilePostCard = React.memo(({ post, onInteraction, onFollowChange, onProfileClick, onOptionsClick, index = 0 }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [likesCount, setLikesCount] = useState(post._count?.likes || 0);

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (onProfileClick && post.user) {
            onProfileClick(post.user);
        }
    };
    const [lastClickTime, setLastClickTime] = useState(0);
    const [showHeartOverlay, setShowHeartOverlay] = useState(false);
    const [isMediaLoaded, setIsMediaLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    // Derived state directly from props to ensure zero-latency sync across components
    // We default to false/0 if undefined to prevent crashes
    const isFollowing = post.isFollowing || post.user?.isFollowing || false;
    const followersCount = post.user?._count?.followers || 0;

    // Video handling
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const abortControllerRef = useRef(null); // Ref for cancelling outdated requests
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    // Neural Mask Logic (Same as web)
    const neuralMask = React.useMemo(() => {
        const maskNumber = Math.floor(Math.random() * 6) + 1;
        return `/assets/neural-masks/mask_${maskNumber}.webp`;
    }, []);

    const handleDoubleTap = (e) => {
        const now = Date.now();
        if (now - lastClickTime < 300) {
            // Double tap detected
            if (!isLiked) handleLike();
            setShowHeartOverlay(true);
            setTimeout(() => setShowHeartOverlay(false), 1000);
        }
        setLastClickTime(now);
    };

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token');
            await fetch(`${apiUrl}/api/social/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) { console.error(err); }
    };

    const handleFollow = async (e) => {
        e.stopPropagation();

        // Safety: Cancel any previous pending request to prevent race conditions
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new controller for this specific request
        const newController = new AbortController();
        abortControllerRef.current = newController;

        setIsFollowLoading(true);
        const targetState = !isFollowing;
        const targetId = post.user?.id || post.user?.userId;

        // Optimistic Update via Parent (Instant Sync)
        if (onFollowChange) {
            onFollowChange(post.id, targetId, targetState);
        }

        try {
            if (!targetId) throw new Error("Target user identity not found");

            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');
            const response = await fetch(`${apiUrl}/api/social/users/${targetId}/follow`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                signal: newController.signal // Link request to controller
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.debug || errorData.error || `Status: ${response.status}`);
            }
        } catch (err) {
            // Ignore abort errors (user just clicked again)
            if (err.name === 'AbortError') return;

            console.error("Follow Error:", err);
            // Revert state on actual error
            if (onFollowChange) {
                onFollowChange(post.id, targetId, !targetState);
            }
        } finally {
            // Only clear loading if this is still the active request
            if (abortControllerRef.current === newController) {
                setIsFollowLoading(false);
            }
        }
    };

    // Auto-play video & Cinematic trigger when in view
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (post.type === 'VIDEO') {
                            videoRef.current?.play().catch(() => { });
                            setIsPlaying(true);
                        }
                        setIsInView(true);
                    } else {
                        if (post.type === 'VIDEO') {
                            videoRef.current?.pause();
                            setIsPlaying(false);
                        }
                        setIsInView(false);
                    }
                });
            },
            { threshold: 0.85 }
        );

        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [post.type]);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
            transition={{
                duration: 0.6,
                ease: [0.33, 1, 0.68, 1], // Custom easeOutExpo
                delay: index < 5 ? index * 0.05 : 0,
            }}
            className="bg-black text-white w-full border-b border-white/5 pb-2 mb-1 overflow-hidden"
        >
            {/* Media Canvas - Neural Masking Applied */}
            <div
                className="relative w-full aspect-[4/5] bg-[#0d0d0d] post-media-container flex items-center justify-center overflow-hidden"
                onClick={handleDoubleTap}
            >
                {/* Floating Header Overlay */}
                <div className="absolute top-0 left-0 right-0 z-40 px-3 py-2 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/20 to-transparent">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-full bg-gray-800/50 overflow-hidden border border-white/20 p-[1px] backdrop-blur-md cursor-pointer"
                            onClick={handleProfileClick}
                        >
                            {isVideo(post.user?.profileImage || post.user?.image) ? (
                                <video
                                    src={post.user?.profileImage || post.user?.image}
                                    className="w-full h-full rounded-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={post.user?.profileImage || post.user?.image || `https://ui-avatars.com/api/?name=${post.user?.username || 'User'}&background=random`}
                                    alt={post.user?.username}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span
                                className="text-[12px] font-bold tracking-tight text-white drop-shadow-lg cursor-pointer"
                                onClick={handleProfileClick}
                            >
                                {post.user?.username}
                            </span>
                            <div className="flex items-center gap-1.5 -mt-1">
                                {post.location ? (
                                    <span className="text-[9px] text-white/70">{post.location}</span>
                                ) : (
                                    <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">{followersCount.toLocaleString()} Following</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Only show follow button if it's not the current user */}
                        {post.user?.id !== Cookies.get('synapse_userId') && (
                            <button
                                onClick={handleFollow}
                                // disabled={isFollowLoading} // Removed to allow rapid toggling
                                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${isFollowing
                                    ? 'bg-white/10 border-white/20 text-white'
                                    : 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                    }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                        )}
                        <button
                            className="p-2 -mr-2 text-white/90 active:scale-95 transition-transform"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onOptionsClick) onOptionsClick(post);
                            }}
                        >
                            <MoreHorizontal size={20} className="drop-shadow-md" />
                        </button>
                    </div>
                </div>

                {/* Underlying Neural Atmosphere */}
                <AnimatePresence>
                    {!isMediaLoaded && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute inset-0 z-10 overflow-hidden bg-[#0d0d0d]"
                        >
                            <img
                                src={neuralMask}
                                className="absolute inset-0 w-full h-full object-cover opacity-40 scale-100 grayscale transition-transform duration-[10s] linear"
                                style={{ transform: 'scale(1.1)' }}
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-skeleton-shimmer z-20" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {post.type === 'VIDEO' ? (
                    <div className="relative w-full h-full">
                        <video
                            ref={videoRef}
                            src={post.mediaUrl}
                            className={`post-media-fix object-cover transition-opacity duration-700 ${(isInView && isMediaLoaded) ? 'active-cinematic' : ''} ${isMediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                            loop
                            muted={isMuted}
                            playsInline
                            onCanPlay={() => setIsMediaLoaded(true)}
                        />
                        <button
                            onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                            className="absolute bottom-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full z-20 border border-white/10 shadow-lg"
                        >
                            {isMuted ? <span className="text-xs">🔇</span> : <span className="text-xs">🔊</span>}
                        </button>
                    </div>
                ) : (
                    <img
                        src={post.mediaUrl}
                        alt="Post content"
                        className={`post-media-fix object-cover transition-opacity duration-700 ${(isInView && isMediaLoaded) ? 'active-cinematic' : ''} ${isMediaLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setIsMediaLoaded(true)}
                    />
                )}

                {/* Heart Animation Overlay */}
                <AnimatePresence>
                    {showHeartOverlay && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        >
                            <Heart size={80} fill="white" className="text-white drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-5">
                        <button onClick={handleLike} className="active:scale-125 transition-transform duration-200">
                            <Heart size={26} className={isLiked ? "text-red-500 fill-red-500" : "text-white"} />
                        </button>
                        <button className="active:scale-125 transition-transform duration-200">
                            <MessageCircle size={26} className="text-white" />
                        </button>
                        <button className="active:scale-125 transition-transform duration-200">
                            <Send size={26} className="text-white" />
                        </button>
                    </div>
                    <button onClick={() => setIsSaved(!isSaved)} className="active:scale-125 transition-transform duration-200">
                        <Bookmark size={26} className={isSaved ? "text-white fill-white" : "text-white"} />
                    </button>
                </div>

                {/* Likes */}
                <div className="text-[13px] font-bold mb-1 tracking-tight">
                    {likesCount.toLocaleString()} Liked
                </div>

                {/* Caption */}
                <div className="text-[13px] leading-snug">
                    <span className="font-bold mr-2 tracking-tight">{post.user?.username}</span>
                    <span className="text-gray-200">{post.caption}</span>
                </div>

                {/* Comments Link */}
                <button className="text-gray-500 text-[12px] mt-1 font-medium">
                    View all {post._count?.comments || 0} synapses...
                </button>

                {/* Date */}
                <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
            </div>
        </motion.div >
    );
});

export default MobilePostCard;
