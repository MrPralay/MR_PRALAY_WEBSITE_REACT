import React from 'react';
import { Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from './PostCard';
import Cookies from 'js-cookie';

const PostSkeleton = () => (
    <div className="relative bg-white/[0.02] border border-white/5 rounded-[2.5rem] overflow-hidden mb-12 animate-pulse">
        <div className="flex items-center justify-between p-6 px-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5" />
                <div className="space-y-2">
                    <div className="w-32 h-3 bg-white/5 rounded-full" />
                    <div className="w-20 h-2 bg-white/5 rounded-full" />
                </div>
            </div>
            <div className="p-3 bg-white/5 rounded-2xl w-10 h-10" />
        </div>
        <div className="relative aspect-square md:aspect-[16/10] bg-black/40 overflow-hidden">
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
            />
        </div>
        <div className="p-8 px-10">
            <div className="flex items-center gap-8 mb-8">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-white/5 rounded-[1.2rem]" />
                        <div className="w-8 h-2 bg-white/5 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const StoryCircleSkeleton = () => (
    <div className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
        <div className="w-[78px] h-[78px] rounded-full bg-white/5 border-2 border-white/5" />
        <div className="w-12 h-2 bg-white/5 rounded-full" />
    </div>
);

const StoriesSlider = ({ stories, onStoryClick, onUserProfileClick }) => {
    const [startIndex, setStartIndex] = React.useState(0);
    const visibleCount = 5;

    const handleNext = () => {
        setStartIndex(prev => {
            const remainingRight = stories.length - (prev + visibleCount);
            const shift = remainingRight === 1 ? 1 : 2;
            const maxStart = Math.max(0, stories.length - visibleCount);
            return Math.min(prev + shift, maxStart);
        });
    };

    const handlePrev = () => {
        setStartIndex(prev => Math.max(0, prev - 2));
    };

    const hasMore = startIndex + visibleCount < stories.length;
    const canGoBack = startIndex > 0;
    const visibleStories = stories.slice(startIndex, startIndex + visibleCount);

    const handleClick = (item) => {
        if (item.hasStory && onStoryClick) {
            onStoryClick(item);
        } else if (!item.hasStory && onUserProfileClick) {
            onUserProfileClick(item.user);
        }
    };

    return (
        <div className="flex items-center gap-6">
            {canGoBack && (
                <button onClick={handlePrev} className="p-1 z-10 bg-black/50 rounded-full text-white hover:scale-110 transition-transform">
                    <ChevronRight size={16} className="rotate-180" />
                </button>
            )}

            <AnimatePresence mode="popLayout">
                {visibleStories.map((item, i) => (
                    <motion.div
                        key={item.id || item.user?.username || i}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer ${!item.hasStory ? 'opacity-70' : ''}`}
                        onClick={() => handleClick(item)}
                    >
                        <div className={`w-[78px] h-[78px] rounded-full p-[2px] ${item.hasStory ? 'bg-gradient-to-tr from-yellow-400 to-fuchsia-600' : 'border-2 border-gray-700'}`}>
                            <img
                                src={item.user?.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                className={`w-full h-full rounded-full ${item.hasStory ? 'border-2 border-black' : 'grayscale'} object-cover`}
                                alt="Story"
                            />
                        </div>
                        <span className="text-[10px] text-gray-300 font-medium truncate w-[78px] text-center">{item.user?.username || 'User'}</span>
                    </motion.div>
                ))}
            </AnimatePresence>

            {hasMore && (
                <button onClick={handleNext} className="flex flex-col items-center justify-center p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <ChevronRight size={24} className="text-white" />
                </button>
            )}
        </div>
    );
};

const FeedView = ({ posts, stories = [], suggestedUsers = [], onCreateClick, loading, onCinemaMode, myStories = [], onStoryClick, onUserProfileClick, onMyStoryClick }) => {
    const maxVisible = 5;

    const combinedList = React.useMemo(() => {
        const otherStories = stories.filter(s => !myStories.find(ms => ms.id === s.id));
        const userMap = new Map();
        otherStories.forEach(story => {
            if (!userMap.has(story.userId)) {
                userMap.set(story.userId, { ...story, hasStory: true });
            }
        });
        const uniqueUserStories = Array.from(userMap.values());

        if (uniqueUserStories.length === 0) {
            return suggestedUsers.map(user => ({
                id: `user-${user.id}`,
                user: user,
                hasStory: false
            }));
        } else if (uniqueUserStories.length >= maxVisible) {
            return uniqueUserStories;
        } else {
            const storyUserIds = new Set(uniqueUserStories.map(s => s.userId));
            const filteredSuggested = suggestedUsers.filter(u => !storyUserIds.has(u.id));
            const remainingSlots = maxVisible - uniqueUserStories.length;
            const fillingProfiles = filteredSuggested.slice(0, remainingSlots).map(user => ({
                id: `user-${user.id}`,
                user: user,
                hasStory: false
            }));
            return [...uniqueUserStories, ...fillingProfiles];
        }
    }, [stories, suggestedUsers, myStories]);

    return (
        <div className="flex-1 max-w-2xl mx-auto py-8 px-4">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-lg">Stories</h3>
                    <button className="text-gray-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:text-white transition-colors">
                        WATCH ALL <ChevronRight size={12} />
                    </button>
                </div>
                <div className="flex gap-6 overflow-x-auto hide-scrollbar py-2 items-center">
                    {loading ? (
                        <>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0 animate-pulse">
                                <div className="w-[78px] h-[78px] rounded-full bg-white/5 border-2 border-white/5" />
                                <div className="w-12 h-2 bg-white/5 rounded-full" />
                            </div>
                            {[1, 2, 3, 4, 5].map(i => <StoryCircleSkeleton key={i} />)}
                        </>
                    ) : (
                        <>
                            <div
                                onClick={myStories.length > 0 ? onMyStoryClick : onCreateClick}
                                className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group relative"
                            >
                                {myStories.length > 0 ? (
                                    <div className="w-[78px] h-[78px] rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 to-fuchsia-600 relative">
                                        <img
                                            src={myStories[myStories.length - 1].user?.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                            className="w-full h-full rounded-full border-2 border-black object-cover"
                                            alt="My Story"
                                        />
                                        <div
                                            onClick={(e) => { e.stopPropagation(); onCreateClick(); }}
                                            className="absolute bottom-0 right-0 translate-x-[10%] translate-y-[10%] bg-blue-500 rounded-full p-1 border-2 border-black z-10 hover:scale-110 transition-transform"
                                        >
                                            <Plus size={14} className="text-white" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-[78px] h-[78px]">
                                        <img
                                            src={Cookies.get('synapse_user_image') || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                            className="w-full h-full rounded-full border-2 border-white/10 object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            alt="Add Story"
                                        />
                                        <div className="absolute bottom-0 right-1 bg-blue-500 rounded-full p-1 border-2 border-black">
                                            <Plus size={16} className="text-white" />
                                        </div>
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-500 font-medium">{myStories.length > 0 ? 'Your Story' : 'Add story'}</span>
                            </div>

                            <StoriesSlider
                                stories={combinedList}
                                onStoryClick={onStoryClick}
                                onUserProfileClick={onUserProfileClick}
                            />
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between mb-8">
                <h3 className="text-white font-bold text-2xl">Feeds</h3>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    <button className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">LATEST</button>
                    <button className="px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-emerald-500 text-black rounded-lg">POPULAR</button>
                </div>
            </div>

            <div className="min-h-[500px]">
                {loading ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : posts.length > 0 ? (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} onCinemaMode={onCinemaMode} />
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Plus size={32} className="text-emerald-500" />
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">No posts yet</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto">The neural network is quiet.</p>
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
