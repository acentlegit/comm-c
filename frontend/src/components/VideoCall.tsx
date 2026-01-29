import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant, LocalParticipant } from 'livekit-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface VideoCallProps {
  sessionId: string;
  roomName: string;
  onClose: () => void;
}

export default function VideoCall({ sessionId, roomName, onClose }: VideoCallProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    connectToRoom();
    return () => {
      disconnectFromRoom();
    };
  }, []);

  useEffect(() => {
    if (room) {
      room.on(RoomEvent.ParticipantConnected, handleParticipantConnected);
      room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    }

    return () => {
      if (room) {
        room.off(RoomEvent.ParticipantConnected, handleParticipantConnected);
        room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
        room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
        room.off(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
      }
    };
  }, [room]);

  const connectToRoom = async () => {
    try {
      // Get LiveKit token from backend
      const response = await api.post('/livekit/token', {
        roomName,
        participantName: user?.name || 'Customer',
      });

      const { token, url } = response.data;

      // Create room and connect
      const newRoom = new Room();
      
      // Set up event listeners before connecting
      newRoom.on(RoomEvent.Connected, () => {
        console.log('Connected to LiveKit room');
        setIsConnected(true);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('Disconnected from LiveKit room');
        setIsConnected(false);
      });

      await newRoom.connect(url, token);

      // Enable camera and microphone
      try {
        await newRoom.localParticipant.enableCameraAndMicrophone();
      } catch (mediaError) {
        console.error('Error enabling media:', mediaError);
        // Continue even if media fails - user can enable manually
      }

      setRoom(newRoom);

      // Attach local video track when available
      const attachLocalVideo = () => {
        newRoom.localParticipant.videoTrackPublications.forEach((publication) => {
          if (publication.track && localVideoRef.current) {
            publication.track.attach(localVideoRef.current);
          }
        });
      };

      // Try immediately and also listen for new tracks
      attachLocalVideo();
      newRoom.localParticipant.on('trackPublished', attachLocalVideo);
    } catch (error: any) {
      console.error('Error connecting to room:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to connect';
      alert(`Failed to connect to video call: ${errorMsg}\n\nNote: LiveKit server may not be running. See LIVEKIT_SETUP.md for setup instructions.`);
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      room.disconnect();
      setRoom(null);
      setIsConnected(false);
    }
  };

  const handleParticipantConnected = (participant: RemoteParticipant) => {
    setRemoteParticipants((prev) => [...prev, participant]);
  };

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    setRemoteParticipants((prev) => prev.filter((p) => p !== participant));
  };

  const handleTrackSubscribed = (
    track: any,
    publication: any,
    participant: RemoteParticipant
  ) => {
    if (track.kind === 'video' && remoteVideoRef.current) {
      track.attach(remoteVideoRef.current);
    }
  };

  const handleTrackUnsubscribed = (track: any) => {
    track.detach();
  };

  const toggleVideo = async () => {
    if (room) {
      await room.localParticipant.setCameraEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const handleEndCall = () => {
    disconnectFromRoom();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="w-full h-full flex flex-col">
        {/* Remote video (main) */}
        <div className="flex-1 relative bg-gray-900">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {remoteParticipants.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">📹</div>
                <p className="text-xl">Waiting for agent to join...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (small) */}
        <div className="absolute bottom-24 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
          <button
            onClick={toggleAudio}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${
              isAudioEnabled
                ? 'bg-brand-primary text-white hover:bg-brand-primaryHover'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition ${
              isVideoEnabled
                ? 'bg-brand-primary text-white hover:bg-brand-primaryHover'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {isVideoEnabled ? '📹' : '📷'}
          </button>
          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-2xl transition"
          >
            📞
          </button>
        </div>

        {/* Status */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
          {isConnected ? 'Connected' : 'Connecting...'}
        </div>
      </div>
    </div>
  );
}
