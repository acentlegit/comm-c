import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get LiveKit token for video/voice calls
router.post('/token', authenticate, async (req: AuthRequest, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    // LiveKit server configuration
    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
    const livekitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.user!.id,
      name: participantName,
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    res.json({
      token,
      url: livekitUrl,
      roomName,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
