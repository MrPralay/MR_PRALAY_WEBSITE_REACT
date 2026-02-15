import { Hono } from 'hono';
import {
    getConversations,
    getMessages,
    sendMessage,
    deleteMessage,
    getNotes,
    createNote,
    deleteNote,
    updateTypingStatus,
    getTypingStatus,
    streamTyping
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
messages.get('/typing/pulse', authenticateToken, updateTypingStatus); // GET Pulse (Specific route must come first)
messages.get('/typing/:conversationId', authenticateToken, getTypingStatus); // Restored Generic Fallback
messages.get('/typing/stream/:conversationId', authenticateToken, streamTyping); // SSE Stream
messages.delete('/:id', authenticateToken, deleteMessage);

export default messages;
