import React, { useEffect, useState } from 'react';
import client from '../api/client';
import { Users, UserCheck, UserX, AlertCircle } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, colorClass, borderClass }) => (
    <div className={`bg-white rounded-lg border ${borderClass || 'border-gray-200'} p-6 shadow-sm`}>
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${colorClass}`}>
                <Icon className="h-6 w-6" />
            </div>
        </div>
    </div>
);

// ... (imports)
import StudentJoiningGraph from '../components/StudentJoiningGraph';

// ... (StatCard component remains same)

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Date Filters for Student Growth
    const [growthStartDate, setGrowthStartDate] = useState('');
    const [growthEndDate, setGrowthEndDate] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Get Role from stored user data
                const storedUser = localStorage.getItem('adminUser');
                const user = storedUser ? JSON.parse(storedUser) : null;
                const role = user?.role;

                console.log("Dashboard Role Check:", role);

                if (role === 'Teacher') {
                    // Fetch Teacher Data directly
                    const teacherRes = await client.get('/teacher/dashboard');
                    setStats({
                        isTeacher: true,
                        subjectsCount: teacherRes.data.stats?.subjectsCount || 0,
                        assignedSubjects: teacherRes.data.assignedSubjects || []
                    });
                } else {
                    // Fetch Admin Data
                    const params = {};
                    if (growthStartDate) params.growthStartDate = growthStartDate;
                    if (growthEndDate) params.growthEndDate = growthEndDate;

                    const res = await client.get('/admin/dashboard', { params });
                    // Ensure studentGrowth is present or empty array
                    const dashboardStats = res.data.stats || {};
                    if (!dashboardStats.studentGrowth) dashboardStats.studentGrowth = [];
                    setStats(dashboardStats);
                }
            } catch (err) {
                console.error("Dashboard error:", err);
                setError(err.response?.data?.message || err.message || 'Unknown Error');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [growthStartDate, growthEndDate]);

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500 font-medium">Loading Dashboard Data...</div>
        </div>
    );

    if (error) return (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            <h3 className="font-bold">Error Loading Dashboard</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="mt-2 text-sm underline">Retry</button>
        </div>
    );

    // Teacher View
    if (stats?.isTeacher) {
        return (
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-8">Teacher Dashboard</h1>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Assigned Subjects"
                        value={stats.subjectsCount}
                        icon={Users} // Using generic icon for now
                        colorClass="bg-indigo-50 text-indigo-600"
                    />
                    {/* Add more teacher stats here later */}
                </div>

                <div className="mt-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Your Subjects</h2>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {stats.assignedSubjects.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {stats.assignedSubjects.map(sub => (
                                    <li key={sub._id} className="p-4 hover:bg-gray-50">
                                        <span className="font-medium text-gray-900">{sub.name}</span>
                                        <span className="ml-2 text-xs text-gray-500">({sub.code})</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-6 text-center text-gray-500">
                                No subjects assigned yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Admin View (Default)
    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Control Room</h1>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={Users}
                    colorClass="bg-blue-50 text-blue-600"
                />

                <StatCard
                    label="Active Students"
                    value={stats?.activeStudents || 0}
                    icon={UserCheck}
                    colorClass="bg-green-50 text-green-600"
                />

                <StatCard
                    label="Disabled Students"
                    value={stats?.disabledStudents || 0}
                    icon={UserX}
                    colorClass="bg-gray-100 text-gray-600"
                />

                <StatCard
                    label="Handwriting Skipped Today"
                    value={stats?.handwritingSkippedToday || 0}
                    icon={AlertCircle}
                    colorClass="bg-red-50 text-red-600"
                    borderClass="border-red-200"
                />
            </div>

            {/* Student Joining Graph */}
            <div className="mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    {/* Filters */}
                    <div className="flex items-center space-x-4 bg-white p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-600">From:</label>
                            <input
                                type="date"
                                value={growthStartDate}
                                onChange={(e) => setGrowthStartDate(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <label className="text-sm font-medium text-gray-600">To:</label>
                            <input
                                type="date"
                                value={growthEndDate}
                                onChange={(e) => setGrowthEndDate(e.target.value)}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        {(growthStartDate || growthEndDate) && (
                            <button
                                onClick={() => { setGrowthStartDate(''); setGrowthEndDate(''); }}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <StudentJoiningGraph data={stats?.studentGrowth} />
            </div>

            <div className="mt-8 border-t border-gray-200 pt-8">
                <p className="text-sm text-gray-500">
                    System status: <span className="text-green-600 font-medium">Operational</span>
                </p>
            </div>
        </div>
    );
};

export default Dashboard;
