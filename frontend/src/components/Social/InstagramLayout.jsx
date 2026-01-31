import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import FeedView from './FeedView';
import ProfileView from './ProfileView';
import RightSidebar from './RightSidebar';
import CreatePostModal from './CreatePostModal';
import ReelsView from './ReelsView';
import CreateStoryModal from './CreateStoryModal';
import StoryViewer from './StoryViewer';
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
    const backdropVideoRef = useRef(null);

    // Story State
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [viewingStory, setViewingStory] = useState(false);
    const [allStories, setAllStories] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [myStories, setMyStories] = useState([]);

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

                if (view === 'feed' || view === 'igtv') {
                    const res = await fetch(`${apiUrl}/api/social/feed`, fetchOptions);
                    const data = await res.json();
                    if (active) setPosts(Array.isArray(data) ? data : []);

                    // ALSO FETCH STORIES FOR FEED
                    if (view === 'feed') {
                        const storyRes = await fetch(`${apiUrl}/api/social/stories`, fetchOptions);
                        const storyData = await storyRes.json();
                        if (active && storyData.success) {
                            setAllStories(storyData.data);
                            // Set current user's stories for the "My Story" button
                            const mine = storyData.data.filter(s => s.userId === currentUser.id || s.userId === currentUser.userId);
                            setMyStories(mine);
                        }

                        // FETCH SUGGESTED USERS (for empty states)
                        const userRes = await fetch(`${apiUrl}/api/user/suggested?limit=10`, fetchOptions);
                        const userData = await userRes.json();
                        if (active && userData.success) {
                            setSuggestedUsers(userData.data);
                        }
                    }
                } else if (view === 'profile') {
                    const profileToFetch = userProfile?.username || currentUser.username;
                    const res = await fetch(`${apiUrl}/api/user/profile/${encodeURIComponent(profileToFetch)}`, fetchOptions);
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

    // Neural Prefetcher: Cache media in background for instant viewing
    useEffect(() => {
        if (allStories.length > 0) {
            allStories.forEach(story => {
                if (story.type === 'IMAGE') {
                    const img = new Image();
                    img.src = story.mediaUrl;
                } else if (story.type === 'VIDEO') {
                    const video = document.createElement('video');
                    video.src = story.mediaUrl;
                    video.preload = 'auto'; // Force browser to start caching
                }
            });
        }
    }, [allStories]);

    const handleViewMyProfile = () => {
        setUserProfile(currentUser);
        setView('profile');
    };

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

    const handleStoryUpload = async (storyData) => {
        try {
            const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token');
            let finalMediaUrl = storyData.mediaUrl;

            // Neural Core Storage Logic (Cloud Uplink)
            // If file is present, we MUST try cloud upload to bypass worker limits
            if (storyData.rawFile) {
                try {
                    const uploadUrlRes = await fetch(`${apiUrl}/api/social/upload-url`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` })
                        },
                        body: JSON.stringify({ fileName: storyData.rawFile.name, fileType: storyData.rawFile.type })
                    });

                    if (uploadUrlRes.ok) {
                        const { uploadUrl, publicUrl } = await uploadUrlRes.json();
                        const storageRes = await fetch(uploadUrl, {
                            method: 'PUT',
                            body: storyData.rawFile,
                            headers: { 'Content-Type': storyData.rawFile.type }
                        });

                        if (storageRes.ok) {
                            finalMediaUrl = publicUrl;
                        } else {
                            console.error("Cloud Storage rejected binary broadcast");
                            return false; // Fail early if binary upload rejected
                        }
                    } else {
                        // If it's a large file and we can't get a signed URL, we must stop here
                        if (storyData.rawFile.size > 800000) {
                            console.error("Cloud Uplink rejected. File too large for direct broadcast.");
                            return false;
                        }
                    }
                } catch (err) {
                    console.error("Cloud Uplink Connection Refused:", err);
                    if (storyData.rawFile.size > 800000) return false;
                }
            }

            const res = await fetch(`${apiUrl}/api/social/stories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ mediaUrl: finalMediaUrl, type: storyData.type })
            });

            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                return true;
            }
            const errData = await res.json();
            console.error("Broadcast Rejected:", errData);
            return false;
        } catch (err) {
            console.error("Neural Story Broadcast Failure:", err);
            return false;
        }
    };

    const handleAddStoryClick = () => {
        setIsStoryModalOpen(true);
    };

    const handleMyStoryClick = () => {
        if (myStories.length > 0) {
            setViewingStory(myStories);
        } else {
            setIsStoryModalOpen(true);
        }
    };

    const handleDeleteStory = async (storyId) => {
        try {
            const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
            const token = Cookies.get('synapse_token');
            const res = await fetch(`${apiUrl}/api/social/stories/${storyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setRefreshTrigger(prev => prev + 1);
                return true;
            }
        } catch (err) {
            console.error("Story Termination Failed:", err);
        }
        return false;
    };

    return (
        <div className="flex bg-[#050505] min-h-screen">
            {/* Left Sidebar */}
            <Sidebar
                user={currentUser}
                activeView={view}
                setView={setView}
                onLogout={onLogout}
                onMyProfileClick={handleViewMyProfile}
                onOpenCreatePost={() => setIsPostModalOpen(true)}
            />

            {/* Main Content Area - Neural Scale Applied (90% Zoom feel) */}
            <main
                className={`flex-1 ml-80 mr-80 ${view === 'igtv' ? 'origin-center' : 'origin-top'} overflow-visible`}
                style={{
                    zoom: '0.9',
                    transformOrigin: view === 'igtv' ? 'center' : 'top center'
                }}
            >
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
                                stories={allStories}
                                suggestedUsers={suggestedUsers}
                                onCreateClick={handleAddStoryClick}
                                loading={loading}
                                onCinemaMode={setCinemaPost}
                                myStories={myStories}
                                onMyStoryClick={handleMyStoryClick}
                                onStoryClick={(item) => {
                                    // Group stories by user and show all stories of the clicked user
                                    const userStories = allStories.filter(s => s.userId === item.userId);
                                    setViewingStory(userStories);
                                }}
                                onUserProfileClick={(user) => {
                                    setUserProfile(user);
                                    setView('profile');
                                }}
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

                    {view === 'igtv' && (
                        <motion.div
                            key="igtv"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-screen overflow-hidden"
                        >
                            <ReelsView
                                posts={posts}
                                loading={loading}
                            />
                        </motion.div>
                    )}

                    {!['feed', 'profile', 'igtv'].includes(view) && (
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

            {/* Create Story Modal */}
            <CreateStoryModal
                isOpen={isStoryModalOpen}
                onClose={() => setIsStoryModalOpen(false)}
                onSubmit={handleStoryUpload}
                user={currentUser}
            />

            {/* Story Viewer Overlay */}
            <AnimatePresence>
                {viewingStory && Array.isArray(viewingStory) && viewingStory.length > 0 && (
                    <StoryViewer
                        stories={viewingStory}
                        initialStoryIndex={0}
                        onClose={() => setViewingStory(false)}
                        onDelete={handleDeleteStory}
                    />
                )}
            </AnimatePresence>

            {/* Neural Cinema Mode Overlay */}
            <AnimatePresence>
                {cinemaPost && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/20 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12"
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

                        {/* Media Container - Dual Layer Neural Projection (Boxed Reversion) */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-6xl h-[88vh] flex items-center justify-center group/cinema overflow-hidden rounded-[3rem] border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Layer 1: Wide Background (Cropped & Slightly Blurred) */}
                            <div className="absolute inset-0 z-0">
                                {cinemaPost.type === 'VIDEO' ? (
                                    <video
                                        ref={backdropVideoRef}
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

                            {/* Layer 2: Main Content (Maximum Cinematic Scale) */}
                            <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                                <div className="relative max-w-full h-full flex items-center justify-center">
                                    {cinemaPost.type === 'VIDEO' ? (
                                        <video
                                            src={cinemaPost.mediaUrl}
                                            className="max-w-full max-h-[82vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2.5rem] border border-white/10"
                                            controls
                                            autoPlay
                                            loop
                                            playsInline
                                            onPlay={() => backdropVideoRef.current?.play()}
                                            onPause={() => backdropVideoRef.current?.pause()}
                                        />
                                    ) : (
                                        <img
                                            src={cinemaPost.mediaUrl}
                                            className="max-w-full max-h-[82vh] object-contain shadow-[0_40px_100px_rgba(0,0,0,0.8)] rounded-[2.5rem] border border-white/10"
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
        </div >
    );
};

export default InstagramLayout;
