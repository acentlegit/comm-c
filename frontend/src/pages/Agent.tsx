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
  customerId?: { name: string; email: string };
  agentId?: string | { name: string; email: string };
}

export default function Agent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'status'>('date');
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [waitingSessions, setWaitingSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchTickets();
    fetchWaitingSessions();
    fetchAgentStats();
    const socket = getSocket();
    if (socket) {
      socket.on('tickets:refresh', () => {
        fetchTickets();
        fetchAgentStats();
      });
      socket.on('ticket:updated', (updatedTicket: any) => {
        const ticket: Ticket = {
          ...updatedTicket,
          status: updatedTicket.status as Ticket['status'],
          priority: updatedTicket.priority as Ticket['priority'],
          agentId: typeof updatedTicket.agentId === 'object' ? updatedTicket.agentId : undefined
        };
        setTickets((prev) =>
          prev.map((t) => (t._id === ticket._id ? ticket : t))
        );
        fetchAgentStats();
      });
      return () => {
        socket.off('tickets:refresh');
        socket.off('ticket:updated');
      };
    }
  }, []);

  const fetchWaitingSessions = async () => {
    try {
      const response = await api.get('/chat/sessions');
      setWaitingSessions(response.data.filter((s: any) => s.status === 'waiting'));
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Demo mode: Use empty array
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const handleAssignToMe = async (ticketId: string) => {
    try {
      const { data: user } = await api.get('/auth/me');
      await api.post(`/tickets/${ticketId}/assign`, { agentId: user.id });
      fetchTickets();
      fetchAgentStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign ticket');
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status });
      fetchTickets();
      fetchAgentStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update ticket');
    }
  };

  const filteredTickets = tickets
    .filter((ticket) => {
      const matchesFilter = filter === 'all' 
        ? true 
        : filter === 'my-tickets' 
          ? ticket.status !== 'open' && ticket.status !== 'closed'
          : ticket.status === filter;
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.customerId?.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      }
      if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleBulkAssign = async () => {
    try {
      const { data: user } = await api.get('/auth/me');
      for (const ticketId of selectedTickets) {
        await api.post(`/tickets/${ticketId}/assign`, { agentId: user.id });
      }
      setSelectedTickets([]);
      fetchTickets();
      fetchAgentStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign tickets');
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    try {
      for (const ticketId of selectedTickets) {
        await api.put(`/tickets/${ticketId}`, { status });
      }
      setSelectedTickets([]);
      fetchTickets();
      fetchAgentStats();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update tickets');
    }
  };

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    myTotal: 0
  });

  useEffect(() => {
    if (tickets.length > 0) {
      fetchAgentStats();
    }
  }, [tickets.length]);

  const fetchAgentStats = async () => {
    try {
      const response = await api.get('/analytics/agent-stats');
      setStats(response.data);
    } catch (error) {
      // Fallback to calculated stats if API fails
      setStats({
        total: tickets.length,
        open: tickets.filter((t) => t.status === 'open').length,
        assigned: tickets.filter((t) => t.status === 'assigned').length,
        inProgress: tickets.filter((t) => t.status === 'in-progress').length,
        resolved: tickets.filter((t) => t.status === 'resolved').length,
        myTotal: tickets.filter((t) => t.agentId && (typeof t.agentId === 'string' || t.agentId)).length
      });
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold text-brand-title mb-6">Agent Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-brand-cardBg p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Total</div>
          <div className="text-2xl font-bold text-brand-body">{stats.total}</div>
        </div>
        <div className="bg-brand-primarySoft p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Open</div>
          <div className="text-2xl font-bold text-brand-primary">{stats.open}</div>
        </div>
        <div className="bg-brand-sectionBg p-4 rounded-lg shadow border border-brand-border">
          <div className="text-xs text-brand-muted mb-1">Assigned</div>
          <div className="text-2xl font-bold text-brand-body">{stats.assigned}</div>
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

      {/* Waiting Sessions Alert */}
      {waitingSessions.length > 0 && (
        <div className="mb-4 bg-brand-accentSoft p-4 rounded-lg border border-brand-border">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-brand-title">⚠️ {waitingSessions.length} Waiting Session(s)</h3>
              <p className="text-sm text-brand-muted">Customers are waiting for support</p>
            </div>
            <button
              onClick={fetchWaitingSessions}
              className="px-4 py-2 bg-brand-accentTeal text-white rounded-lg hover:opacity-90 text-sm"
            >
              View Sessions
            </button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="mb-4 bg-brand-primarySoft p-4 rounded-lg border border-brand-border flex items-center gap-3">
          <span className="text-sm font-medium text-brand-body">
            {selectedTickets.length} ticket(s) selected
          </span>
          <button
            onClick={handleBulkAssign}
            className="px-3 py-1 bg-brand-primary text-white rounded text-sm hover:bg-brand-primaryHover"
          >
            Assign to Me
          </button>
          <button
            onClick={() => handleBulkStatusUpdate('in-progress')}
            className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
          >
            Mark In Progress
          </button>
          <button
            onClick={() => handleBulkStatusUpdate('resolved')}
            className="px-3 py-1 bg-emerald-500 text-white rounded text-sm hover:bg-emerald-600"
          >
            Mark Resolved
          </button>
          <button
            onClick={() => setSelectedTickets([])}
            className="px-3 py-1 border border-brand-border rounded text-sm hover:bg-brand-sectionBg"
          >
            Clear
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {['all', 'open', 'assigned', 'in-progress', 'resolved', 'my-tickets'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filter === f
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'bg-brand-cardBg text-brand-body hover:bg-brand-primarySoft border border-brand-border'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary flex-1 min-w-[200px]"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-brand-border rounded-lg text-sm focus:ring-2 focus:ring-brand-primary"
        >
          <option value="date">Sort by Date</option>
          <option value="priority">Sort by Priority</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-brand-muted">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-8 text-brand-muted">No tickets found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket._id} className="relative">
              <div className="mb-2">
                <input
                  type="checkbox"
                  checked={selectedTickets.includes(ticket._id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTickets([...selectedTickets, ticket._id]);
                    } else {
                      setSelectedTickets(selectedTickets.filter(id => id !== ticket._id));
                    }
                  }}
                  className="mr-2"
                />
                {ticket.customerId && (
                  <span className="text-xs text-brand-muted">Customer: {ticket.customerId.name}</span>
                )}
              </div>
              <TicketCard ticket={ticket} />
              <div className="mt-2 flex gap-2 flex-wrap">
                {ticket.status === 'open' && (
                  <button
                    onClick={() => handleAssignToMe(ticket._id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Assign to Me
                  </button>
                )}
                {ticket.status === 'assigned' && (
                  <button
                    onClick={() => handleUpdateStatus(ticket._id, 'in-progress')}
                    className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                  >
                    Start Work
                  </button>
                )}
                {ticket.status === 'in-progress' && (
                  <button
                    onClick={() => handleUpdateStatus(ticket._id, 'resolved')}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
