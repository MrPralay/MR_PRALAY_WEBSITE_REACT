import { Hono } from 'hono';
import { getProfile, updateProfile, getSavedItems, getSuggestedUsers } from '../controllers/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const user = new Hono();

user.get('/profile/:username', getProfile);
user.get('/saved', authenticateToken, getSavedItems);
user.get('/suggested', getSuggestedUsers);
user.put('/update', authenticateToken, updateProfile);

export default user;
