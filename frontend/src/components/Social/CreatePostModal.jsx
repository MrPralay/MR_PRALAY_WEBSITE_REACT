import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Send, ShieldCheck, Loader2, Lock, Unlock, Upload, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreatePostModal = ({ isOpen, onClose, onSubmit, user }) => {
    const [caption, setCaption] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [type, setType] = useState('IMAGE'); // IMAGE or VIDEO
    const [postPassword, setPostPassword] = useState('');
    const [isProtected, setIsProtected] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [uploadPreview, setUploadPreview] = useState(null);

    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;

        // Detect type
        const isVideo = file.type.startsWith('video/');
        setType(isVideo ? 'VIDEO' : 'IMAGE');

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadPreview(e.target.result);
            setMediaUrl(e.target.result); // In a real app, you'd upload this to R2/Cloudinary
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mediaUrl) return;

        setIsSubmitting(true);
        try {
            const success = await onSubmit({
                caption,
                mediaUrl,
                type,
                postPassword: isProtected ? postPassword : null
            });

            if (success) {
                resetForm();
                onClose();
            } else {
                alert("Neural Broadcast Rejected. Image might be too large for the current link (Cloudflare limit). Please try a smaller file or a URL.");
            }
        } catch (err) {
            alert("Broadcast interruption detected.");
            console.error("Neural Broadcast Failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setCaption('');
        setMediaUrl('');
        setUploadPreview(null);
        setIsProtected(false);
        setPostPassword('');
        setType('IMAGE');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className="relative w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
                            <div>
                                <h2 className="text-white text-2xl font-bold flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <ShieldCheck className="text-emerald-500" size={24} />
                                    </div>
                                    Neural Broadcast
                                </h2>
                                <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide">SECURE UPLOAD • SECTOR 7G</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 max-h-[80vh] overflow-y-auto hide-scrollbar">
                            {/* Media Type Toggle */}
                            <div className="flex gap-4 mb-8">
                                <button
                                    type="button"
                                    onClick={() => setType('IMAGE')}
                                    className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] ${type === 'IMAGE'
                                        ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                        }`}
                                >
                                    <ImageIcon size={18} /> Image
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('VIDEO')}
                                    className={`flex-1 py-4 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-[0.2em] ${type === 'VIDEO'
                                        ? 'bg-emerald-500 border-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                        : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                                        }`}
                                >
                                    <Video size={18} /> Video/Reel
                                </button>
                            </div>

                            {/* Dropzone / Preview */}
                            {!uploadPreview ? (
                                <div
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current.click()}
                                    className={`relative mb-8 aspect-video rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer group ${dragActive
                                        ? 'border-emerald-500 bg-emerald-500/5'
                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => handleFile(e.target.files[0])}
                                        accept={type === 'IMAGE' ? "image/*" : "video/*"}
                                    />
                                    <div className="p-6 bg-white/5 rounded-full mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="text-emerald-500" size={32} />
                                    </div>
                                    <h3 className="text-white font-bold mb-1">Upload from Storage</h3>
                                    <p className="text-gray-500 text-xs text-center px-10">
                                        Drag and drop your neural visual or click to browse files
                                    </p>

                                    <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                        <Monitor size={12} /> MAX 50MB
                                    </div>
                                </div>
                            ) : (
                                <div className="relative mb-8 aspect-video rounded-3xl overflow-hidden border border-white/10 group">
                                    {type === 'IMAGE' ? (
                                        <img src={uploadPreview} className="w-full h-full object-cover" alt="Preview" />
                                    ) : (
                                        <video src={uploadPreview} className="w-full h-full object-cover" controls />
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setUploadPreview(null)}
                                        className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Caption Section */}
                            <div className="mb-8">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-2 mb-3 block">Neural Context</label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write a caption for this synapse..."
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-6 text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/30 transition-all resize-none h-32 text-sm leading-relaxed"
                                />
                            </div>

                            {/* Password Protection */}
                            <div className="mb-10 p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl transition-colors ${isProtected ? 'bg-amber-500/10 text-amber-500' : 'bg-white/5 text-gray-500'}`}>
                                            {isProtected ? <Lock size={18} /> : <Unlock size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-bold">Secure Broadcast</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Password protect this neural segment</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsProtected(!isProtected)}
                                        className={`w-12 h-6 rounded-full relative transition-colors ${isProtected ? 'bg-emerald-500' : 'bg-white/10'}`}
                                    >
                                        <motion.div
                                            animate={{ x: isProtected ? 24 : 4 }}
                                            className="w-4 h-4 bg-white rounded-full absolute top-1"
                                        />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isProtected && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <input
                                                type="text"
                                                value={postPassword}
                                                onChange={(e) => setPostPassword(e.target.value)}
                                                placeholder="Enter access key for this synapse..."
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 px-5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all mt-2 font-mono text-sm tracking-widest"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Actions */}
                            <button
                                type="submit"
                                disabled={isSubmitting || !mediaUrl}
                                className={`w-full py-5 rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${isSubmitting || !mediaUrl
                                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed border border-white/5'
                                    : 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-[1.02] active:scale-[0.98]'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Transmitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Initiate Post
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
