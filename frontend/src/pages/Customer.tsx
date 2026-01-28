import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TicketCard from '../components/TicketCard';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'assigned' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  breached: boolean;
  createdAt: string;
}

export default function Customer() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchTickets();
    fetchActiveSessions();
    fetchCustomerStats();
    const socket = getSocket();
    if (socket) {
      socket.on('tickets:refresh', () => {
        fetchTickets();
        fetchCustomerStats();
      });
      return () => {
        socket.off('tickets:refresh');
      };
    }
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setActiveSessions(response.data.filter((s: any) => s.status === 'active' || s.status === 'waiting'));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Demo mode: Use empty array or mock data
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };


  const handleStartChat = async (type: 'chat' | 'voice' | 'video') => {
    try {
      await api.post('/chat/session', { type });
      await fetchActiveSessions();
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} session created! Waiting for agent...`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to start session');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  useEffect(() => {
    if (tickets.length > 0) {
      fetchCustomerStats();
    }
  }, [tickets.length]);

  const fetchCustomerStats = async () => {
    try {
      const response = await api.get('/analytics/customer-stats');
      setStats(response.data);
    } catch (error) {
      // Fallback to calculated stats if API fails
      setStats({
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        inProgress: tickets.filter(t => t.status === 'in-progress' || t.status === 'assigned').length,
        resolved: tickets.filter(t => t.status === 'resolved').length
      });
    }
  };

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-title">Customer Support</h1>
        <button
          onClick={() => window.open('http://ticket-tracker-dev.s3-website-us-east-1.amazonaws.com', '_blank')}
          className="px-6 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primaryHover transition shadow-sm"
        >
          Create Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => handleStartChat('chat')}
          className="p-6 bg-brand-cardBg rounded-2xl shadow hover:shadow-lg transition text-left border border-brand-border"
        >
          <div className="text-4xl mb-2">💬</div>
          <h3 className="font-semibold text-lg mb-1 text-brand-body">Chat Support</h3>
          <p className="text-sm text-brand-muted">Start a text chat with an agent</p>
        </button>
        <button
          onClick={() => handleStartChat('voice')}
          className="p-6 bg-brand-cardBg rounded-2xl shadow hover:shadow-lg transition text-left border border-brand-border"
        >
          <div className="text-4xl mb-2">📞</div>
          <h3 className="font-semibold text-lg mb-1 text-brand-body">Voice Call</h3>
          <p className="text-sm text-brand-muted">Connect via voice call</p>
        </button>
        <button
          onClick={() => handleStartChat('video')}
          className="p-6 bg-brand-cardBg rounded-2xl shadow hover:shadow-lg transition text-left border border-brand-border"
        >
          <div className="text-4xl mb-2">📹</div>
          <h3 className="font-semibold text-lg mb-1 text-brand-body">Video Call</h3>
          <p className="text-sm text-brand-muted">Start a video call session</p>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-cardBg p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Total</div>
          <div className="text-2xl font-bold text-brand-primary">{stats.total}</div>
        </div>
        <div className="bg-brand-primarySoft p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Open</div>
          <div className="text-2xl font-bold text-brand-primary">{stats.open}</div>
        </div>
        <div className="bg-amber-50 p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">In Progress</div>
          <div className="text-2xl font-bold text-amber-500">{stats.inProgress}</div>
        </div>
        <div className="bg-emerald-50 p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Resolved</div>
          <div className="text-2xl font-bold text-emerald-500">{stats.resolved}</div>
        </div>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="mb-6 bg-brand-accentSoft p-4 rounded-lg border border-brand-border">
          <h3 className="font-semibold mb-2 text-brand-title">Active Sessions</h3>
          <div className="space-y-2">
            {activeSessions.map((session: any) => (
              <div key={session._id} className="flex justify-between items-center text-sm">
                <span className="capitalize">{session.type} session</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  session.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {session.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-brand-title">My Tickets</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8 text-brand-muted">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-brand-muted">No tickets found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>

    </Layout>
  );
}
