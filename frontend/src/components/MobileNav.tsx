import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t flex justify-around py-3 md:hidden z-50">
      <Link
        to="/customer"
        className={`px-4 py-2 rounded-lg transition ${
          isActive('/customer')
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Customer
      </Link>
      <Link
        to="/agent"
        className={`px-4 py-2 rounded-lg transition ${
          isActive('/agent')
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Agent
      </Link>
      <Link
        to="/admin"
        className={`px-4 py-2 rounded-lg transition ${
          isActive('/admin')
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        Admin
      </Link>
    </nav>
  );
}
