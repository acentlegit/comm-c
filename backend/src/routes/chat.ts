import express from 'express';
import ChatSession from '../models/ChatSession';
import Ticket from '../models/Ticket';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Create chat session
router.post('/session', [
  authenticate,
  body('type').isIn(['chat', 'voice', 'video'])
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, ticketId } = req.body;

    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can create chat sessions' });
    }

    const session = new ChatSession({
      customerId: req.user.id,
      type,
      ticketId,
      status: 'waiting'
    });

    await session.save();

    const populatedSession = await ChatSession.findById(session._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email')
      .populate('ticketId');

    res.status(201).json(populatedSession);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get active sessions
router.get('/sessions', authenticate, async (req: AuthRequest, res) => {
  try {
    const query: any = { status: { $in: ['waiting', 'active'] } };

    if (req.user?.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user?.role === 'agent') {
      query.agentId = req.user.id;
    }

    const sessions = await ChatSession.find(query)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email')
      .populate('ticketId')
      .sort({ startedAt: -1 });

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Join session (agent)
router.post('/session/:id/join', [authenticate], async (req: AuthRequest, res) => {
  try {
    if (req.user?.role === 'customer') {
      return res.status(403).json({ error: 'Only agents can join sessions' });
    }

    const session = await ChatSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status === 'ended') {
      return res.status(400).json({ error: 'Session has ended' });
    }

    session.agentId = req.user!.id;
    session.status = 'active';
    await session.save();

    const populatedSession = await ChatSession.findById(session._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email')
      .populate('ticketId');

    res.json(populatedSession);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// End session
router.post('/session/:id/end', authenticate, async (req: AuthRequest, res) => {
  try {
    const session = await ChatSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check permissions
    if (req.user?.role === 'customer' && session.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    session.status = 'ended';
    session.endedAt = new Date();
    session.duration = (session.endedAt.getTime() - session.startedAt.getTime()) / 1000;
    await session.save();

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
