import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client, { downloadFile } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, CheckCircle, XCircle, Eye, Power, Trash2 } from 'lucide-react';

const StudentList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [schools, setSchools] = useState([]);
    const [filters, setFilters] = useState({
        class: '',
        medium: '',
        active: '',
        search: '',
        school: '' // Added school filter state
    });

    // Helper to debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    // Fetch Schools on Mount (if allowed)
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


    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.class) params.append('class', filters.class);
            if (filters.medium) params.append('medium', filters.medium);
            if (filters.active) params.append('active', filters.active);
            if (filters.search) params.append('search', filters.search);

            // Should add School filter for Super Admin? 
            // Spec says "Filters: Class, Medium, School, Access Status".
            // Adding School Input if Super Admin
            if (filters.school) params.append('school', filters.school);
            if (filters.subscriptionStatus) params.append('subscriptionStatus', filters.subscriptionStatus);

            const res = await client.get(`/admin/students?${params.toString()}`);
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const toggleAccess = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'DISABLE' : 'ENABLE'} this student?`)) return;
        try {
            await client.patch(`/admin/students/${id}/access`, { accessEnabled: !currentStatus });
            // Refresh local state optimization
            setStudents(students.map(s => s._id === id ? { ...s, accessEnabled: !currentStatus } : s));
        } catch (err) {
            alert("Failed to update status: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to PERMANENTLY delete this student? This action cannot be undone and will remove all student data.")) return;

        // Double confirmation
        if (!window.confirm("Please confirm again to DELETE the ENTIRE PROFILE.")) return;

        try {
            await client.delete(`/admin/students/${id}`);
            setStudents(students.filter(s => s._id !== id));
            alert("Student deleted successfully");
        } catch (err) {
            alert("Failed to delete student: " + (err.response?.data?.message || err.message));
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (filters.class) params.append('class', filters.class);
        if (filters.medium) params.append('medium', filters.medium);
        if (filters.active) params.append('active', filters.active);
        if (filters.search) params.append('search', filters.search);
        if (filters.school) params.append('school', filters.school);
        params.append('download', 'true');
        params.append('format', 'excel'); // Request Excel

        downloadFile(`/admin/students?${params.toString()}`, 'Students_Export.xlsx');
    };

    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [bulkAction, setBulkAction] = useState('');

    const toggleSelectAll = () => {
        if (selectedStudents.size === students.length && students.length > 0) {
            setSelectedStudents(new Set());
        } else {
            setSelectedStudents(new Set(students.map(s => s._id)));
        }
    };

    const toggleSelectStudent = (id) => {
        const newSet = new Set(selectedStudents);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedStudents(newSet);
    };

    const handleBulkSubmit = async () => {
        if (selectedStudents.size === 0) return alert("Select students first");
        if (!bulkAction) return alert("Select an action");

        if (!window.confirm(`Apply to ${selectedStudents.size} students?`)) return;

        try {
            let body = { studentIds: Array.from(selectedStudents) };

            if (bulkAction === 'extend_30') {
                body.action = 'extend_days';
                body.value = 30;
            } else if (bulkAction === 'extend_60') {
                body.action = 'extend_days';
                body.value = 60;
            }

            await client.post('/admin/students/subscription/bulk', body);
            alert("Bulk update successful");
            setSelectedStudents(new Set());
            setBulkAction('');
            fetchStudents();
        } catch (e) {
            alert("Bulk update failed: " + e.message);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Students</h1>
                    {selectedStudents.size > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-medium">{selectedStudents.size} selected</span>
                            <select
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                className="text-sm border-gray-300 rounded p-1 border"
                            >
                                <option value="">-- Bulk Actions --</option>
                                <option value="extend_30">Extend +30 Days</option>
                                <option value="extend_60">Extend +60 Days</option>
                            </select>
                            <button
                                onClick={handleBulkSubmit}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                            >
                                Apply
                            </button>
                        </div>
                    )}
                </div>
                <button
                    onClick={handleExport}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
                    Export Excel
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Name or Username..."
                            className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 p-2 border"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* School Filter - Only for Super Admin */}
                {(user.role === 'Super Admin' || user.role === 'Owner') && (
                    <div className="w-full sm:w-40">
                        <label className="block text-xs font-medium text-gray-500 mb-1">School</label>
                        <select
                            name="school"
                            value={filters.school}
                            onChange={handleFilterChange}
                            className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 p-2 border"
                        >
                            <option value="">All Schools</option>
                            {schools.map(s => (
                                <option key={s._id} value={s.name}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="w-28">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                    <select
                        name="class"
                        value={filters.class}
                        onChange={handleFilterChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 p-2 border"
                    >
                        <option value="">All</option>
                        {[6, 7, 8, 9, 10].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="w-32">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Medium</label>
                    <select
                        name="medium"
                        value={filters.medium}
                        onChange={handleFilterChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 p-2 border"
                    >
                        <option value="">All</option>
                        <option value="Telugu">Telugu</option>
                        <option value="English">English</option>
                    </select>
                </div>

                <div className="w-36">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Subscription</label>
                    <select
                        name="subscriptionStatus"
                        value={filters.subscriptionStatus || ''}
                        onChange={handleFilterChange}
                        className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 p-2 border"
                    >
                        <option value="">All Status</option>
                        <option value="active_sub">Active</option>
                        <option value="expiring_soon">Expiring (7d)</option>
                        <option value="expired">Expired</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white shadow overflow-x-auto sm:rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left">
                                <input
                                    type="checkbox"
                                    checked={students.length > 0 && selectedStudents.size === students.length}
                                    onChange={toggleSelectAll}
                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name / ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Class Info
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                School
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Sub. Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Access
                            </th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">No students found.</td></tr>
                        ) : (
                            students.map((student) => {
                                // Status Helper
                                const sub = student.subscription || {}; // If lean(), it's a plain object
                                let subStatus = 'Unknown';
                                let subColor = 'bg-gray-100 text-gray-800';

                                if (sub.status === 'EXPIRED') {
                                    subStatus = 'Expired';
                                    subColor = 'bg-red-100 text-red-800';
                                } else if (sub.status === 'ACTIVE') {
                                    // Check if dates imply expiry (display sync)
                                    const now = new Date();
                                    const exp = sub.expiryDate ? new Date(sub.expiryDate) : null;
                                    if (exp && now > exp) {
                                        subStatus = 'Expired';
                                        subColor = 'bg-red-100 text-red-800';
                                    } else {
                                        subStatus = 'Active';
                                        subColor = 'bg-green-100 text-green-800';
                                    }
                                }

                                return (
                                    <tr key={student._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selectedStudents.has(student._id)}
                                                onChange={() => toggleSelectStudent(student._id)}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                                    <div className="text-sm text-gray-500">@{student.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">Class {student.class}</div>
                                            <div className="text-sm text-gray-500">{student.medium}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {student.schoolName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${subColor}`}>
                                                {subStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${student.accessEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {student.accessEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-3">
                                                <button
                                                    onClick={() => navigate(`/students/${student._id}`)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </button>
                                                {user.role === 'Super Admin' && (
                                                    <button
                                                        onClick={() => toggleAccess(student._id, student.accessEnabled)}
                                                        className={`${student.accessEnabled ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                                        title={student.accessEnabled ? "Disable Access" : "Enable Access"}
                                                    >
                                                        <Power className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {user.role === 'Super Admin' && (
                                                    <button
                                                        onClick={() => handleDelete(student._id)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Delete Student"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentList;
