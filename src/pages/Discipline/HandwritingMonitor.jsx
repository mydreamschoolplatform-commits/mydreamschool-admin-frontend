import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { downloadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, AlertTriangle, Eye, Calendar, Download } from 'lucide-react';
import DateSelector from '../../components/common/DateSelector';

const HandwritingMonitor = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    const [filters, setFilters] = useState({
        class: '',
        medium: '',
        school: '',
        status: 'skipped', // Default to Skipped
        search: '',
        date: new Date().toISOString().split('T')[0] // Default to Today
    });

    // Helper to debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Fetch Schools on Mount
    useEffect(() => {
        const fetchSchools = async () => {
            try {
                if (user.role === 'Super Admin' || user.role === 'Owner') {
                    const res = await client.get('/admin/schools');
                    setSchools(res.data);
                }
            } catch (err) {
                console.error("Error fetching schools:", err);
            }
        };
        fetchSchools();
    }, [user.role]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.class) params.append('class', filters.class);
            if (filters.medium) params.append('medium', filters.medium);
            // Only active students usually matter for discipline monitoring
            params.append('active', 'true');
            if (filters.school) params.append('school', filters.school);

            if (filters.status !== 'all') {
                params.append('handwritingStatus', filters.status);
            }
            if (filters.search) params.append('search', filters.search);
            if (filters.date) params.append('date', filters.date);

            // Logic handled by appending param above, removing duplicate hardcoded block
            // Server handles security so if simple user sends strict param it ignores or verifies.
            // But we already appended it cleanly.

            const res = await client.get(`/admin/students?${params.toString()}`);
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching monitor data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const exportData = () => {
        const params = new URLSearchParams();
        if (filters.class) params.append('class', filters.class);
        if (filters.medium) params.append('medium', filters.medium);
        params.append('active', 'true');
        if (filters.status !== 'all') params.append('handwritingStatus', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.school) params.append('school', filters.school);
        if (filters.date) params.append('date', filters.date);

        params.append('download', 'true');
        params.append('format', 'excel'); // Request Excel with checking "best details"

        const dateStr = filters.date || new Date().toISOString().split('T')[0];
        downloadFile(`/admin/students?${params.toString()}`, `Handwriting_Monitor_${dateStr}.xlsx`);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Handwriting Monitor</h1>
                    <p className="text-sm text-gray-500 mt-1">Daily Discipline Tracking</p>
                </div>
                <button
                    onClick={exportData}
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Download className="h-4 w-4 mr-2 text-green-600" />
                    Export Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <input
                        type="text"
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        placeholder="Name..."
                        className="block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                </div>

                {/* Date Filter */}
                <div className="w-full sm:w-60">
                    <DateSelector
                        label="Date"
                        value={filters.date}
                        onChange={(val) => handleFilterChange({ target: { name: 'date', value: val } })}
                        startYear={2024}
                        endYear={new Date().getFullYear() + 1}
                    />
                </div>

                {/* School Filter - Only for Super Admin */}
                {(user.role === 'Super Admin' || user.role === 'Owner') && (
                    <div className="w-full sm:w-48">
                        <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                        <select
                            name="school"
                            value={filters.school}
                            onChange={handleFilterChange}
                            className="block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        >
                            <option value="">All Schools</option>
                            {schools.map(s => <option key={s._id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="w-full sm:w-40">
                    <label className="block text-xs font-medium text-gray-500 mb-1">View</label>
                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    >
                        <option value="skipped">Skipped (Red)</option>
                        <option value="completed">Completed</option>
                        <option value="all">All</option>
                    </select>
                </div>

                <div className="w-full sm:w-40">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                    <select
                        name="class"
                        value={filters.class}
                        onChange={handleFilterChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    >
                        <option value="">All Classes</option>
                        {[6, 7, 8, 9, 10].map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                </div>
            </div>

            {/* Monitor List */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Class
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                School
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status ({new Date(filters.date).toLocaleDateString()})
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Current Streak
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">Loading monitor data...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No students found matching criteria.</td></tr>
                        ) : (
                            students.map((student) => (
                                <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                        <div className="text-sm text-gray-500">@{student.username}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">Class {student.class}</div>
                                        <div className="text-sm text-gray-500">{student.medium}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {student.schoolName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {student.handwritingToday ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Completed
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Skipped
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        {student.handwritingStreak?.currentStreak || 0} 🔥
                                        <div className="text-xs text-gray-500 mt-1">
                                            Last: {student.handwritingStreak?.lastPracticeDate ? new Date(student.handwritingStreak.lastPracticeDate).toLocaleDateString() : 'Never'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/students/${student._id}`)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end w-full"
                                        >
                                            Details <Eye className="ml-1 h-3 w-3" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HandwritingMonitor;
