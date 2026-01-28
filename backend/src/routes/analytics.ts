import express from 'express';
import Ticket from '../models/Ticket';
import Message from '../models/Message';
import ChatSession from '../models/ChatSession';
import User from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get dashboard analytics (admin only)
router.get('/dashboard', [authenticate, authorize('admin')], async (req: AuthRequest, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Ticket statistics - ALL FROM DATABASE
    const totalTickets = await Ticket.countDocuments();
    const openTickets = await Ticket.countDocuments({ status: { $in: ['open', 'assigned', 'in-progress'] } });
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const breachedTickets = await Ticket.countDocuments({ breached: true });

    // Today's stats - FROM DATABASE
    const ticketsToday = await Ticket.countDocuments({ createdAt: { $gte: today } });
    const resolvedToday = await Ticket.countDocuments({ 
      resolvedAt: { $gte: today },
      status: 'resolved'
    });

    // This week's stats - FROM DATABASE
    const ticketsThisWeek = await Ticket.countDocuments({ createdAt: { $gte: thisWeek } });
    const resolvedThisWeek = await Ticket.countDocuments({ 
      resolvedAt: { $gte: thisWeek },
      status: 'resolved'
    });

    // This month's stats - FROM DATABASE
    const ticketsThisMonth = await Ticket.countDocuments({ createdAt: { $gte: thisMonth } });
    const resolvedThisMonth = await Ticket.countDocuments({ 
      resolvedAt: { $gte: thisMonth },
      status: 'resolved'
    });

    // Average response and resolution times - FROM DATABASE
    const ticketsWithTimes = await Ticket.find({
      responseTime: { $exists: true },
      resolutionTime: { $exists: true }
    });

    const avgResponseTime = ticketsWithTimes.length > 0
      ? ticketsWithTimes.reduce((sum, t) => sum + (t.responseTime || 0), 0) / ticketsWithTimes.length
      : 0;

    const avgResolutionTime = ticketsWithTimes.length > 0
      ? ticketsWithTimes.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / ticketsWithTimes.length
      : 0;

    // Priority distribution - FROM DATABASE AGGREGATION
    const priorityStats = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Status distribution - FROM DATABASE AGGREGATION
    const statusStats = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Agent performance - FROM DATABASE AGGREGATION
    const agentStats = await Ticket.aggregate([
      { $match: { agentId: { $exists: true } } },
      {
        $group: {
          _id: '$agentId',
          totalTickets: { $sum: 1 },
          resolvedTickets: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          avgResolutionTime: { $avg: '$resolutionTime' }
        }
      },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'agent'
        }
      },
      { $unwind: '$agent' },
      { $project: {
          agentName: '$agent.name',
          agentEmail: '$agent.email',
          totalTickets: 1,
          resolvedTickets: 1,
          avgResolutionTime: 1
        }
      }
    ]);

    // Chat sessions - FROM DATABASE
    const activeChats = await ChatSession.countDocuments({ status: 'active' });
    const totalChats = await ChatSession.countDocuments();

    res.json({
      tickets: {
        total: totalTickets,
        open: openTickets,
        resolved: resolvedTickets,
        breached: breachedTickets,
        today: ticketsToday,
        thisWeek: ticketsThisWeek,
        thisMonth: ticketsThisMonth,
        resolvedToday,
        resolvedThisWeek,
        resolvedThisMonth
      },
      performance: {
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        resolutionRate: totalTickets > 0 ? (resolvedTickets / totalTickets) * 100 : 0
      },
      priorityDistribution: priorityStats,
      statusDistribution: statusStats,
      agentPerformance: agentStats,
      chats: {
        active: activeChats,
        total: totalChats
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent analytics - FROM DATABASE
router.get('/agent/:agentId', [authenticate, authorize('admin', 'agent')], async (req: AuthRequest, res) => {
  try {
    const agentId = req.params.agentId;
    
    // Check if user is requesting their own stats or is admin
    if (req.user?.role !== 'admin' && req.user?.id !== agentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all tickets for this agent - FROM DATABASE
    const agentTickets = await Ticket.find({ agentId });
    const resolvedTickets = agentTickets.filter(t => t.status === 'resolved').length;
    const avgResolutionTime = agentTickets
      .filter(t => t.resolutionTime)
      .reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / 
      (agentTickets.filter(t => t.resolutionTime).length || 1);

    res.json({
      totalTickets: agentTickets.length,
      resolvedTickets,
      avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
      openTickets: agentTickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get agent dashboard stats - FROM DATABASE
router.get('/agent-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'agent') {
      return res.status(403).json({ error: 'Only agents can access this endpoint' });
    }

    const agentId = req.user.id;

    // Get all tickets for this agent - FROM DATABASE
    const allTickets = await Ticket.find({ 
      $or: [
        { agentId },
        { status: 'open' }
      ]
    });

    const myTickets = await Ticket.find({ agentId });
    
    const stats = {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      assigned: allTickets.filter(t => t.status === 'assigned' && t.agentId?.toString() === agentId).length,
      inProgress: allTickets.filter(t => t.status === 'in-progress' && t.agentId?.toString() === agentId).length,
      resolved: myTickets.filter(t => t.status === 'resolved').length,
      myTotal: myTickets.length
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer stats - FROM DATABASE
router.get('/customer-stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can access this endpoint' });
    }

    const customerId = req.user.id;

    // Get all tickets for this customer - FROM DATABASE
    const tickets = await Ticket.find({ customerId });
    
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
