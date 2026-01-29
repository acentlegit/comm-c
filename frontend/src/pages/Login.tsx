import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        // For demo mode, get role from localStorage
        const demoUser = localStorage.getItem('demoUser');
        if (demoUser) {
          const user = JSON.parse(demoUser);
          navigate(`/${user.role}`);
        } else {
          const userRole = (await api.get('/auth/me')).data.role;
          navigate(`/${userRole}`);
        }
      } else {
        await register(email, password, name, role);
        navigate(`/${role}`);
      }
    } catch (err: any) {
      setError(err.message || err.response?.data?.error || err.response?.data?.details || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-appBg p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="hidden md:block">
          <div className="rounded-3xl bg-sidebar-gradient text-white p-8 shadow-2xl">
            <h1 className="text-3xl font-bold mb-4">Command Center</h1>
            <p className="text-sm text-brand-primarySoft mb-6">
              Always-on customer support with real-time visibility for customers, agents and admins.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Live ticket analytics & SLA monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-accentTeal" />
                <span>Secure, role-based access control</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/80" />
                <span>24/7 multi-channel support</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-brand-cardBg rounded-2xl shadow-xl p-8 border border-brand-border">
          <h2 className="text-2xl font-bold text-center mb-6 text-brand-title">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>

          <div className="flex gap-4 mb-6 bg-brand-sectionBg p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              type="button"
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
                isLogin
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              type="button"
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition ${
                !isLogin
                  ? 'bg-brand-primary text-white shadow-sm'
                  : 'text-brand-muted'
              }`}
            >
              Register
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-brand-body mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-body mb-1">
                  Role
                </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full px-4 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                        >
                          <option value="customer">Customer</option>
                          <option value="member">Member (Read-only)</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-brand-body mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-body mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-3 rounded-lg font-medium hover:bg-brand-primaryHover transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
