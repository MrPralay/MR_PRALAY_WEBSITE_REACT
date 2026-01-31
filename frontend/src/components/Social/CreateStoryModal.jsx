import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CreateStoryModal = ({ isOpen, onClose, onSubmit, user }) => {
    const [step, setStep] = useState(1); // 1: Select Media, 2: Preview
    const [mediaUrl, setMediaUrl] = useState('');
    const [type, setType] = useState('IMAGE');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [rawMedia, setRawMedia] = useState(null);

    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (!file) return;

        const isVideo = file.type.startsWith('video/');
        setType(isVideo ? 'VIDEO' : 'IMAGE');

        setRawMedia(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setMediaUrl(e.target.result);
            setStep(2);
        };
        reader.readAsDataURL(file);
    };

    const handleDrag = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = async () => {
        if (!mediaUrl) return;

        setIsSubmitting(true);
        try {
            const success = await onSubmit({
                mediaUrl,
                type,
                rawFile: rawMedia
            });

            if (success) {
                onClose();
                setStep(1);
                setMediaUrl('');
                setRawMedia(null);
            } else {
                alert("Neural link unstable: Upload failed. Check your connection or file size.");
            }
        } catch (err) {
            console.error("Story Upload Error", err);
            alert("Neural crash: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Content - Mobile First Full Screen */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        className="relative w-full md:max-w-md h-full md:h-[90vh] bg-[#111] border border-white/10 md:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="absolute top-0 left-0 right-0 z-20 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                            <button onClick={step === 1 ? onClose : () => setStep(1)} className="text-white hover:text-emerald-500 transition-colors">
                                {step === 1 ? <X size={28} /> : <ArrowLeft size={28} />}
                            </button>
                            {step === 2 && (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-emerald-500 text-black px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Share"}
                                </button>
                            )}
                        </div>

                        {/* Step 1: Upload */}
                        {step === 1 && (
                            <div
                                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                onClick={() => fileInputRef.current.click()}
                                className={`flex-1 flex flex-col items-center justify-center cursor-pointer transition-all ${dragActive ? 'bg-emerald-500/10' : ''}`}
                            >
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFile(e.target.files[0])} accept="image/*,video/*" />
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 group-hover:border-emerald-500/50 transition-all">
                                    <Upload className="text-emerald-500" size={32} />
                                </div>
                                <h3 className="text-white text-lg font-bold">Add to Story</h3>
                                <p className="text-gray-500 text-xs mt-2">Photos or Videos</p>
                            </div>
                        )}

                        {/* Step 2: Preview */}
                        {step === 2 && (
                            <div className="relative w-full h-full bg-black flex items-center justify-center">
                                {type === 'VIDEO' ? (
                                    <video src={mediaUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                ) : (
                                    <img src={mediaUrl} className="w-full h-full object-cover" alt="Story Preview" />
                                )}

                                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                                    <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
                                        <img src={user?.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"} className="w-6 h-6 rounded-full border border-white/20" alt="me" />
                                        <span className="text-white text-xs font-bold">Your Story</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreateStoryModal;
