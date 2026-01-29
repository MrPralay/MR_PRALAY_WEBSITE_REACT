import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import FeedView from './FeedView';
import ProfileView from './ProfileView';
import RightSidebar from './RightSidebar';
import CreatePostModal from './CreatePostModal';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Cookies from 'js-cookie';

const InstagramLayout = ({ currentUser, onLogout }) => {
    const [view, setView] = useState(() => localStorage.getItem('synapse_social_tab') || 'feed'); // feed, profile, explore, etc.
    const [posts, setPosts] = useState([]);
    const [userProfile, setUserProfile] = useState(currentUser);
    const [loading, setLoading] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [cinemaPost, setCinemaPost] = useState(null);

    // Persist social tab to localStorage
    useEffect(() => {
        localStorage.setItem('synapse_social_tab', view);
    }, [view]);

    // Data loading from API
    useEffect(() => {
        let active = true;
        const fetchData = async () => {
            if (!active) return;
            setLoading(true);
            setPosts([]);

            try {
                const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
                const token = Cookies.get('synapse_token');

                const fetchOptions = {
                    method: 'GET',
                    headers: {
                        ...(token && { 'Authorization': `Bearer ${token}` })
                    }
                };

                if (view === 'feed') {
                    const res = await fetch(`${apiUrl}/api/social/feed`, fetchOptions);
                    const data = await res.json();
                    if (active) setPosts(Array.isArray(data) ? data : []);
                } else if (view === 'profile') {
                    const res = await fetch(`${apiUrl}/api/user/profile/${encodeURIComponent(currentUser.username)}`, fetchOptions);
                    const data = await res.json();
                    const profileData = data.data || data;
                    if (active) {
                        setUserProfile(profileData);
                        setPosts(profileData.posts || []);
                    }
                }
            } catch (err) {
                console.error("Data Fetch Error:", err);
            } finally {
                if (active) setLoading(false);
            }
        };
        fetchData();
        return () => { active = false; };
    }, [view, currentUser, refreshTrigger]);

    const handleCreatePost = async (postData) => {
        try {
            const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token');
            let finalMediaUrl = postData.mediaUrl;

            // Neural Core Storage Logic: Check if we need Cloud Storage Uplink
            if (postData.rawFile) {
                const fileSize = postData.rawFile.size;
                const isVideo = postData.type === 'VIDEO';

                // Use Direct Cloud Uplink to bypass Cloudflare 1MB Gateway Gate
                if (isVideo || fileSize > 800000) {
                    try {
                        const uploadUrlRes = await fetch(`${apiUrl}/api/social/upload-url`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                fileName: postData.rawFile.name,
                                fileType: postData.rawFile.type
                            })
                        });

                        if (uploadUrlRes.ok) {
                            const { uploadUrl, publicUrl } = await uploadUrlRes.json();

                            // Direct Broadcast to Cloud Storage (Exactly what Instagram do)
                            // This goes FROM BROWSER -> SUPABASE (Bypasses Cloudflare 1MB limit!)
                            const storageRes = await fetch(uploadUrl, {
                                method: 'PUT',
                                body: postData.rawFile,
                                headers: { 'Content-Type': postData.rawFile.type }
                            });

                            if (storageRes.ok) {
                                finalMediaUrl = publicUrl;
                            } else {
                                console.error("Neural Storage Uplink Rejected. Status:", storageRes.status);
                                // If cloud fails, we must stop here or it will hit 1MB limit on next call
                                return false;
                            }
                        }
                    } catch (err) {
                        console.error("Neural Storage Uplink Connection Severed:", err);
                        return false;
                    }
                }
            }

            const res = await fetch(`${apiUrl}/api/social/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    caption: postData.caption,
                    mediaUrl: finalMediaUrl,
                    type: postData.type,
                    postPassword: postData.postPassword
                })
            });

            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Neural Broadcast Error:", err);
            return false;
        }
    };

    return (
        <div className="flex bg-[#050505] min-h-screen">
            {/* Left Sidebar */}
            <Sidebar
                user={currentUser}
                activeView={view}
                setView={setView}
                onLogout={onLogout}
                onOpenCreatePost={() => setIsPostModalOpen(true)}
            />

            {/* Main Content Area */}
            <main className="flex-1 ml-80 mr-80 min-h-screen">
                <AnimatePresence mode="wait">
                    {view === 'feed' && (
                        <motion.div
                            key="feed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <FeedView
                                posts={posts}
                                onCreateClick={() => setIsPostModalOpen(true)}
                                loading={loading}
                                onCinemaMode={setCinemaPost}
                            />
                        </motion.div>
                    )}

                    {view === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ProfileView
                                user={userProfile}
                                currentUser={currentUser}
                                posts={posts}
                                onOpenCreatePost={() => setIsPostModalOpen(true)}
                                loading={loading}
                                onCinemaMode={setCinemaPost}
                            />
                        </motion.div>
                    )}

                    {!['feed', 'profile'].includes(view) && (
                        <motion.div
                            key="other"
                            className="flex items-center justify-center min-h-screen text-gray-500 font-bold uppercase tracking-widest italic"
                        >
                            {view} Section Under Construction
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Right Sidebar (Hidden on small screens) */}
            <RightSidebar />

            {/* Global Create Post Modal */}
            <CreatePostModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                onSubmit={handleCreatePost}
                user={currentUser}
            />

            {/* Neural Cinema Mode Overlay */}
            <AnimatePresence>
                {cinemaPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-12"
                        onClick={() => setCinemaPost(null)}
                    >
                        {/* Close Button / Terminate Link */}
                        <motion.button
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="absolute top-8 right-8 z-[1010] flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-emerald-500 hover:text-black transition-all group"
                            onClick={() => setCinemaPost(null)}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Terminate Link</span>
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                        </motion.button>

                        {/* Media Container - Dual Layer Neural Projection */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-6xl h-[85vh] flex items-center justify-center group/cinema"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Layer 1: Wide Background (Cropped & Slightly Blurred) */}
                            <div className="absolute inset-0 rounded-[3rem] overflow-hidden border border-white/10">
                                {cinemaPost.type === 'VIDEO' ? (
                                    <video
                                        src={cinemaPost.mediaUrl}
                                        className="w-full h-full object-cover blur-[10px] opacity-60"
                                        muted loop autoPlay
                                    />
                                ) : (
                                    <img
                                        src={cinemaPost.mediaUrl}
                                        className="w-full h-full object-cover blur-[10px] opacity-60"
                                        alt="projection-bg"
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/30" />
                            </div>

                            {/* Layer 2: Main Content (Maximum Screen Usage) */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center">
                                <div className="relative group/main max-w-full max-h-full">
                                    <div className="absolute -inset-1 bg-emerald-500/20 blur-xl rounded-2xl opacity-0 group-hover/main:opacity-100 transition-opacity" />
                                    {cinemaPost.type === 'VIDEO' ? (
                                        <video
                                            src={cinemaPost.mediaUrl}
                                            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/20"
                                            controls
                                            autoPlay
                                            playsInline
                                        />
                                    ) : (
                                        <img
                                            src={cinemaPost.mediaUrl}
                                            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/20"
                                            alt="Neural Actual Size"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Floating Metadata (Centered at the Bottom) */}
                            <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 group-hover/cinema:opacity-100 transition-all duration-700 bg-black/40 backdrop-blur-md py-6 px-12 rounded-full mx-auto w-fit border border-emerald-500/20 shadow-2xl">
                                <p className="text-emerald-500 font-bold text-xl tracking-tighter">@{cinemaPost.user?.username}</p>
                                <p className="text-gray-300 text-sm mt-1 font-medium max-w-2xl">{cinemaPost.caption}</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InstagramLayout;
