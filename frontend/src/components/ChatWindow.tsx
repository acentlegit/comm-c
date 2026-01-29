import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../utils/socket';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface ChatMessage {
  _id?: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  createdAt: string;
  type?: string;
}

interface ChatWindowProps {
  sessionId: string;
  onClose: () => void;
}

export default function ChatWindow({ sessionId, onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const socket = getSocket();

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await api.get(`/chat/session/${sessionId}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    if (socket) {
      socket.emit('chat:join', sessionId);
      socket.on('chat:message', (message: ChatMessage) => {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) {
            return prev;
          }
          return [...prev, message];
        });
      });
    }

    return () => {
      if (socket) {
        socket.emit('chat:leave', sessionId);
        socket.off('chat:message');
      }
    };
  }, [sessionId, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      // Save message via API
      const response = await api.post(`/chat/session/${sessionId}/message`, {
        content: messageContent
      });

      const savedMessage = response.data;
      
      // Also emit via socket for real-time updates
      if (socket) {
        socket.emit('chat:message', { 
          sessionId, 
          message: {
            _id: savedMessage._id,
            content: savedMessage.content,
            senderId: savedMessage.senderId._id || savedMessage.senderId,
            senderName: savedMessage.senderId.name || user?.name || 'You',
            senderRole: savedMessage.senderRole || user?.role || 'customer',
            createdAt: savedMessage.createdAt
          }
        });
      }

      // Add to local state
      setMessages((prev) => [...prev, {
        _id: savedMessage._id,
        content: savedMessage.content,
        senderId: savedMessage.senderId._id || savedMessage.senderId,
        senderName: savedMessage.senderId.name || user?.name || 'You',
        senderRole: savedMessage.senderRole || user?.role || 'customer',
        createdAt: savedMessage.createdAt
      }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
      setNewMessage(messageContent); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-brand-cardBg rounded-2xl w-full max-w-2xl h-[600px] flex flex-col border border-brand-border shadow-2xl">
        <div className="p-4 border-b border-brand-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-brand-title">💬 Chat Support</h2>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-brand-body text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-brand-muted py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.senderId === user?.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-brand-sectionBg text-brand-body'
                  }`}
                >
                  <div className="text-xs opacity-75 mb-1">{msg.senderName}</div>
                  <div>{msg.content}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {format(new Date(msg.createdAt), 'HH:mm')}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t border-brand-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryHover transition disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
