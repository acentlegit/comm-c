import express from 'express';
import User from '../models/User';
import { authenticate, requireScope, AuthRequest } from '../middleware/auth';

const router = express.Router();

// List users (requires users:read scope, inspired by uam-hardening-pack/secure-users.js)
router.get('/', authenticate, requireScope('users:read'), async (req: AuthRequest, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (admin function) - requires users:create scope
router.post('/', authenticate, requireScope('users:create'), async (req: AuthRequest, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const user = new User({ email, password, name, role });
    await user.save();

    res.status(201).json({ id: user._id, email: user.email, name: user.name, role: user.role });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

