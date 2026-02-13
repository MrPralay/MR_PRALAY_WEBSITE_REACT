import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Heart, Search } from 'lucide-react';
import Cookies from 'js-cookie';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const LikesOverlay = ({ isOpen, onClose, postId, onProfileClick, isLiked, currentUser }) => {
    const [likers, setLikers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Simplified: currentUser is now a reliable prop

    useEffect(() => {
        if (isOpen && postId) {
            fetchLikers();
        } else if (!isOpen) {
            // Reset state when closed for fresh feel next time
            setLikers([]);
            setLoading(true);
        }
    }, [isOpen, postId]);

    const fetchLikers = async () => {
        setLoading(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');
            // Cache busting with timestamp
            const res = await fetch(`${apiUrl}/api/social/posts/${postId}/likers?t=${Date.now()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setLikers(data.data);
            }
        } catch (err) {
            console.error("Fetch Likers Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (userId, currentState) => {
        // Simple optimistic toggle for the list
        setLikers(prev => prev.map(u =>
            u.id === userId ? { ...u, isFollowing: !currentState } : u
        ));

        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');
            await fetch(`${apiUrl}/api/social/users/${userId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Follow Error:", err);
            // Revert on error
            setLikers(prev => prev.map(u =>
                u.id === userId ? { ...u, isFollowing: currentState } : u
            ));
        }
    };

    const displayLikers = useMemo(() => {
        let list = [...likers];
        if (!currentUser) {
            console.warn("[LikesOverlay] No resonance found in current session identity.");
            return list;
        }

        const curId = (currentUser.id || currentUser.userId)?.toString();
        const isIncluded = list.some(u =>
            u.id?.toString() === curId ||
            u.userId?.toString() === curId
        );

        if (isLiked && !isIncluded) {
            // Optimistically prepend current user
            list.unshift({
                id: currentUser.id || currentUser.userId,
                username: currentUser.username,
                name: currentUser.name,
                profileImage: currentUser.profileImage || currentUser.image,
                isFollowing: false
            });
        } else if (!isLiked && isIncluded) {
            // Optimistically remove current user
            list = list.filter(u =>
                u.id?.toString() !== curId &&
                u.userId?.toString() !== curId
            );
        }

        return list;
    }, [likers, isLiked, currentUser]);

    const filteredLikers = displayLikers.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
                    />

                    {/* Overlay */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 h-[75vh] bg-black/90 backdrop-blur-2xl rounded-t-[32px] border-t border-white/10 z-[70] flex flex-col overflow-hidden"
                    >
                        {/* Grab Handle */}
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Heart size={20} fill="red" className="text-red-500" />
                                Liked by
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="px-6 py-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search likers..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all"
                                />
                            </div>
                        </div>

                        {/* Likers List */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-3">
                                    <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                                    <p className="text-xs text-gray-500">Retrieving resonance...</p>
                                </div>
                            ) : filteredLikers.length > 0 ? (
                                filteredLikers.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between group">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer active:opacity-60 transition-all"
                                            onClick={() => {
                                                if (onProfileClick) onProfileClick(user);
                                                onClose();
                                            }}
                                        >
                                            <div className="w-12 h-12 rounded-full border border-white/10 overflow-hidden p-[1px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-800">
                                                    {isVideo(user.profileImage) ? (
                                                        <video src={user.profileImage} autoPlay muted loop className="w-full h-full object-cover" />
                                                    ) : (
                                                        <img src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`} className="w-full h-full object-cover" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-bold tracking-tight">{user.username}</span>
                                                <span className="text-[11px] text-gray-500">{user.name || "Synapse Architect"}</span>
                                            </div>
                                        </div>

                                        {/* Follow Button */}
                                        {(() => {
                                            const curId = (currentUser?.id || currentUser?.userId)?.toString();
                                            const targetId = user.id?.toString();
                                            return curId !== targetId && (
                                                <button
                                                    onClick={() => handleFollow(user.id, user.isFollowing)}
                                                    className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${user.isFollowing
                                                        ? 'bg-white/10 border-white/20 text-white'
                                                        : 'bg-white text-black border-transparent shadow-[0_4px_12px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95'
                                                        }`}
                                                >
                                                    {user.isFollowing ? 'Following' : 'Follow'}
                                                </button>
                                            );
                                        })()}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 text-gray-500">
                                    <Heart className="mx-auto mb-3 opacity-20" size={48} strokeWidth={1} />
                                    <p className="text-sm">No resonance found yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default LikesOverlay;
