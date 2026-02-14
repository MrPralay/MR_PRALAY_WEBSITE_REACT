import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Send, CheckCircle2 } from 'lucide-react';
import Cookies from 'js-cookie';

const SharePostModal = ({ isOpen, onClose, post, currentUser }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const apiUrl = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token') || localStorage.getItem('synapse_token');

    useEffect(() => {
        if (isOpen) {
            fetchRecentUsers();
        } else {
            // Reset state on close
            setSearchQuery('');
            setSelectedUsers([]);
            setSent(false);
            setSending(false);
        }
    }, [isOpen]);

    const fetchRecentUsers = async () => {
        setLoading(true);
        try {
            // We can fetch suggested users as a baseline for "real users"
            const response = await fetch(`${apiUrl}/api/user/suggested?limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (err) {
            console.error("Fetch users error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            if (query.trim().length === 0) fetchRecentUsers();
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/user/search?q=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.data);
            }
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        if (sent) return;
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSend = async () => {
        if (selectedUsers.length === 0 || sending || sent) return;

        // Lightning Send: Show success state immediately
        setSending(true);
        setSent(true);

        // Neural Sync: Force inbox to refresh by marking cache as stale
        try {
            const raw = localStorage.getItem('synapse_neural_cache_inbox_main_data');
            if (raw) {
                const packet = JSON.parse(raw);
                packet.data.lastFetched = 0; // Force immediate re-fetch
                localStorage.setItem('synapse_neural_cache_inbox_main_data', JSON.stringify(packet));
            }
        } catch (e) {
            console.warn("Neural Sync Error:", e);
        }

        // Fast Close: Close modal while requests run in background
        setTimeout(() => onClose(), 400);

        try {
            const shareContent = `[POST_SHARE:${post.id}]`;

            // Execute in background
            const sendPromises = selectedUsers.map(receiverId =>
                fetch(`${apiUrl}/api/messages/send`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        receiverId,
                        content: shareContent
                    })
                })
            );

            await Promise.all(sendPromises);
        } catch (err) {
            console.error("Background share error:", err);
            // Non-blocking error
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-[#121212] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 mb-1" />

                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                    <h2 className="text-lg font-bold">Share to</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="px-6 py-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search names or usernames"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto px-2 pb-24">
                    {loading && users.length === 0 ? (
                        <div className="flex justify-center py-20">
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {users.map(user => (
                                <div
                                    key={user.id}
                                    onClick={() => toggleUserSelection(user.id)}
                                    className={`flex items-center justify-between p-4 rounded-3xl transition-all cursor-pointer ${selectedUsers.includes(user.id) ? 'bg-blue-500/10' : 'hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-gray-800">
                                            <img
                                                src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
                                                className="w-full h-full object-cover"
                                                alt={user.username}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{user.username}</span>
                                            <span className="text-gray-500 text-xs">{user.name || "Synapse User"}</span>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUsers.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                                        {selectedUsers.includes(user.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Send size={12} className="text-white" /></motion.div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Action */}
                <AnimatePresence>
                    {(selectedUsers.length > 0 || sent) && (
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent"
                        >
                            <button
                                onClick={handleSend}
                                disabled={sending || sent}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${sent ? 'bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'}`}
                            >
                                {sending ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : sent ? (
                                    <><CheckCircle2 size={20} /> Sent!</>
                                ) : (
                                    <>Send to {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}</>
                                )}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default SharePostModal;
