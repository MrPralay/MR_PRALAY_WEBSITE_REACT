import getPrisma from '../prisma/db.js';
import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';

export const getProfile = async (c) => {
    const username = c.req.param('username');
    try {
        // Extract current user if authenticated (optional auth)
        let currentUser = c.get('user');
        if (!currentUser) {
            const cookieToken = getCookie(c, 'synapse_token');
            const authHeader = c.req.header('authorization');
            const headerToken = authHeader && authHeader.split(' ')[1];
            const token = cookieToken || headerToken;

            if (token) {
                try {
                    currentUser = jwt.verify(token, c.env.JWT_SECRET || 'fallback_secret');
                } catch (e) { /* invalid token is fine for public profile */ }
            }
        }

        const prisma = getPrisma(c.env.DATABASE_URL);
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                name: true,
                bio: true,
                profileImage: true,
                riskScore: true,
                isPrivate: true,
                createdAt: true,
                lastSeen: true,
                role: true,
                posts: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        _count: {
                            select: { likes: true, comments: true }
                        }
                    }
                },
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true
                    }
                },
                // Include followers to check if current user follows this profile
                followers: currentUser ? {
                    where: { followerId: currentUser.userId },
                    select: { id: true }
                } : false
            }
        });

        if (!user) {
            return c.json({ success: false, error: "Identity not found" }, 404);
        }

        // Add isFollowing flag
        const profileData = {
            ...user,
            isFollowing: (user.followers?.length || 0) > 0,
            followers: undefined // remove raw array
        };

        return c.json({ success: true, data: profileData });
    } catch (error) {
        console.error("Profile Error:", error);
        return c.json({ success: false, error: "Search failed" }, 500);
    }
};

export const getSavedItems = async (c) => {
    try {
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        const saved = await prisma.savedPost.findMany({
            where: { userId: user.userId },
            include: {
                post: {
                    include: {
                        user: { select: { username: true, profileImage: true } },
                        _count: { select: { likes: true, comments: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return c.json({
            success: true,
            data: saved.map(s => s.post)
        });
    } catch (error) {
        return c.json({ success: false, error: "Archived content retrieval failed" }, 500);
    }
};

export const updateProfile = async (c) => {
    try {
        const { name, bio, profileImage, username, isPrivate } = await c.req.json();
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: {
                ...(name && { name }),
                ...(bio && { bio }),
                ...(profileImage && { profileImage }),
                ...(username && { username }),
                ...(typeof isPrivate === 'boolean' && { isPrivate })
            },
            select: {
                id: true,
                username: true,
                name: true,
                bio: true,
                profileImage: true,
                riskScore: true,
                isPrivate: true
            }
        });

        return c.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error("Profile Update Error:", error);
        return c.json({ success: false, error: "Neural recalibration failed" }, 500);
    }
};

export const getResonance = async (c) => {
    try {
        const targetUsername = c.req.param('username');
        const currentUser = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        // Find posts liked by BOTH users
        const mutualPosts = await prisma.post.findMany({
            where: {
                AND: [
                    { likes: { some: { userId: currentUser.userId } } },
                    { likes: { some: { user: { username: targetUsername } } } }
                ]
            },
            include: {
                user: { select: { username: true, profileImage: true } },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return c.json({ success: true, data: mutualPosts });
    } catch (error) {
        console.error("Resonance Error:", error);
        return c.json({ success: false, error: "Neural resonance failed" }, 500);
    }
};

export const getSuggestedUsers = async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const limit = parseInt(c.req.query('limit')) || 10;

        // Fetch users for the story bar (suggested users)
        const users = await prisma.user.findMany({
            take: limit,
            select: {
                id: true,
                username: true,
                profileImage: true,
                lastSeen: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return c.json({ success: true, data: users });
    } catch (error) {
        console.error("Suggested Users Error:", error);
        return c.json({ success: false, error: "Failed to fetch user signatures" }, 500);
    }
};

export const toggleFollow = async (c) => {
    try {
        const targetId = parseInt(c.req.param('id'));
        const user = c.get('user'); // From authMiddleware
        const prisma = getPrisma(c.env.DATABASE_URL);

        console.log(`[FOLLOW DEBUG] Toggle follow request:`, {
            currentUserId: user.userId,
            targetId,
            userObject: user
        });

        if (user.userId === targetId) {
            return c.json({ success: false, error: "Cannot follow yourself" }, 400);
        }

        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: user.userId,
                    followingId: targetId
                }
            }
        });

        console.log(`[FOLLOW DEBUG] Existing follow:`, existingFollow);

        if (existingFollow) {
            await prisma.follow.delete({
                where: { id: existingFollow.id }
            });
            console.log(`[FOLLOW DEBUG] Unfollowed user ${targetId}`);
            return c.json({ success: true, action: 'unfollowed' });
        } else {
            const newFollow = await prisma.follow.create({
                data: {
                    followerId: user.userId,
                    followingId: targetId
                }
            });
            console.log(`[FOLLOW DEBUG] Followed user ${targetId}:`, newFollow);
            return c.json({ success: true, action: 'followed' });
        }
    } catch (error) {
        console.error("Follow Toggle Error:", error);
        return c.json({ success: false, error: "Neural link modification failed" }, 500);
    }
};

export const searchUsers = async (c) => {
    try {
        const query = c.req.query('q');
        if (!query || query.length < 1) return c.json({ success: true, data: [] });

        const prisma = getPrisma(c.env.DATABASE_URL);
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 20,
            select: {
                id: true,
                username: true,
                name: true,
                profileImage: true,
                isVerified: true,
                lastSeen: true
            }
        });

        return c.json({ success: true, data: users });
    } catch (error) {
        console.error("User Search Error:", error);
        return c.json({ success: false, error: "Search protocol failed" }, 500);
    }
};
export const updateActivity = async (c) => {
    try {
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);
        const { status, sentAt } = await c.req.json().catch(() => ({}));

        const clientSentAt = sentAt ? new Date(sentAt) : new Date();

        // Neural Order Correction: Only update if request is newer than last processed
        const dbUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { lastActivityAt: true }
        });

        if (dbUser?.lastActivityAt && clientSentAt <= dbUser.lastActivityAt) {
            return c.json({ success: true, message: "Out-of-order signal ignored" });
        }

        const isOffline = status === 'offline' || status === 'leaving';
        const lastSeenTime = isOffline ? new Date(clientSentAt.getTime() - 61000) : clientSentAt;

        await prisma.user.update({
            where: { id: user.userId },
            data: {
                lastSeen: lastSeenTime,
                lastActivityAt: clientSentAt
            }
        });

        return c.json({ success: true });
    } catch (error) {
        return c.json({ success: false, error: error.message }, 500);
    }
};
