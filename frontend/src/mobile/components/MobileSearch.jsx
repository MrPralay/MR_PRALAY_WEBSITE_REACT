import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Heart, Bookmark, Share2, MessageCircle, X as CloseIcon } from 'lucide-react';
import CommentOverlay from './CommentOverlay';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'framer-motion';
import { loadFromCache, saveToCache } from '../../utils/synapseCache';

const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const PremiumIcon = ({ Icon, active, activeColor, glowColor, size = 20, count, onClick, className = "" }) => {
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
                    className={`transition-all duration-300 ${active ? activeColor : "text-white/80"}`}
                    fill={active ? "currentColor" : "none"}
                    style={{
                        filter: active ? `drop-shadow(0 0 8px ${glowColor})` : 'none'
                    }}
                />
            </div>
            {count !== undefined && (
                <span className={`text-[12px] font-bold tracking-tight transition-all duration-300 ${active ? activeColor : "text-white/70"}`}>
                    {count.toLocaleString()}
                </span>
            )}
        </motion.button>
    );
};

const SkeletonCard = () => (
    <div className="relative aspect-square bg-gray-900/40 overflow-hidden">
        <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full"
            animate={{
                x: ['100%', '-100%'],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear"
            }}
        />
    </div>
);

const NeuralPeekOverlay = ({ post, onClose }) => {
    const [isCommentOpen, setIsCommentOpen] = useState(false);
    if (!post) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60"
            onClick={onClose}
        >
            <motion.div
                layoutId={`post-${post.id}`}
                className="relative w-full max-w-[90vw] bg-[#1a1a1a] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10"
                onClick={(e) => e.stopPropagation()}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.7}
                onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.y) > 100) {
                        onClose();
                    }
                }}
            >
                {/* Media Content - Optimized for Full Length (9:16) */}
                <div className="relative w-full aspect-[9/16] max-h-[70vh] bg-black overflow-hidden flex items-end">
                    {post.type === 'VIDEO' || isVideo(post.mediaUrl) ? (
                        <video
                            src={post.mediaUrl}
                            className="w-full h-full object-cover object-bottom"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={post.mediaUrl}
                            className="w-full h-full object-cover object-bottom"
                            alt="peek-content"
                        />
                    )}

                    {/* Header Overlay */}
                    <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-gray-900">
                                {isVideo(post.user?.profileImage || post.user?.image) ? (
                                    <video
                                        src={post.user?.profileImage || post.user?.image}
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    />
                                ) : (
                                    <img
                                        src={post.user?.profileImage || post.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`}
                                        className="w-full h-full object-cover"
                                        alt="avatar"
                                    />
                                )}
                            </div>
                            <span className="font-bold text-sm text-white drop-shadow-md">{post.user?.username}</span>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full bg-white/10 backdrop-blur-md text-white/80">
                            <CloseIcon size={16} />
                        </button>
                    </div>

                    {/* Footer Actions - Premium Upgrade */}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <PremiumIcon
                                Icon={Heart}
                                size={20}
                                count={post._count?.likes || 0}
                                glowColor="rgba(239, 68, 68, 0.4)"
                                onClick={() => { }}
                            />
                            <PremiumIcon
                                Icon={MessageCircle}
                                size={20}
                                count={post._count?.comments || 0}
                                glowColor="rgba(255, 255, 255, 0.2)"
                                onClick={() => setIsCommentOpen(true)}
                            />
                            <PremiumIcon
                                Icon={Share2}
                                size={20}
                                count={post.shareCount || 0}
                                glowColor="rgba(255, 255, 255, 0.2)"
                                onClick={() => { }}
                            />
                        </div>
                        <PremiumIcon
                            Icon={Bookmark}
                            size={20}
                            glowColor="rgba(255, 255, 255, 0.3)"
                            onClick={() => { }}
                        />
                    </div>
                </div>

                {/* Caption / Details Area */}
                <div className="p-4 bg-[#1a1a1a]">
                    <p className="text-[11px] text-white/90 line-clamp-2 leading-relaxed">
                        <span className="font-bold mr-2">{post.user?.username}</span>
                        {post.caption || "Neural broadcast synchronized."}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            {new Date(post.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-gray-700" />
                        <span className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                            NEURAL PEEK
                        </span>
                    </div>
                </div>

                <CommentOverlay
                    isOpen={isCommentOpen}
                    onClose={() => setIsCommentOpen(false)}
                    postId={post.id}
                    postUser={post.user}
                    commentCount={post._count?.comments || 0}
                />
            </motion.div>
        </motion.div>
    );
};

const MobileSearch = ({ onUserProfileClick }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [explorePosts, setExplorePosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRevalidating, setIsRevalidating] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const searchTimeout = useRef(null);

    // Fetch Explore Feed on Mount with Intelligent Caching
    useEffect(() => {
        const cachedData = loadFromCache('synapse_explore_posts');
        if (cachedData && Array.isArray(cachedData)) {
            console.log("⚡ Instant Neural Load: Explore cache retrieved");
            setExplorePosts(shuffleArray(cachedData));
        } else {
            setLoading(true); // First time load
        }
        fetchExplore();
    }, []);

    const fetchExplore = async () => {
        setIsRevalidating(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const res = await fetch(`${apiUrl}/api/social/explore`);
            const data = await res.json();
            if (data.success) {
                // Smoothly replace with fresh data
                setExplorePosts(shuffleArray(data.data));
                saveToCache('synapse_explore_posts', data.data);
                console.log("🔄 Neural Revalidation: Explore cache updated");
            }
        } catch (e) {
            console.error("Explore fetch failed", e);
        } finally {
            // Delay slightly for smoother feel
            setTimeout(() => {
                setLoading(false);
                setIsRevalidating(false);
            }, 600);
        }
    };

    // Handle Search with Debounce
    const handleSearch = (e) => {
        const val = e.target.value;
        setQuery(val);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (val.trim().length > 0) {
            setLoading(true);
            searchTimeout.current = setTimeout(async () => {
                try {
                    const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
                    const res = await fetch(`${apiUrl}/api/user/search?q=${encodeURIComponent(val)}`);
                    const data = await res.json();
                    if (data.success) {
                        setResults(data.data);
                    }
                } catch (e) {
                    console.error("Search failed", e);
                } finally {
                    setLoading(false);
                }
            }, 500); // 500ms debounce
        } else {
            setResults([]);
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setResults([]);
    };

    return (
        <div className="bg-black min-h-screen text-white pb-20 scrollbar-hide">
            {/* Search Bar */}
            <div className="sticky top-0 bg-black z-30 px-3 py-2 border-b border-white/10">
                <div className="bg-[#262626] rounded-xl flex items-center px-4 py-2 gap-3">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={query}
                        onChange={handleSearch}
                        className="bg-transparent text-white placeholder-gray-400 text-sm w-full focus:outline-none"
                    />
                    {query && (
                        <button onClick={clearSearch}>
                            <X size={16} className="text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-0 relative">
                {/* Neural Sync Indicator (Soft shimmer) */}
                <AnimatePresence>
                    {isRevalidating && !loading && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-0 inset-x-0 h-0.5 z-40 overflow-hidden"
                        >
                            <motion.div
                                className="w-full h-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
                                animate={{ x: ['-100%', '100%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {query ? (
                    /* Search Results */
                    <div className="px-4 py-2 flex flex-col gap-4">
                        {loading ? (
                            <div className="text-gray-500 text-center py-4">Searching...</div>
                        ) : results.length > 0 ? (
                            results.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => onUserProfileClick && onUserProfileClick(user)}
                                    className="flex items-center gap-3 cursor-pointer"
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-gray-900">
                                        {isVideo(user.profileImage || user.image) ? (
                                            <video
                                                src={user.profileImage || user.image}
                                                className="w-full h-full object-cover"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={user.profileImage || user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                                alt={user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-sm">{user.username}</span>
                                            {user.isVerified && (
                                                <span className="text-blue-500 text-[10px]">✓</span>
                                            )}
                                        </div>
                                        <span className="text-gray-400 text-xs">{user.name}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-10">No users found.</div>
                        )}
                    </div>
                ) : (
                    /* Explore Grid */
                    <div className="grid grid-cols-3 gap-[1px]">
                        {loading ? (
                            // Premium Skeleton Grid
                            Array.from({ length: 18 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))
                        ) : (
                            explorePosts.map((item, i) => (
                                <motion.div
                                    key={item.id}
                                    layoutId={`post-${item.id}`}
                                    onClick={() => setSelectedPost(item)}
                                    className="relative bg-gray-900 aspect-square overflow-hidden cursor-pointer group"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        delay: Math.min(i * 0.015, 0.3),
                                        duration: 0.4
                                    }}
                                >
                                    {item.type === 'VIDEO' || isVideo(item.mediaUrl) ? (
                                        <video
                                            src={item.mediaUrl}
                                            className="w-full h-full object-cover"
                                            autoPlay
                                            muted
                                            loop
                                            playsInline
                                        />
                                    ) : (
                                        <motion.img
                                            src={item.mediaUrl}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                            alt={`explore-${i}`}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    )}
                                    {item.type === 'VIDEO' && (
                                        <div className="absolute top-2 right-2">
                                            <span className="text-white drop-shadow-md text-[10px] bg-black/20 backdrop-blur-md px-1 rounded">▶</span>
                                        </div>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Neural Peek Overlay */}
            <AnimatePresence>
                {selectedPost && (
                    <NeuralPeekOverlay
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileSearch;
