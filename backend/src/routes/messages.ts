import express from 'express';
import Message from '../models/Message';
import Ticket from '../models/Ticket';
import { authenticate, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get messages for a ticket
router.get('/ticket/:ticketId', authenticate, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    if (req.user?.role === 'customer' && ticket.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await Message.find({ ticketId: req.params.ticketId })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/', [
  authenticate,
  body('ticketId').notEmpty(),
  body('content').trim().notEmpty()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ticketId, content, type } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    if (req.user?.role === 'customer' && ticket.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update ticket status if needed
    if (ticket.status === 'open' && req.user?.role !== 'customer') {
      ticket.status = 'in-progress';
      ticket.updatedAt = new Date();
      await ticket.save();
    }

    const message = new Message({
      ticketId,
      senderId: req.user!.id,
      senderRole: req.user!.role,
      content,
      type: type || 'text'
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email');

    res.status(201).json(populatedMessage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.put('/:ticketId/read', authenticate, async (req: AuthRequest, res) => {
  try {
    await Message.updateMany(
      { 
        ticketId: req.params.ticketId,
        senderId: { $ne: req.user!.id }
      },
      { read: true }
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
