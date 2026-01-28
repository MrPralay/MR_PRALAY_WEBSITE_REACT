import getPrisma from '../prisma/db.js';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getFeed = async (c) => {
    try {
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        const posts = await prisma.post.findMany({
            take: 30,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        profileImage: true
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        savedBy: true
                    }
                },
                likes: user ? {
                    where: { userId: user.userId },
                    select: { id: true }
                } : false,
                savedBy: user ? {
                    where: { userId: user.userId },
                    select: { id: true }
                } : false
            }
        });

        // Transform to include helpful flags
        const formattedPosts = posts.map(post => ({
            ...post,
            isLiked: (post.likes?.length || 0) > 0,
            isSaved: (post.savedBy?.length || 0) > 0,
            likes: undefined, // remove raw array
            savedBy: undefined // remove raw array
        }));

        return c.json(formattedPosts);
    } catch (error) {
        console.error("Neural Feed Sync Error:", error);
        return c.json({ success: false, error: "Feed synchronization failed" }, 500);
    }
};

export const getUploadUrl = async (c) => {
    try {
        const { fileName, fileType } = await c.req.json();
        const user = c.get('user');

        // Check for Supabase configuration
        if (!c.env.SUPABASE_STORAGE_URL || !c.env.SUPABASE_ACCESS_KEY_ID || !c.env.SUPABASE_SECRET_ACCESS_KEY || !c.env.SUPABASE_BUCKET_NAME) {
            return c.json({
                success: false,
                error: "Infrastructure Saturated: Supabase Storage not configured. Please add keys to Cloudflare Secrets."
            }, 503);
        }

        const s3 = new S3Client({
            region: c.env.SUPABASE_REGION || "ap-northeast-1",
            endpoint: c.env.SUPABASE_STORAGE_URL,
            credentials: {
                accessKeyId: c.env.SUPABASE_ACCESS_KEY_ID,
                secretAccessKey: c.env.SUPABASE_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true, // Required for Supabase S3
        });

        const key = `${user.userId}/${Date.now()}-${fileName}`;
        const command = new PutObjectCommand({
            Bucket: c.env.SUPABASE_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        // Supabase Public URL Structure:
        // https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[KEY]
        const projectUrl = c.env.SUPABASE_STORAGE_URL.split('/storage')[0];
        const publicUrl = `${projectUrl}/storage/v1/object/public/${c.env.SUPABASE_BUCKET_NAME}/${key}`;

        return c.json({ success: true, uploadUrl, publicUrl });
    } catch (error) {
        console.error("Neural Storage Sync Error:", error);
        return c.json({ success: false, error: "Supabase connection severed" }, 500);
    }
};

export const createPost = async (c) => {
    try {
        const { caption, mediaUrl, type, postPassword, thumbnailUrl } = await c.req.json();
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        if (!mediaUrl) {
            return c.json({ success: false, error: "Media resource required" }, 400);
        }

        const post = await prisma.post.create({
            data: {
                caption: caption || "",
                mediaUrl,
                type: type || 'IMAGE', // IMAGE or VIDEO
                postPassword: postPassword || null,
                thumbnailUrl: thumbnailUrl || null,
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
        console.error("Neural Post Broadcast Error:", error);
        return c.json({ success: false, error: "Post transmission failed" }, 500);
    }
};

export const toggleLike = async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId: user.userId,
                    postId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({ where: { id: existingLike.id } });
            return c.json({ success: true, action: 'unliked' });
        } else {
            await prisma.like.create({
                data: {
                    userId: user.userId,
                    postId
                }
            });
            return c.json({ success: true, action: 'liked' });
        }
    } catch (error) {
        console.error("Neural Like Toggle Error:", error);
        return c.json({ success: false, error: "Link interaction failed" }, 500);
    }
};

export const addComment = async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const { content } = await c.req.json();
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        if (!content) return c.json({ success: false, error: "Synapse content required" }, 400);

        const comment = await prisma.comment.create({
            data: {
                content,
                userId: user.userId,
                postId
            },
            include: {
                user: {
                    select: { username: true, profileImage: true }
                }
            }
        });

        return c.json({ success: true, data: comment });
    } catch (error) {
        return c.json({ success: false, error: "Comment synchronization failed" }, 500);
    }
};

export const toggleSave = async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const user = c.get('user');
        const prisma = getPrisma(c.env.DATABASE_URL);

        const existingSave = await prisma.savedPost.findUnique({
            where: {
                userId_postId: {
                    userId: user.userId,
                    postId
                }
            }
        });

        if (existingSave) {
            await prisma.savedPost.delete({ where: { id: existingSave.id } });
            return c.json({ success: true, action: 'unsaved' });
        } else {
            await prisma.savedPost.create({
                data: {
                    userId: user.userId,
                    postId
                }
            });
            return c.json({ success: true, action: 'saved' });
        }
    } catch (error) {
        return c.json({ success: false, error: "Archive interaction failed" }, 500);
    }
};

export const getComments = async (c) => {
    try {
        const postId = parseInt(c.req.param('id'));
        const prisma = getPrisma(c.env.DATABASE_URL);

        const comments = await prisma.comment.findMany({
            where: { postId },
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: { username: true, profileImage: true }
                }
            }
        });

        return c.json(comments);
    } catch (error) {
        return c.json({ success: false, error: "Comment retrieval failed" }, 500);
    }
};
