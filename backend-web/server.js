import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { prettyJSON } from 'hono/pretty-json';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import getPrisma from './prisma/db.js';

const app = new Hono();

// 1. MANUALLY SET CORS FOR EVERY SINGLE REQUEST (Maximum Priority)
app.use('*', async (c, next) => {
    const origin = c.req.header('Origin');
    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }

    // Handle Preflight (OPTIONS)
    if (c.req.method === 'OPTIONS') {
        return c.text('', 204);
    }

    await next();
});

app.use('*', logger());
app.use('*', prettyJSON());

// 2. DEBUG ROUTE: Test if Database URL exists
app.get('/api/debug-env', (c) => {
    return c.json({
        success: true,
        hasDatabaseUrl: !!c.env.DATABASE_URL,
        databaseUrlLength: c.env.DATABASE_URL ? c.env.DATABASE_URL.length : 0,
        envKeys: Object.keys(c.env),
        message: "Neural Environment Check Complete"
    });
});

// 3. DEBUG ROUTE: Test direct DB connection
app.get('/api/test-db', async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const userCount = await prisma.user.count();
        return c.json({ success: true, message: "Connection Established", userCount });
    } catch (err) {
        return c.json({ success: false, error: err.message, stack: err.stack }, 500);
    }
});

// Adjusted Secure Headers 
app.use('*', secureHeaders({
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable for debug
}));

// Professional Error Handling
app.onError((err, c) => {
    console.error(`[Error]: ${err.message}`);
    const origin = c.req.header('Origin');

    // Force CORS headers even on crash
    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
    }

    return c.json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            stack: err.stack,
            code: 'NEURAL_CRASH'
        }
    }, 500);
});

// Main Route
app.get('/', (c) => {
    return c.text('SynapseX Neural Gateway is Online...');
});

// API Routes
app.route('/api/auth', authRoutes);
app.route('/api/user', userRoutes);
app.route('/api/social', socialRoutes);
app.route('/api/admin', adminRoutes);

export default app;