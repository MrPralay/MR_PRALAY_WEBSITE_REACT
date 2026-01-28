import React, { useState } from 'react';
import { X, Image as ImageIcon, Send, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePostModal = ({ isOpen, onClose, onSubmit, user }) => {
    const [caption, setCaption] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageUrl) return;

        setIsSubmitting(true);
        try {
            await onSubmit({ caption, imageUrl });
            setCaption('');
            setImageUrl('');
            onClose();
        } catch (err) {
            console.error("Post Creation Failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <h2 className="text-white text-xl font-bold flex items-center gap-2">
                                <ShieldCheck className="text-emerald-500" size={24} />
                                New Neural Synapse
                            </h2>
                            <button
                                onClick={onClose}
                                className="text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            {/* User Info */}
                            <div className="flex items-center gap-3 mb-6">
                                <img
                                    src={user?.profileImage || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                                    className="w-10 h-10 rounded-full border border-white/10"
                                    alt={user?.username}
                                />
                                <div>
                                    <p className="text-white text-sm font-bold">{user?.username || "Quantum User"}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active Link</p>
                                </div>
                            </div>

                            {/* Caption Input */}
                            <textarea
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="What's happening in your segment of the network?"
                                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-4 h-32"
                            />

                            {/* Image URL Input */}
                            <div className="relative mb-6">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                                    <ImageIcon size={20} />
                                </div>
                                <input
                                    type="url"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    placeholder="Paste Neural Visual URL (Image URL)"
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    required
                                />
                            </div>

                            {/* Preview (if URL exists) */}
                            {imageUrl && (
                                <div className="mb-6 aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                                    <img
                                        src={imageUrl}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = "https://via.placeholder.com/1080x720/0a0a0a/555555?text=Invalid+Visual+Link";
                                        }}
                                    />
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !imageUrl}
                                className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${isSubmitting || !imageUrl
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Synchronizing...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Initiate Broadcast
                                    </>
                                )}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreatePostModal;
