import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Edit, Camera, ChevronLeft, Music, Send, Trash2, X, Plus, MessageCircle, Play, Pause, MoreHorizontal, Volume2, VolumeX, Upload, User, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { saveToCache, loadFromCache } from '../../utils/synapseCache';

// --- Neural Global Post Cache (Shared across all chat threads) ---
let GLOBAL_POST_CACHE = {};
const fetchBatchPosts = async (postIds, apiUrl, token) => {
    if (!postIds.length) return;
    try {
        const response = await fetch(`${apiUrl}/api/social/posts/batch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: postIds })
        });
        const data = await response.json();
        if (data.success && data.data) {
            data.data.forEach(post => {
                GLOBAL_POST_CACHE[post.id] = post;
            });
        }
    } catch (err) {
        console.error("Neural Batch Fetch Error:", err);
    }
};

const isVideo = (url) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|mov|m4v|m3u8|ogv)$|video/i);
};

const formatLastActive = (lastSeen) => {
    if (!lastSeen) return { text: "Offline", isActive: false };
    const now = new Date();
    const seen = new Date(lastSeen);
    const diffInSeconds = Math.floor((now - seen) / 1000);

    if (diffInSeconds < 60) return { text: "Active now", isActive: true };
    if (diffInSeconds < 3600) {
        const mins = Math.max(1, Math.floor(diffInSeconds / 60));
        return { text: `Active ${mins}m ago`, isActive: false };
    }
    if (diffInSeconds < 86400) {
        const hours = Math.max(1, Math.floor(diffInSeconds / 3600));
        return { text: `Active ${hours}h ago`, isActive: false };
    }
    return { text: `Active ${Math.floor(diffInSeconds / 86400)}d ago`, isActive: false };
};

const formatSeenAt = (seenAt) => {
    if (!seenAt) return "seen";
    const now = new Date();
    const seen = new Date(seenAt);
    const diffInSeconds = Math.floor((now - seen) / 1000);

    if (diffInSeconds < 60) return "seen now";
    if (diffInSeconds < 3600) {
        const mins = Math.max(1, Math.floor(diffInSeconds / 60));
        return `seen ${mins}m ago`;
    }
    if (diffInSeconds < 86400) {
        const hours = Math.max(1, Math.floor(diffInSeconds / 3600));
        return `seen ${hours}h ago`;
    }
    return `seen ${Math.floor(diffInSeconds / 86400)}d ago`;
};

const ProfileImage = ({ src, username, size = "md", className = "", isActive = false }) => {
    const sizeClasses = {
        xs: "w-8 h-8",
        sm: "w-10 h-10",
        md: "w-14 h-14",
        lg: "w-16 h-16",
        xl: "w-20 h-20",
        full: "w-full h-full"
    };

    const containerSize = sizeClasses[size] || size;

    // Determine icon size based on container size
    const getIconSize = () => {
        if (size === 'xl') return 32;
        if (size === 'lg' || (size === 'full' && className.includes('w-16'))) return 24;
        if (size === 'full' && className.includes('xl')) return 32;
        return 20;
    };

    return (
        <div className={`${containerSize} aspect-square rounded-full flex-shrink-0 relative flex items-center justify-center`}>
            {/* The actual image container */}
            <div className={`w-full h-full rounded-full overflow-hidden bg-gray-800 relative flex items-center justify-center ${className}`}>
                {src ? (
                    isVideo(src) ? (
                        <video src={src} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                        <img src={src} alt={username} className="w-full h-full object-cover" />
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 group-hover:from-gray-600 group-hover:to-gray-800 transition-colors">
                        <User size={getIconSize()} className="text-white/20" />
                    </div>
                )}
            </div>

            {/* Active Status Dot */}
            {isActive && (
                <div className="absolute bottom-0 right-0 w-[30%] h-[30%] min-w-[8px] min-h-[8px] bg-emerald-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] z-20"></div>
            )}
        </div>
    );
};

// --- Child Components ---

const NoteBubble = ({ note, isCurrentUser, onClick }) => {
    const [isMarquee, setIsMarquee] = useState(false);
    const [contentWidth, setContentWidth] = useState(0);
    const textRef = useRef(null);
    const containerRef = useRef(null);

    const displayContent = (note.hasMusic && !note.content) ? note.musicTitle : note.content;

    useEffect(() => {
        if (textRef.current && containerRef.current) {
            const textWidth = textRef.current.scrollWidth;
            const containerWidth = containerRef.current.offsetWidth;
            if (textWidth > containerWidth) {
                setIsMarquee(true);
                setContentWidth(textWidth);
            } else {
                setIsMarquee(false);
            }
        }
    }, [displayContent]);

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center gap-2 flex-shrink-0 relative cursor-pointer group pt-8"
            onClick={onClick}
        >
            <div className={`
                absolute -top-2 z-10 px-2.5 py-1 rounded-xl rounded-bl-sm
                backdrop-blur-md border border-white/10 shadow-lg
                w-[70px] h-[28px] flex items-center justify-center
                ${isCurrentUser ? 'bg-[#262626]/95' : 'bg-[#262626]/90'}
            `}>
                <div ref={containerRef} className="overflow-hidden whitespace-nowrap w-full flex items-center relative mask-linear-fade">
                    <motion.div
                        ref={textRef}
                        className="text-[9px] font-medium text-white/90 flex items-center gap-6"
                        animate={isMarquee ? { x: [0, -(contentWidth + 24)] } : { x: 0 }}
                        transition={isMarquee ? {
                            repeat: Infinity,
                            duration: contentWidth / 15, // Constant speed
                            ease: "linear",
                            repeatType: "loop"
                        } : { duration: 0 }}
                        style={{ width: isMarquee ? 'max-content' : '100% ', justifyContent: isMarquee ? 'flex-start' : 'center' }}
                    >
                        <span>{displayContent}</span>
                        {isMarquee && <span>{displayContent}</span>}
                    </motion.div>
                </div>
            </div>

            <div className="w-16 h-16 relative flex-shrink-0 aspect-square">
                <div className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center ${isCurrentUser ? 'border border-white/10' : 'border-2 border-blue-500/30'}`}>
                    <ProfileImage
                        src={note.user.profileImage}
                        username={note.user.username}
                        size="full"
                        className="opacity-90 grayscale-[0.2] group-hover:grayscale-0 transition-all border border-white/5"
                    />
                </div>
            </div>
            <span className="text-[10px] text-center text-gray-400 truncate w-16 font-medium">
                {isCurrentUser ? "Your note" : note.user.username}
            </span>
        </motion.div>
    );
};

const NoteDetailPopup = ({ note, onClose, isCurrentUser, onDelete, onAddNew }) => {
    const [isPlaying, setIsPlaying] = useState(note.hasMusic);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(new Audio());

    useEffect(() => {
        if (!note.hasMusic) return;

        const audio = audioRef.current;
        const startTime = note.musicStartTime || 0;
        const clipDuration = 30; // Instagram-style 30s limit

        audio.src = note.musicUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        audio.currentTime = startTime;

        const updateProgress = () => {
            const currentClipTime = audio.currentTime - startTime;
            if (audio.duration) {
                setProgress(Math.min((currentClipTime / clipDuration) * 100, 100));
            }

            // Loop if 30s limit reached or song ends
            if (currentClipTime >= clipDuration) {
                audio.currentTime = startTime;
            }
        };

        const handleCanPlay = () => {
            if (isPlaying) {
                audio.play().catch(e => console.log("Autoplay blocked:", e));
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('canplaythrough', handleCanPlay);

        return () => {
            audio.pause();
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('canplaythrough', handleCanPlay);
        };
    }, [note.hasMusic, note.musicUrl, note.musicStartTime]);

    const toggleMute = () => {
        if (!note.hasMusic) return;
        audioRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#1a1a1a] rounded-[32px] w-full max-w-xs flex flex-col items-center gap-6 p-6 border border-white/10 shadow-2xl relative overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors z-20">
                    <X size={16} className="text-white/70" />
                </button>

                {/* User Info */}
                <div className="flex flex-col items-center gap-3 z-10 mt-2">
                    <div className="relative aspect-square">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg flex items-center justify-center">
                            <ProfileImage
                                src={note.user.profileImage}
                                username={note.user.username}
                                size="full"
                            />
                        </div>
                        {note.hasMusic && isPlaying && (
                            <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-pulse opacity-50"></div>
                        )}
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-white">
                            {isCurrentUser ? "Your Note" : note.user.username}
                        </h3>
                        <p className="text-xs text-gray-400">
                            {isCurrentUser ? "You shared a note" : `${note.user.username} shared a note`}
                        </p>
                    </div>
                </div>

                {/* Note Content */}
                {note.content && (
                    <div className="bg-white/5 px-6 py-4 rounded-2xl border border-white/5 w-full text-center max-h-32 overflow-y-auto scrollbar-hide relative z-10">
                        <p className="text-sm text-gray-200 font-medium leading-relaxed italic">
                            "{note.content}"
                        </p>
                    </div>
                )}

                {/* Music Controls (Conditional) */}
                {note.hasMusic && (
                    <div className="w-full flex flex-col gap-3 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col items-center gap-1 mb-2">
                            <div className="flex items-center gap-2 text-emerald-400">
                                <Music size={12} />
                                <span className="text-xs font-bold tracking-wide uppercase">Music attached</span>
                            </div>
                            <h3 className="text-sm font-semibold text-white text-center line-clamp-1 px-4 opacity-90">
                                {note.musicTitle || "Unknown Track"}
                            </h3>
                        </div>

                        <div className="flex items-center justify-center gap-6">
                            <button className="text-gray-500 hover:text-white transition-colors"><MoreHorizontal size={20} /></button>
                            <button
                                onClick={toggleMute}
                                className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                            >
                                {isMuted ? <VolumeX size={24} fill="currentColor" /> : <Volume2 size={24} fill="currentColor" />}
                            </button>
                            <div className="w-5" /> {/* Spacer for centering */}
                        </div>

                        {/* Mini Progress Bar */}
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-4">
                            <motion.div
                                className="h-full bg-white"
                                style={{ width: `${progress}%` }}
                                layoutId="progress"
                            />
                        </div>
                    </div>
                )}

                {/* Management Options for Current User */}
                {isCurrentUser && (
                    <div className="w-full flex flex-col gap-2 mt-2 z-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <button
                            onClick={onAddNew}
                            className="w-full py-3 bg-white text-black rounded-2xl font-bold text-sm hover:bg-gray-100 transition-all active:scale-95 shadow-lg"
                        >
                            Add new note
                        </button>
                        <button
                            onClick={onDelete}
                            className="w-full py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-500/20 transition-all active:scale-95"
                        >
                            Delete note
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

// --- Globals for caching ---
const INBOX_CACHE_KEY = 'inbox_main_data';
let INBOX_CACHE = loadFromCache(INBOX_CACHE_KEY) || {
    notes: [],
    conversations: [],
    shuffledUsers: [],
    lastFetched: 0
};

const MobileInbox = ({ onBack, currentUser, onUserProfileClick, chatIntent, onConsumeIntent }) => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [notes, setNotes] = useState(INBOX_CACHE.notes);
    const [conversations, setConversations] = useState(INBOX_CACHE.conversations);
    const [shuffledUsers, setShuffledUsers] = useState(INBOX_CACHE.shuffledUsers);
    const [loading, setLoading] = useState(INBOX_CACHE.lastFetched === 0 && INBOX_CACHE.conversations.length === 0);
    const [showNotePopup, setShowNotePopup] = useState(false);

    // Note View State
    const [viewingNote, setViewingNote] = useState(null);

    const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');

    const fetchData = useCallback(async (isSilent = false) => {
        // Only show loading if we have no cached conversations
        if (!isSilent && INBOX_CACHE.conversations.length === 0) setLoading(true);
        try {
            const [notesRes, convRes] = await Promise.all([
                fetch(`${apiUrl}/api/messages/notes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }).then(r => r.json()),
                fetch(`${apiUrl}/api/messages/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                }).then(r => r.json())
            ]);

            if (notesRes.success) {
                setNotes(notesRes.notes);
                setShuffledUsers(notesRes.shuffledUsers || []);
                INBOX_CACHE.notes = notesRes.notes;
                INBOX_CACHE.shuffledUsers = notesRes.shuffledUsers || [];
            }
            if (convRes.success) {
                // PRESENCE ACCELERATION: Manifest active only if NOT explicitly offline
                const accelerated = convRes.conversations.map(conv => {
                    if (!conv.user || conv.user.lastSeen === null) return conv;

                    const lastMsg = conv.lastMessage;
                    if (lastMsg && lastMsg.userId === conv.user.id) {
                        const msgTime = new Date(lastMsg.createdAt).getTime();
                        const seenTime = new Date(conv.user.lastSeen).getTime();

                        // Only accelerate if message is newer than known last seen and within 60s
                        if (msgTime > seenTime && (Date.now() - msgTime) < 60000) {
                            return { ...conv, user: { ...conv.user, lastSeen: new Date(msgTime).toISOString() } };
                        }
                    }
                    return conv;
                });
                setConversations(accelerated);
                INBOX_CACHE.conversations = accelerated;
            }
            INBOX_CACHE.lastFetched = Date.now();
            saveToCache(INBOX_CACHE_KEY, INBOX_CACHE);
        } catch (err) {
            console.error("Inbox Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, token]);

    useEffect(() => {
        const isSilent = INBOX_CACHE.lastFetched !== 0;
        fetchData(isSilent);

        // LIVE INBOX POLLING: Neural Burst - 1s updates
        // Suppression: Skip inbox list polling if a chat thread is active to save bandwidth/CPU
        const interval = setInterval(() => {
            if (!selectedChat) {
                fetchData(true);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [fetchData, selectedChat]);

    // NEURAL INTENT HANDLER: Auto-open chat from profile
    useEffect(() => {
        if (chatIntent && conversations.length > 0) {
            console.log("🎯 [Neural Inbox] Processing Message Intent for:", chatIntent.username);
            const targetId = chatIntent.id || chatIntent.userId;
            const existing = conversations.find(c => c.user.id === targetId || c.user.userId === targetId);

            if (existing) {
                setSelectedChat(existing);
            } else {
                // New thread initialization
                setSelectedChat({
                    id: null,
                    user: chatIntent,
                    lastMessage: null
                });
            }
            onConsumeIntent();
        }
    }, [chatIntent, conversations, onConsumeIntent]);

    // Inbox polling handled here; Global activity moved to App.jsx

    // Activity logic removed (moved to App.jsx)

    const handleCreateNote = async (noteData) => {
        // Instant feedback
        setShowNotePopup(false);

        // Optimistic UI Update
        const optimisticNote = {
            id: 'temp-' + Date.now(),
            content: noteData.content,
            hasMusic: noteData.hasMusic,
            musicTitle: noteData.musicTitle,
            musicUrl: noteData.musicUrl,
            musicStartTime: noteData.musicStartTime,
            userId: currentUser?.id,
            user: currentUser,
            createdAt: new Date().toISOString()
        };

        setNotes(prev => {
            const exists = prev.some(n => n.userId === currentUser?.id);
            if (exists) {
                return prev.map(n => n.userId === currentUser?.id ? optimisticNote : n);
            }
            return [optimisticNote, ...prev];
        });

        try {
            const res = await fetch(`${apiUrl}/api/messages/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(noteData)
            }).then(r => r.json());

            if (res.success) {
                fetchData();
            }
        } catch (err) {
            console.error("Create note error:", err);
            fetchData();
        }
    };

    const handleDeleteNote = async () => {
        // Instant feedback
        setViewingNote(null);

        // Optimistic UI Update
        setNotes(prev => prev.filter(n => n.userId !== currentUser?.id));

        try {
            const res = await fetch(`${apiUrl}/api/messages/notes`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json());

            if (res.success) {
                fetchData();
            }
        } catch (err) {
            console.error("Delete note error:", err);
            fetchData();
        }
    };

    if (selectedChat) {
        return (
            <ChatThread
                chat={selectedChat}
                currentUser={currentUser}
                onUserProfileClick={onUserProfileClick}
                onBack={() => {
                    setSelectedChat(null);
                    fetchData(); // Refresh list on back
                }}
            />
        );
    }

    const myNote = notes.find(n => n.userId === currentUser?.id);
    const otherNotes = notes.filter(n => n.userId !== currentUser?.id);

    return (
        <div className="bg-black min-h-screen text-white pb-20 font-sans selection:bg-blue-500/30 scrollbar-hide">
            {/* Header */}
            <div className="sticky top-0 bg-black z-30 px-4 py-3 flex items-center justify-between backdrop-blur-xl bg-opacity-80">
                <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" onClick={onBack}>
                    <ChevronLeft size={28} />
                    <h1 className="text-xl font-bold flex items-center gap-1">
                        {currentUser?.username || "Neural Hive"} <ChevronDown size={14} />
                    </h1>
                </div>
                <div className="flex items-center gap-5">
                    <Edit size={24} />
                </div>
            </div>

            <div className="px-4 pb-4">
                {/* Search */}
                <div className="bg-[#262626] rounded-xl flex items-center px-4 py-2 gap-3 mb-6 border border-white/5 transition-colors focus-within:border-white/20">
                    <Search size={18} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="bg-transparent text-white placeholder-gray-400 text-sm w-full focus:outline-none"
                    />
                </div>

                {/* Notes Rail */}
                <div className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide mb-2 pt-14 pl-4">
                    {/* Your Note */}
                    <NoteBubble
                        note={myNote ? { ...myNote, user: currentUser } : { content: "Note...", user: currentUser, userId: currentUser?.id }}
                        isCurrentUser={true}
                        onClick={() => myNote ? setViewingNote({ ...myNote, user: currentUser }) : setShowNotePopup(true)}
                    />

                    {/* Active Notes */}
                    <AnimatePresence>
                        {otherNotes.map((note) => (
                            <NoteBubble
                                key={note.id}
                                note={note}
                                isCurrentUser={false}
                                onClick={() => setViewingNote(note)} // Clicking others opens details
                            />
                        ))}
                    </AnimatePresence>

                    {/* Shuffled Profiles (Fillers) */}
                    {(() => {
                        const fillerCount = Math.max(0, 6 - otherNotes.length);
                        const availableFillers = shuffledUsers.filter(u =>
                            u.id !== currentUser?.id &&
                            !otherNotes.some(n => n.userId === u.id)
                        );

                        return availableFillers.slice(0, fillerCount).map((user) => (
                            <div key={user.id} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer opacity-50 grayscale hover:grayscale-0 transition-all pt-8 aspect-square">
                                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 flex items-center justify-center">
                                    <ProfileImage
                                        src={user.profileImage}
                                        username={user.username}
                                        size="full"
                                        className="border border-white/5"
                                    />
                                </div>
                                <span className="text-[10px] text-center text-gray-500 truncate w-16">{user.username}</span>
                            </div>
                        ));
                    })()}
                </div>

                {/* Messages List */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-base">Messages</h3>
                    <span className="text-blue-500 text-sm font-semibold">Requests</span>
                </div>

                <div className="flex flex-col gap-4">
                    {conversations.length === 0 ? (
                        <div className="flex flex-col items-center py-20 opacity-40">
                            <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center mb-4">
                                <MessageCircle size={40} />
                            </div>
                            <h2 className="text-lg font-bold">No messages yet</h2>
                            <p className="text-xs">Start a conversation with a neural friend</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedChat(conv)}
                                className="flex items-center justify-between active:bg-white/5 p-2 rounded-lg -mx-2 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <ProfileImage
                                        src={conv.user.profileImage}
                                        username={conv.user.username}
                                        size="md"
                                        className="border border-white/5"
                                        isActive={formatLastActive(conv.user.lastSeen).isActive}
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-semibold text-white truncate">
                                            {conv.user.username}
                                        </span>
                                        <span className="text-sm text-gray-400 truncate flex items-center gap-1">
                                            {conv.lastMessage?.userId === currentUser?.id && "You: "}{conv.lastMessage?.content || "Tap to chat"}
                                            {conv.lastMessage?.userId === currentUser?.id && conv.lastMessage?.isSeen && (
                                                <span className="text-[10px] text-blue-500 font-bold ml-1">{formatSeenAt(conv.lastMessage?.seenAt)}</span>
                                            )}
                                            <span className="text-xs text-gray-600">• {formatLastActive(conv.user.lastSeen).text}</span>
                                        </span>
                                    </div>
                                </div>
                                <Camera size={24} className="text-gray-500" />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Note Creation Popup */}
            <AnimatePresence>
                {showNotePopup && (
                    <AddNotePopup
                        onClose={() => setShowNotePopup(false)}
                        onSubmit={handleCreateNote}
                        user={currentUser}
                    />
                )}
            </AnimatePresence>

            {/* Note Detail Popup (Text/Music) */}
            <AnimatePresence>
                {viewingNote && (
                    <NoteDetailPopup
                        note={viewingNote}
                        onClose={() => setViewingNote(null)}
                        isCurrentUser={viewingNote.userId === currentUser?.id}
                        onDelete={handleDeleteNote}
                        onAddNew={() => {
                            setViewingNote(null);
                            setShowNotePopup(true);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper for icon
const MOCK_SONGS = [
    { id: 1, title: "Until I Found You", artist: "Stephen Sanchez", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Starboy", artist: "The Weeknd", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Blinding Lights", artist: "The Weeknd", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
    { id: 4, title: "As It Was", artist: "Harry Styles", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: 5, title: "Stay", artist: "The Kid LAROI & Justin Bieber", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
    { id: 6, title: "Levitating", artist: "Dua Lipa", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
];

const AddNotePopup = ({ onClose, onSubmit, user }) => {
    const [noteMode, setNoteMode] = useState(null); // null (select), 'text', 'music'
    const [text, setText] = useState('');
    const [hasMusic, setHasMusic] = useState(false);
    const [musicTitle, setMusicTitle] = useState('');
    const [musicUrl, setMusicUrl] = useState('');
    const [musicStartTime, setMusicStartTime] = useState(0);
    const [musicDuration, setMusicDuration] = useState(0);
    const [showMusicSelection, setShowMusicSelection] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('search'); // 'search' or 'upload'
    const [previewProgress, setPreviewProgress] = useState(0);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const fileInputRef = useRef(null);
    const previewAudioRef = useRef(new Audio());
    const musicStartTimeRef = useRef(0);

    // Effect to clean up audio when the entire popup is closed/unmounted
    useEffect(() => {
        return () => {
            if (previewAudioRef.current) {
                previewAudioRef.current.pause();
                previewAudioRef.current.src = ""; // Stop any ongoing downloads/playback
            }
        };
    }, []);

    useEffect(() => {
        musicStartTimeRef.current = musicStartTime;
    }, [musicStartTime]);

    useEffect(() => {
        const audio = previewAudioRef.current;
        if (!hasMusic || !musicUrl) {
            audio.pause();
            setIsPreviewPlaying(false);
            return;
        }

        if (audio.src !== musicUrl) {
            audio.src = musicUrl;
        }
        audio.currentTime = musicStartTime;

        const updateProgress = () => {
            const start = musicStartTimeRef.current;
            const elapsed = audio.currentTime - start;
            const progress = (elapsed / 30) * 100;
            setPreviewProgress(Math.min(progress, 100));

            if (elapsed >= 30 || audio.ended) {
                audio.currentTime = musicStartTimeRef.current;
                audio.play().catch(e => {
                    if (e.name !== 'AbortError') console.log("Preview loop error:", e);
                });
            }
        };

        audio.addEventListener('timeupdate', updateProgress);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            // Removed audio.pause() to prevent stopping on EVERY slider tick
        };
    }, [hasMusic, musicUrl, musicStartTime]);

    const togglePreview = (e) => {
        e.stopPropagation();
        const audio = previewAudioRef.current;
        if (isPreviewPlaying) {
            audio.pause();
            setIsPreviewPlaying(false);
        } else {
            audio.play().catch(e => {
                if (e.name !== 'AbortError') console.log("Preview error:", e);
            });
            setIsPreviewPlaying(true);
        }
    };

    const filteredSongs = MOCK_SONGS.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const loadAudioDuration = (url) => {
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
            setMusicDuration(audio.duration);
            setMusicStartTime(0);
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setMusicTitle(file.name.replace(/\.[^/.]+$/, ""));
            setMusicUrl(url);
            setHasMusic(true);
            setText(''); // Exclusive choice
            setShowMusicSelection(false);
            loadAudioDuration(url);
        }
    };

    const handleSongSelect = (song) => {
        setMusicTitle(`${song.artist} - ${song.title}`);
        setMusicUrl(song.url);
        setHasMusic(true);
        setText(''); // Exclusive choice
        setShowMusicSelection(false);
        loadAudioDuration(song.url);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-end sm:items-center justify-center sm:p-4"
        >
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-gradient-to-b from-[#1a1a1a] to-black w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-5 relative overflow-hidden border-t sm:border border-white/10 shadow-2xl h-[75vh] sm:h-auto"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full mt-3 sm:hidden" />
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />

                <div className="flex justify-between items-center mb-8 mt-4 sm:mt-0 relative z-10">
                    <button
                        onClick={showMusicSelection ? () => setShowMusicSelection(false) : (noteMode ? () => setNoteMode(null) : onClose)}
                        className="text-white/60 p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1"
                    >
                        {showMusicSelection || noteMode ? <ChevronLeft size={16} /> : null}
                        <span className="text-sm font-medium">{showMusicSelection || noteMode ? 'Back' : 'Cancel'}</span>
                    </button>
                    <h2 className="text-white font-bold text-lg">
                        {showMusicSelection ? 'Add Music' : (noteMode === 'text' ? 'New Thought' : (noteMode === 'music' ? 'Music Note' : 'Share Note'))}
                    </h2>
                    {noteMode && !showMusicSelection ? (
                        <button
                            onClick={() => onSubmit({ content: text, hasMusic, musicTitle, musicUrl, musicStartTime })}
                            disabled={(noteMode === 'text' && !text.trim()) || (noteMode === 'music' && !hasMusic)}
                            className={`text-blue-500 font-bold text-sm bg-blue-500/10 px-4 py-2 rounded-full disabled:opacity-50 disabled:bg-transparent transition-all`}
                        >
                            Share
                        </button>
                    ) : <div className="w-12" />}
                </div>

                <AnimatePresence mode="wait">
                    {!noteMode ? (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col gap-4 relative z-10 py-4"
                        >
                            <button
                                onClick={() => setNoteMode('text')}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                    <Edit size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-bold text-base">Share a Thought</h3>
                                    <p className="text-white/40 text-xs">Write a note for your friends</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setNoteMode('music')}
                                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 flex items-center gap-5 hover:bg-white/10 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                    <Music size={24} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-white font-bold text-base">Share Music</h3>
                                    <p className="text-white/40 text-xs">Pick a song to share</p>
                                </div>
                            </button>
                        </motion.div>
                    ) : !showMusicSelection ? (
                        <motion.div
                            key="editor"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex flex-col items-center gap-5 relative z-10"
                        >
                            {/* Floating Avatar Preview */}
                            <div className="relative mb-4">
                                <div className={`absolute inset-0 ${noteMode === 'text' ? 'bg-blue-500/20' : 'bg-emerald-500/20'} blur-xl rounded-full scale-150 animate-pulse`}></div>
                                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 z-20 ${noteMode === 'text' ? 'border-blue-500/40' : 'border-emerald-500/40'} relative shadow-2xl aspect-square flex items-center justify-center`}>
                                    <ProfileImage
                                        src={user?.profileImage}
                                        username={user?.username}
                                        size="full"
                                        className="border border-white/5"
                                    />
                                </div>
                                <AnimatePresence>
                                    {(noteMode === 'text' && text) && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, y: 10 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-8 -right-8 bg-white text-black px-3 py-1.5 rounded-xl rounded-bl-none text-xs font-bold shadow-lg max-w-[100px] truncate"
                                        >
                                            {text}
                                        </motion.div>
                                    )}
                                    {(noteMode === 'music' && hasMusic) && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, y: 10 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            className="absolute -top-8 -right-8 bg-black text-white px-3 py-1.5 rounded-xl rounded-bl-none text-[10px] font-bold shadow-lg border border-white/10 flex items-center gap-2"
                                        >
                                            <Music size={10} className="text-emerald-500" />
                                            {musicTitle}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {noteMode === 'text' && (
                                <div className="w-full relative">
                                    <textarea
                                        autoFocus
                                        value={text}
                                        onChange={(e) => {
                                            setText(e.target.value);
                                            setHasMusic(false); // Strict exclusivity
                                        }}
                                        placeholder="What's on your mind?"
                                        maxLength={60}
                                        className="bg-white/5 text-white text-center text-xl w-full focus:outline-none resize-none h-32 placeholder-white/20 font-bold rounded-2xl p-4 border border-white/5 focus:border-white/10 transition-colors"
                                    />
                                    <div className="absolute bottom-4 right-4 text-[10px] text-white/30 font-mono">
                                        {text.length}/60
                                    </div>
                                </div>
                            )}

                            {noteMode === 'music' && (
                                <div className="w-full">
                                    {!hasMusic ? (
                                        <button
                                            onClick={() => setShowMusicSelection(true)}
                                            className="w-full aspect-video rounded-3xl bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group"
                                        >
                                            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                <Music size={28} />
                                            </div>
                                            <span className="text-sm font-bold text-white/60">Choose a track</span>
                                        </button>
                                    ) : (
                                        <div className="w-full space-y-4">
                                            <div
                                                onClick={() => setShowMusicSelection(true)}
                                                className="w-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <svg className="absolute -inset-1 w-12 h-12 -rotate-90 transform">
                                                            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                                                            <motion.circle
                                                                cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" fill="transparent"
                                                                strokeDasharray="138.23" strokeDashoffset={138.23 - (138.23 * previewProgress) / 100}
                                                                strokeLinecap="round" className="text-emerald-500"
                                                            />
                                                        </svg>
                                                        <button onClick={togglePreview} className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black relative z-10">
                                                            {isPreviewPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} className="translate-x-0.5" fill="currentColor" />}
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-bold text-sm line-clamp-1">{musicTitle}</h4>
                                                        <p className="text-white/40 text-[10px]">30s clip starting at {Math.floor(musicStartTime)}s</p>
                                                    </div>
                                                </div>
                                                <Edit size={16} className="text-white/30" />
                                            </div>

                                            <div className="mt-6 w-full space-y-3">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Clip Start</span>
                                                    <span className="text-[10px] text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                        {Math.floor(musicStartTime)}s - {Math.floor(Math.min(musicDuration, musicStartTime + 30))}s
                                                    </span>
                                                </div>
                                                <div className="relative h-12 flex items-center bg-white/5 rounded-xl px-4 border border-white/5">
                                                    <input
                                                        type="range" min="0" max={Math.max(0, musicDuration - 30)} step="1" value={musicStartTime}
                                                        onPointerDown={() => { previewAudioRef.current.pause(); setIsPreviewPlaying(false); }}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value);
                                                            setMusicStartTime(val);
                                                            previewAudioRef.current.currentTime = val;
                                                        }}
                                                        onPointerUp={() => {
                                                            previewAudioRef.current.play().catch(e => {
                                                                if (e.name !== 'AbortError') console.log("Slide play error:", e);
                                                            });
                                                            setIsPreviewPlaying(true);
                                                        }}
                                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all hover:accent-emerald-400"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="selection"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex flex-col h-[50vh] relative z-10"
                        >
                            {/* Tabs */}
                            <div className="flex gap-2 mb-4 bg-white/5 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'search' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    Explore
                                </button>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
                                >
                                    My Files
                                </button>
                            </div>

                            {activeTab === 'search' ? (
                                <>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search songs or artists..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-white/20"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-hide">
                                        {filteredSongs.length > 0 ? filteredSongs.map(song => (
                                            <button
                                                key={song.id}
                                                onClick={() => handleSongSelect(song)}
                                                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 text-left overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-105 transition-transform">
                                                        <Music size={18} />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-sm font-bold text-white truncate">{song.title}</span>
                                                        <span className="text-xs text-white/40 truncate">{song.artist}</span>
                                                    </div>
                                                </div>
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 group-hover:text-blue-500 transition-colors">
                                                    <Plus size={18} />
                                                </div>
                                            </button>
                                        )) : (
                                            <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
                                                <Music size={40} strokeWidth={1} />
                                                <span className="text-sm">No songs found</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                                    <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center text-white/20 border border-white/10 shadow-xl">
                                        <Upload size={32} />
                                    </div>
                                    <div className="max-w-[200px]">
                                        <h3 className="text-white font-bold mb-1">Local Music</h3>
                                        <p className="text-xs text-white/40 leading-relaxed">Choose an audio file from your device to share.</p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept="audio/*,audio/mpeg,audio/mp3,audio/x-m4a,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg,.mpeg"
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mt-2 bg-white text-black px-6 py-2.5 rounded-2xl text-sm font-bold hover:scale-105 transition-transform"
                                    >
                                        Browse Files
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};

// --- Shared Post Preview Component (Neural Cache Enabled) ---
const SharedPostPreview = ({ postId, apiUrl, token }) => {
    // Check global cache first for instant render
    const [post, setPost] = useState(GLOBAL_POST_CACHE[postId]);
    const [loading, setLoading] = useState(!GLOBAL_POST_CACHE[postId]);

    useEffect(() => {
        if (GLOBAL_POST_CACHE[postId]) {
            setPost(GLOBAL_POST_CACHE[postId]);
            setLoading(false);
            return;
        }

        let isMounted = true;
        const fetchPost = async () => {
            if (!postId) return;
            try {
                const response = await fetch(`${apiUrl}/api/social/posts/${postId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (isMounted && data.success) {
                    const postData = data.data || data.post || data;
                    GLOBAL_POST_CACHE[postId] = postData;
                    setPost(postData);
                }
            } catch (err) {
                console.error("Fetch shared post error:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchPost();
        return () => { isMounted = false; };
    }, [postId, apiUrl, token]);

    // DYNAMIC FLUID WIDTH: w-[75vw] with min/max bounds ensures proper edge spacing on all devices
    // FIXED HEIGHT (400px): Keeps 1:1 skeleton matching regardless of width
    const containerClass = "w-[68vw] min-w-[240px] max-w-[335px] h-[350px] overflow-hidden rounded-[20px] bg-[#121212] border border-white/5 shadow-2xl mb-2 relative group flex flex-col";

    if (loading) return (
        <div className={`${containerClass} animate-pulse`}>
            {/* Top Overlay Skeleton (Overlapping) */}
            <div className="absolute top-0 inset-x-0 p-5 flex items-center gap-3 z-10">
                <div className="w-9 h-9 rounded-full bg-white/20 border border-white/5" />
                <div className="w-24 h-3.5 bg-white/20 rounded-full" />
            </div>
            {/* Full Height Media Area Skeleton (Background) */}
            <div className="w-full h-full bg-white/5" />
            {/* Bottom Overlay Skeleton (Overlapping) */}
            <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-2.5 z-10">
                <div className="w-1/2 h-2.5 bg-white/10 rounded-full" />
                <div className="w-full h-2.5 bg-white/5 rounded-full" />
            </div>
        </div>
    );

    if (!post) return (
        <div className={containerClass}>
            <div className="w-full h-full flex items-center justify-center p-8 text-center bg-white/5">
                <p className="text-xs text-red-500/60 font-semibold tracking-wide">Neural link offline: Post removed</p>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={containerClass}
        >
            {/* Full length media container - fills 100% of the 400px height */}
            <div className="absolute inset-0 w-full h-full bg-black">
                {isVideo(post.mediaUrl) ? (
                    <video src={post.mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
                ) : (
                    <img src={post.mediaUrl} className="w-full h-full object-cover" />
                )}
            </div>

            {/* Overlapping cinematic shades - Minimized to maximize media "length" visibility */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/70 via-black/30 to-transparent z-[5]" />
            <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/85 via-black/30 to-transparent z-[5]" />

            <div className="absolute top-0 inset-x-0 p-4 flex items-center gap-2.5 z-20">
                <ProfileImage
                    src={post.user?.profileImage}
                    username={post.user?.username}
                    size="xs"
                    className="border border-white/20 bg-black/20 shadow-lg"
                />
                <div className="flex flex-col drop-shadow-lg text-white">
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-extrabold tracking-tight truncate">
                            {post.user?.username}
                        </span>
                        {post.user?.isVerified && <span className="text-blue-400 text-[10px]">✓</span>}
                    </div>
                    <span className="text-[9px] text-white/80 font-bold leading-none uppercase tracking-wider">Shared Post</span>
                </div>
            </div>

            {/* Overlapping caption details */}
            <div className="absolute bottom-0 inset-x-0 p-5 z-10 flex flex-col gap-2.5">
                {post.type === 'VIDEO' && (
                    <div className="w-fit p-1.5 bg-white/10 rounded-lg backdrop-blur-2xl border border-white/20 shadow-lg">
                        <Music size={12} className="text-white" />
                    </div>
                )}

                {post.caption && (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-[13px] leading-relaxed text-white drop-shadow-2xl line-clamp-2">
                            <span className="font-extrabold mr-2 text-white">{post.user?.username}</span>
                            <span className="text-white/95 font-medium whitespace-pre-wrap">{post.caption}</span>
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ChatThread = ({ chat: initialChat, onBack, currentUser, onUserProfileClick }) => {
    const [chat, setChat] = useState(initialChat);
    const CACHE_KEY = chat.id ? `chat_messages_${chat.id}` : null;
    const [messages, setMessages] = useState(() => loadFromCache(CACHE_KEY) || []);
    const [input, setInput] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');

    // Update local chat if prop changes (e.g. from inbox polling)
    useEffect(() => {
        if (initialChat?.id !== chat?.id) {
            setChat(initialChat);
        }
    }, [initialChat, chat?.id]);


    const fetchMessages = useCallback(async () => {
        if (!chat.id) return; // Skip if it's a new unsaved thread
        try {
            // CACHE-BUSTER PROTOCOL: Unique timestamp to bypass every possible intermediate cache
            const cacheBuster = `t=${Date.now()}`;
            const res = await fetch(`${apiUrl}/api/messages/conversations/${chat.id}/messages?${cacheBuster}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                cache: 'no-store'
            });
            const data = await res.json();
            if (data.success) {
                // PRESENCE ACCELERATION: Manifest active only if NOT explicitly offline
                if (chat.user.lastSeen !== null) {
                    const partnerMsgs = data.messages.filter(m => m.userId === chat.user.id);
                    if (partnerMsgs.length > 0) {
                        const latestMsgTime = Math.max(...partnerMsgs.map(m => new Date(m.createdAt).getTime()));
                        const currentSeenTime = new Date(chat.user.lastSeen).getTime();

                        if (latestMsgTime > currentSeenTime && (Date.now() - latestMsgTime) < 60000) {
                            setChat(prev => ({
                                ...prev,
                                user: { ...prev.user, lastSeen: new Date(latestMsgTime).toISOString() }
                            }));
                        }
                    }
                }

                // NEURAL MERGE: Don't let polling overwrite messages we just sent but aren't in the list yet
                setMessages(prev => {
                    const incomingIds = new Set(data.messages.map(m => m.id));

                    const optimisticToKeep = prev.filter(m => {
                        const isSyncing = !incomingIds.has(m.id);
                        const currentUserId = currentUser.id || currentUser.userId;
                        const msgUserId = m.userId || m.user?.id;
                        const isMine = msgUserId == currentUserId;
                        const isRecent = (Date.now() - new Date(m.createdAt).getTime()) < 30000;
                        const isTempId = typeof m.id === 'number' && m.id > 1000000000000;

                        return isSyncing && isMine && (isRecent || isTempId);
                    });

                    const finalMessages = [...data.messages, ...optimisticToKeep].sort((a, b) =>
                        new Date(a.createdAt) - new Date(b.createdAt)
                    );

                    // SMART-RENDER GUARD: Only update state if something actually changed
                    // This prevents lag from high-frequency re-renders when no new content exists
                    const isDifferent = JSON.stringify(finalMessages) !== JSON.stringify(prev);
                    return isDifferent ? finalMessages : prev;
                });

                saveToCache(CACHE_KEY, data.messages);

                // Neural Batch Optimization: Scan for shared posts and fetch them all at once
                const sharedPostIds = [];
                data.messages.forEach(msg => {
                    const match = msg.content.match(/\[POST_SHARE:(\d+)\]/);
                    if (match && !GLOBAL_POST_CACHE[match[1]]) {
                        sharedPostIds.push(match[1]);
                    }
                });

                if (sharedPostIds.length > 0) {
                    await fetchBatchPosts(sharedPostIds, apiUrl, token);
                }

                // NEURAL TYPING CHECK: Sync typing status with the 300ms pulse
                if (data.isTyping !== undefined) {
                    setChat(prev => ({ ...prev, isTyping: data.isTyping }));
                }
            }
        } catch (err) {
            console.error("Fetch Messages Error:", err);
        }
    }, [apiUrl, token, chat.id]);

    // NEURAL STATUS REFRESH: Keep the recipient's status live in the header
    useEffect(() => {
        const refreshStatus = async () => {
            if (!chat.id) return; // Skip if it's a new unsaved thread
            try {
                const res = await fetch(`${apiUrl}/api/messages/conversations`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store'
                });
                const data = await res.json();
                if (data.success) {
                    const currentConv = data.conversations.find(c => c.id === chat.id);
                    if (currentConv && currentConv.user) {
                        setChat(prev => ({
                            ...prev,
                            user: { ...prev.user, lastSeen: currentConv.user.lastSeen },
                            isTyping: currentConv.isTyping
                        }));
                    }
                }
            } catch (err) {
                console.error("Status Refresh Error:", err);
            }
        };

        refreshStatus(); // HYDRATE IMMEDIATELY: No more 5-second stale period
        const interval = setInterval(refreshStatus, 5000);
        return () => clearInterval(interval);
    }, [apiUrl, token, chat.id]);

    useEffect(() => {
        let isActive = true;
        const pulse = async () => {
            if (!isActive) return;
            await fetchMessages();
            // RECURSIVE ULTRA-PULSE: 300ms delay between completions
            if (isActive) setTimeout(pulse, 300);
        };

        pulse();
        return () => { isActive = false; };
    }, [fetchMessages]);

    // NEURAL TYPING ENGINE: Emit signal every 2s while typing
    const lastTypingSent = useRef(0);
    useEffect(() => {
        if (!input.trim() || !chat.id) return;
        const now = Date.now();
        if (now - lastTypingSent.current > 2000) {
            lastTypingSent.current = now;
            fetch(`${apiUrl}/api/messages/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ conversationId: chat.id, isTyping: true })
            }).catch(() => { });
        }
    }, [input, chat.id, apiUrl, token]);

    // flex-col-reverse ensures we stay at the bottom naturally


    const handleSend = async () => {
        if (!input.trim()) return;
        const optimisticMsg = {
            id: Date.now(),
            content: input,
            userId: currentUser.id || currentUser.userId,
            user: currentUser,
            createdAt: new Date()
        };
        setMessages(prev => [...prev, optimisticMsg]);
        const tempInput = input;
        setInput('');

        try {
            const res = await fetch(`${apiUrl}/api/messages/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conversationId: chat.id, // might be null
                    content: tempInput,
                    receiverId: chat.user.id || chat.user.userId
                })
            });
            const data = await res.json();
            if (!data.success) {
                setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
                setInput(tempInput);
            } else {
                // NEURAL PERSISTENCE: Replace optimistic message with actual data immediately
                setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? data.message : m));

                // If this was a new thread, it now has an ID!
                if (!chat.id && data.message.conversationId) {
                    setChat(prev => ({ ...prev, id: data.message.conversationId }));
                }

                // We call fetchMessages for total state sync, but the merge logic will prevent flickering
                fetchMessages();
            }
        } catch (err) {
            console.error("Send Error:", err);
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setInput(tempInput);
        }
    };

    const handleDelete = async (msgId) => {
        try {
            const res = await fetch(`${apiUrl}/api/messages/${msgId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    return (
        <div className="bg-black fixed inset-0 z-[70] flex flex-col text-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-black z-10 backdrop-blur-md bg-opacity-90">
                <div className="flex items-center gap-4">
                    <button onClick={onBack}><ChevronLeft size={28} /></button>
                    <div className="flex items-center gap-3">
                        <ProfileImage
                            src={chat.user.profileImage}
                            username={chat.user.username}
                            size="sm"
                            className="border border-white/5 cursor-pointer"
                            isActive={formatLastActive(chat.user.lastSeen).isActive}
                            onClick={() => onUserProfileClick && onUserProfileClick(chat.user)}
                        />
                        <div className="flex flex-col cursor-pointer" onClick={() => onUserProfileClick && onUserProfileClick(chat.user)}>
                            <span className="text-sm font-bold truncate leading-none">{chat.user.username}</span>
                            {chat.isTyping ? (
                                <div className="flex items-center space-x-1 h-3 mt-1">
                                    <div className="w-1 h-1 bg-[#0095f6] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 bg-[#0095f6] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 bg-[#0095f6] rounded-full animate-bounce"></div>
                                </div>
                            ) : (
                                <span className={`text-[10px] font-medium ${formatLastActive(chat.user.lastSeen).isActive ? "text-emerald-500" : "text-gray-400"}`}>
                                    {formatLastActive(chat.user.lastSeen).text}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <button className="text-white opacity-60 hover:opacity-100 transition-opacity"><Music size={22} /></button>
                    <button className="text-white opacity-60 hover:opacity-100 transition-opacity"><Edit size={22} /></button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse gap-4 bg-gradient-to-b from-black to-[#0a0a0a] scrollbar-hide">
                {/* flex-col-reverse naturally starts at the bottom */}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center py-20 opacity-30 text-center mt-20 flex-1 justify-center rotate-180">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
                            <MessageCircle size={48} className="text-white/50" />
                        </div>
                        <h2 className="font-bold text-lg mb-1">Encrypted Channel</h2>
                        <p className="text-xs px-10 text-gray-400">Messages are end-to-end encrypted within the Neural Hive.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-0 flex-shrink-0" /> {/* Bottom spacer for reverse layout */}
                        {[...messages].reverse().map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.userId === currentUser.id ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                <div className={`flex items-end gap-3 max-w-[88%] group ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                    {msg.userId !== currentUser.id && (
                                        <ProfileImage
                                            src={msg.user.profileImage}
                                            username={msg.user.username}
                                            size="xs"
                                            className="mb-0.5 border-2 border-white/5 shadow-xl ring-1 ring-white/10"
                                        />
                                    )}
                                    <div className="relative">
                                        <div
                                            className={(() => {
                                                const isPostShare = msg.content.includes('[POST_SHARE:');
                                                if (isPostShare) return "relative"; // No background/padding for shares

                                                return `px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.userId === currentUser.id
                                                    ? 'bg-[#1e1e1e] text-white rounded-br-sm border border-white/10 shadow-lg'
                                                    : 'bg-[#262626] text-gray-100 rounded-bl-sm border border-white/5 shadow-md'
                                                    }`;
                                            })()}
                                        >
                                            {(() => {
                                                const postMatch = msg.content.match(/\[POST_SHARE:(\d+)\]/);
                                                const textContent = msg.content.replace(/\[POST_SHARE:\d+\]/, '').trim();

                                                // Filter out legacy "Check out this post" boilerplate
                                                const legacyPattern = /^Check out this post by @\w+!$/;
                                                const isLegacyText = legacyPattern.test(textContent);

                                                if (postMatch) {
                                                    return (
                                                        <div className={`flex flex-col gap-2 ${msg.userId === currentUser.id ? 'items-end' : 'items-start'}`}>
                                                            <SharedPostPreview postId={postMatch[1]} apiUrl={apiUrl} token={token} />
                                                            {textContent && !isLegacyText && (
                                                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.userId === currentUser.id
                                                                    ? 'bg-[#1e1e1e] text-white rounded-br-sm border border-white/10'
                                                                    : 'bg-[#262626] text-gray-100 rounded-bl-sm border border-white/5'
                                                                    }`}>
                                                                    {textContent}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                                return msg.content;
                                            })()}
                                        </div>
                                        {msg.userId === currentUser.id && (
                                            <button
                                                onClick={() => handleDelete(msg.id)}
                                                className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-red-500 hover:bg-white/5 rounded-full"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[9px] text-gray-600 mt-1 px-1 font-medium select-none flex items-center gap-1">
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {msg.userId === currentUser.id && msg.isSeen && (
                                        <span className="text-blue-500 font-bold ml-1">{formatSeenAt(msg.seenAt)}</span>
                                    )}
                                </span>
                            </div>
                        ))}
                    </>
                )}
            </div>

            <div className="p-3 border-t border-white/10 bg-black/80 backdrop-blur-xl pb-6">
                <div className="bg-[#1e1e1e] rounded-[24px] flex items-center px-4 py-1.5 gap-3 border border-white/5 focus-within:border-white/10 transition-colors shadow-lg">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all">
                        <Camera size={18} />
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Message..."
                        className="bg-transparent text-white placeholder-gray-500 text-[15px] w-full focus:outline-none py-2.5"
                    />
                    {input.trim() ? (
                        <button
                            onClick={handleSend}
                            className="text-white font-bold text-sm px-3 py-1 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors animate-in zoom-in"
                        >
                            Send
                        </button>
                    ) : (
                        <div className="flex gap-4 px-2 text-gray-500">
                            <Music size={22} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
                            <Plus size={22} className="opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileInbox;
