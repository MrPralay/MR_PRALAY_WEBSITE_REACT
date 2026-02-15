import getPrisma from '../prisma/db.js';

/**
 * 📧 Neural Messaging Controller
 */

export const getConversations = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get('user').userId;

    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                profileImage: true,
                                name: true,
                                lastSeen: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Format for frontend
        const formatted = conversations.map(conv => {
            const otherMember = conv.members.find(m => m.userId !== userId);
            const isTyping = otherMember?.typingUntil ? new Date(otherMember.typingUntil) > new Date() : false;

            return {
                id: conv.id,
                user: otherMember?.user,
                lastMessage: conv.messages[0],
                updatedAt: conv.updatedAt,
                isTyping
            };
        });

        return c.json({ success: true, conversations: formatted });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const getMessages = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const conversationId = parseInt(c.req.param('id'));

    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Mark messages as seen if they are not from the current user
        const userId = c.get('user').userId;
        const unseenMessages = messages.filter(m => m.userId !== userId && !m.isSeen);

        if (unseenMessages.length > 0) {
            // NEURAL BACKGROUND SYNC: Update seen status without blocking the response
            prisma.message.updateMany({
                where: {
                    id: { in: unseenMessages.map(m => m.id) }
                },
                data: {
                    isSeen: true,
                    seenAt: new Date()
                }
            }).catch(err => console.error("[Non-Blocking Seen Error]:", err));
        }

        // Check typing status of the other user
        const otherMember = await prisma.conversationMember.findFirst({
            where: {
                conversationId,
                userId: { not: userId }
            },
            select: { typingUntil: true }
        });

        const isTyping = otherMember?.typingUntil ? new Date(otherMember.typingUntil) > new Date() : false;

        return c.json({ success: true, messages, isTyping });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const sendMessage = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const senderId = c.get('user').userId;
    const { receiverId, content, conversationId } = await c.req.json();

    try {
        let finalConvId = conversationId;

        // If no conversationId provided, find or create one
        if (!finalConvId) {
            const existing = await prisma.conversation.findFirst({
                where: {
                    AND: [
                        { members: { some: { userId: senderId } } },
                        { members: { some: { userId: receiverId } } }
                    ]
                }
            });

            if (existing) {
                finalConvId = existing.id;
            } else {
                const newConv = await prisma.conversation.create({
                    data: {
                        members: {
                            create: [
                                { userId: senderId },
                                { userId: receiverId }
                            ]
                        }
                    }
                });
                finalConvId = newConv.id;
            }
        }

        const message = await prisma.message.create({
            data: {
                content,
                userId: senderId,
                conversationId: finalConvId,
                isSeen: false
            },
            include: {
                user: {
                    select: { id: true, username: true, profileImage: true }
                }
            }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: finalConvId },
            data: { updatedAt: new Date() }
        });

        // NEURAL BROADCAST: Push new message to all SSE subscribers
        const convIdStr = String(finalConvId);
        if (typingSubscribers.has(convIdStr)) {
            const subscribers = typingSubscribers.get(convIdStr);
            subscribers.forEach(async (stream) => {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            conversationId: convIdStr,
                            message
                        }),
                        event: 'new_message',
                        id: String(Date.now())
                    });
                } catch (e) { }
            });
        }

        return c.json({ success: true, message });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const deleteMessage = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get('user').userId;
    const messageId = parseInt(c.req.param('id'));

    try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.userId !== userId) {
            return c.json({ success: false, error: "Unauthorized" }, 403);
        }

        await prisma.message.delete({ where: { id: messageId } });
        return c.json({ success: true, message: "Message neutralized" });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

/**
 * 📝 User Notes Controller
 */

export const getNotes = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);

    try {
        const notes = await prisma.userNote.findMany({
            where: {
                expiresAt: { gt: new Date() }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        profileImage: true,
                        name: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get some random users if notes are few
        let shuffledUsers = [];
        if (notes.length < 5) {
            shuffledUsers = await prisma.user.findMany({
                take: 10,
                select: { id: true, username: true, profileImage: true, name: true }
            });
            // Simple shuffle
            shuffledUsers.sort(() => Math.random() - 0.5);
        }

        return c.json({ success: true, notes, shuffledUsers });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const createNote = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get('user').userId;
    const { content, hasMusic, musicTitle, musicUrl, musicStartTime } = await c.req.json();

    try {
        // Delete existing note for this user first
        await prisma.userNote.deleteMany({ where: { userId } });

        const note = await prisma.userNote.create({
            data: {
                content,
                hasMusic,
                musicTitle,
                musicUrl,
                musicStartTime: musicStartTime || 0,
                userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
            },
            include: {
                user: {
                    select: { id: true, username: true, profileImage: true }
                }
            }
        });

        return c.json({ success: true, note });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};
export const deleteNote = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get('user').userId;

    try {
        await prisma.userNote.deleteMany({ where: { userId } });
        return c.json({ success: true, message: "Note neutralized" });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

import { streamSSE } from 'hono/streaming';

// --- Global SSE Connection Tracking (In-Memory for Single Instance) ---
// Map<conversationId, Set<Controller>>
// --- Global SSE Connection Tracking ---
const typingSubscribers = new Map();

// Map<conversationId, Map<userId, { isTyping: boolean, expires: number }>>
const typingCache = new Map();

export const updateTypingStatus = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userId = c.get('user').userId;

    let conversationId, isTyping;
    if (c.req.method === 'GET') {
        conversationId = c.req.query('conversationId');
        isTyping = c.req.query('isTyping') === 'true';
    } else {
        const body = await c.req.json();
        conversationId = body.conversationId;
        isTyping = body.isTyping;
    }

    const convIdStr = String(conversationId);

    try {
        // 1. Update Relay Cache (User-Aware Instant)
        if (!typingCache.has(convIdStr)) {
            typingCache.set(convIdStr, new Map());
        }
        typingCache.get(convIdStr).set(userId, {
            isTyping,
            expires: Date.now() + 2500
        });

        // 2. NEURAL OPTIMIZATION: Broadcast IMMEDIATELY (Fire & Forget)
        if (typingSubscribers.has(convIdStr)) {
            const subscribers = typingSubscribers.get(convIdStr);
            subscribers.forEach(async (stream) => {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({
                            conversationId: convIdStr,
                            userId,
                            isTyping
                        }),
                        event: 'typing',
                        id: String(Date.now())
                    });
                } catch (e) { }
            });
        }

        // 3. Update DB (Persistence) - NON-BLOCKING
        c.executionCtx.waitUntil(
            prisma.conversationMember.update({
                where: {
                    userId_conversationId: {
                        userId,
                        conversationId: parseInt(conversationId)
                    }
                },
                data: {
                    typingUntil: isTyping ? new Date(Date.now() + 2000) : null
                }
            }).catch(err => console.error("[Neural Flow] Background DB Error:", err))
        );

        return c.json({ success: true });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const getTypingStatus = async (c) => {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const conversationId = c.req.param('conversationId');
    const convIdStr = String(conversationId);

    // NEURAL PULSE ENGINE: Check if this is a broadcast request
    const isPulse = c.req.query('pulse') === 'true';
    if (isPulse) {
        const isTyping = c.req.query('isTyping') === 'true';
        const userId = c.get('user').userId;

        // 1. Update Relay Cache (User-Aware Instant)
        if (!typingCache.has(convIdStr)) {
            typingCache.set(convIdStr, new Map());
        }
        typingCache.get(convIdStr).set(userId, {
            isTyping,
            expires: Date.now() + 2500
        });

        // 2. Broadcast to SSE
        if (typingSubscribers.has(convIdStr)) {
            const subscribers = typingSubscribers.get(convIdStr);
            subscribers.forEach(async (stream) => {
                try {
                    await stream.writeSSE({
                        data: JSON.stringify({ conversationId: convIdStr, userId, isTyping }),
                        event: 'typing',
                        id: String(Date.now())
                    });
                } catch (e) { }
            });
        }

        // 3. Background DB Sync
        c.executionCtx.waitUntil(
            prisma.conversationMember.update({
                where: { userId_conversationId: { userId, conversationId: parseInt(conversationId) } },
                data: { typingUntil: isTyping ? new Date(Date.now() + 2000) : null }
            }).catch(e => console.error("[Neural Flow] Pulse DB Error:", e))
        );

        return c.json({ success: true });
    }

    // NORMAL POLLING LOGIC
    const convCache = typingCache.get(convIdStr);
    const userId = c.get('user').userId;

    if (convCache) {
        // Find if ANY user other than the requester is currently typing
        let otherTyping = false;
        const now = Date.now();
        for (const [uId, status] of convCache.entries()) {
            if (uId != userId && status.isTyping && status.expires > now) {
                otherTyping = true;
                break;
            }
        }
        if (otherTyping) {
            return c.json({ success: true, isTyping: true });
        }
    }

    try {
        const otherMember = await prisma.conversationMember.findFirst({
            where: {
                conversationId: parseInt(conversationId),
                userId: { not: c.get('user').userId }
            },
            select: { typingUntil: true }
        });
        const isTyping = otherMember?.typingUntil ? new Date(otherMember.typingUntil) > new Date() : false;
        return c.json({ success: true, isTyping });
    } catch (err) {
        return c.json({ success: false, error: err.message }, 500);
    }
};

export const streamTyping = async (c) => {
    const conversationId = c.req.param('conversationId');
    const convIdStr = String(conversationId);

    return streamSSE(c, async (stream) => {
        // 1. Maintain Connection State
        if (!typingSubscribers.has(convIdStr)) {
            typingSubscribers.set(convIdStr, new Set());
        }
        const subscribers = typingSubscribers.get(convIdStr);
        subscribers.add(stream);

        // 2. Heartbeat Engine (Prevent Mobile Sleep)
        const heartbeat = setInterval(async () => {
            try {
                await stream.writeSSE({ data: "heartbeat", event: "ping" });
            } catch (e) {
                clearInterval(heartbeat);
                subscribers.delete(stream);
            }
        }, 15000);

        // 3. Keep connection alive
        stream.onAbort(() => {
            clearInterval(heartbeat);
            subscribers.delete(stream);
        });

        // 4. Infinite sleep to keep the stream open
        while (true) {
            await new Promise((r) => setTimeout(r, 60000));
        }
    });
};
