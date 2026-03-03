import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, Plus, FilePenLine, Trash2 } from 'lucide-react';

const AdminAnnouncementsPage = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Live Session State
    const [activeTab, setActiveTab] = useState('announcements');
    const [liveSessions, setLiveSessions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [schools, setSchools] = useState([]); // [NEW] Schools List

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        message: '', // Used for Description in Live Session
        priority: 'Normal',
        targetType: 'Global', // Global, Class, Subject, School
        targetClass: '',
        targetSubjectId: '',
        targetSchoolId: '', // [NEW]
        attachment: null, // New file attachment
        // Live Session Specifics
        platform: 'Zoom',
        joinLink: '',
        startTime: '',
        endTime: ''
    });

    useEffect(() => {
        fetchAnnouncements();
        fetchLiveSessions();
        fetchSubjects();
        fetchSchools(); // [NEW]
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await client.get('/announcements');
            setAnnouncements(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveSessions = async () => {
        try {
            const res = await client.get('/live-sessions/admin/all');
            setLiveSessions(res.data);
        } catch (err) {
            console.error("Error fetching live sessions", err);
        }
    };

    const fetchSubjects = async () => {
        try {
            const res = await client.get('/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error("Error fetching subjects", err);
        }
    };

    const fetchSchools = async () => {
        try {
            const res = await client.get('/admin/schools');
            setSchools(res.data);
        } catch (err) {
            console.error("Error fetching schools", err);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, attachment: e.target.files[0] });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payloadTargetType = formData.targetType === 'Global' ? 'Global' :
            (formData.targetClass ? 'Class' : 'Subject');

        const targetAudience = {
            type: payloadTargetType,
            ...(formData.targetClass && { class: formData.targetClass }),
            ...(formData.targetSubjectId && { subjectId: formData.targetSubjectId })
        };

        if (user.role === 'Teacher') {
            targetAudience.type = 'Subject';
        } else {
            // Admin Logic
            if (formData.targetType !== 'Global') {
                if (formData.targetClass) {
                    targetAudience.type = 'Class';
                } else if (formData.targetSubjectId) {
                    targetAudience.type = 'Subject';
                } else if (formData.targetSchoolId) {
                    targetAudience.type = 'School';
                    targetAudience.schoolId = formData.targetSchoolId;
                } else if (formData.targetType === 'Custom' || formData.targetType === 'School') {
                    // Check specific types because 'Custom' is UI only, actual types are Class/Subject
                    // But if 'School' was selected (mapped to Custom or standalone?)
                    // Let's refine targetType logic.
                    if (formData.targetType === 'School' && !formData.targetSchoolId) {
                        return alert("Please select a School");
                    }
                    // Fallback check
                    return alert("Please select a specific target (Class, Subject, or School)");
                }
            }
        }

        try {
            if (activeTab === 'announcements') {
                // Use FormData for File Upload
                const data = new FormData();
                data.append('title', formData.title);
                data.append('message', formData.message);
                data.append('priority', formData.priority);

                // Append nested object as JSON string or individual fields? 
                // Mongoose/Express body parser might struggle with mixed FormData if not handled right.
                // Safest to JSON stringify complex objects in FormData
                // But typically express body-parser handles 'targetAudience[type]' syntax if strictly followed.
                // However, our backend controller expects `req.body` to have `targetAudience` object.
                // Let's use individual fields for simplicity if object fails, OR stringify.
                // Let's try appending as object paths:
                // Construct Target Audience for Payload
                data.append('targetAudience[type]', formData.targetType); // Global or School
                if (formData.targetClass) data.append('targetAudience[class]', formData.targetClass);
                if (formData.targetSubjectId) data.append('targetAudience[subjectId]', formData.targetSubjectId);
                if (formData.targetSchoolId) data.append('targetAudience[schoolId]', formData.targetSchoolId);
                if (targetAudience.schoolId) data.append('targetAudience[schoolId]', targetAudience.schoolId);

                if (formData.attachment) {
                    data.append('attachment', formData.attachment);
                }

                if (editingId) {
                    // Patch might need different handling if we want to replace file.
                    // For now, simpler to just send fields.
                    // NOTE: axios with FormData automatically sets Content-Type to multipart/form-data
                    await client.patch(`/announcements/${editingId}`, data);
                    alert('Announcement Updated!');
                } else {
                    const endpoint = user.role === 'Teacher' ? '/announcements/create/teacher' : '/announcements/create/admin';
                    await client.post(endpoint, data);
                    alert('Announcement Created!');
                }
                fetchAnnouncements();
            } else {
                // Live Session Submit (JSON)
                const payload = {
                    title: formData.title,
                    targetAudience,
                    description: formData.message, // reusing message field as description
                    platform: formData.platform,
                    joinLink: formData.joinLink,
                    startTime: formData.startTime,
                    endTime: formData.endTime
                };

                if (editingId) {
                    await client.patch(`/live-sessions/${editingId}`, payload);
                    alert('Live Session Updated');
                } else {
                    await client.post('/live-sessions/create', payload);
                    alert('Live Session Scheduled!');
                }
                fetchLiveSessions();
            }
            closeModal();
        } catch (err) {
            console.error(err);
            alert('Error saving: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await client.delete(`/announcements/${id}`);
            alert('Announcement deleted');
            fetchAnnouncements();
        } catch (err) {
            alert('Error deleting: ' + err.message);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item._id);

        let visualTargetType = 'Global';
        if (item.targetAudience.type !== 'Global') visualTargetType = 'Custom';

        if (activeTab === 'announcements') {
            setFormData({
                title: item.title,
                message: item.message,
                priority: item.priority,
                targetType: visualTargetType,
                targetClass: item.targetAudience.class || '',
                targetSubjectId: item.targetAudience.subjectId?._id || item.targetAudience.subjectId || '',
                targetSchoolId: item.targetAudience.schoolId?._id || item.targetAudience.schoolId || ''
            });
        } else {
            // Live Session Edit
            setFormData({
                title: item.title,
                message: item.description,
                targetType: visualTargetType,
                targetClass: item.targetAudience.class || '',
                targetSubjectId: item.targetAudience.subjectId?._id || item.targetAudience.subjectId || '',
                platform: item.platform,
                joinLink: item.joinLink,
                startTime: item.startTime ? new Date(item.startTime).toISOString().slice(0, 16) : '',
                endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setFormData({
            title: '', message: '', priority: 'Normal', targetType: 'Global', targetClass: '', targetSubjectId: '', targetSchoolId: '',
            platform: 'Zoom', joinLink: '', startTime: '', endTime: ''
        });
    };

    const isTeacher = user?.role === 'Teacher';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    <Plus className="w-5 h-5" />
                    {activeTab === 'announcements' ? 'New Announcement' : 'Schedule Session'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'announcements' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('announcements')}
                >
                    Announcements
                </button>
                <button
                    className={`px-4 py-2 font-medium text-sm ${activeTab === 'live' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('live')}
                >
                    Live Sessions
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'announcements' ? (
                // EXISTING ANNOUNCEMENTS TABLE
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {announcements.map((ann) => (
                                <tr key={ann._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {ann.title}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                                            {/* Type Icon/Label */}
                                            {ann.targetAudience.type === 'School' ? (
                                                <span className="text-blue-600">
                                                    {ann.targetAudience.schoolId?.name || 'Specific School'}
                                                </span>
                                            ) : 'Global'}

                                            {/* Filters */}
                                            {(ann.targetAudience.class || ann.targetAudience.subjectId) && (
                                                <span className="text-gray-400">|</span>
                                            )}

                                            {ann.targetAudience.class && (
                                                <span>Class {ann.targetAudience.class}</span>
                                            )}

                                            {ann.targetAudience.subjectId && (
                                                <span className="text-gray-500">
                                                    ({ann.targetAudience.subjectId.name || 'Subject'})
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {ann.priority === 'Important' ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800">
                                                Important
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Normal
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {ann.authorRole}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(ann)}
                                            className="text-indigo-600 hover:text-indigo-900 p-1 bg-indigo-50 rounded"
                                            title="Edit"
                                        >
                                            <FilePenLine className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ann._id)}
                                            className="text-red-600 hover:text-red-900 p-1 bg-red-50 rounded"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {announcements.length === 0 && !loading && (
                        <div className="p-8 text-center text-gray-500">No announcements found.</div>
                    )}
                </div>
            ) : (
                // LIVE SESSIONS TABLE
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {liveSessions.map((session) => (
                                <tr key={session._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{new Date(session.startTime).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-400">
                                            {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {session.title}
                                        <div className="text-xs text-gray-500">{session.targetAudience.type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {session.platform}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${session.status === 'Live' ? 'bg-red-100 text-red-800' :
                                                session.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {session.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleEdit(session)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {liveSessions.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No live sessions scheduled.</div>
                    )}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingId ? 'Edit' : 'Create'} {activeTab === 'announcements' ? 'Announcement' : 'Live Session'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {activeTab === 'announcements' ? 'Message' : 'Description'}
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            {activeTab === 'announcements' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Attachment (Optional)</label>
                                    <input
                                        type="file"
                                        className="mt-1 w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-indigo-50 file:text-indigo-700
                                        hover:file:bg-indigo-100"
                                        onChange={handleFileChange}
                                    />
                                    {formData.attachment && (
                                        <p className="mt-1 text-xs text-green-600">
                                            Selected: {formData.attachment.name}
                                        </p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'live' && (
                                <div className="space-y-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <h3 className="text-sm font-semibold text-indigo-900">Session Details</h3>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Platform</label>
                                        <select
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={formData.platform}
                                            onChange={e => setFormData({ ...formData, platform: e.target.value })}
                                        >
                                            <option value="Zoom">Zoom</option>
                                            <option value="Google Meet">Google Meet</option>
                                            <option value="Teams">Microsoft Teams</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Join Link</label>
                                        <input
                                            type="url"
                                            required
                                            placeholder="https://..."
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                                            value={formData.joinLink}
                                            onChange={e => setFormData({ ...formData, joinLink: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={formData.startTime}
                                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700">End Time</label>
                                            <input
                                                type="datetime-local"
                                                required
                                                className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={formData.endTime}
                                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                {activeTab === 'announcements' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Priority</label>
                                        <select
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                            value={formData.priority}
                                            onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        >
                                            <option value="Normal">Normal</option>
                                            <option value="Important">Important</option>
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="text-sm font-semibold text-gray-900">Target Audience</h3>

                                    {/* 1. School Scope */}
                                    {!isTeacher && (
                                        <div className="grid grid-cols-1 gap-2">
                                            <label className="block text-xs font-medium text-gray-700">School Scope</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="schoolScope"
                                                        checked={formData.targetType !== 'School'}
                                                        onChange={() => setFormData(prev => ({ ...prev, targetType: 'Global', targetSchoolId: '' }))}
                                                    />
                                                    All Schools (Global)
                                                </label>
                                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="schoolScope"
                                                        checked={formData.targetType === 'School'}
                                                        onChange={() => setFormData(prev => ({ ...prev, targetType: 'School' }))}
                                                    />
                                                    Specific School
                                                </label>
                                            </div>

                                            {formData.targetType === 'School' && (
                                                <select
                                                    className="mt-1 w-full p-2 border border-blue-300 rounded-md text-sm bg-blue-50"
                                                    value={formData.targetSchoolId}
                                                    required={formData.targetType === 'School'}
                                                    onChange={e => setFormData({ ...formData, targetSchoolId: e.target.value })}
                                                >
                                                    <option value="">-- Select Target School --</option>
                                                    {schools.map(s => (
                                                        <option key={s._id} value={s._id}>{s.name} {s.schoolCode ? `(${s.schoolCode})` : ''}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    )}

                                    {/* 2. Class & Subject Filters (Composable) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Class Filter (Optional)</label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={formData.targetClass}
                                                onChange={e => setFormData({ ...formData, targetClass: e.target.value })}
                                            >
                                                <option value="">All Classes</option>
                                                {[6, 7, 8, 9, 10].map(c => <option key={c} value={c}>Class {c}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Subject Filter (Optional)</label>
                                            <select
                                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                                                value={formData.targetSubjectId}
                                                onChange={e => setFormData({ ...formData, targetSubjectId: e.target.value })}
                                            >
                                                <option value="">All Subjects</option>
                                                {subjects.map(sub => (
                                                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    {editingId ? 'Update' : 'Post Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncementsPage;
