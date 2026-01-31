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

    const apiUrl = "https://synapse-backend.pralayd140.workers.dev";
    const token = Cookies.get('synapse_token');

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
        <div className="flex-1 max-w-6xl mx-auto py-12 px-6 md:px-12 flex flex-col md:flex-row gap-8">
            {/* Settings Sidebar */}
            <div className="w-full md:w-80 space-y-2">
                <div className="mb-10 px-4">
                    <h2 className="text-3xl font-bold text-white tracking-tighter mb-2">Command Center</h2>
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.3em] font-bold">Protocol Settings v4.0</p>
                </div>

                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all group relative overflow-hidden ${activeSection === item.id
                            ? 'bg-emerald-500/10 border border-emerald-500/20'
                            : 'hover:bg-white/5 border border-transparent'
                            }`}
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className={`${activeSection === item.id ? 'text-emerald-500' : 'text-gray-500 group-hover:text-white'} transition-colors`}>
                                {item.icon}
                            </div>
                            <div>
                                <h4 className={`text-sm font-bold ${activeSection === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                    {item.label}
                                </h4>
                                <p className="text-[9px] text-gray-500 font-medium group-hover:text-gray-400 mt-0.5">{item.description}</p>
                            </div>
                        </div>
                        {activeSection === item.id && (
                            <motion.div
                                layoutId="active-menu-bg"
                                className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
                            />
                        )}
                    </button>
                ))}

                <button
                    onClick={onLogout}
                    className="w-full text-left p-4 mt-8 rounded-2xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 group transition-all"
                >
                    <div className="flex items-center gap-4">
                        <LogOut size={20} className="text-red-500/50 group-hover:text-red-500 transition-colors" />
                        <div>
                            <h4 className="text-sm font-bold text-red-500/70 group-hover:text-red-500">Sever Login</h4>
                            <p className="text-[9px] text-red-500/40 font-medium group-hover:text-red-500/60 mt-0.5">Disconnect from all terminals</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 bg-[#0a0a0a] border border-white/5 rounded-[3rem] overflow-hidden relative">
                <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] -z-10" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="p-10 md:p-16 h-full overflow-y-auto hide-scrollbar"
                    >
                        {activeSection === 'profile' && (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Neural Identity Edit</h3>
                                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Designation</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:outline-none transition-all"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Unique Username</label>
                                                <input
                                                    type="text"
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:outline-none transition-all"
                                                    placeholder="username"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Neural Bio</label>
                                            <textarea
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:outline-none transition-all resize-none"
                                                placeholder="Enter your profile description..."
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-12 py-4 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? 'Synchronizing...' : 'Save Changes'}
                                        </button>
                                    </form>
                                </section>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div className="space-y-12">
                                <section>
                                    <div className="flex items-center gap-3 mb-8">
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Security Protocol</h3>
                                        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                                            <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Enhanced Shield On</span>
                                        </div>
                                    </div>

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
                                                    <button
                                                        onClick={handleRequestOTP}
                                                        disabled={loading}
                                                        className="px-8 py-3 bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
                                                    >
                                                        {loading ? 'Initializing...' : 'Initialize Reset'}
                                                    </button>
                                                )}
                                            </div>

                                            <AnimatePresence>
                                                {otpSent && (
                                                    <motion.form
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        onSubmit={handleResetPassword}
                                                        className="w-full space-y-6 pt-6 border-t border-white/5"
                                                    >
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                            <div className="space-y-2 col-span-full md:col-span-1">
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
                                                                            className="w-full aspect-square bg-white/5 border border-white/10 rounded-2xl text-center text-xl font-bold text-emerald-500 focus:border-emerald-500/50 focus:bg-emerald-500/5 focus:outline-none transition-all"
                                                                            placeholder="-"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">New Neural Key</label>
                                                                <input
                                                                    type="password"
                                                                    value={passwordData.new}
                                                                    onChange={e => setPasswordData({ ...passwordData, new: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:outline-none transition-all"
                                                                    placeholder="••••••••"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Confirm Key</label>
                                                                <input
                                                                    type="password"
                                                                    value={passwordData.confirm}
                                                                    onChange={e => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-emerald-500/50 focus:outline-none transition-all"
                                                                    placeholder="••••••••"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-4">
                                                            <button
                                                                type="submit"
                                                                disabled={loading}
                                                                className="flex-1 py-4 bg-emerald-500 text-black font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-emerald-400 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                                            >
                                                                {loading ? 'Recalibrating...' : 'Update Key'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setOtpSent(false)}
                                                                className="px-8 py-4 bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
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
                                                <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5 group hover:border-red-500/30 transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                                                        <div>
                                                            <p className="text-white text-sm font-bold">Neural Link Mobile</p>
                                                            <p className="text-gray-500 text-[10px] tracking-wider font-bold">IP: 192.168.1.1 • LOGGED 2 DAYS AGO</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-red-500 opacity-0 group-hover:opacity-100 transition-all px-4 py-2 hover:bg-red-500/10 rounded-xl text-[9px] font-bold uppercase tracking-widest">Sever</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'privacy' && (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Privacy Logic</h3>

                                    <div className="space-y-6">
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between">
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
                                                    // Trigger background update
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
                                        </div>

                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-between group">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                                                    <Eye size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-bold text-lg mb-1">Ghost Browsing</h4>
                                                    <p className="text-gray-500 text-xs font-medium max-w-sm">Navigate profiles without leaving a data pulse (experimental).</p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Locked</span>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'interface' && (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Neural Interface Saturation</h3>

                                    <div className="space-y-12">
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Glow Intensity</label>
                                                <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">High Voltage</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-[85%] bg-emerald-500 shadow-[0_0_20px_#10b981] rounded-full" />
                                                <div className="absolute left-[85%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-emerald-500" />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-end mb-2">
                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Glass Refraction</label>
                                                <span className="text-emerald-500 font-bold text-xs uppercase tracking-widest">Ultra Clarity</span>
                                            </div>
                                            <div className="h-2 bg-white/5 rounded-full relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-[40%] bg-white/20 rounded-full" />
                                                <div className="absolute left-[40%] top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-6">
                                            {['Emerald Core', 'Sapphire Flux', 'Solar Flare'].map((theme, i) => (
                                                <div key={theme} className={`p-4 rounded-2xl border transition-all cursor-pointer ${i === 0 ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02] hover:bg-white/5'}`}>
                                                    <div className={`w-full h-20 rounded-xl mb-4 ${i === 0 ? 'bg-emerald-500 shadow-[0_10px_30px_#10b98140]' : i === 1 ? 'bg-blue-500' : 'bg-orange-500'} opacity-20`} />
                                                    <p className="text-[9px] font-bold text-center uppercase tracking-widest text-white">{theme}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'data' && (
                            <div className="space-y-12">
                                <section>
                                    <h3 className="text-2xl font-bold text-white mb-8 tracking-tight">Data & Archive Protocols</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:border-emerald-500/30 transition-all">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                                                <Download size={22} />
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 tracking-tight">Export Neural Map</h4>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Packages your synapses, stories and reels into a local archive.</p>
                                            <button className="w-full py-4 bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-white/10 transition-all">Prepare Archive</button>
                                        </div>

                                        <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] group hover:border-red-500/30 transition-all">
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 transition-transform">
                                                <Trash2 size={22} />
                                            </div>
                                            <h4 className="text-white font-bold text-lg mb-2 tracking-tight">Wipe Activity Cache</h4>
                                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-8">Clears all temporary data pulas and viewing history.</p>
                                            <button className="w-full py-4 bg-red-500/5 border border-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/10 transition-all">Execute wipe</button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Global Status Notification Popup */}
                <AnimatePresence>
                    {statusMsg.text && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute bottom-8 left-10 right-10 z-[100]"
                        >
                            <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between ${statusMsg.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                }`}>
                                <div className="flex items-center gap-3">
                                    {statusMsg.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{statusMsg.text}</span>
                                </div>
                                <button onClick={() => setStatusMsg({ type: '', text: '' })} className="text-current opacity-40 hover:opacity-100"><X size={16} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SettingsView;
