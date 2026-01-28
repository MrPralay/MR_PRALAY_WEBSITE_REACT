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

const app = new Hono();

// Global Middleware
app.use('*', cors({
    origin: (origin) => {
        // Log origin for debugging if needed (Cloudflare logs)
        return origin || '*';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposeHeaders: ['Content-Length', 'X-Synapse-Debug'],
    maxAge: 86400,
    credentials: true,
}));

app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());



// Professional Error Handling
app.onError((err, c) => {
    console.error(`[Error]: ${err.message}`);
    const status = err.status || 500;

    // Ensure CORS headers are present even on error
    const origin = c.req.header('Origin');
    if (origin) {
        c.header('Access-Control-Allow-Origin', origin);
        c.header('Access-Control-Allow-Credentials', 'true');
    }

    return c.json({
        success: false,
        error: {
            message: err.message || 'Internal Server Error',
            code: err.code || 'INTERNAL_ERROR',
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    }, status);
});

// 404 Not Found
app.notFound((c) => {
    return c.json({
        success: false,
        error: {
            message: 'Resource not found',
            code: 'NOT_FOUND'
        }
    }, 404);
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
