import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { Plus, Search, Shield, User, Lock, Trash2, CheckCircle, XCircle } from 'lucide-react';

const StaffRegistry = () => {
    const [activeTab, setActiveTab] = useState('Teacher'); // 'Teacher' or 'School Admin'
    const [staffList, setStaffList] = useState([]);
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'Teacher',
        schoolId: '',
        assignedSubjects: []
    });

    // Helper for Teacher Assignment
    const [subjectInput, setSubjectInput] = useState({ subjectId: '', classes: [] });
    // Assuming we might need to fetch subjects list too - for now hardcoding common subjects or fetching?
    // Let's rely on manual entry or basic list if possible. 
    // Ideally we should fetch subjects. Let's just use text for now or simple manual Management for MVP.
    // Actually, `subjectId` is an ObjectId. We need to fetch Subjects!
    const [allSubjects, setAllSubjects] = useState([]);

    useEffect(() => {
        fetchStaff();
        fetchSchools();
        // Fetch subjects if creating teacher
        fetchSubjects();
    }, [activeTab]);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/admin/staff?role=${activeTab}`);
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const res = await client.get('/admin/schools');
            console.log("[DEBUG] fetchSchools response:", res.data);
            setSchools(res.data);
        } catch (err) {
            console.error("[DEBUG] fetchSchools error:", err);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await client.get('/admin/subjects');
            setAllSubjects(res.data);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        }
    };

    const handleAddAssignment = () => {
        if (!subjectInput.subjectId) return alert("Select a subject");

        // Parse classes: empty string/null means ALL classes? Or force selection?
        // UI should probably force selection or have "All" checkbox.
        // Let's assume input is a comma separated string for now or array if we build a UI.
        // Let's implement array based UI state for subjectInput.classes

        // Check if subject already added
        if (formData.assignedSubjects.find(a => a.subjectId === subjectInput.subjectId)) {
            return alert("Subject already assigned");
        }

        const newAssignment = {
            subjectId: subjectInput.subjectId,
            classes: subjectInput.classes.length > 0 ? subjectInput.classes.map(Number) : [] // [] = All
        };

        setFormData({
            ...formData,
            assignedSubjects: [...formData.assignedSubjects, newAssignment]
        });

        // Reset input
        setSubjectInput({ subjectId: '', classes: [] });
    };

    const removeAssignment = (index) => {
        const updated = [...formData.assignedSubjects];
        updated.splice(index, 1);
        setFormData({ ...formData, assignedSubjects: updated });
    };

    const toggleClassSelection = (cls) => {
        const current = Array.isArray(subjectInput.classes) ? subjectInput.classes : [];
        if (current.includes(cls)) {
            setSubjectInput({ ...subjectInput, classes: current.filter(c => c !== cls) });
        } else {
            setSubjectInput({ ...subjectInput, classes: [...current, cls] });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            // Transform assignedSubjects for API
            // For MVP: We will just push one subject if added.

            await client.post('/admin/staff', formData);
            setShowModal(false);
            fetchStaff();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create staff');
        }
    };

    const resetParams = (role) => {
        setActiveTab(role);
        setFormData(prev => ({ ...prev, role }));
    };

    const toggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'DISABLE' : 'ENABLE'} this account?`)) return;
        try {
            await client.patch(`/admin/staff/${id}/status`, { isActive: !currentStatus });
            fetchStaff();
        } catch (err) {
            alert("Failed to update status");
        }
    };

    const resetPassword = async (id) => {
        const newPw = prompt("Enter new password for this user:");
        if (!newPw) return;
        try {
            await client.patch(`/admin/staff/${id}/password`, { newPassword: newPw });
            alert("Password updated successfully");
        } catch (err) {
            alert("Failed to reset password");
        }
    };

    const togglePermission = async (id, permission, newValue) => {
        // Optimistic UI update could be complex with list state, so simple fetch refresh is safer.
        try {
            await client.patch(`/admin/staff/${id}/permissions`, { permission, value: newValue });
            fetchStaff(); // Refresh list to show new state
        } catch (err) {
            console.error(err);
            alert("Failed to update permission: " + (err.response?.data?.message || err.message));
        }
    };



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Registry</h1>
                    <p className="text-gray-500">Manage Teachers and School Admins.</p>
                </div>
                <button
                    onClick={() => { setShowModal(true); setFormData({ ...formData, role: activeTab }); }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New {activeTab}
                </button>
            </div>

            {/* TABS */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                {['Teacher', 'School Admin'].map(role => (
                    <button
                        key={role}
                        onClick={() => resetParams(role)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === role
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        {role}s
                    </button>
                ))}
            </div>

            {/* LIST */}
            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="bg-white border rounded-lg overflow-x-auto shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                                {activeTab === 'Teacher' && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rights</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staffList.map(staff => (
                                <tr key={staff._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                {activeTab === 'Teacher' ? <User className="h-5 w-5 text-gray-500" /> : <Shield className="h-5 w-5 text-purple-500" />}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{staff.username}</div>
                                                <div className="text-xs text-gray-500">Created: {new Date(staff.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{staff.schoolId?.name || staff.schoolName || '-'}</div>
                                    </td>
                                    {activeTab === 'Teacher' && (
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {staff.assignedSubjects?.length > 0
                                                    ? staff.assignedSubjects.map((as, i) => (
                                                        <span key={i} className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded mr-1">
                                                            {/* Placeholder for Subject Name lookup if not populated details */}
                                                            Subject {i + 1}
                                                        </span>
                                                    ))
                                                    : <span className="text-gray-400 italic">No assignments</span>}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => togglePermission(staff._id, 'canPublish', !staff.permissions?.canPublish)}
                                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border cursor-pointer select-none transition-colors ${staff.permissions?.canPublish
                                                ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                                }`}
                                            title="Click to toggle Exam Publish rights"
                                        >
                                            {staff.permissions?.canPublish ? 'Can Publish' : 'Draft Only'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staff.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {staff.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                        <button
                                            onClick={() => resetPassword(staff._id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                            title="Reset Password"
                                        >
                                            <Lock className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleStatus(staff._id, staff.isActive)}
                                            className={`${staff.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                            title={staff.isActive ? "Disable Account" : "Enable Account"}
                                        >
                                            {staff.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Create New {activeTab}</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            {/* School Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assign School</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg"
                                    value={formData.schoolId}
                                    onChange={e => setFormData({ ...formData, schoolId: e.target.value })}
                                    required={activeTab === 'School Admin'}
                                >
                                    <option value="">Select School...</option>
                                    {activeTab === 'Teacher' && <option value="GLOBAL" className="font-bold text-blue-600">All Schools (Global Access)</option>}
                                    {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Teacher Specific: Assignments (Simplified for now - can't fully implement complex subject picker within this task scope without subject API) */}
                            {activeTab === 'Teacher' && (
                                <div className="p-4 bg-gray-50 border rounded-lg space-y-4">
                                    <h3 className="font-semibold text-gray-700">Subject Assignments</h3>

                                    {/* Assignment Builder */}
                                    <div className="space-y-3">
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg"
                                            value={subjectInput.subjectId}
                                            onChange={e => setSubjectInput({ ...subjectInput, subjectId: e.target.value })}
                                        >
                                            <option value="">Select Subject...</option>
                                            {allSubjects.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>

                                        <div>
                                            <label className="text-xs font-medium text-gray-500 mb-1 block">Classes (Select none for All Classes)</label>
                                            <div className="flex flex-wrap gap-2">
                                                {[6, 7, 8, 9, 10].map(cls => (
                                                    <button
                                                        key={cls}
                                                        type="button"
                                                        onClick={() => toggleClassSelection(cls)}
                                                        className={`px-3 py-1 text-xs rounded-full border ${(subjectInput.classes || []).includes(cls)
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-600 border-gray-300'
                                                            }`}
                                                    >
                                                        Class {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddAssignment}
                                            disabled={!subjectInput.subjectId}
                                            className="w-full py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                                        >
                                            Add Assignment
                                        </button>
                                    </div>

                                    {/* Assignment List */}
                                    {formData.assignedSubjects.length > 0 && (
                                        <div className="space-y-2 mt-2">
                                            {formData.assignedSubjects.map((assign, idx) => {
                                                const subName = allSubjects.find(s => s._id === assign.subjectId)?.name || 'Unknown';
                                                return (
                                                    <div key={idx} className="flex justify-between items-center bg-white p-2 border rounded text-sm shadow-sm">
                                                        <div>
                                                            <span className="font-semibold block">{subName}</span>
                                                            <span className="text-xs text-gray-500">
                                                                {assign.classes.length === 0 ? 'All Classes' : `Classes: ${assign.classes.join(', ')}`}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAssignment(idx)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffRegistry;
