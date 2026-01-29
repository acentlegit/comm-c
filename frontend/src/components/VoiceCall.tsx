import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

interface VoiceCallProps {
  sessionId: string;
  roomName: string;
  onClose: () => void;
}

export default function VoiceCall({ sessionId, roomName, onClose }: VoiceCallProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    connectToRoom();
    const interval = setInterval(() => {
      if (isConnected) {
        setCallDuration((prev) => prev + 1);
      }
    }, 1000);

    return () => {
      disconnectFromRoom();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (room) {
      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    }

    return () => {
      if (room) {
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
      await newRoom.connect(url, token);

      // Enable microphone only (voice call)
      await newRoom.localParticipant.setMicrophoneEnabled(true);

      setRoom(newRoom);
      setIsConnected(true);
    } catch (error) {
      console.error('Error connecting to room:', error);
      // Fallback to basic WebRTC if LiveKit fails
      startBasicVoiceCall();
    }
  };

  const startBasicVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (audioRef.current) {
        audioRef.current.srcObject = stream;
      }
      setIsConnected(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const disconnectFromRoom = async () => {
    if (room) {
      room.disconnect();
      setRoom(null);
    }
    setIsConnected(false);
  };

  const handleTrackSubscribed = (track: any, publication: any, participant: RemoteParticipant) => {
    if (track.kind === 'audio' && audioRef.current) {
      track.attach(audioRef.current);
    }
  };

  const handleTrackUnsubscribed = (track: any) => {
    track.detach();
  };

  const toggleMute = async () => {
    if (room) {
      await room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = () => {
    disconnectFromRoom();
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-cardBg rounded-2xl w-full max-w-md p-6 border border-brand-border shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">📞</div>
          <h2 className="text-2xl font-bold text-brand-title mb-2">Voice Call</h2>
          <p className="text-brand-muted">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>
          {isConnected && (
            <p className="text-brand-primary font-semibold mt-2">
              {formatTime(callDuration)}
            </p>
          )}
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={toggleMute}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
              isMuted
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-brand-primary text-white hover:bg-brand-primaryHover'
            }`}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center text-2xl transition"
          >
            📞
          </button>
        </div>

        <div className="text-center text-sm text-brand-muted">
          <p>Room: {roomName}</p>
          <p className="mt-2">Waiting for agent to join...</p>
        </div>

        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
}
