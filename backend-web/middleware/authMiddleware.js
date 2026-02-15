import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';

const authenticateToken = async (c, next) => {
    // 1. Try Authorization Header first (Higher priority in local dev)
    const authHeader = c.req.header('authorization');
    const headerToken = authHeader && authHeader.split(' ')[1];

    // 2. Fallback to Cookie (Professional way)
    const cookieToken = getCookie(c, 'synapse_token');

    // 3. Fallback to Query Param (Essential for SSE/EventSource which can't set headers)
    const queryToken = c.req.query('token');

    // Prioritize header -> cookie -> query
    const toxicStrings = ['undefined', 'null', '', 'NaN'];
    const isValid = (t) => t && typeof t === 'string' && !toxicStrings.includes(t);

    const token = isValid(headerToken) ? headerToken :
        (isValid(cookieToken) ? cookieToken :
            (isValid(queryToken) ? queryToken : null));

    if (!token) {
        console.warn(`[Neural Sync Failure] 401: Authorization missing or toxic. Header: ${headerToken}, Cookie: ${cookieToken}, Query: ${queryToken}`);
        return c.json({ success: false, error: "Neural authorization missing" }, 401);
    }

    try {
        const secret = c.env.JWT_SECRET || 'synapse_x_quantum_secure_2026';

        // Diagnostic log: Only in development
        if (c.env.NODE_ENV === 'development') {
            console.log(`[Auth Diagnostic]: Verifying token. Source: ${headerToken ? 'Header' : (cookieToken ? 'Cookie' : (queryToken ? 'Query' : 'None'))}`);
        }

        const user = jwt.verify(token, secret);
        c.set('user', user);
        await next();
    } catch (err) {
        console.error(`[Auth Failure]: ${err.message}`, {
            tokenStart: token.substring(0, 10),
            error: err.message
        });
        return c.json({
            success: false,
            error: "Neural link expired or corrupted",
            debug: err.message
        }, 403);
    }
};

export default authenticateToken;
