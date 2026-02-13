import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Heart, Reply, MessageSquare } from 'lucide-react';
import Cookies from 'js-cookie';

const PremiumIcon = ({ Icon, active, activeColor, glowColor, size = 20, onClick, className = "" }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={onClick}
            className={`relative flex items-center justify-center transition-all duration-300 ${className}`}
        >
            <Icon
                size={size}
                strokeWidth={1.5}
                className={`transition-all duration-300 ${active ? activeColor : "text-white/80"}`}
                fill={active ? "currentColor" : "none"}
                style={{
                    filter: active ? `drop-shadow(0 0 8px ${glowColor})` : 'none'
                }}
            />
        </motion.button>
    );
};

const CommentItem = ({ comment, onReply, isReply = false }) => {
    const [isLiked, setIsLiked] = useState(comment.isLiked || false);
    const [likeCount, setLikeCount] = useState(comment._count?.likes || 0);

    // Sync state with props when they change (e.g. on reopen/refresh)
    useEffect(() => {
        setIsLiked(comment.isLiked || false);
        setLikeCount(comment._count?.likes || 0);
    }, [comment.isLiked, comment._count?.likes]);

    const handleLike = async () => {
        const token = Cookies.get('synapse_token');
        const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";

        // Optimistic UI
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        try {
            await fetch(`${apiUrl}/api/social/comments/${comment.id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            // Revert on error
            setIsLiked(!newIsLiked);
            setLikeCount(prev => !newIsLiked ? prev + 1 : prev - 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex gap-3 ${isReply ? 'ml-10 mt-2' : 'mt-4'}`}
        >
            <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full overflow-hidden border border-white/10 bg-gray-900 flex-shrink-0`}>
                <img
                    src={comment.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username}`}
                    alt="avatar"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-white">{comment.user?.username}</span>
                            <span className="text-[10px] text-gray-500 font-medium">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-[12px] text-gray-200 mt-1 leading-relaxed">
                            {comment.content}
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                        <PremiumIcon
                            Icon={Heart}
                            size={14}
                            active={isLiked}
                            activeColor="text-red-500"
                            glowColor="rgba(239, 68, 68, 0.4)"
                            onClick={handleLike}
                        />
                        {likeCount > 0 && (
                            <span className="text-[9px] text-gray-500 font-bold">{likeCount}</span>
                        )}
                    </div>
                </div>
                {!isReply && (
                    <button
                        onClick={() => onReply(comment)}
                        className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500 font-bold hover:text-white transition-colors"
                    >
                        <Reply size={12} strokeWidth={2.5} />
                        REPLY
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const CommentOverlay = ({ isOpen, onClose, postId, postUser, commentCount, onCommentCountChange }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [expandedThreads, setExpandedThreads] = useState(new Set());
    const inputRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchComments();
            // Focus input if replying or just opening
            if (!replyingTo) setTimeout(() => inputRef.current?.focus(), 500);
        }
    }, [isOpen, postId]);

    const fetchComments = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
            const response = await fetch(`${apiUrl}/api/social/posts/${postId}/comments`);
            const data = await response.json();
            setComments(data);
            if (onCommentCountChange) {
                onCommentCountChange(data.length, data);
            }
        } catch (err) {
            console.error("Failed to fetch comments", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        const token = Cookies.get('synapse_token');
        const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";

        try {
            const response = await fetch(`${apiUrl}/api/social/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newComment,
                    parentId: replyingTo?.id
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            if (result.success) {
                const updatedComments = [...comments, result.data];
                setComments(updatedComments);
                setNewComment("");
                setReplyingTo(null);

                // Notify parent of total count and current previews
                if (onCommentCountChange) {
                    onCommentCountChange(updatedComments.length, updatedComments);
                }

                // Scroll to bottom
                setTimeout(() => {
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
                }, 100);
            }
        } catch (err) {
            console.error("Comment submission failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleThread = (threadId) => {
        setExpandedThreads(prev => {
            const next = new Set(prev);
            if (next.has(threadId)) next.delete(threadId);
            else next.add(threadId);
            return next;
        });
    };

    // Organize comments into threads
    const threads = comments.reduce((acc, comment) => {
        if (!comment.parentId) {
            acc[comment.id] = { ...comment, replies: [] };
        } else {
            if (acc[comment.parentId]) {
                acc[comment.parentId].replies.push(comment);
            }
        }
        return acc;
    }, {});

    const sortedThreads = Object.values(threads).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 h-[80vh] bg-[#0a0a0a] rounded-t-[2.5rem] z-[101] flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Handle */}
                        <div className="w-full flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 flex items-center justify-between pb-4 border-b border-white/5">
                            <div className="flex flex-col">
                                <h3 className="text-lg font-bold tracking-tight">Synapses</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Neural Broadcast Discussion</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 text-gray-400 active:scale-90 transition-transform"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Comments Body */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide"
                        >
                            {loading ? (
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-[11px] text-gray-500 font-bold tracking-[0.1em]">SYNCHRONIZING...</p>
                                </div>
                            ) : sortedThreads.length > 0 ? (
                                sortedThreads.map((thread) => (
                                    <div key={thread.id}>
                                        <CommentItem
                                            comment={thread}
                                            onReply={(c) => {
                                                setReplyingTo(c);
                                                inputRef.current?.focus();
                                            }}
                                        />
                                        <div className="space-y-1">
                                            {(expandedThreads.has(thread.id) ? thread.replies : thread.replies.slice(0, 2)).map(reply => (
                                                <CommentItem key={reply.id} comment={reply} isReply />
                                            ))}
                                            {thread.replies.length > 2 && !expandedThreads.has(thread.id) && (
                                                <button
                                                    onClick={() => toggleThread(thread.id)}
                                                    className="ml-10 mt-2 text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors uppercase tracking-wider"
                                                >
                                                    View all {thread.replies.length} replies...
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <MessageSquare size={32} className="text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium">No synapses yet.</p>
                                    <p className="text-[10px] mt-1 text-gray-500 uppercase font-bold tracking-widest">Be the first to respond.</p>
                                </div>
                            )}
                        </div>

                        {/* Input Footer */}
                        <div className="p-4 bg-black/80 backdrop-blur-xl border-t border-white/5 pb-safe">
                            {replyingTo && (
                                <div className="flex items-center justify-between px-2 py-2 mb-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <p className="text-[11px] text-emerald-400 font-medium">
                                        Replying to <span className="font-bold">@{replyingTo.user?.username}</span>
                                    </p>
                                    <button onClick={() => setReplyingTo(null)} className="text-emerald-400">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                            <form
                                onSubmit={handleSubmit}
                                className="relative flex items-center gap-3 bg-white/5 rounded-2xl p-2 pl-4 border border-white/10"
                            >
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={replyingTo ? "Neural reply..." : "Add synapse..."}
                                    className="flex-1 bg-transparent border-none outline-none text-[13px] py-2 text-white placeholder:text-gray-600"
                                />
                                <button
                                    type="submit"
                                    disabled={!newComment.trim() || isSubmitting}
                                    className={`p-2 rounded-xl transition-all ${newComment.trim() ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-white/5 text-gray-600'}`}
                                >
                                    <Send size={18} strokeWidth={2.5} />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommentOverlay;
