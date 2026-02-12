import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MobileApp from './mobile/MobileApp.jsx'
import './index.css'

const Root = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <React.StrictMode>
            {isMobile ? <MobileApp /> : <App />}
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
