import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';

const authenticateToken = async (c, next) => {
    // 1. Try Authorization Header first (Higher priority in local dev)
    const authHeader = c.req.header('authorization');
    const headerToken = authHeader && authHeader.split(' ')[1];

    // 2. Fallback to Cookie (Professional way)
    const cookieToken = getCookie(c, 'synapse_token');

    const token = headerToken || cookieToken;

    if (!token) {
        return c.json({ success: false, error: "Neural authorization missing" }, 401);
    }

    try {
        const secret = c.env.JWT_SECRET || 'fallback_secret';

        // Diagnostic log: Only in development
        if (c.env.NODE_ENV === 'development') {
            console.log(`[Auth Diagnostic]: Verifying token. Secret Length: ${secret.length}, Token Source: ${headerToken ? 'Header' : 'Cookie'}`);
        }

        const user = jwt.verify(token, secret);
        c.set('user', user);
        await next();
    } catch (err) {
        console.error(`[Auth Failure]: ${err.message}`, {
            tokenType: headerToken ? 'Header' : 'Cookie',
            secretLength: (c.env.JWT_SECRET || 'fallback_secret').length
        });
        return c.json({
            success: false,
            error: "Neural link expired or corrupted",
            debug: err.message
        }, 403);
    }
};

export default authenticateToken;
