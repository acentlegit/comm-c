# LiveKit Setup Guide

This application uses LiveKit for voice and video call functionality. Follow these steps to set up LiveKit:

## Option 1: Local Development (Docker)

1. **Install Docker** (if not already installed)
   - Download from: https://www.docker.com/products/docker-desktop

2. **Run LiveKit Server**
   ```bash
   docker run -p 7880:7880 livekit/livekit-server --dev
   ```

3. **Update Backend Environment Variables**
   Create or update `backend/.env`:
   ```
   LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=secret
   ```

## Option 2: LiveKit Cloud (Production) ✅ CONFIGURED

**LiveKit Cloud is already configured for this project!**

The following credentials are set in `backend/.env`:
```
LIVEKIT_URL=wss://family-tree-z2e5ucpb.livekit.cloud
LIVEKIT_API_KEY=APIEQoDjNRiSxUA
LIVEKIT_API_SECRET=eeIs6xFAcMHNGRX24uF2lQ3AxESAS5TGeRwkdOfUwc4A
```

**No additional setup required!** The backend will automatically use these credentials when generating LiveKit tokens for video and voice calls.

## Testing the Features

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend Server**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Chat Support**
   - Login as a customer
   - Click "💬 Chat Support"
   - Start chatting (works without LiveKit)

4. **Test Voice Call**
   - Click "📞 Voice Call"
   - Grant microphone permissions
   - Voice calls use LiveKit for better quality

5. **Test Video Call**
   - Click "📹 Video Call"
   - Grant camera and microphone permissions
   - Video calls require LiveKit server to be running

## Troubleshooting

### "Failed to connect to room" Error
- Ensure LiveKit server is running
- Check that `LIVEKIT_URL` in backend/.env matches your LiveKit server URL
- Verify API key and secret are correct

### Microphone/Camera Not Working
- Check browser permissions
- Ensure HTTPS in production (required for media access)
- Try a different browser

### Connection Issues
- Check firewall settings
- Verify port 7880 is accessible (for local setup)
- Check network connectivity

## Features

- **Chat Support**: Real-time text messaging via Socket.io (works without LiveKit)
- **Voice Call**: High-quality voice calls via LiveKit
- **Video Call**: Full video conferencing via LiveKit with screen sharing support
