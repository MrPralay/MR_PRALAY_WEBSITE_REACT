import React, { useState, useEffect } from 'react';
import { Grid, Play, Bookmark, User as UserIcon, Settings, ShieldCheck, Plus, Monitor, Lock, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const ProfileView = ({ user, currentUser }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [displayPosts, setDisplayPosts] = useState([]);
    const [loading, setLoading] = useState(false);

    const isOwnProfile = currentUser?.id === user.id;

    const tabs = [
        { id: 'posts', label: 'Synapses', icon: <Grid size={16} />, type: 'IMAGE' },
        { id: 'reels', label: 'Neural Reels', icon: <Play size={16} />, type: 'VIDEO' },
        { id: 'saved', label: 'Registry', icon: <Bookmark size={16} />, type: 'SAVED' },
        { id: 'tagged', label: 'Tagged', icon: <UserIcon size={16} />, type: 'TAGGED' },
    ];

    const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token');

    useEffect(() => {
        const fetchTabData = async () => {
            setLoading(true);
            try {
                if (activeTab === 'saved') {
                    const res = await fetch(`${apiUrl}/api/user/saved`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    setDisplayPosts(data.data || []);
                } else if (activeTab === 'posts') {
                    setDisplayPosts(user.posts?.filter(p => p.type === 'IMAGE') || []);
                } else if (activeTab === 'reels') {
                    setDisplayPosts(user.posts?.filter(p => p.type === 'VIDEO') || []);
                } else {
                    setDisplayPosts([]);
                }
            } catch (err) {
                console.error("Neural Fetch Failure:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTabData();
    }, [activeTab, user, token]);

    return (
        <div className="flex-1 max-w-5xl mx-auto py-16 px-6 md:px-12">
            {/* Header / Premium Intro */}
            <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-center md:items-start mb-24">
                <div className="relative group">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="story-ring p-[5px] w-36 h-36 md:w-52 md:h-52 relative z-10"
                    >
                        <img
                            src={user.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                            className="w-full h-full rounded-full border-4 border-black object-cover"
                            alt={user.username}
                        />
                    </motion.div>
                    {/* Shadow Decor */}
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[60px] rounded-full -z-10 group-hover:bg-emerald-500/30 transition-all"></div>
                </div>

                <div className="flex-1 w-full text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-4xl font-black text-white tracking-tighter">{user.username}</h2>
                            <ShieldCheck className="text-emerald-500" size={24} />
                        </div>
                        <div className="flex gap-3">
                            {isOwnProfile ? (
                                <>
                                    <button className="px-8 py-3 bg-white text-black text-[10px] font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95">Edit Neural Link</button>
                                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
                                        <Settings size={20} className="text-gray-400" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button className="px-10 py-3 bg-emerald-500 text-black text-[10px] font-black rounded-2xl hover:bg-emerald-400 transition-all uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.2)]">Connect</button>
                                    <button className="px-10 py-3 bg-white/5 text-white text-[10px] font-black rounded-2xl border border-white/10 hover:bg-white/10 transition-all uppercase tracking-[0.2em]">Message</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-start gap-16 mb-10 border-y border-white/5 py-8 md:border-none md:py-0">
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="text-2xl font-black text-white block mb-1 group-hover:text-emerald-500 transition-colors">{user._count?.posts || 0}</span>
                            <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Synapses</span>
                        </div>
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="text-2xl font-black text-white block mb-1 group-hover:text-emerald-500 transition-colors">{user._count?.followers || 0}</span>
                            <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Followers</span>
                        </div>
                        <div className="text-center md:text-left group cursor-pointer">
                            <span className="text-2xl font-black text-white block mb-1 group-hover:text-emerald-500 transition-colors">{user._count?.following || 0}</span>
                            <span className="text-[9px] text-gray-600 uppercase tracking-[0.3em] font-black">Following</span>
                        </div>
                    </div>

                    <div className="max-w-lg mx-auto md:mx-0">
                        <h3 className="text-white font-black text-lg mb-3 tracking-tight uppercase tracking-[0.1em]">{user.name}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed font-medium">
                            {user.bio || "Synchronizing with the neural hive mind. Quantum explorer in the SynapseX realm."}
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-gray-400 border border-white/5">#NEURAL</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-gray-400 border border-white/5">#SYNC_X</span>
                            <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-gray-400 border border-white/5">#SECTOR_7G</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-t border-white/5 flex justify-center gap-12 text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 mb-12 relative">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-6 border-t-[3px] -mt-[3px] transition-all relative z-10 ${activeTab === tab.id ? 'border-emerald-500 text-white' : 'border-transparent hover:text-gray-400'}`}
                    >
                        {tab.icon}
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div layoutId="tab-active" className="absolute inset-0 bg-emerald-500/5 -z-10" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area - Grid Layout */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full"
                        />
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] animate-pulse">Syncing Registry...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 md:gap-8">
                        <AnimatePresence mode="popLayout">
                            {displayPosts.length > 0 ? (
                                displayPosts.map((post, i) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                        transition={{ delay: i * 0.05, duration: 0.4 }}
                                        className="aspect-square bg-gradient-to-br from-white/[0.05] to-transparent border border-white/5 rounded-[2rem] overflow-hidden relative group cursor-pointer shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] transition-all"
                                    >
                                        <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all z-10 flex flex-col items-center justify-center backdrop-blur-sm">
                                            <div className="flex items-center gap-6 mb-2">
                                                <div className="flex items-center gap-2 text-white font-bold">
                                                    <Heart size={18} fill="white" />
                                                    <span>{post._count?.likes || 0}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-white font-bold">
                                                    <MessageCircle size={18} fill="white" />
                                                    <span>{post._count?.comments || 0}</span>
                                                </div>
                                            </div>
                                            {post.postPassword && (
                                                <div className="flex items-center gap-2 text-amber-400 text-[8px] font-bold uppercase tracking-widest mt-2 mt-4 bg-black/40 px-3 py-1 rounded-full">
                                                    <Lock size={10} /> Encrypted
                                                </div>
                                            )}
                                        </div>

                                        {post.type === 'VIDEO' ? (
                                            <div className="w-full h-full relative">
                                                {post.thumbnailUrl ? (
                                                    <img src={post.thumbnailUrl} className="w-full h-full object-cover" alt="Video Thumbnail" />
                                                ) : (
                                                    <div className="w-full h-full bg-black/60 flex items-center justify-center">
                                                        <Play className="text-white/20" size={48} />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-lg">
                                                    <Play className="text-white" size={14} />
                                                </div>
                                            </div>
                                        ) : (
                                            <img
                                                src={post.mediaUrl}
                                                alt="Post"
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        )}

                                        {/* Badge for Type */}
                                        <div className="absolute bottom-4 right-4 text-white opacity-40">
                                            {post.type === 'VIDEO' ? <Monitor size={14} /> : <Hash size={14} />}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="col-span-full py-40 text-center flex flex-col items-center"
                                >
                                    <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center mb-8 border border-white/5 group hover:border-emerald-500/30 transition-all">
                                        {activeTab === 'posts' ? <Grid size={32} className="text-gray-700" /> : activeTab === 'reels' ? <Play size={32} className="text-gray-700" /> : <Bookmark size={32} className="text-gray-700" />}
                                    </div>
                                    <h3 className="text-white text-2xl font-black mb-2 tracking-tight uppercase">Segment Empty</h3>
                                    <p className="text-gray-600 text-xs font-bold tracking-[0.2em] mb-10 uppercase">Initiate your first neural broadcast in this area.</p>
                                    {isOwnProfile && activeTab === 'posts' && (
                                        <button className="flex items-center gap-3 px-10 py-4 bg-emerald-500 text-black font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-2xl">
                                            <Plus size={16} /> New post
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Subtle Footer */}
            <div className="mt-32 pt-16 border-t border-white/5 text-center">
                <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.5em]">SynapseX Neural Network • Sector 7G Collective</p>
            </div>
        </div>
    );
};

// Internal Import helper
const MessageCircle = ({ size, fill = "none" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
);

const Heart = ({ size, fill = "none" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

export default ProfileView;
