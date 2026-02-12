import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Download, Trash2, X, Flag, AlertTriangle, Share2 } from 'lucide-react';
import Cookies from 'js-cookie';

const MobilePostOptionsModal = ({ post, isOpen, onClose, onDelete, currentUser }) => {
    if (!post) return null;

    // Robust ID comparison (handle string/number mismatch)
    const isOwner = React.useMemo(() => {
        if (!currentUser) return false;
        const currentId = String(currentUser.id || currentUser.userId);
        const postUserId = String(post.user?.id || post.user?.userId);
        return currentId === postUserId;
    }, [currentUser, post]);

    const [isDeleting, setIsDeleting] = useState(false);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/post/${post.id}`;
        navigator.clipboard.writeText(link);
        alert("Link copied to clipboard!");
        onClose();
    };

    const handleDownload = async () => {
        try {
            const response = await fetch(post.mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `synapse_${post.id}_${Date.now()}.${post.type === 'VIDEO' ? 'mp4' : 'jpg'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            onClose();
        } catch (e) {
            console.error("Download failed", e);
            // Fallback
            window.open(post.mediaUrl, '_blank');
            onClose();
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;

        setIsDeleting(true);
        try {
            await onDelete(post.id);
            onClose();
        } catch (error) {
            console.error("Delete failed", error);
            setIsDeleting(false);
            alert("Failed to delete post. Please try again.");
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
                    />

                    {/* Modal Sheet */}
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] rounded-t-[2rem] z-[61] overflow-hidden border-t border-white/10"
                    >
                        <div className="flex justify-center pt-3 pb-2">
                            <div className="w-10 h-1 bg-gray-600 rounded-full" />
                        </div>

                        <div className="p-6 space-y-2">
                            {/* Actions */}
                            <div className="bg-[#2a2a2a] rounded-xl overflow-hidden divide-y divide-white/5">
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full p-4 flex items-center gap-3 text-white active:bg-white/5 transition-colors"
                                >
                                    <Copy size={20} />
                                    <span className="font-medium text-sm">Copy Link</span>
                                </button>

                                <button
                                    onClick={handleDownload}
                                    className="w-full p-4 flex items-center gap-3 text-white active:bg-white/5 transition-colors"
                                >
                                    <Download size={20} />
                                    <span className="font-medium text-sm">Download</span>
                                </button>

                                <button
                                    className="w-full p-4 flex items-center gap-3 text-white active:bg-white/5 transition-colors"
                                    onClick={() => { alert("Sharing coming soon!"); onClose(); }}
                                >
                                    <Share2 size={20} />
                                    <span className="font-medium text-sm">Share...</span>
                                </button>

                                {isOwner ? (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="w-full p-4 flex items-center gap-3 text-red-500 active:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={20} />
                                        <span className="font-medium text-sm">{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                                    </button>
                                ) : (
                                    <button
                                        className="w-full p-4 flex items-center gap-3 text-red-400 active:bg-red-500/10 transition-colors"
                                        onClick={() => { alert("Reported to admin."); onClose(); }}
                                    >
                                        <Flag size={20} />
                                        <span className="font-medium text-sm">Report</span>
                                    </button>
                                )}
                            </div>

                            {/* Cancel Button */}
                            <button
                                onClick={onClose}
                                className="w-full p-4 bg-[#2a2a2a] rounded-xl text-white font-bold text-sm active:scale-98 transition-transform mt-4"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="pb-safe h-6" /> {/* Safe area padding */}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobilePostOptionsModal;
