import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import FeedView from './FeedView';
import ProfileView from './ProfileView';
import RightSidebar from './RightSidebar';
import CreatePostModal from './CreatePostModal';
import { AnimatePresence, motion } from 'framer-motion';
import Cookies from 'js-cookie';

const InstagramLayout = ({ currentUser, onLogout }) => {
    const [view, setView] = useState(() => localStorage.getItem('synapse_social_tab') || 'feed'); // feed, profile, explore, etc.
    const [posts, setPosts] = useState([]);
    const [userProfile, setUserProfile] = useState(currentUser);
    const [loading, setLoading] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        </div>
    );
};

export default InstagramLayout;
