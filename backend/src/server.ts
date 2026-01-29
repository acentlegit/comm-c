import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import ticketRoutes from './routes/tickets';
import messageRoutes from './routes/messages';
import analyticsRoutes from './routes/analytics';
import chatRoutes from './routes/chat';
import secureUsersRoutes from './routes/secureUsers';
import usersRoutes from './routes/users';
import livekitRoutes from './routes/livekit';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/command-center';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.get('/health', (_, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/secure/users', secureUsersRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/livekit', livekitRoutes);

// Socket.io for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join ticket room
  socket.on('join:ticket', (ticketId: string) => {
    socket.join(`ticket:${ticketId}`);
    console.log(`Socket ${socket.id} joined ticket:${ticketId}`);
  });

  // Leave ticket room
  socket.on('leave:ticket', (ticketId: string) => {
    socket.leave(`ticket:${ticketId}`);
    console.log(`Socket ${socket.id} left ticket:${ticketId}`);
  });

  // New message
  socket.on('message:new', (data: { ticketId: string; message: any }) => {
    io.to(`ticket:${data.ticketId}`).emit('message:received', data.message);
  });

  // Ticket update
  socket.on('ticket:update', (data: { ticketId: string; ticket: any }) => {
    io.to(`ticket:${data.ticketId}`).emit('ticket:updated', data.ticket);
    io.emit('tickets:refresh'); // Notify all clients to refresh ticket list
  });

  // Chat session events
  socket.on('chat:join', (sessionId: string) => {
    socket.join(`chat:${sessionId}`);
    console.log(`Socket ${socket.id} joined chat:${sessionId}`);
  });

  socket.on('chat:leave', (sessionId: string) => {
    socket.leave(`chat:${sessionId}`);
    console.log(`Socket ${socket.id} left chat:${sessionId}`);
  });

  socket.on('chat:message', async (data: { sessionId: string; message: any }) => {
    try {
      // Save message to database
      const ChatMessageModel = (await import('./models/ChatMessage')).default;
      const chatMessage = new ChatMessageModel({
        sessionId: data.sessionId,
        senderId: data.message.senderId,
        senderName: data.message.senderName,
        senderRole: data.message.senderRole,
        content: data.message.content
      });
      await chatMessage.save();

      // Broadcast to all participants in the session
      io.to(`chat:${data.sessionId}`).emit('chat:message', {
        ...data.message,
        _id: chatMessage._id,
        createdAt: chatMessage.createdAt
      });
      console.log(`Message saved and sent to chat:${data.sessionId}`);
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Still broadcast even if save fails
      io.to(`chat:${data.sessionId}`).emit('chat:message', data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Command Center Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
