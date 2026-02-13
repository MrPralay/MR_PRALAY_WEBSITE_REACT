import { Hono } from 'hono';
import {
    getFeed,
    createPost,
    getUploadUrl,
    toggleLike,
    addComment,
    toggleSave,
    getComments,
    getStories,
    createStory,
    deleteStory,
    viewStory,
    replyToStory,
    getStoryDetails,
    getExploreFeed,
    toggleCommentLike,
    getPostLikers
} from '../controllers/socialController.js';
import { toggleFollow } from '../controllers/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const social = new Hono();

// Public/Semi-public Feed
social.get('/feed', getFeed);
social.get('/explore', getExploreFeed);
social.post('/upload-url', authenticateToken, getUploadUrl);

// Protected Interaction Routes
social.post('/posts', authenticateToken, createPost);
social.post('/posts/:id/like', authenticateToken, toggleLike);
social.post('/posts/:id/comment', authenticateToken, addComment);
social.post('/comments/:id/like', authenticateToken, toggleCommentLike);
social.get('/posts/:id/comments', getComments);
social.get('/posts/:id/likers', authenticateToken, getPostLikers);
social.post('/posts/:id/save', authenticateToken, toggleSave);
social.post('/users/:id/follow', authenticateToken, toggleFollow);

// Story System
social.get('/stories', getStories);
social.post('/stories', authenticateToken, createStory);
social.delete('/stories/:id', authenticateToken, deleteStory);
social.post('/stories/:id/view', authenticateToken, viewStory);
social.post('/stories/:id/reply', authenticateToken, replyToStory);
social.get('/stories/:id/details', authenticateToken, getStoryDetails);

export default social;
