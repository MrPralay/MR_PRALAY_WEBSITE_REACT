import React, { useState, useEffect } from 'react';
import {
    User, Lock, Mail, Shield, Monitor, Zap, Download,
    Bell, Eye, Trash2, Smartphone, Globe, Palette,
    ChevronRight, Key, ShieldCheck, CreditCard, ChevronLeft,
    LogOut, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

const SettingsView = ({ user, onUpdateUser, onLogout }) => {
    const [activeSection, setActiveSection] = useState('profile');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        isPrivate: user.isPrivate || false
    });

    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: '',
    });
    const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

    const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token');

    // Vital Sync: Fetch latest user data on mount if email or isPrivate is missing
    useEffect(() => {
        const syncIdentity = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${apiUrl}/api/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setFormData({
                        name: data.user.name || '',
                        username: data.user.username || '',
                        email: data.user.email || '',
                        bio: data.user.bio || '',
                        isPrivate: data.user.isPrivate || false
                    });
                    onUpdateUser(data.user);
                }
            } catch (err) {
                console.error("Identity Sync Failed", err);
            }
        };
        syncIdentity();
    }, []);

    const menuItems = [
        { id: 'profile', label: 'Neural Identity', icon: <User size={20} />, description: 'Edit your core profile and bio' },
        { id: 'security', label: 'Security Core', icon: <Shield size={20} />, description: 'Passwords, OTP and Login activity' },
        { id: 'privacy', label: 'Privacy Link', icon: <Eye size={20} />, description: 'Manage account visibility and status' },
        { id: 'interface', label: 'Neural Interface', icon: <Palette size={20} />, description: 'Customize glow levels and glass intensity' },
        { id: 'data', label: 'Archive & Synapses', icon: <Download size={20} />, description: 'Download your data or clear activity' },
    ];

    const showStatus = (type, text) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/user/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                onUpdateUser(data.data);
                showStatus('success', 'Neural Identity Synchronized Successfully');
            } else {
                showStatus('error', data.error || 'Sync Failed');
            }
        } catch (err) {
            showStatus('error', 'Sync Failed: Connection Severed');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email || user.email })
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                showStatus('success', 'OTP Transmitted to your Neural Mail');
            } else {
                showStatus('error', data.error || 'Transmission Failed');
            }
        } catch (err) {
            showStatus('error', 'Transmission Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...otpDigits];
        newDigits[index] = value.slice(-1);
        setOtpDigits(newDigits);

        // Auto focus next
        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 4);
        if (!/^\d+$/.test(data)) return;
        const newDigits = [...otpDigits];
        data.split('').forEach((char, i) => {
            if (i < 4) newDigits[i] = char;
        });
        setOtpDigits(newDigits);
        // Focus last or next available
        const targetIdx = data.length < 4 ? data.length : 3;
        document.getElementById(`otp-${targetIdx}`)?.focus();
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const combinedOtp = otpDigits.join('');
        if (combinedOtp.length < 4) {
            showStatus('error', 'Incomplete Neural Code');
            return;
        }
        if (passwordData.new !== passwordData.confirm) {
            showStatus('error', 'Neural Mismatch: Passwords do not align');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email || user.email,
                    otp: combinedOtp,
                    newPassword: passwordData.new
                })
            });
            const data = await res.json();
            if (data.success) {
                showStatus('success', 'Neural Key Recalibrated');
                setOtpSent(false);
                setOtpDigits(['', '', '', '']);
                setPasswordData({ current: '', new: '', confirm: '' });
            } else {
                showStatus('error', data.error || 'Recalibration Failed');
            }
        } catch (err) {
            showStatus('error', 'Recalibration Failed: Connection Error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[85vh] max-w-7xl mx-auto bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative">
            {/* Status Messages */}
            <AnimatePresence>
                {statusMsg.text && (
                    <motion.div
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`fixed top-12 left-1/2 -translate-x-1/2 z-[2000] px-8 py-4 rounded-2xl flex items-center gap-4 backdrop-blur-xl border shadow-2xl ${statusMsg.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        {statusMsg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{statusMsg.text}</span>
                        <X size={16} className="cursor-pointer hover:rotate-90 transition-transform" onClick={() => setStatusMsg({ type: '', text: '' })} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sidebar Navigation */}
            <div className="w-full lg:w-80 bg-white/[0.02] border-r border-white/5 p-8 flex flex-col gap-10">
                <div className="flex items-center gap-4 px-2">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                        <Monitor size={24} />
                    </div>
                    <div>
                        <h2 className="text-white font-bold tracking-tight">Command Center</h2>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">System Configuration</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setIsTransitioning(true);
                                setActiveSection(item.id);
                            }}
                            className={`w-full group relative flex items-center gap-4 p-4 rounded-2xl transition-all ${activeSection === item.id ? 'bg-emerald-500/10 shadow-inner' : 'hover:bg-white/5'
                                }`}
                        >
                            {activeSection === item.id && (
                                <motion.div
                                    layoutId="active-bg"
                                    className="absolute inset-0 bg-emerald-500/5 rounded-2xl border border-emerald-500/10"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <div className={`relative z-10 ${activeSection === item.id ? 'text-emerald-500' : 'text-gray-500 group-hover:text-white'}`}>
                                {item.icon}
                            </div>
                            <div className="relative z-10 text-left">
                                <p className={`text-xs font-bold transition-colors ${activeSection === item.id ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                    {item.label}
                                </p>
                            </div>
                        </button>
                    ))}
                </nav>

                <div className="pt-6 border-t border-white/5">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all group"
                    >
                        <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sever Connection</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-black relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="p-10 md:p-16 h-full overflow-y-auto hide-scrollbar"
                        layout
                    >
                        {activeSection === 'profile' && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                                className="space-y-12"
                            >
                                <section>
                                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-2xl font-bold text-white mb-8 tracking-tight">Neural Identity Edit</motion.h3>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Designation</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all"
                                                    placeholder="Your Name"
                                                />
                                            </motion.div>
                                            <motion.div variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }} className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Unique Username</label>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all"
                                                    placeholder="username"
                                                />
                                            </motion.div>
                                        </div>
                                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Neural Bio</label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all resize-none"
                                                placeholder="Enter your profile description..."
                                            />
                                        </motion.div>
                                        <motion.button
                                            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
                                            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
                                            whileActive={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={loading}
                                            className="px-12 py-4 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-50"
                                        >
                                            {loading ? 'Synchronizing...' : 'Save Changes'}
                                        </motion.button>
                                    </form>
                                </section>
                            </motion.div>
                        )}

                        {activeSection === 'security' && (
                            <motion.div
                                initial="hidden" animate="visible"
                                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                                className="space-y-12"
                            >
                                <section>
                                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-2xl font-bold text-white mb-8 tracking-tight">Security Core</motion.h3>

                                    <div className="space-y-6">
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col items-center gap-8 group">
                                            <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                                    <Key size={30} />
                                                </div>
                                                <div className="flex-1 text-center md:text-left">
                                                    <h4 className="text-white font-bold text-lg mb-1">Update Neural Key</h4>
                                                    <p className="text-gray-500 text-xs font-medium">Reset your encrypted login credentials</p>
                                                </div>
                                                {!otpSent && (
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileActive={{ scale: 0.95 }}
                                                        onClick={handleRequestOTP}
                                                        disabled={loading}
                                                        className="px-8 py-3 bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                                                    >
                                                        {loading ? 'Initializing...' : 'Initialize Reset'}
                                                    </motion.button>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {otpSent && (
                                                    <motion.form
                                                        initial={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
                                                        animate={{ opacity: 1, height: 'auto', filter: 'blur(0px)' }}
                                                        exit={{ opacity: 0, height: 0, filter: 'blur(10px)' }}
                                                        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                                                        onSubmit={handleResetPassword}
                                                        className="w-full space-y-8 pt-8 border-t border-white/5 overflow-hidden"
                                                    >
                                                        <motion.div
                                                            initial="hidden" animate="visible"
                                                            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
                                                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                                        >
                                                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-3 col-span-full md:col-span-1">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Neural Access Code</label>
                                                                <div className="flex gap-4">
                                                                    {otpDigits.map((digit, idx) => (
                                                                        <input
                                                                            key={idx}
                                                                            id={`otp-${idx}`}
                                                                            type="text"
                                                                            maxLength={1}
                                                                            autoComplete="one-time-code"
                                                                            inputMode="numeric"
                                                                            value={digit}
                                                                            onPaste={handleOtpPaste}
                                                                            onChange={e => handleOtpChange(idx, e.target.value)}
                                                                            onKeyDown={e => handleOtpKeyDown(idx, e)}
                                                                            className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl text-center text-xl font-bold text-emerald-500 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all caret-transparent select-none shadow-inner"
                                                                            placeholder="-"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-3">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Neural Key</label>
                                                                <input
                                                                    type="password"
                                                                    value={passwordData.new}
                                                                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all"
                                                                    placeholder="••••••••"
                                                                />
                                                            </motion.div>
                                                            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-3">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Key</label>
                                                                <input
                                                                    type="password"
                                                                    value={passwordData.confirm}
                                                                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all"
                                                                    placeholder="••••••••"
                                                                />
                                                            </motion.div>
                                                        </motion.div>
                                                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className="flex gap-4">
                                                            <motion.button
                                                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}
                                                                whileActive={{ scale: 0.98 }}
                                                                type="submit"
                                                                disabled={loading}
                                                                className="flex-1 py-4 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-lg disabled:opacity-50"
                                                            >
                                                                {loading ? 'Recalibrating...' : 'Update Key'}
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileActive={{ scale: 0.98 }}
                                                                type="button"
                                                                onClick={() => setOtpSent(false)}
                                                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all"
                                                            >
                                                                Cancel
                                                            </motion.button>
                                                        </motion.div>
                                                    </motion.form>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem]">
                                            <h4 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                                                <Smartphone size={20} className="text-emerald-500" />
                                                Active Terminals
                                            </h4>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                        <div>
                                                            <p className="text-white text-sm font-bold">This Web Browser (Nova Prime)</p>
                                                            <p className="text-gray-500 text-[10px] tracking-wider font-bold">CURRENT SESSION • EARTH SECTOR 7G</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeSection === 'privacy' && (
                            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-12">
                                <section>
                                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-2xl font-bold text-white mb-8 tracking-tight">Privacy Logic</motion.h3>
                                    <div className="space-y-6">
                                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-500">
                                                    <Lock size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-lg mb-1">Stealth Shield</h4>
                                                    <p className="text-gray-500 text-xs font-medium max-w-sm">When active, only approved links can view your synapses and reels.</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const newStatus = !formData.isPrivate;
                                                    setFormData(prev => ({ ...prev, isPrivate: newStatus }));
                                                    try {
                                                        const res = await fetch(`${apiUrl}/api/user/update`, {
                                                            method: 'PUT',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ ...formData, isPrivate: newStatus })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            onUpdateUser(data.data);
                                                            showStatus('success', `Stealth Shield ${newStatus ? 'Activated' : 'Liquidated'}`);
                                                        }
                                                    } catch (err) {
                                                        showStatus('error', 'Shield Sync Failed');
                                                    }
                                                }}
                                                className={`w-14 h-8 rounded-full relative transition-all duration-500 ${formData.isPrivate ? 'bg-emerald-500' : 'bg-gray-800'}`}
                                            >
                                                <motion.div
                                                    animate={{ x: formData.isPrivate ? 26 : 4 }}
                                                    className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg"
                                                />
                                            </button>
                                        </motion.div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeSection === 'interface' && (
                            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-12">
                                <section>
                                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-2xl font-bold text-white mb-8 tracking-tight">Neural Interface Saturation</motion.h3>
                                    <div className="space-y-12">
                                        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="space-y-6">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Glow Intensity</label>
                                                <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">High Voltage</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-emerald-500 shadow-[0_0_20px_#10b981] rounded-full" />
                                                <div className="absolute left-[85%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-emerald-500" />
                                            </div>
                                        </motion.div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {activeSection === 'data' && (
                            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-12">
                                <section>
                                    <motion.h3 variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="text-2xl font-bold text-white mb-8 tracking-tight">Data & Archive Protocols</motion.h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                                                <Download size={22} />
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 tracking-tight">Export Neural Map</h4>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Packages your synapses, stories and reels into a local archive.</p>
                                            <button className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all">Prepare Archive</button>
                                        </motion.div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SettingsView;
