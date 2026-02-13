import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';
import CommentOverlay from './CommentOverlay';
import LikesOverlay from './LikesOverlay';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const PremiumIcon = ({ Icon, active, activeColor, glowColor, size = 24, count, onClick, className = "" }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={onClick}
            className={`group relative flex items-center gap-1.5 transition-all duration-300 ${className}`}
        >
            <div className="relative flex items-center justify-center">
                <Icon
                    size={size}
                    strokeWidth={1.5}
                    className={`transition-all duration-300 ${active ? activeColor : "text-white/90"}`}
                    fill={active ? "currentColor" : "none"}
                    style={{
                        filter: active ? `drop-shadow(0 0 8px ${glowColor})` : 'none'
                    }}
                />
            </div>
            {count !== undefined && (
                <span className={`text-[13px] font-bold tracking-tight transition-all duration-300 ${active ? activeColor : "text-white/80"}`}>
                    {count.toLocaleString()}
                </span>
            )}
        </motion.button>
    );
};

const MobilePostCard = React.memo(({ post, currentUser, onInteraction, onFollowChange, onProfileClick, onOptionsClick, index = 0 }) => {
    const [isLiked, setIsLiked] = useState(post.isLiked || false);
    const [isSaved, setIsSaved] = useState(post.isSaved || false);
    const [likesCount, setLikesCount] = useState(post._count?.likes || 0);
    const [commentsCount, setCommentsCount] = useState(post._count?.comments || 0);
    const [isFollowed, setIsFollowed] = useState(post.isFollowing || false);
    const [latestLiker, setLatestLiker] = useState(post.latestLiker || null);
    const [latestOtherLiker, setLatestOtherLiker] = useState(post.latestOtherLiker || null);

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
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    const [isLikesOpen, setIsLikesOpen] = useState(false);

    useEffect(() => {
        setLatestLiker(post.latestLiker || null);
        setLatestOtherLiker(post.latestOtherLiker || null);
        setIsLiked(post.isLiked || false);
        setLikesCount(post._count?.likes || 0);
        setIsSaved(post.isSaved || false);
    }, [post]);

    const handleCommentCountUpdate = (newCount) => {
        setCommentsCount(newCount);
        if (onInteraction) onInteraction(post.id, 'comment', newCount);
    };

    // Derived state directly from props to ensure zero-latency sync across components
    // We default to false/0 if undefined to prevent crashes
    const isFollowing = post.isFollowing || post.user?.isFollowing || false;
    const followersCount = post.user?._count?.followers || 0;

    // DEBUG LOGGING
    useEffect(() => {
        console.log(`[MobilePostCard] Post ${post.id} (User: ${post.user?.username}) - isFollowing prop:`, isFollowing);
    }, [isFollowing, post.id, post.user?.username]);

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
            if (!isLiked) handleLike(); // Only trigger like if not already liked
            setShowHeartOverlay(true);
            setTimeout(() => setShowHeartOverlay(false), 1000);
        }
        setLastClickTime(now);
    };

    const handleLike = async () => {
        const token = Cookies.get('synapse_token');
        const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";

        const newIsLiked = !isLiked;
        const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

        // 1. Instant Local Sync
        setIsLiked(newIsLiked);
        setLikesCount(newLikesCount);

        // 2. Instant Parent/Cache Sync (Fast-Sync)
        if (onInteraction) onInteraction(post.id, 'like', newIsLiked);

        try {
            await fetch(`${apiUrl}/api/social/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error(err);
            // Revert all states on failure
            setIsLiked(!newIsLiked);
            setLikesCount(likesCount);
            if (onInteraction) onInteraction(post.id, 'like', !newIsLiked);
        }
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

            // Priority: Cookie > LocalStorage (to match backend expectation)
            const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');

            if (!token) {
                console.error("Follow Error: No token found");
                alert("Please log in again to follow users.");
                throw new Error("No token found");
            }

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
            { threshold: 0.5 } // Trigger when 50% visible (Intelligent Scroll)
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
                                    <span className="text-[9px] text-white/70 font-bold uppercase tracking-widest">{followersCount.toLocaleString()} Followers</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Only show follow button if it's not the current user */}
                        {(() => {
                            const curId = (currentUser?.id || currentUser?.userId)?.toString();
                            const postUserId = (post.user?.id || post.user?.userId)?.toString();
                            return curId !== postUserId && (
                                <button
                                    onClick={handleFollow}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all border ${isFollowing
                                        ? 'bg-white/10 border-white/20 text-white'
                                        : 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                        }`}
                                >
                                    {isFollowing ? 'Following' : 'Follow'}
                                </button>
                            );
                        })()}
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
            <div className="px-3 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-6">
                        <PremiumIcon
                            Icon={Heart}
                            active={isLiked}
                            activeColor="text-red-500"
                            glowColor="rgba(239, 68, 68, 0.4)"
                            size={24}
                            count={likesCount}
                            onClick={handleLike}
                        />
                        <PremiumIcon
                            Icon={MessageCircle}
                            size={24}
                            count={commentsCount}
                            glowColor="rgba(255, 255, 255, 0.2)"
                            onClick={() => setIsCommentOpen(true)}
                        />
                        <PremiumIcon
                            Icon={Send}
                            size={24}
                            count={post.shareCount || 0}
                            glowColor="rgba(255, 255, 255, 0.2)"
                            onClick={() => { }}
                        />
                    </div>
                    <PremiumIcon
                        Icon={Bookmark}
                        active={isSaved}
                        activeColor="text-white"
                        glowColor="rgba(255, 255, 255, 0.3)"
                        size={24}
                        onClick={() => setIsSaved(!isSaved)}
                    />
                </div>

                {/* Liker Summary */}
                {likesCount > 0 && (
                    <div
                        onClick={() => setIsLikesOpen(true)}
                        className="text-[13px] font-medium mb-1.5 tracking-tight text-white/90 cursor-pointer active:opacity-60 transition-opacity"
                    >
                        Liked by <span className="font-bold">
                            {isLiked ? "You" : (latestOtherLiker || "Someone")}
                        </span>
                        {likesCount > 1 && (
                            <> and <span className="font-bold">{likesCount - 1} {likesCount - 1 === 1 ? 'other' : 'others'}</span></>
                        )}
                    </div>
                )}

                {/* Caption */}
                <div className="text-[13px] leading-snug">
                    <span className="font-bold mr-2 tracking-tight">{post.user?.username}</span>
                    <span className="text-gray-200">{post.caption}</span>
                </div>

                <CommentOverlay
                    isOpen={isCommentOpen}
                    onClose={() => setIsCommentOpen(false)}
                    postId={post.id}
                    postUser={post.user}
                    commentCount={commentsCount}
                    onCommentCountChange={handleCommentCountUpdate}
                />

                <LikesOverlay
                    isOpen={isLikesOpen}
                    onClose={() => setIsLikesOpen(false)}
                    postId={post.id}
                    onProfileClick={onProfileClick}
                    isLiked={isLiked}
                    currentUser={currentUser}
                />

                {/* Date */}
                <p className="text-[9px] text-gray-500 mt-1 uppercase font-bold tracking-widest">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </p>
            </div>
        </motion.div >
    );
});

export default MobilePostCard;
