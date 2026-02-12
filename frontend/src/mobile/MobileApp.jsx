import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Cookies from 'js-cookie';
import LoginBox from '../components/Login/LoginBox';
import SignUpBox from '../components/Login/SignUpBox';
import OTPBox from '../components/Login/OTPBox';
import ForgotPasswordBox from '../components/Login/ForgotPasswordBox';
import LandingPageMobile from './components/LandingPageMobile';
import InstagramLayoutMobile from './components/InstagramLayoutMobile';

// Synapse Core Logo (Reused)
const SynapseLogo = ({ size = 60 }) => (
    <motion.div style={{ width: size, height: size }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-emerald-500/20 rotate-45 rounded-sm" />
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3], rotate: 45 }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-1/2 h-1/2 bg-emerald-500 shadow-[0_0_20px_#10b981] rounded-sm" />
        {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} animate={{ y: [-10, 10, -10], x: i % 2 === 0 ? [-5, 5, -5] : [5, -5, 5], opacity: [0, 1, 0] }} transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }} className="absolute w-1 h-1 bg-emerald-400 rounded-full" style={{ top: i < 2 ? '0%' : '100%', left: i % 2 === 0 ? '0%' : '100%' }} />
        ))}
    </motion.div>
);

function MobileApp() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState(() => localStorage.getItem('synapse_last_view') || 'landing');
    const [isLoading, setIsLoading] = useState(true);
    const [isExited, setIsExited] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');

    // Persist view to localStorage
    useEffect(() => {
        localStorage.setItem('synapse_last_view', view);
        console.log('📱 Mobile View changed to:', view);
    }, [view]);

    const LIVE_API = import.meta.env.VITE_API_URL || "https://synapse-backend.pralayd140.workers.dev";

    useEffect(() => {
        const performNeuralSync = async () => {
            const token = Cookies.get('synapse_token');
            const savedUser = localStorage.getItem('synapse_user_data');

            if (!token) {
                if (view === 'profile') setView('landing');
                setTimeout(() => setIsLoading(false), 800);
                return;
            }

            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                    setView('profile');
                    // OPTIMISTIC LOAD: Trust local data first to prevent resize logouts
                    setTimeout(() => setIsLoading(false), 1200);
                    return;
                } catch (e) {
                    localStorage.removeItem('synapse_user_data');
                }
            }

            try {
                const response = await fetch(`${LIVE_API}/api/auth/me`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                    setView('profile');
                    localStorage.setItem('synapse_user_data', JSON.stringify(data.user));
                } else {
                    handleLogout();
                }
            } catch (err) {
                handleLogout();
            } finally {
                setTimeout(() => setIsLoading(false), 1200);
            }
        };

        performNeuralSync();
    }, []);

    const handleLoginSuccess = (loginData) => {
        const { user: userData, token } = loginData;
        setUser(userData);

        const isSecure = window.location.protocol === 'https:';
        if (token) {
            Cookies.set('synapse_token', token, {
                expires: 7,
                secure: isSecure,
                sameSite: isSecure ? 'None' : 'Lax'
            });
            localStorage.setItem('synapse_token', token); // Backup
        }

        if (loginData.sessionId) {
            Cookies.set('session_id', loginData.sessionId, {
                expires: 7,
                secure: isSecure,
                sameSite: isSecure ? 'None' : 'Lax'
            });
        }

        localStorage.setItem('synapse_user_data', JSON.stringify(userData));
        setView('profile');
    };

    const handleLogout = async () => {
        try { await fetch(`${LIVE_API}/api/auth/logout`, { method: 'POST' }); } catch (e) { }
        setUser(null);

        // Nuclear Logout: Clear everything
        const cookieOptions = [
            {},
            { path: '/' },
            { path: '/', domain: window.location.hostname },
            { path: '/', secure: true, sameSite: 'none' }
        ];

        cookieOptions.forEach(opt => {
            Cookies.remove('synapse_token', opt);
            Cookies.remove('session_id', opt);
        });

        localStorage.removeItem('synapse_token');
        localStorage.removeItem('synapse_user_data');
        localStorage.removeItem('synapse_last_view');
        localStorage.removeItem('synapse_social_tab');
        localStorage.clear(); // Extreme measure

        setView('landing');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <SynapseLogo size={50} />
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-[9px] uppercase tracking-[0.4em] font-bold mt-10 ml-1">
                        Mobile Uplink
                    </motion.p>
                </div>
            </div>
        );
    }

    if (isExited) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <SynapseLogo size={40} />
                <h1 className="text-xl font-bold tracking-tighter text-white mb-2 italic mt-8">Connection Severed</h1>
                <button onClick={() => setIsExited(false)} className="mt-16 text-[9px] text-gray-700 hover:text-emerald-500/50 uppercase tracking-[0.3em] font-bold transition-colors">[ Re-initialize ]</button>
            </div>
        );
    }

    const pageVariants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

    return (
        <motion.div className="App bg-black min-h-screen overflow-hidden">
            <AnimatePresence mode="wait">
                {view === 'landing' && (
                    <motion.div key="landing" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }}>
                        <LandingPageMobile onLogin={() => setView('login')} onRegister={() => setView('signup')} onExit={() => setIsExited(true)} />
                    </motion.div>
                )}
                {view === 'login' && (
                    <motion.div key="login" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                        <div className="p-4 flex items-center justify-center min-h-screen">
                            {/* Reuse LoginBox but wrap it to ensure it fits mobile if needed */}
                            <LoginBox onSwitch={() => setView('signup')} onBack={() => setView('landing')} onLoginSuccess={handleLoginSuccess} onForgot={() => setView('forgot')} />
                        </div>
                    </motion.div>
                )}
                {view === 'forgot' && (
                    <motion.div key="forgot" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                        <div className="p-4 flex items-center justify-center min-h-screen">
                            <ForgotPasswordBox onBack={() => setView('login')} onSuccess={() => setView('login')} />
                        </div>
                    </motion.div>
                )}
                {view === 'signup' && (
                    <motion.div key="signup" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                        <div className="p-4 flex items-center justify-center min-h-screen">
                            <SignUpBox onSwitch={() => setView('login')} onBack={() => setView('landing')} onSuccess={(email) => { setOtpEmail(email); setView('otp'); }} />
                        </div>
                    </motion.div>
                )}
                {view === 'otp' && (
                    <motion.div key="otp" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.4 }}>
                        <div className="p-4 flex items-center justify-center min-h-screen">
                            <OTPBox email={otpEmail} onVerified={() => setView('login')} onBack={() => setView('signup')} />
                        </div>
                    </motion.div>
                )}
                {view === 'profile' && user && (
                    <motion.div key="profile" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }}>
                        <InstagramLayoutMobile currentUser={user} onLogout={handleLogout} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default MobileApp;
