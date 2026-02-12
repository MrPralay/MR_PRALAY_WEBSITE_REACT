import React, { useState } from 'react';
import {
    User, Shield, Eye, TrendingUp, Zap, Bell, Palette,
    Download, Globe, ChevronRight, ChevronLeft, LogOut,
    Sparkles, Key, Mail, ShieldCheck, CreditCard, Activity,
    EyeOff, Ghost, CheckCheck, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MobileSettings = ({ user, onUpdateUser, onLogout, onBack }) => {
    const [activeSection, setActiveSection] = useState(null);

    const menuItems = [
        { id: 'profile', label: 'Professional Deck', icon: <Sparkles size={20} />, description: 'Creator tools and professional signals', color: 'text-emerald-500' },
        { id: 'security', label: 'Security Core', icon: <Shield size={20} />, description: 'Passwords, OTP and Login activity', color: 'text-blue-500' },
        { id: 'privacy', label: 'Privacy Link', icon: <Eye size={20} />, description: 'Manage account visibility', color: 'text-purple-500' },
        { id: 'analytics', label: 'Neural Analytics', icon: <TrendingUp size={20} />, description: 'Track resonance and frequency', color: 'text-amber-500' },
        { id: 'advanced', label: 'Advanced Protocols', icon: <Zap size={20} />, description: 'Quantum decay and neural guardian', color: 'text-red-500' },
        { id: 'notifications', label: 'Notification Pulse', icon: <Bell size={20} />, description: 'Configure alerts and neural pings', color: 'text-indigo-500' },
        { id: 'interface', label: 'Neural Interface', icon: <Palette size={20} />, description: 'Customize glow levels', color: 'text-pink-500' },
        { id: 'help', label: 'System Support', icon: <Globe size={20} />, description: 'Documentation and assistance', color: 'text-cyan-500' },
    ];

    return (
        <div className="bg-black min-h-screen text-white pb-20">
            <AnimatePresence mode="wait">
                {!activeSection ? (
                    <motion.div
                        key="main-menu"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-6"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 mb-10 mt-2">
                            <button onClick={onBack} className="p-2 -ml-2">
                                <ChevronLeft size={28} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">System Configuration</p>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-4">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className="w-full flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem] active:scale-[0.98] transition-all group"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`p-3 rounded-2xl bg-white/5 ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{item.label}</p>
                                            <p className="text-[10px] text-gray-500 line-clamp-1">{item.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-600" />
                                </button>
                            ))}

                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-4 p-5 bg-red-500/5 border border-red-500/10 rounded-[2rem] text-red-500 active:scale-[0.98] transition-all mt-8"
                            >
                                <div className="p-3 rounded-2xl bg-red-500/10">
                                    <LogOut size={20} />
                                </div>
                                <span className="font-bold text-sm uppercase tracking-widest">Sever Connection</span>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="section"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-6"
                    >
                        {/* Section Header */}
                        <div className="flex items-center gap-4 mb-10 mt-2">
                            <button onClick={() => setActiveSection(null)} className="p-2 -ml-2">
                                <ChevronLeft size={28} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    {menuItems.find(m => m.id === activeSection)?.label}
                                </h1>
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                                {menuItems.find(m => m.id === activeSection)?.icon}
                            </div>
                            <h3 className="text-lg font-bold uppercase tracking-widest mb-2">Accessing Neural Core</h3>
                            <p className="text-xs max-w-[200px]">This protocol is being optimized for mobile broadcast.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MobileSettings;
