import { Hono } from 'hono';
import {
    getConversations,
    getMessages,
    sendMessage,
    deleteMessage,
    getNotes,
    createNote,
    deleteNote,
    updateTypingStatus
} from '../controllers/messageController.js';
import authenticateToken from '../middleware/authMiddleware.js';

const messages = new Hono();

// Notes
messages.get('/notes', authenticateToken, getNotes);
messages.post('/notes', authenticateToken, createNote);
messages.delete('/notes', authenticateToken, deleteNote);

// Messaging
messages.get('/conversations', authenticateToken, getConversations);
messages.get('/conversations/:id/messages', authenticateToken, getMessages);
messages.post('/send', authenticateToken, sendMessage);
messages.post('/typing', authenticateToken, updateTypingStatus);
messages.delete('/:id', authenticateToken, deleteMessage);

export default messages;
