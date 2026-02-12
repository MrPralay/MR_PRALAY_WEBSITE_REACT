import React from 'react';
import { motion } from 'framer-motion';
import { Target, Shield, Zap, Globe, X } from 'lucide-react';

// Import Assets (Adjusted path for mobile directory)
import bgImage from '../../assets/dark_floating_pyramids_bg.png';

const LandingPageMobile = ({ onLogin, onRegister, onExit }) => {
    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-start p-6 overflow-hidden bg-black text-white">
            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
                <img
                    src={bgImage}
                    alt="background"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Global Exit Button */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={onExit}
                className="absolute top-6 left-6 z-50 p-2 rounded-full bg-white/5 active:bg-white/10 text-white border border-white/10 backdrop-blur-md"
                title="Exit Neural Gateway"
            >
                <X size={20} />
            </motion.button>

            {/* Content Container */}
            <div className="z-10 w-full flex flex-col items-center pt-20 pb-10">
                {/* Header/Logo section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center gap-3 mb-8"
                >
                    <div className="p-3 rounded-full bg-emerald-500/20">
                        <Target className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tighter">SynapseX</h1>
                </motion.div>

                {/* Main Hero Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full text-center space-y-6"
                >
                    <h2 className="text-4xl font-bold leading-tight">
                        The World's Most <span className="text-emerald-500">Secure</span> Neural Gateway
                    </h2>
                    <p className="text-base text-gray-400 max-w-sm mx-auto">
                        Experience the next generation of digital identity. SynapseX uses advanced behavioral AI.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto pt-4">
                        <button
                            onClick={onLogin}
                            className="w-full py-4 bg-emerald-500 text-black font-bold rounded-xl active:bg-emerald-400 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        >
                            Access Neural Hub
                        </button>
                        <button
                            onClick={onRegister}
                            className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl active:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
                        >
                            Initialize Identity
                        </button>
                    </div>
                </motion.div>

                {/* Feature Cards Grid (Scrollable or Stacked) */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full grid grid-cols-1 gap-3 mt-12"
                >
                    {[
                        { icon: <Shield className="w-5 h-5 text-emerald-500" />, title: "Quantum Security", desc: "Military-grade encryption." },
                        { icon: <Zap className="w-5 h-5 text-emerald-500" />, title: "Instant Sync", desc: "Real-time authentication." },
                        { icon: <Globe className="w-5 h-5 text-emerald-500" />, title: "Global Uplink", desc: "Access from any node." },
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                {feature.icon}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-sm">{feature.title}</h3>
                                <p className="text-xs text-gray-500">{feature.desc}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Footer simple */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="mt-12 text-[10px] text-gray-700 uppercase tracking-widest font-bold text-center"
                >
                    <p>© 2026 SynapseX Neural Research Lab</p>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPageMobile;
