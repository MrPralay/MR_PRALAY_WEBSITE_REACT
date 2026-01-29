import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';

const FeedView = ({ posts, stories = [], onCreateClick, loading }) => {
    return (
        <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
            {/* Professional Loading State (Spinner + Skeleton) */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505]/60 backdrop-blur-md"
                    >
                        <div className="relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-20 h-20 border-2 border-emerald-500/10 border-t-emerald-500 rounded-full"
                            />
                            <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full" />
                        </div>
                        <p className="mt-8 text-emerald-500 font-bold text-[10px] uppercase tracking-[0.4em] animate-pulse">Synchronizing Neural Feed...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stories Section */}
            <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">Stories</h3>
                    <button className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                        WATCH ALL <ChevronRight size={12} />
                    </button>
                </div>
                <div className="flex gap-6 overflow-x-auto hide-scrollbar py-2">
                    {/* Add Story Button */}
                    <div
                        onClick={onCreateClick}
                        className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
                            <Plus size={24} className="text-gray-500 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium">Add story</span>
                    </div>

                    {/* Dummy Stories */}
                    {stories.length > 0 ? (
                        stories.map((story, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
                                <div className="story-ring p-[2px]">
                                    <img
                                        src={story.user?.profileImage || `https://picsum.photos/seed/user${i}/100/100`}
                                        className="w-14 h-14 rounded-full border-2 border-black object-cover"
                                        alt="Story"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-300 font-medium">{story.user?.username || 'User'}</span>
                            </div>
                        ))
                    ) : (
                        // Placeholder stories matching the image
                        ['Pradana', 'Ben Schade', 'Shubha', 'Shea Lewis', 'Sumeet'].map((name, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer">
                                <div className="story-ring p-[2px]">
                                    <img
                                        src={`https://i.pravatar.cc/150?u=${name}`}
                                        className="w-14 h-14 rounded-full border-2 border-black object-cover"
                                        alt={name}
                                    />
                                </div>
                                <span className="text-[10px] text-gray-300 font-medium">{name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Feeds Header */}
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-bold text-2xl">Feeds</h3>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    <button className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">LATEST</button>
                    <button className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-black rounded-lg">POPULAR</button>
                </div>
            </div>

            {/* Posts Grid/List */}
            <div className="space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">No posts yet</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">The neural network is quiet. Be the first to synchronize your thoughts.</p>
                        <button
                            onClick={onCreateClick}
                            className="mt-8 px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors"
                        >
                            Initiate Upload
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedView;
