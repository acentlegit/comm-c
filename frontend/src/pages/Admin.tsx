import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

interface DashboardData {
  tickets: {
    total: number;
    open: number;
    resolved: number;
    breached: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    resolvedToday: number;
    resolvedThisWeek: number;
    resolvedThisMonth: number;
  };
  performance: {
    avgResponseTime: number;
    avgResolutionTime: number;
    resolutionRate: number;
  };
  priorityDistribution: Array<{ _id: string; count: number }>;
  statusDistribution: Array<{ _id: string; count: number }>;
  agentPerformance: Array<{
    agentName: string;
    agentEmail: string;
    totalTickets: number;
    resolvedTickets: number;
    avgResolutionTime: number;
  }>;
  chats: {
    active: number;
    total: number;
  };
}

export default function Admin() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'users'>('dashboard');

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.put(`/users/${userId}`, { isActive: !isActive });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      // Demo mode: Use mock data
      setData({
        tickets: { total: 0, open: 0, resolved: 0, breached: 0, today: 0, thisWeek: 0, thisMonth: 0, resolvedToday: 0, resolvedThisWeek: 0, resolvedThisMonth: 0 },
        performance: { avgResponseTime: 0, avgResolutionTime: 0, resolutionRate: 0 },
        priorityDistribution: [],
        statusDistribution: [],
        agentPerformance: [],
        chats: { active: 0, total: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Layout>
        <div className="text-center py-8">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-title">Admin Panel</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedTab('dashboard');
              fetchDashboard();
            }}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              selectedTab === 'dashboard'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-cardBg text-brand-body border border-brand-border hover:bg-brand-primarySoft'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setSelectedTab('users');
              fetchUsers();
            }}
            className={`px-4 py-2 rounded-lg text-sm transition ${
              selectedTab === 'users'
                ? 'bg-brand-primary text-white'
                : 'bg-brand-cardBg text-brand-body border border-brand-border hover:bg-brand-primarySoft'
            }`}
          >
            User Management
          </button>
        </div>
      </div>

      {selectedTab === 'users' ? (
        <div className="space-y-4">
          <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
            <h2 className="text-xl font-semibold mb-4 text-brand-title">All Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left p-3 text-sm font-semibold text-brand-body">Name</th>
                    <th className="text-left p-3 text-sm font-semibold text-brand-body">Email</th>
                    <th className="text-left p-3 text-sm font-semibold text-brand-body">Role</th>
                    <th className="text-left p-3 text-sm font-semibold text-brand-body">Status</th>
                    <th className="text-left p-3 text-sm font-semibold text-brand-body">Created</th>
                    <th className="text-right p-3 text-sm font-semibold text-brand-body">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id || user._id} className="border-b border-brand-border hover:bg-brand-sectionBg">
                      <td className="p-3 text-sm text-brand-body">{user.name}</td>
                      <td className="p-3 text-sm text-brand-body">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'agent' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-brand-muted">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(user.id || user._id, user.isActive)}
                            className={`px-3 py-1 rounded text-xs ${
                              user.isActive
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id || user._id)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <div className="text-sm text-brand-muted mb-1">Total Tickets</div>
          <div className="text-3xl font-bold text-brand-primary">{data.tickets.total}</div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <div className="text-sm text-brand-muted mb-1">Open Tickets</div>
          <div className="text-3xl font-bold text-amber-500">{data.tickets.open}</div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <div className="text-sm text-brand-muted mb-1">Resolved</div>
          <div className="text-3xl font-bold text-emerald-500">{data.tickets.resolved}</div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <div className="text-sm text-brand-muted mb-1">SLA Breached</div>
          <div className="text-3xl font-bold text-red-500">{data.tickets.breached}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-2">Average Response Time</h3>
          <div className="text-2xl font-bold">{data.performance.avgResponseTime.toFixed(1)} min</div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-2">Average Resolution Time</h3>
          <div className="text-2xl font-bold">{data.performance.avgResolutionTime.toFixed(1)} min</div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-2">Resolution Rate</h3>
          <div className="text-2xl font-bold">{data.performance.resolutionRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Time Period Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-4">Today</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>New Tickets:</span>
              <span className="font-semibold">{data.tickets.today}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved:</span>
              <span className="font-semibold">{data.tickets.resolvedToday}</span>
            </div>
          </div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-4">This Week</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>New Tickets:</span>
              <span className="font-semibold">{data.tickets.thisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved:</span>
              <span className="font-semibold">{data.tickets.resolvedThisWeek}</span>
            </div>
          </div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-4">This Month</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>New Tickets:</span>
              <span className="font-semibold">{data.tickets.thisMonth}</span>
            </div>
            <div className="flex justify-between">
              <span>Resolved:</span>
              <span className="font-semibold">{data.tickets.resolvedThisMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-4">Priority Distribution</h3>
          <div className="space-y-2">
            {data.priorityDistribution.map((item) => (
              <div key={item._id} className="flex items-center gap-2">
                <div className="w-24 text-sm capitalize">{item._id}:</div>
                <div className="flex-1 bg-brand-primarySoft rounded-full h-4">
                  <div
                    className="bg-brand-primary h-4 rounded-full"
                    style={{
                      width: `${(item.count / data.tickets.total) * 100}%`
                    }}
                  />
                </div>
                <div className="w-12 text-sm text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
          <h3 className="font-semibold mb-4">Status Distribution</h3>
          <div className="space-y-2">
            {data.statusDistribution.map((item) => (
              <div key={item._id} className="flex items-center gap-2">
                <div className="w-24 text-sm capitalize">{item._id}:</div>
                <div className="flex-1 bg-brand-primarySoft rounded-full h-4">
                  <div
                    className="bg-emerald-500 h-4 rounded-full"
                    style={{
                      width: `${(item.count / data.tickets.total) * 100}%`
                    }}
                  />
                </div>
                <div className="w-12 text-sm text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div className="bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
        <h3 className="font-semibold mb-4">Agent Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Email</th>
                <th className="text-right p-2">Total Tickets</th>
                <th className="text-right p-2">Resolved</th>
                <th className="text-right p-2">Avg Resolution (min)</th>
              </tr>
            </thead>
            <tbody>
              {data.agentPerformance.map((agent, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2">{agent.agentName}</td>
                  <td className="p-2 text-sm text-brand-muted">{agent.agentEmail}</td>
                  <td className="p-2 text-right">{agent.totalTickets}</td>
                  <td className="p-2 text-right">{agent.resolvedTickets}</td>
                  <td className="p-2 text-right">{agent.avgResolutionTime.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chat Stats */}
      <div className="mt-6 bg-brand-cardBg p-6 rounded-lg shadow border border-brand-border">
        <h3 className="font-semibold mb-4">Chat Sessions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-brand-primary">{data.chats.active}</div>
            <div className="text-sm text-brand-muted">Active Sessions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-brand-body">{data.chats.total}</div>
            <div className="text-sm text-brand-muted">Total Sessions</div>
          </div>
        </div>
      </div>
        </>
      )}
    </Layout>
  );
}
