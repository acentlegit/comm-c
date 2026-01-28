import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

interface Message {
  _id: string;
  content: string;
  senderId: { name: string; email: string };
  senderRole: string;
  type: string;
  createdAt: string;
  read: boolean;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  confidence: number;
  breached: boolean;
  createdAt: string;
  customerId?: { name: string; email: string };
  agentId?: { name: string; email: string };
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetchTicket();
    const socket = getSocket();
    if (socket) {
      socket.emit('join:ticket', id);
      socket.on('message:received', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });
      socket.on('ticket:updated', (updatedTicket: Ticket) => {
        setTicket(updatedTicket);
      });
      return () => {
        socket.emit('leave:ticket', id);
        socket.off('message:received');
        socket.off('ticket:updated');
      };
    }
  }, [id]);

  const fetchTicket = async () => {
    if (!id) return;
    try {
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      const response = await api.post('/messages', {
        ticketId: id,
        content: newMessage
      });
      setMessages((prev) => [...prev, response.data]);
      setNewMessage('');

      const socket = getSocket();
      if (socket) {
        socket.emit('message:new', { ticketId: id, message: response.data });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading ticket...</div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout>
        <div className="text-center py-8">Ticket not found</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{ticket.title}</h1>
            <p className="text-gray-600">{ticket.description}</p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded text-sm ${ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {ticket.priority}
            </span>
            <span className={`px-3 py-1 rounded text-sm ${ticket.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {ticket.status}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Created: {format(new Date(ticket.createdAt), 'PPpp')}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-4" style={{ height: '400px', overflowY: 'auto' }}>
        <h2 className="font-semibold mb-4">Messages</h2>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${message.senderRole === user?.role ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.senderRole === user?.role
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <div className="text-xs mb-1">{message.senderId.name}</div>
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-75">
                  {format(new Date(message.createdAt), 'HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Send
        </button>
      </form>
    </Layout>
  );
}
