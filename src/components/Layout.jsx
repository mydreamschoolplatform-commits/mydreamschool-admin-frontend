import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, BookOpen, LogOut, FileText, HelpCircle, Megaphone, School as SchoolIcon, Trophy, Activity } from 'lucide-react';
import client from '../api/client';

const Layout = () => {
    const [unreadTickets, setUnreadTickets] = React.useState(0);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Fetch Unread Tickets (Admin Only)
    React.useEffect(() => {
        if (user?.role !== 'Student') {
            const fetchStats = async () => {
                try {
                    // We need a way to call API. Assuming apiClient is available or using fetch with token
                    // Since Layout doesn't import apiClient, let's try to import it or use a simple fetch if context provides token
                    // But typically projects have an axios instance. Let's assume standard fetch for now or check imports.
                    // Wait, I should import apiClient first.
                    // For now, let's inject a simple fetch if apiClient isn't top-level. 
                    // Actually, let's add the import in a separate block if needed, but for replacement here:

                    const res = await client.get('/support/admin/stats');
                    if (res.data) {
                        setUnreadTickets(res.data.Open || 0);
                    }
                } catch (err) {
                    console.error("Failed to fetch ticket stats", err);
                }
            };
            fetchStats();
            // Poll every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/students', label: 'Students', icon: Users },
        { path: '/discipline/handwriting', label: 'Handwriting Monitor', icon: FileText },
        { path: '/exams', label: 'Exams', icon: BookOpen },
        { path: '/rankings', label: 'Rankings', icon: Trophy },
    ];

    // Role-based Navigation
    if (user?.role !== 'Teacher') {
        navItems.push({
            path: '/support',
            label: 'Support Desk',
            icon: HelpCircle,
            badge: unreadTickets > 0 ? unreadTickets : null
        });
    }
    navItems.push({ path: '/announcements', label: 'Announcements', icon: Megaphone });

    // Super Admin Controls
    if (['Super Admin', 'Owner'].includes(user?.role)) {
        navItems.push({ path: '/admin/schools', label: 'Schools', icon: SchoolIcon || BookOpen }); // Fallback icon if SchoolIcon not imported
        navItems.push({ path: '/admin/staff', label: 'Staff Registry', icon: Users });
        navItems.push({ path: '/admin/system-health', label: 'System Health', icon: Activity || BookOpen }); // Use Activity icon
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">MyDreamSchool</h1>
                </div>

                <div className="p-4">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg mb-6 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logged in as</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                    </div>

                    <nav className="space-y-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${isActive
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`
                                }
                            >
                                <div className="flex items-center">
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.label}
                                </div>
                                {item.badge && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                        {item.badge}
                                    </span>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
