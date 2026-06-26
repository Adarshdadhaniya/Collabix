import { Outlet, Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'teacher';

  const navLinkClass = (path) => {
    const isActive = location.pathname.startsWith(path);
    return `block px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? 'text-indigo-600 bg-indigo-50' 
        : 'text-gray-600 hover:bg-gray-50'
    }`;
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 hidden md:block p-6 flex flex-col justify-between">
        <div className="flex-grow">
          <nav className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Menu</p>
            
            {isAdminOrTeacher ? (
              <>
                <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                  Admin Dashboard
                </Link>
                <Link to="/admin/room-booking" className={navLinkClass('/admin/room-booking')}>
                  Room Booking
                </Link>
              </>
            ) : (
              <>
                <Link to="/student/dashboard" className={navLinkClass('/student/dashboard')}>
                  Dashboard
                </Link>
                <Link to="/student/requests" className={navLinkClass('/student/requests')}>
                  Requests & Invites
                </Link>
                <Link to="/student/profile" className={navLinkClass('/student/profile')}>
                  My Profile
                </Link>
                <Link to="/student/messages" className={navLinkClass('/student/messages')}>
                  Messages
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User profile card at bottom of sidebar */}
        {user && (
          <div className="border-t border-gray-100 pt-4 mt-auto">
            <div className="p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Account</p>
              <p className="text-sm font-bold text-gray-900 truncate mt-1">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded">
                {user.role}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gray-50/50">
        <Outlet />
      </main>
    </div>
  );
}
