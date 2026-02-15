import React, { useState } from 'react';
import { Grid, Bookmark, User, Settings, Menu, ChevronDown, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import Cookies from 'js-cookie';
import EditNeuralProfileModal from '../../components/Social/EditNeuralProfileModal';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const MobileProfile = ({ user, currentUser, posts, onUpdateUser, onOpenCreatePost, onNavigate, onFollowChange, onMessageClick }) => {
    const currentUserIdFromStorage = Cookies.get('synapse_userId') || (localStorage.getItem('synapse_user_data') ? JSON.parse(localStorage.getItem('synapse_user_data')).id : null);
    const profileId = user?.id || user?.userId;
    const isMe = currentUserIdFromStorage?.toString() === profileId?.toString();
    const abortControllerRef = React.useRef(null);
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(user.followers?.length || user._count?.followers || 0);

    // Sync state with props when user changes (e.g. from parent update)
    React.useEffect(() => {
        setIsFollowing(user.isFollowing || false);
        setFollowersCount(user.followers?.length || user._count?.followers || 0);
    }, [user]);

    if (!user) return <div className="text-white text-center mt-20">Loading profile...</div>;

    const handleFollow = async () => {
        // Safety: Cancel any previous pending request to prevent race conditions
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new controller for this specific request
        const newController = new AbortController();
        abortControllerRef.current = newController;

        setIsFollowLoading(true);
        const prevFollowing = isFollowing;
        setIsFollowing(!prevFollowing);
        setFollowersCount(prev => prevFollowing ? prev - 1 : prev + 1);

        try {
            const targetId = user.id || user.userId;
            if (!targetId) {
                throw new Error("Target user identity not found");
            }

            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const token = localStorage.getItem('synapse_token') || Cookies.get('synapse_token');
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

            // Notify parent component to sync with feed
            if (onFollowChange) {
                onFollowChange(null, targetId, !prevFollowing);
            }
        } catch (err) {
            // Ignore abort errors (user just clicked again)
            if (err.name === 'AbortError') return;

            console.error("Follow Error:", err);
            // alert(`Neural link failure: ${err.message}. Please re-login if this persists.`); // Optional: silent fail on spam
            setIsFollowing(prevFollowing);
            setFollowersCount(prev => prevFollowing ? prev + 1 : prev - 1);
        } finally {
            // Only clear loading if this is still the active request
            if (abortControllerRef.current === newController) {
                setIsFollowLoading(false);
            }
        }
    };

    return (
        <div className="bg-black min-h-screen text-white pb-20 scrollbar-hide">
            {/* Header */}
            <div className="sticky top-0 bg-black z-30 flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-1">
                    <h1 className="text-xl font-bold flex items-center gap-1">
                        {user.username}
                        {user.isVerified && <span className="text-blue-500 text-xs">Verified</span>}
                        {isMe && <ChevronDown size={16} />}
                    </h1>
                    {/* Notification Badge if Needed */}
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={onOpenCreatePost}><Plus size={24} strokeWidth={2.5} /></button>
                    <button onClick={() => onNavigate('setting')}><Menu size={24} strokeWidth={2.5} /></button>
                </div>
            </div>

            <div className="px-4 py-4">
                {/* Profile Info Row */}
                <div className="flex items-center justify-between mb-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border border-white/10 overflow-hidden p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
                            <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-800">
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
                                        src={user.profileImage || user.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                        alt={user.username}
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>
                        {isMe && (
                            <div className="absolute bottom-0 right-0 bg-blue-500 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center text-white">
                                <Plus size={14} strokeWidth={4} />
                            </div>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-1 justify-around text-center ml-4">
                        <div>
                            <div className="font-bold text-lg">{posts?.length || 0}</div>
                            <div className="text-sm text-gray-400">posts</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{followersCount}</div>
                            <div className="text-sm text-gray-400">followers</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{user.following?.length || user._count?.following || 0}</div>
                            <div className="text-sm text-gray-400">following</div>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <div className="mb-4">
                    <div className="font-bold">{user.name || user.username}</div>
                    <div className="text-sm whitespace-pre-wrap">{user.bio || "Digital Creator | Living life one pixel at a time"}</div>
                    {/* External Link if any */}
                    {user.website && <div className="text-blue-200 text-sm mt-1">{user.website}</div>}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-6 text-sm font-semibold">
                    {isMe ? (
                        <>
                            <button onClick={() => setIsEditModalOpen(true)} className="flex-1 bg-white/10 py-2 rounded-lg active:bg-white/20 transition-colors">Edit profile</button>
                            <button className="flex-1 bg-white/10 py-2 rounded-lg active:bg-white/20 transition-colors">Share profile</button>
                            <button className="bg-white/10 p-2 rounded-lg active:bg-white/20"><User size={20} /></button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleFollow}
                                // disabled={isFollowLoading} // Removed for rapid toggle
                                className={`flex-1 py-2 rounded-lg font-bold transition-all ${isFollowing
                                    ? 'bg-white/10 text-white border border-white/20'
                                    : 'bg-emerald-500 text-white'
                                    }`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                            <button onClick={() => onMessageClick && onMessageClick(user)} className="flex-1 bg-white/10 py-2 rounded-lg active:bg-white/20 font-bold">Message</button>
                        </>
                    )}
                </div>

                {/* Highlights (Mock) */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="w-16 h-16 rounded-full border border-white/10 bg-gray-900 p-[2px]">
                                <div className="w-full h-full rounded-full bg-gray-800 border-2 border-black" />
                            </div>
                            <span className="text-xs">Highlight</span>
                        </div>
                    ))}
                    {isMe && (
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs">New</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-t border-white/10 sticky top-[60px] bg-black z-20">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-3 flex justify-center border-b-[1px] ${activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
                >
                    <Grid size={24} />
                </button>
                <button
                    onClick={() => setActiveTab('reels')}
                    className={`flex-1 py-3 flex justify-center border-b-[1px] ${activeTab === 'reels' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
                >
                    {/* Reel Icon */}
                    <span className="text-xl font-bold scale-y-75 transform block border-2 border-current rounded-md w-6 h-6 flex items-center justify-center text-[10px]">▶</span>
                </button>
                <button
                    onClick={() => setActiveTab('tagged')}
                    className={`flex-1 py-3 flex justify-center border-b-[1px] ${activeTab === 'tagged' ? 'border-white text-white' : 'border-transparent text-gray-500'}`}
                >
                    <User size={24} /> {/* Tagged User Icon */}
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-3 gap-[1px] scrollbar-hide">
                {posts && posts.length > 0 ? (
                    posts.map((post) => (
                        <div key={post.id} className="relative aspect-square bg-gray-900">
                            {post.type === 'VIDEO' ? (
                                <video src={post.mediaUrl} className="w-full h-full object-cover" muted />
                            ) : (
                                <img src={post.mediaUrl} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 py-20 text-center text-gray-500">
                        <div className="w-20 h-20 rounded-full border-2 border-white/10 flex items-center justify-center mx-auto mb-4">
                            <Grid size={40} strokeWidth={1} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Posts Yet</h3>
                        <p className="text-sm">When you share photos and videos, they will appear on your profile.</p>
                        {isMe && (
                            <button className="text-blue-500 font-semibold mt-4" onClick={onOpenCreatePost}>Share your first photo</button>
                        )}
                    </div>
                )}
            </div>

            <EditNeuralProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                user={user}
                onUpdate={onUpdateUser}
            />
        </div>
    );
};

export default MobileProfile;
