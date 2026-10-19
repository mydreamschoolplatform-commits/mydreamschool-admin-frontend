import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
    Plus, Search, Shield, User, Lock, Trash2, CheckCircle, XCircle,
    Edit, AlertTriangle, Eye, EyeOff, BookOpen, X, RefreshCw
} from 'lucide-react';

const StaffRegistry = () => {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = ['Super Admin', 'Owner'].includes(currentUser?.role);
    const isSchoolAdmin = currentUser?.role === 'School Admin';

    // Tabs: Super Admin sees Teacher & School Admin; School Admin only sees Teacher
    const [activeTab, setActiveTab] = useState('Teacher');
    const [staffList, setStaffList] = useState([]);
    const [schools, setSchools] = useState([]);
    const [allSubjects, setAllSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Visibility States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState(null); // { type: 'success' | 'error', text }

    // Form States
    const [createForm, setCreateForm] = useState({
        username: '',
        password: '',
        role: 'Teacher',
        schoolId: '',
        assignedSubjects: [],
        canPublish: false
    });

    const [editForm, setEditForm] = useState({
        username: '',
        schoolId: '',
        assignedSubjects: [],
        canPublish: false
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
        showText: false
    });

    const [deleteWarning, setDeleteWarning] = useState(null);

    // Subject Assignment Builder State
    const [subjectInput, setSubjectInput] = useState({ subjectId: '', classes: [] });

    useEffect(() => {
        if (isSchoolAdmin) {
            setActiveTab('Teacher');
        }
        fetchStaff();
        fetchSchools();
        fetchSubjects();
    }, [activeTab]);

    const showFeedback = (text, type = 'success') => {
        setFeedbackMessage({ text, type });
        setTimeout(() => setFeedbackMessage(null), 5000);
    };

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/admin/staff?role=${activeTab}`);
            setStaffList(res.data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
            showFeedback(err.response?.data?.message || "Failed to load staff list", 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        try {
            const res = await client.get('/admin/schools');
            setSchools(res.data || []);
        } catch (err) {
            console.error("fetchSchools error:", err);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await client.get('/admin/subjects');
            setAllSubjects(res.data || []);
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        }
    };

    // Helper to get Subject Name from ID or Object
    const getSubjectDisplayName = (subjectRef) => {
        if (!subjectRef) return 'Unknown Subject';
        if (typeof subjectRef === 'object' && subjectRef.name) return subjectRef.name;
        const found = allSubjects.find(s => s._id === subjectRef || s.id === subjectRef);
        return found ? found.name : 'Subject';
    };

    // Assignment Builder Handlers
    const handleAddAssignment = (formType = 'create') => {
        if (!subjectInput.subjectId) return alert("Please select a subject");

        const targetList = formType === 'create' ? createForm.assignedSubjects : editForm.assignedSubjects;
        if (targetList.find(a => a.subjectId === subjectInput.subjectId)) {
            return alert("This subject is already assigned to this teacher");
        }

        const newAssignment = {
            subjectId: subjectInput.subjectId,
            classes: subjectInput.classes.length > 0 ? subjectInput.classes.map(Number) : []
        };

        if (formType === 'create') {
            setCreateForm(prev => ({
                ...prev,
                assignedSubjects: [...prev.assignedSubjects, newAssignment]
            }));
        } else {
            setEditForm(prev => ({
                ...prev,
                assignedSubjects: [...prev.assignedSubjects, newAssignment]
            }));
        }

        setSubjectInput({ subjectId: '', classes: [] });
    };

    const handleRemoveAssignment = (index, formType = 'create') => {
        if (formType === 'create') {
            setCreateForm(prev => {
                const updated = [...prev.assignedSubjects];
                updated.splice(index, 1);
                return { ...prev, assignedSubjects: updated };
            });
        } else {
            setEditForm(prev => {
                const updated = [...prev.assignedSubjects];
                updated.splice(index, 1);
                return { ...prev, assignedSubjects: updated };
            });
        }
    };

    const toggleClassSelection = (cls) => {
        const current = Array.isArray(subjectInput.classes) ? subjectInput.classes : [];
        if (current.includes(cls)) {
            setSubjectInput({ ...subjectInput, classes: current.filter(c => c !== cls) });
        } else {
            setSubjectInput({ ...subjectInput, classes: [...current, cls] });
        }
    };

    // --- CREATE STAFF ---
    const openCreateModal = () => {
        setCreateForm({
            username: '',
            password: '',
            role: activeTab,
            schoolId: isSchoolAdmin ? (currentUser?.schoolId || '') : '',
            assignedSubjects: [],
            canPublish: false
        });
        setSubjectInput({ subjectId: '', classes: [] });
        setShowCreateModal(true);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const payload = {
                username: createForm.username.trim(),
                password: createForm.password,
                role: createForm.role,
                schoolId: isSchoolAdmin ? (currentUser?.schoolId || '') : createForm.schoolId,
                assignedSubjects: createForm.role === 'Teacher' ? createForm.assignedSubjects : [],
                permissions: { canPublish: createForm.canPublish }
            };

            await client.post('/admin/staff', payload);
            showFeedback(`Staff account "${payload.username}" created successfully`);
            setShowCreateModal(false);
            fetchStaff();
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to create staff account', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- EDIT STAFF PROFILE ---
    const openEditModal = (staff) => {
        setSelectedStaff(staff);
        setEditForm({
            username: staff.username,
            schoolId: staff.schoolId?._id || staff.schoolId || '',
            assignedSubjects: (staff.assignedSubjects || []).map(as => ({
                subjectId: as.subjectId?._id || as.subjectId,
                classes: as.classes || []
            })),
            canPublish: staff.permissions?.canPublish === true
        });
        setSubjectInput({ subjectId: '', classes: [] });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStaff) return;
        setActionLoading(true);
        try {
            const payload = {
                username: editForm.username.trim(),
                schoolId: isSuperAdmin ? editForm.schoolId : undefined,
                assignedSubjects: selectedStaff.role === 'Teacher' ? editForm.assignedSubjects : undefined,
                permissions: { canPublish: editForm.canPublish }
            };

            await client.put(`/admin/staff/${selectedStaff._id}`, payload);
            showFeedback(`Staff profile for "${editForm.username}" updated successfully`);
            setShowEditModal(false);
            fetchStaff();
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to update staff profile', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- RESET PASSWORD ---
    const openPasswordModal = (staff) => {
        setSelectedStaff(staff);
        setPasswordForm({ newPassword: '', confirmPassword: '', showText: false });
        setShowPasswordModal(true);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword.length < 6) {
            return alert("Password must be at least 6 characters");
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return alert("Passwords do not match");
        }

        setActionLoading(true);
        try {
            await client.patch(`/admin/staff/${selectedStaff._id}/password`, {
                newPassword: passwordForm.newPassword
            });
            showFeedback(`Password for "${selectedStaff.username}" updated. Previous sessions have been invalidated.`);
            setShowPasswordModal(false);
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to reset password', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- TOGGLE STATUS (ACTIVATE / DEACTIVATE) ---
    const openStatusModal = (staff) => {
        setSelectedStaff(staff);
        setShowStatusModal(true);
    };

    const handleStatusConfirm = async () => {
        if (!selectedStaff) return;
        setActionLoading(true);
        try {
            const nextStatus = !selectedStaff.isActive;
            await client.patch(`/admin/staff/${selectedStaff._id}/status`, { isActive: nextStatus });
            showFeedback(`Account "${selectedStaff.username}" has been ${nextStatus ? 'enabled' : 'disabled'}.`);
            setShowStatusModal(false);
            fetchStaff();
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to update account status', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // --- TOGGLE PUBLISH PERMISSION QUICK ACTION ---
    const handleTogglePermission = async (staff, permission, newValue) => {
        try {
            await client.patch(`/admin/staff/${staff._id}/permissions`, { permission, value: newValue });
            fetchStaff();
            showFeedback(`Publish rights for "${staff.username}" updated to ${newValue ? 'Can Publish' : 'Draft Only'}`);
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to update permission', 'error');
        }
    };

    // --- DELETE STAFF ---
    const openDeleteModal = (staff) => {
        setSelectedStaff(staff);
        setDeleteWarning(null);
        setShowDeleteModal(true);
    };

    const handleDeleteSubmit = async () => {
        if (!selectedStaff) return;
        setActionLoading(true);
        try {
            await client.delete(`/admin/staff/${selectedStaff._id}`);
            showFeedback(`Staff account "${selectedStaff.username}" deleted successfully`);
            setShowDeleteModal(false);
            fetchStaff();
        } catch (err) {
            const data = err.response?.data;
            if (data?.canDeactivate) {
                setDeleteWarning(data.message);
            } else {
                showFeedback(data?.message || 'Failed to delete staff account', 'error');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeactivateFromDelete = async () => {
        if (!selectedStaff) return;
        setActionLoading(true);
        try {
            await client.patch(`/admin/staff/${selectedStaff._id}/status`, { isActive: false });
            showFeedback(`Account "${selectedStaff.username}" has been deactivated safely to preserve history.`);
            setShowDeleteModal(false);
            fetchStaff();
        } catch (err) {
            showFeedback(err.response?.data?.message || 'Failed to deactivate account', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Filter staff list by search query
    const filteredStaff = staffList.filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        const username = (s.username || '').toLowerCase();
        const school = (s.schoolId?.name || s.schoolName || '').toLowerCase();
        return username.includes(q) || school.includes(q);
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Staff Registry</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isSuperAdmin
                            ? 'Manage institutional accounts, subject assignments, and permissions for Teachers and School Admins.'
                            : `Manage Teacher accounts and assignments for ${currentUser?.schoolName || 'your school'}.`}
                    </p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New {activeTab}
                </button>
            </div>

            {/* Notification Banner */}
            {feedbackMessage && (
                <div className={`p-4 rounded-lg flex items-center justify-between text-sm ${feedbackMessage.type === 'error'
                    ? 'bg-red-50 text-red-800 border border-red-200'
                    : 'bg-green-50 text-green-800 border border-green-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {feedbackMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-green-600" />}
                        <span>{feedbackMessage.text}</span>
                    </div>
                    <button onClick={() => setFeedbackMessage(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Controls: Tabs & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                {isSuperAdmin ? (
                    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                        {['Teacher', 'School Admin'].map(role => (
                            <button
                                key={role}
                                onClick={() => setActiveTab(role)}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${activeTab === role
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                {role}s
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200 inline-block w-fit">
                        School Scope: {currentUser?.schoolName || 'Authorized School'}
                    </div>
                )}

                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                        type="text"
                        placeholder="Search by username or school..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* STAFF LIST TABLE */}
            {loading ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Loading staff accounts...</p>
                </div>
            ) : filteredStaff.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-gray-800">No {activeTab}s found</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {searchQuery ? 'Try adjusting your search query.' : `Click "New ${activeTab}" to provision an account.`}
                    </p>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">School Scope</th>
                                {activeTab === 'Teacher' && (
                                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Subjects</th>
                                )}
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Publish Rights</th>
                                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Status</th>
                                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStaff.map(staff => (
                                <tr key={staff._id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center">
                                                {staff.role === 'Teacher' ? <User className="h-5 w-5 text-indigo-600" /> : <Shield className="h-5 w-5 text-purple-600" />}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-gray-900">{staff.username}</div>
                                                <div className="text-xs text-gray-400">
                                                    Joined: {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-800">
                                            {staff.schoolId?.name || staff.schoolName || 'All Schools'}
                                        </div>
                                        <div className="text-xs text-gray-400">
                                            {staff.schoolId ? 'Specific School' : 'Global Institution Scope'}
                                        </div>
                                    </td>
                                    {activeTab === 'Teacher' && (
                                        <td className="px-6 py-4">
                                            {staff.assignedSubjects && staff.assignedSubjects.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                    {staff.assignedSubjects.map((as, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-100"
                                                        >
                                                            {getSubjectDisplayName(as.subjectId)}
                                                            <span className="ml-1 text-[10px] text-blue-600 font-normal">
                                                                {as.classes && as.classes.length > 0 ? `(${as.classes.join(', ')})` : '(All)'}
                                                            </span>
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No assigned subjects</span>
                                            )}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button
                                            onClick={() => handleTogglePermission(staff, 'canPublish', !staff.permissions?.canPublish)}
                                            disabled={isSchoolAdmin && currentUser?.permissions?.canPublish !== true}
                                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full border transition-all ${staff.permissions?.canPublish
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                                } ${isSchoolAdmin && currentUser?.permissions?.canPublish !== true ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer select-none active:scale-95'}`}
                                            title={isSchoolAdmin && currentUser?.permissions?.canPublish !== true ? "Only Super Admin or authorized School Admin can toggle" : "Toggle exam publishing permission"}
                                        >
                                            {staff.permissions?.canPublish ? 'Can Publish' : 'Draft Only'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full border ${staff.isActive
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                            }`}>
                                            {staff.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button
                                                onClick={() => openEditModal(staff)}
                                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Staff Profile"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openPasswordModal(staff)}
                                                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="Reset Password"
                                            >
                                                <Lock className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => openStatusModal(staff)}
                                                className={`p-1.5 rounded-lg transition-colors ${staff.isActive
                                                    ? 'text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                    }`}
                                                title={staff.isActive ? "Deactivate Account" : "Activate Account"}
                                            >
                                                {staff.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(staff)}
                                                className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Account"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================================================== */}
            {/* 1. CREATE STAFF MODAL */}
            {/* ============================================================== */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 my-8">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-900">Provision New {activeTab}</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. math_teacher_1"
                                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={createForm.username}
                                    onChange={e => setCreateForm({ ...createForm, username: e.target.value })}
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Username is case-insensitive for login.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    placeholder="Minimum 6 characters"
                                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={createForm.password}
                                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                />
                            </div>

                            {/* School Selection */}
                            {isSuperAdmin ? (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Assigned School Scope {activeTab === 'School Admin' && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={createForm.schoolId}
                                        onChange={e => setCreateForm({ ...createForm, schoolId: e.target.value })}
                                        required={activeTab === 'School Admin'}
                                    >
                                        <option value="">Select an affiliated school...</option>
                                        {activeTab === 'Teacher' && <option value="GLOBAL">All Schools (Global Cross-School Scope)</option>}
                                        {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            ) : (
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <span className="text-xs text-gray-500 font-semibold uppercase">School Assignment: </span>
                                    <span className="text-xs font-bold text-gray-800">{currentUser?.schoolName}</span>
                                </div>
                            )}

                            {/* Permissions */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="createCanPublish"
                                    checked={createForm.canPublish}
                                    onChange={e => setCreateForm({ ...createForm, canPublish: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="createCanPublish" className="text-xs font-medium text-gray-700">
                                    Grant Exam Publishing Rights (Otherwise Draft-Only)
                                </label>
                            </div>

                            {/* Teacher Subject Assignment Builder */}
                            {createForm.role === 'Teacher' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subject & Class Assignments</h4>
                                    </div>

                                    <div className="space-y-2">
                                        <select
                                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                                            value={subjectInput.subjectId}
                                            onChange={e => setSubjectInput({ ...subjectInput, subjectId: e.target.value })}
                                        >
                                            <option value="">Select subject to assign...</option>
                                            {allSubjects.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>

                                        <div>
                                            <span className="text-[11px] font-semibold text-gray-500 block mb-1">Target Classes (Leave empty for All Classes):</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[6, 7, 8, 9, 10].map(cls => (
                                                    <button
                                                        key={cls}
                                                        type="button"
                                                        onClick={() => toggleClassSelection(cls)}
                                                        className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${subjectInput.classes.includes(cls)
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Class {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleAddAssignment('create')}
                                            disabled={!subjectInput.subjectId}
                                            className="w-full py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                            + Add Subject Assignment
                                        </button>
                                    </div>

                                    {/* Selected Assignments List */}
                                    {createForm.assignedSubjects.length > 0 && (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                            {createForm.assignedSubjects.map((assign, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-800">{getSubjectDisplayName(assign.subjectId)}</span>
                                                        <span className="ml-2 text-gray-500">
                                                            {assign.classes.length === 0 ? '(All Classes)' : `(Classes: ${assign.classes.join(', ')})`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAssignment(idx, 'create')}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 shadow-sm"
                                >
                                    {actionLoading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 2. EDIT STAFF MODAL */}
            {/* ============================================================== */}
            {showEditModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 my-8">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Edit Staff Profile</h2>
                                <p className="text-xs text-gray-500">{selectedStaff.role} • ID: {selectedStaff._id}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    value={editForm.username}
                                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                                />
                            </div>

                            {/* School Selection */}
                            {isSuperAdmin && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                        Assigned School Scope
                                    </label>
                                    <select
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={editForm.schoolId}
                                        onChange={e => setEditForm({ ...editForm, schoolId: e.target.value })}
                                    >
                                        <option value="">Select an affiliated school...</option>
                                        {selectedStaff.role === 'Teacher' && <option value="GLOBAL">All Schools (Global Cross-School Scope)</option>}
                                        {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Permissions */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="editCanPublish"
                                    checked={editForm.canPublish}
                                    onChange={e => setEditForm({ ...editForm, canPublish: e.target.checked })}
                                    disabled={isSchoolAdmin && currentUser?.permissions?.canPublish !== true}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                                />
                                <label htmlFor="editCanPublish" className="text-xs font-medium text-gray-700">
                                    Grant Exam Publishing Rights (Otherwise Draft-Only)
                                </label>
                            </div>

                            {/* Teacher Subject Assignment Builder */}
                            {selectedStaff.role === 'Teacher' && (
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subject & Class Assignments</h4>
                                    </div>

                                    <div className="space-y-2">
                                        <select
                                            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                                            value={subjectInput.subjectId}
                                            onChange={e => setSubjectInput({ ...subjectInput, subjectId: e.target.value })}
                                        >
                                            <option value="">Select subject to assign...</option>
                                            {allSubjects.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                                            ))}
                                        </select>

                                        <div>
                                            <span className="text-[11px] font-semibold text-gray-500 block mb-1">Target Classes (Leave empty for All Classes):</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {[6, 7, 8, 9, 10].map(cls => (
                                                    <button
                                                        key={cls}
                                                        type="button"
                                                        onClick={() => toggleClassSelection(cls)}
                                                        className={`px-2.5 py-1 text-xs font-bold rounded-md border transition-all ${subjectInput.classes.includes(cls)
                                                            ? 'bg-blue-600 text-white border-blue-600'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        Class {cls}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleAddAssignment('edit')}
                                            disabled={!subjectInput.subjectId}
                                            className="w-full py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold rounded-lg disabled:opacity-50 transition-colors"
                                        >
                                            + Add Subject Assignment
                                        </button>
                                    </div>

                                    {/* Existing Assignments List */}
                                    {editForm.assignedSubjects.length > 0 && (
                                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                            {editForm.assignedSubjects.map((assign, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-white px-3 py-1.5 border border-slate-200 rounded-lg text-xs">
                                                    <div>
                                                        <span className="font-bold text-gray-800">{getSubjectDisplayName(assign.subjectId)}</span>
                                                        <span className="ml-2 text-gray-500">
                                                            {assign.classes.length === 0 ? '(All Classes)' : `(Classes: ${assign.classes.join(', ')})`}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAssignment(idx, 'edit')}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 shadow-sm"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 3. PASSWORD RESET MODAL */}
            {/* ============================================================== */}
            {showPasswordModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
                                <p className="text-xs text-gray-500">User: {selectedStaff.username}</p>
                            </div>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                                Setting a new password will automatically invalidate any active sessions or tokens for this user.
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={passwordForm.showText ? "text" : "password"}
                                        required
                                        placeholder="Minimum 6 characters"
                                        className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setPasswordForm({ ...passwordForm, showText: !passwordForm.showText })}
                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                    >
                                        {passwordForm.showText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type={passwordForm.showText ? "text" : "password"}
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="px-5 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50 shadow-sm"
                                >
                                    {actionLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 4. STATUS TOGGLE MODAL */}
            {/* ============================================================== */}
            {showStatusModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${selectedStaff.isActive ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {selectedStaff.isActive ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {selectedStaff.isActive ? 'Deactivate Account?' : 'Activate Account?'}
                                </h3>
                                <p className="text-xs text-gray-500">User: {selectedStaff.username} ({selectedStaff.role})</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600">
                            {selectedStaff.isActive
                                ? `Disabling this account will immediately revoke all login capabilities and invalidate active sessions for "${selectedStaff.username}". Historical exams and audit records will remain preserved.`
                                : `Enabling this account will restore login and administrative capabilities for "${selectedStaff.username}".`}
                        </p>

                        <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowStatusModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleStatusConfirm}
                                disabled={actionLoading}
                                className={`px-5 py-2 text-sm font-bold text-white rounded-lg disabled:opacity-50 shadow-sm ${selectedStaff.isActive
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                            >
                                {actionLoading ? 'Updating...' : (selectedStaff.isActive ? 'Yes, Deactivate' : 'Yes, Activate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* 5. GUARDED DELETE MODAL */}
            {/* ============================================================== */}
            {showDeleteModal && selectedStaff && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-50 text-red-600 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Permanently Delete Staff?</h3>
                                <p className="text-xs text-gray-500">User: {selectedStaff.username} ({selectedStaff.role})</p>
                            </div>
                        </div>

                        {deleteWarning ? (
                            <div className="space-y-3">
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
                                    {deleteWarning}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Hard deletion is blocked by system safety rules to prevent orphaned records. Deactivating the account revokes all access while protecting audit compliance.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Are you sure you want to permanently delete account <strong>"{selectedStaff.username}"</strong>?
                                This action cannot be undone. Accounts with linked exam content or audit trails cannot be hard-deleted.
                            </p>
                        )}

                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                            {deleteWarning ? (
                                <button
                                    type="button"
                                    onClick={handleDeactivateFromDelete}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
                                >
                                    Deactivate Instead
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleDeleteSubmit}
                                    disabled={actionLoading}
                                    className="px-4 py-2 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm"
                                >
                                    {actionLoading ? 'Checking & Deleting...' : 'Confirm Delete'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffRegistry;
