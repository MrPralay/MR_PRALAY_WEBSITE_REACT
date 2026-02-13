import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import getPrisma from '../prisma/db.js';
import { sendOTP, sendResetOTP } from '../utils/email.js';

export const register = async (c) => {
    try {
        const { name, username, email, password } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);

        if (!email || !password || !username) {
            return c.json({ success: false, error: "Missing required fields" }, 400);
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                username,
                email,
                password: hashedPassword,
                role: email.includes('admin') ? 'ADMIN' : 'USER',
                otp,
                otpExpires,
                isVerified: false
            }
        });

        const emailSent = await sendOTP(email, otp, c.env);

        return c.json({
            success: true,
            message: emailSent ? "Neural access code transmitted to your email" : "User created but failed to send verification code",
            userId: user.id,
            email: user.email
        }, 201);
    } catch (error) {
        console.error("Registration Error:", error);

        // Handle duplicate email/username
        if (error.code === 'P2002') {
            return c.json({
                success: false,
                error: "Identity overlap detected: This email or username is already synced to the network."
            }, 409);
        }

        return c.json({ success: false, error: `Neural link failure: ${error.message}` }, 500);
    }
};

export const verifyOTP = async (c) => {
    try {
        const { email, otp } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return c.json({ success: false, error: "Neural record not found" }, 404);
        if (user.otp !== otp) return c.json({ success: false, error: "Invalid neural access code" }, 400);
        if (new Date() > user.otpExpires) return c.json({ success: false, error: "Neural code expired" }, 400);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                otp: null,
                otpExpires: null
            }
        });

        return c.json({ success: true, message: "Neural link established successfully" });
    } catch (error) {
        console.error("OTP Verification Error:", error);
        return c.json({ success: false, error: "Verification process failed", details: error.message }, 500);
    }
};

export const login = async (c) => {
    try {
        const { username, password, behaviorData } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);

        if (!username || !password) {
            return c.json({ success: false, error: "Credentials required" }, 400);
        }

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return c.json({ success: false, error: "Access Denied: Neural mismatch" }, 401);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return c.json({ success: false, error: "Access Denied: Neural mismatch" }, 401);
        }

        // AUTO-VERIFY EXISTING USERS (FIX FOR OLD ACCOUNTS)
        if (user.isVerified === false && !user.otp) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isVerified: true }
            });
        } else if (!user.isVerified) {
            return c.json({ success: false, error: "Neural link not verified. Please check your email." }, 403);
        }

        let riskScore = 0.0;
        const aiBackendUrl = c.env.AI_BACKEND_URL;

        if (aiBackendUrl) {
            try {
                const aiResponse = await fetch(`${aiBackendUrl}/analyze-risk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: user.email,
                        key_strokes: behaviorData?.key_strokes || [],
                        mouse_movements: behaviorData?.mouse_movements || []
                    })
                });

                if (aiResponse.ok) {
                    const aiData = await aiResponse.json();
                    riskScore = aiData.risk_score;
                }
            } catch (aiError) {
                console.warn("AI Neural Core unreachable");
            }
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { riskScore, lastLogin: new Date() }
        });

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            c.env.JWT_SECRET || 'synapse_x_quantum_secure_2026',
            { expiresIn: '2h' }
        );

        // CREATE PROFESSIONAL SESSIONID (Like Instagram/Facebook)
        const userAgent = c.req.header('user-agent');
        const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'local';
        const sessionExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const session = await prisma.session.create({
            data: {
                userId: user.id,
                userAgent,
                ipAddress,
                expiresAt: sessionExpires
            }
        });

        // Return session data (Frontend can handle it if needed)
        c.header('X-Synapse-Debug', 'v3-no-cookies');
        return c.json({
            success: true,
            token,
            sessionId: session.id,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                image: user.profileImage,
                bio: user.bio,
                email: user.email,
                isPrivate: user.isPrivate,
                riskScore
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        return c.json({ success: false, error: `Neural link failure: ${error.message}` }, 500);
    }
};

export const forgotPassword = async (c) => {
    try {
        const { email } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);

        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, username: true, email: true, name: true, profileImage: true }
        });

        if (!user) {
            return c.json({ success: false, error: "No neural record found for this address" }, 404);
        }

        // Generate OTP for reset
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: { otp, otpExpires }
        });

        // Send reset OTP
        const emailSent = await sendResetOTP(email, otp, c.env);

        return c.json({
            success: true,
            message: "Recovery code transmitted to your email",
            user: {
                username: user.username,
                name: user.name,
                image: user.profileImage,
                email: user.email
            }
        });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return c.json({ success: false, error: `Recovery fail: ${error.message}` }, 500);
    }
};

export const resetPassword = async (c) => {
    try {
        const { email, otp, newPassword } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return c.json({ success: false, error: "Neural record not found" }, 404);
        if (user.otp !== otp) return c.json({ success: false, error: "Invalid recovery code" }, 400);
        if (new Date() > user.otpExpires) return c.json({ success: false, error: "Recovery code expired" }, 400);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpires: null,
                isVerified: true // Auto-verify if they reset password
            }
        });

        return c.json({ success: true, message: "Neural key successfully recalibrated" });
    } catch (error) {
        console.error("Reset Password Error:", error);
        return c.json({ success: false, error: `Recalibration fail: ${error.message}` }, 500);
    }
};

export const logout = async (c) => {
    try {
        const isSecure = c.req.url.startsWith('https') || c.req.header('x-forwarded-proto') === 'https';
        const options = { path: '/', secure: isSecure, sameSite: isSecure ? 'None' : 'Lax' };

        // Explicitly clear the legacy cookies with the correct protocol options
        deleteCookie(c, 'session_id', options);
        deleteCookie(c, 'synapse_token', options);

        return c.json({
            success: true,
            message: "Neural link severed successfully"
        });
    } catch (error) {
        console.error("Logout Error:", error);
        return c.json({ success: false, error: "Failed to sever link" }, 500);
    }
};

export const getMe = async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        c.header('X-Synapse-Debug', 'v6-session-persistence');

        // Note: isSecure check is used for diagnostic headers if needed, 
        // but we no longer proactively clear cookies here to prevent session nuking.

        const cookieToken = getCookie(c, 'synapse_token');
        const authHeader = c.req.header('authorization');

        // DEEP DIAGNOSTIC: Reveal the ghost
        const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        // Filter out toxic strings from faulty storage
        const toxicStrings = ['undefined', 'null', '', 'NaN'];
        const isValid = (t) => t && typeof t === 'string' && !toxicStrings.includes(t);

        const token = isValid(headerToken) ? headerToken : (isValid(cookieToken) ? cookieToken : null);

        if (!token) {
            console.warn(`[Neural Sync Failure] 401: No valid token. Header: ${headerToken}, Cookie: ${cookieToken}`);
            return c.json({
                success: false,
                error: "No neural link found",
                debug: "TOKEN_MISSING_OR_TOXIC",
                received: { header: !!headerToken, cookie: !!cookieToken }
            }, 401);
        }

        // 2. Verify Token (Diagnostic Secret Check)
        const secret = c.env.JWT_SECRET || 'synapse_x_quantum_secure_2026';
        if (!c.env.JWT_SECRET) {
            console.warn("[Neural Security] JWT_SECRET is missing from environment. Using hardcoded dev fallback.");
        }

        const decoded = jwt.verify(token, secret);

        // 3. Get User
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) return c.json({ success: false, error: "Identity corrupted" }, 404);

        return c.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                name: user.name,
                image: user.profileImage,
                bio: user.bio,
                email: user.email,
                riskScore: user.riskScore,
                isPrivate: user.isPrivate
            }
        });
    } catch (error) {
        console.error(`[getMe Auth Failure]: ${error.message}`);
        return c.json({
            success: false,
            error: "Session expired",
            debug: error.message,
            secret_status: !!c.env.JWT_SECRET ? 'present' : 'missing'
        }, 401);
    }
};
