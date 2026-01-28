import { Hono } from 'hono';
import {
    getFeed,
    createPost,
    getUploadUrl,
    toggleLike,
    addComment,
    toggleSave,
    getComments
} from '../controllers/socialController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const social = new Hono();

// Public/Semi-public Feed
social.get('/feed', getFeed);
social.post('/upload-url', authenticateToken, getUploadUrl);

// Protected Interaction Routes
social.post('/posts', authenticateToken, createPost);
social.post('/posts/:id/like', authenticateToken, toggleLike);
social.post('/posts/:id/comment', authenticateToken, addComment);
social.get('/posts/:id/comments', getComments);
social.post('/posts/:id/save', authenticateToken, toggleSave);

export default social;
