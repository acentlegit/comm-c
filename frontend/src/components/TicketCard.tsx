import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

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

interface TicketCardProps {
  ticket: Ticket;
}

export default function TicketCard({ ticket }: TicketCardProps) {
  const navigate = useNavigate();

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-purple-100 text-purple-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  return (
    <div
      className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow hover:shadow-lg transition cursor-pointer"
      onClick={() => navigate(`/ticket/${ticket._id}`)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">#{ticket._id.slice(-6)}</h3>
        <div className="flex gap-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[ticket.priority]}`}
          >
            {ticket.priority}
          </span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${statusColors[ticket.status]}`}
          >
            {ticket.status}
          </span>
        </div>
      </div>
      <h4 className="font-medium mb-2">{ticket.title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
        {ticket.description}
      </p>
      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>AI Confidence: {(ticket.confidence * 100).toFixed(0)}%</span>
          {ticket.breached && (
            <span className="text-red-600 font-semibold">SLA BREACHED</span>
          )}
        </div>
        <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
      </div>
      {ticket.agentId && typeof ticket.agentId === 'object' && (
        <div className="mt-2 text-xs text-gray-500">
          Agent: {ticket.agentId.name}
        </div>
      )}
    </div>
  );
}
