import React from 'react';
import MobilePostCard from './MobilePostCard';
import { motion } from 'framer-motion';

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

// Memoized Story Rail for performance
const StoriesRail = React.memo(({ combinedList, currentUser, onStoryClick, onUserProfileClick, onCreateClick }) => (
    <div className="flex gap-3 overflow-x-auto pb-3 px-3 pt-2 scrollbar-hide border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        {/* My Story Add Button */}
        <div className="flex flex-col items-center flex-shrink-0 gap-1 cursor-pointer" onClick={onCreateClick}>
            <div className="relative w-16 h-16">
                <div className="w-full h-full rounded-full overflow-hidden border border-white/10 p-[2px]">
                    {isVideo(currentUser?.profileImage || currentUser?.image) ? (
                        <video
                            src={currentUser?.profileImage || currentUser?.image}
                            className="w-full h-full rounded-full object-cover opacity-80"
                            autoPlay
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={currentUser?.profileImage || currentUser?.image || `https://ui-avatars.com/api/?name=${currentUser?.username || 'Me'}&background=random`}
                            className="w-full h-full rounded-full object-cover opacity-80"
                            alt="Me"
                        />
                    )}
                </div>
                <div className="absolute bottom-0 right-0 bg-blue-500 w-5 h-5 rounded-full border-2 border-black flex items-center justify-center text-white">
                    <span className="text-sm font-bold leading-none mb-[1px]">+</span>
                </div>
            </div>
            <span className="text-[10px] text-center text-gray-400 font-medium truncate w-16">Your story</span>
        </div>

        {/* Story Items & Fallback Profiles */}
        {combinedList.map((item, i) => (
            <div
                key={item.id || i}
                className="flex flex-col items-center flex-shrink-0 gap-1 cursor-pointer"
                onClick={() => {
                    if (item.hasStory) onStoryClick(item);
                    else onUserProfileClick(item.user);
                }}
            >
                <div className={`relative w-16 h-16 rounded-full p-[2px] ${item.hasStory ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500' : 'border border-white/20'}`}>
                    <div className="w-full h-full rounded-full border-2 border-black overflow-hidden bg-gray-900">
                        {isVideo(item.user?.profileImage || item.user?.image || item.mediaUrl) ? (
                            <video
                                src={item.user?.profileImage || item.user?.image || item.mediaUrl}
                                className={`w-full h-full object-cover ${!item.hasStory ? 'grayscale opacity-60' : ''}`}
                                autoPlay
                                muted
                                loop
                                playsInline
                            />
                        ) : (
                            <img
                                src={item.user?.profileImage || item.user?.image || item.mediaUrl || `https://ui-avatars.com/api/?name=${item.user?.username || 'User'}&background=random`}
                                alt={item.user?.username}
                                className={`w-full h-full object-cover ${!item.hasStory ? 'grayscale opacity-60' : ''}`}
                            />
                        )}
                    </div>
                </div>
                <span className={`text-[10px] text-center truncate w-16 font-medium ${item.hasStory ? 'text-white' : 'text-gray-500'}`}>
                    {item.user?.username}
                </span>
            </div>
        ))}
    </div>
));

const MobileFeed = ({ posts, stories = [], suggestedUsers = [], myStories = [], currentUser, onStoryClick, onUserProfileClick, onCreateClick, onFollowChange, onInteraction, onOptionsClick }) => {

    const combinedList = React.useMemo(() => {
        // 1. Filter out 'Me' from Stories
        const otherStories = stories.filter(s => {
            const isMe = currentUser && (s.userId === currentUser.id || s.userId === currentUser.userId);
            const inMyStories = myStories.find(ms => ms.id === s.id);
            return !isMe && !inMyStories;
        });

        const userMap = new Map();
        otherStories.forEach(story => {
            if (!userMap.has(story.userId)) {
                userMap.set(story.userId, { ...story, hasStory: true });
            }
        });
        const uniqueUserStories = Array.from(userMap.values());

        const isStartUser = (u) => currentUser && (u.id === currentUser.id || u.username === currentUser.username);
        const maxVisible = 10;

        if (uniqueUserStories.length === 0) {
            return suggestedUsers
                .filter(u => !isStartUser(u))
                .map(user => ({
                    id: `user-${user.id}`,
                    user: user,
                    hasStory: false
                }));
        } else if (uniqueUserStories.length >= maxVisible) {
            return uniqueUserStories;
        } else {
            const storyUserIds = new Set(uniqueUserStories.map(s => s.userId));
            const filteredSuggested = suggestedUsers.filter(u =>
                !storyUserIds.has(u.id) && !isStartUser(u)
            );

            const remainingSlots = maxVisible - uniqueUserStories.length;
            const fillingProfiles = filteredSuggested.slice(0, remainingSlots).map(user => ({
                id: `user-${user.id}`,
                user: user,
                hasStory: false
            }));
            return [...uniqueUserStories, ...fillingProfiles];
        }
    }, [stories, suggestedUsers, myStories, currentUser]);

    return (
        <div className="flex flex-col min-h-screen bg-black pb-16 scrollbar-hide">
            {/* Stories */}
            <StoriesRail
                combinedList={combinedList}
                currentUser={currentUser}
                onStoryClick={onStoryClick}
                onUserProfileClick={onUserProfileClick}
                onCreateClick={onCreateClick}
            />

            {/* Posts Feed */}
            <div className="flex flex-col pt-1">
                {posts && posts.length > 0 ? (
                    posts.map((post, index) => (
                        <MobilePostCard
                            key={post.id || index}
                            post={post}
                            index={index}
                            currentUser={currentUser}
                            onFollowChange={onFollowChange}
                            onInteraction={onInteraction}
                            onProfileClick={onUserProfileClick}
                            onOptionsClick={onOptionsClick}
                        />
                    ))
                ) : (
                    <div className="py-20 text-center text-gray-500 text-sm">
                        <p>No posts yet.</p>
                        <p className="text-xs mt-2">Follow users to see their photos and videos.</p>
                    </div>
                )}
            </div>

            {/* Loading / End of feed */}
            <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin"></div>
            </div>
        </div>
    );
};

export default MobileFeed;
