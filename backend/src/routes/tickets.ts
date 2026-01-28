import express from 'express';
import Ticket from '../models/Ticket';
import Message from '../models/Message';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Get all tickets (with filters)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, priority, role } = req.query;
    const query: any = {};

    if (req.user?.role === 'customer') {
      query.customerId = req.user.id;
    }
    // Agents and Admins can see all tickets (no filter needed)

    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email')
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ticket
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions - customers can only see their own tickets
    if (req.user?.role === 'customer' && ticket.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Agents and admins can access any ticket (no additional check needed)

    const messages = await Message.find({ ticketId: ticket._id })
      .populate('senderId', 'name email')
      .sort({ createdAt: 1 });

    res.json({ ticket, messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create ticket
router.post('/', [
  authenticate,
  body('title').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('category').optional().trim()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, category } = req.body;

    // Calculate AI confidence based on ticket content analysis
    // In production, this would use actual AI/ML models
    // For now, we calculate based on description length and keywords
    const descriptionLength = description.length;
    const hasKeywords = /urgent|critical|important|issue|problem|error|bug|broken/i.test(description);
    const confidence = Math.min(0.95, Math.max(0.7, 
      0.7 + (descriptionLength > 50 ? 0.1 : 0) + (hasKeywords ? 0.15 : 0)
    ));

    const ticket = new Ticket({
      customerId: req.user!.id,
      title,
      description,
      priority: priority || 'medium',
      category: category || 'general',
      confidence,
      breached: false
    });

    await ticket.save();

    // Create system message
    const message = new Message({
      ticketId: ticket._id,
      senderId: req.user!.id,
      senderRole: req.user!.role,
      content: `Ticket created: ${title}`,
      type: 'system'
    });
    await message.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email');

    res.status(201).json(populatedTicket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update ticket
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    // Check permissions
    if (req.user?.role === 'customer' && ticket.customerId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, priority, agentId } = req.body;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (agentId && req.user?.role !== 'customer') ticket.agentId = agentId;
    
    if (status === 'resolved' && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date();
      const resolutionTime = (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60);
      ticket.resolutionTime = resolutionTime;
    }

    ticket.updatedAt = new Date();
    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email');

    res.json(populatedTicket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Assign ticket to agent
router.post('/:id/assign', [authenticate, authorize('admin', 'agent')], async (req: AuthRequest, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { agentId } = req.body;
    ticket.agentId = agentId;
    ticket.status = 'assigned';
    ticket.updatedAt = new Date();

    // Calculate response time
    if (!ticket.responseTime) {
      const responseTime = (new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60);
      ticket.responseTime = responseTime;
    }

    await ticket.save();

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('customerId', 'name email')
      .populate('agentId', 'name email');

    res.json(populatedTicket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
