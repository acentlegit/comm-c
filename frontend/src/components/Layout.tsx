import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MobileNav from './MobileNav';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-brand-appBg">
      <div className="flex min-h-screen">
        {/* Sidebar for desktop */}
        <aside className="hidden md:flex w-64 bg-sidebar-gradient text-white flex-col justify-between py-6 px-5">
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-semibold">Command Center</h1>
              <p className="text-xs text-brand-primarySoft/90 mt-1">
                24/7 Customer Support
              </p>
            </div>
            <nav className="space-y-2 text-sm">
              <Link
                to="/customer"
                className="block px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Customer
              </Link>
              <Link
                to="/agent"
                className="block px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Agent
              </Link>
              <Link
                to="/admin"
                className="block px-3 py-2 rounded-lg hover:bg-white/10 transition"
              >
                Admin
              </Link>
            </nav>
          </div>
          {user && (
            <div className="mt-8 border-t border-white/10 pt-4 text-xs">
              <div className="mb-2">
                <div className="font-medium">{user.name}</div>
                <div className="text-brand-primarySoft/80">{user.email}</div>
                <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[11px] uppercase tracking-wide">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition"
              >
                Logout
              </button>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <header className="md:hidden p-4 bg-brand-primary text-white shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <h1 className="text-xl font-bold">Command Center</h1>
              <div className="flex items-center gap-3">
                {user && (
                  <>
                    <span className="text-xs">
                      {user.name.split(' ')[0]} ({user.role})
                    </span>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1 bg-brand-primaryHover rounded-lg text-xs transition"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </header>
          <main className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
            {children}
          </main>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
