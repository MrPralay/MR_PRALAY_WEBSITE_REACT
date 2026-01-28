import getPrisma from '../prisma/db.js';

export const getFeed = async (c) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const posts = await prisma.post.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { username: true, name: true, profileImage: true }
                },
                _count: {
                    select: { likes: true, comments: true }
                }
            }
        });
        return c.json(posts);
    } catch (error) {
        console.error("Feed Error:", error);
        return c.json({ success: false, error: `Feed failure: ${error.message}` }, 500);
    }
};

export const createPost = async (c) => {
    try {
        const { caption, imageUrl } = await c.req.json();
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        if (!imageUrl) {
            return c.json({ success: false, error: "Image URL is required" }, 400);
        }

        const post = await prisma.post.create({
            data: {
                caption,
                imageUrl,
                userId: user.userId
            },
            include: {
                user: {
                    select: { username: true, name: true, profileImage: true }
                }
            }
        });
        return c.json({ success: true, data: post }, 201);
    } catch (error) {
        console.error("Post Creation Error:", error);
        return c.json({ success: false, error: "Post synchronization failed" }, 500);
    }
};
