import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { Plus, Edit2, Users, School as SchoolIcon, ArrowRightLeft } from 'lucide-react';

const SchoolRegistry = () => {
    const [schools, setSchools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // create, rename, merge
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [formData, setFormData] = useState({ name: '', schoolCode: '', targetSchoolId: '' });

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            setLoading(true);
            const res = await client.get('/admin/schools');
            setSchools(res.data);
        } catch (err) {
            console.error("Failed to fetch schools", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await client.post('/admin/schools', {
                name: formData.name,
                schoolCode: formData.schoolCode
            });
            setShowModal(false);
            fetchSchools();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create school');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await client.put(`/admin/schools/${selectedSchool._id}`, {
                name: formData.name,
                schoolCode: formData.schoolCode
            });
            setShowModal(false);
            fetchSchools();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update school');
        }
    };

    const handleMerge = async (e) => {
        e.preventDefault();
        if (!window.confirm(`Are you sure you want to merge ${selectedSchool.name} into the selected target? This cannot be undone.`)) return;

        try {
            const res = await client.post('/admin/schools/merge', {
                sourceSchoolId: selectedSchool._id,
                targetSchoolId: formData.targetSchoolId
            });
            alert(res.data.message);
            setShowModal(false);
            fetchSchools();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to merge schools');
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setFormData({ name: '', schoolCode: '', targetSchoolId: '' });
        setShowModal(true);
    };

    const openRenameModal = (school) => {
        setModalMode('rename');
        setSelectedSchool(school);
        setFormData({ name: school.name, schoolCode: school.schoolCode || '', targetSchoolId: '' });
        setShowModal(true);
    };

    const openMergeModal = (school) => {
        setModalMode('merge');
        setSelectedSchool(school);
        setFormData({ name: school.name, schoolCode: school.schoolCode, targetSchoolId: '' });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">School Registry</h1>
                    <p className="text-gray-500">Manage all schools, merges, and updates.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    New School
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {schools.map(school => (
                        <div key={school._id} className="bg-white border rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <SchoolIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex space-x-2">
                                    <button onClick={() => openRenameModal(school)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Rename">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openMergeModal(school)} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Merge into another">
                                        <ArrowRightLeft className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 mb-1">{school.name}</h3>
                            {school.schoolCode && <div className="text-xs font-mono bg-gray-100 inline-block px-2 py-0.5 rounded text-gray-600 mb-3">{school.schoolCode}</div>}

                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2 border-t pt-3">
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1.5" />
                                    <span>{school.studentCount || 0} Students</span>
                                </div>
                                <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1.5" />
                                    <span>{school.teacherCount || 0} Teachers</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">
                            {modalMode === 'create' ? 'Create New School' :
                                modalMode === 'rename' ? 'Rename School' : 'Merge School'}
                        </h2>

                        <form onSubmit={modalMode === 'create' ? handleCreate : modalMode === 'rename' ? handleUpdate : handleMerge}>

                            {modalMode !== 'merge' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. Hyderabad Public School"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">School Code (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.schoolCode}
                                            onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. HPS-01"
                                        />
                                    </div>
                                </div>
                            )}

                            {modalMode === 'merge' && (
                                <div className="space-y-4">
                                    <div className="p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg">
                                        Warning: You are merging <strong>{selectedSchool?.name}</strong>.
                                        All students and staff will be moved to the target school.
                                        <strong>{selectedSchool?.name}</strong> will be archived.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Merge Into (Target School)</label>
                                        <select
                                            required
                                            value={formData.targetSchoolId}
                                            onChange={(e) => setFormData({ ...formData, targetSchoolId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select Target School...</option>
                                            {schools
                                                .filter(s => s._id !== selectedSchool?._id)
                                                .map(s => (
                                                    <option key={s._id} value={s._id}>{s.name}</option>
                                                ))}
                                        </select>
                                    </div>
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
                                    {modalMode === 'create' ? 'Create School' :
                                        modalMode === 'rename' ? 'Update School' : 'Confirm Merge'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SchoolRegistry;
