import { Hono } from 'hono';
import { getProfile, updateProfile, getSavedItems, getSuggestedUsers, getResonance, searchUsers, updateActivity } from '../controllers/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const user = new Hono();

user.get('/profile/:username', getProfile);
user.get('/saved', authenticateToken, getSavedItems);
user.get('/suggested', getSuggestedUsers);
user.get('/resonance/:username', authenticateToken, getResonance);
user.get('/search', searchUsers);
user.put('/update', authenticateToken, updateProfile);
user.post('/activity', authenticateToken, updateActivity);

export default user;
