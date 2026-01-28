import { Hono } from 'hono';
import { getProfile, updateProfile, getSavedItems } from '../controllers/userController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const user = new Hono();

user.get('/profile/:username', getProfile);
user.get('/saved', authenticateToken, getSavedItems);
user.put('/update', authenticateToken, updateProfile);

export default user;
