import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Download, Trash2, CheckSquare } from 'lucide-react';
import ExamTable from '../../components/exams/ExamTable';
import MonthGroupedExams from './MonthGroupedExams';
import { examService } from '../../api/examService';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';


const ExamsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedExams, setSelectedExams] = useState(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [schools, setSchools] = useState([]); // Schools list
    const [filters, setFilters] = useState({
        subject: '',
        section: '',
        class: '',
        medium: '',
        school: '',
        pattern: '',
        status: '', // Default to ALL to show drafts and published
        search: '',
        date: ''
    });

    const [distinctSubjects, setDistinctSubjects] = useState([]);
    // We can fetch subjects dynamically or hardcode if standard. 
    // Assuming we might need to extract from exams or fetch from API. 
    // For now, we'll extract from loaded exams or hardcoded list.

    useEffect(() => {
        fetchExams();
        fetchSubjects();
        if (user?.role === 'Super Admin' || user?.role === 'Owner') {
            fetchSchools();
        }
    }, [user?.role]);

    const fetchSubjects = async () => {
        try {
            const res = await client.get('/admin/subjects');
            setDistinctSubjects(res.data.map(s => s.name));
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

    const fetchExams = async () => {
        setLoading(true);
        try {
            // Requirement 3: "Default View: Show Published + Active exams only".
            // "Archived exams -> greyed row".
            // This suggests they ARE shown if filters allow.

            // Strategy: Fetch EVERYTHING from Admin API (no filters initially) to support client-side filtering freely.
            // Or if dataset is huge, this is bad. But for Phase 1 Admin, likely manageable.
            const allExams = await examService.getExams({});
            setExams(allExams);

            // Subjects are now fetched independently via fetchSubjects


        } catch (err) {
            console.error("Failed to fetch exams", err);
            // alert("Failed to fetch exams");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const filteredExams = exams.filter(exam => {
        // 1. Status Filter
        // Requirement values: 'Draft', 'Published', 'Archived'
        // Map to exam properties: 
        // Published: isPublished === true
        // Draft: isPublished === false 
        // Archived: Requirement "Archived exams -> greyed row". 
        // "Old versions are archived". 
        // Maybe we just show everything and let the user filter?
        // User selected 'status' filter:
        if (filters.status === 'published' && !exam.isPublished) return false;
        if (filters.status === 'draft' && exam.isPublished) return false;
        // if filters.status === 'all' (or empty), show both.

        // 2. Subject
        if (filters.subject && exam.subject?.name !== filters.subject) return false;

        // 3. Section
        if (filters.section && exam.section !== filters.section) return false;

        // 4. Pattern
        if (filters.pattern && String(exam.patternType) !== String(filters.pattern)) return false;

        // 5. Class (Scope) - Client side check
        // exam.scopes.classes is array. check if it includes filters.class
        if (filters.class) {
            if (!exam.scopes?.classes?.includes(filters.class) && !exam.scopes?.classes?.includes('Global')) return false;
        }

        // 6. Medium (Scope)
        if (filters.medium && !exam.scopes?.medium?.includes(filters.medium)) return false;

        // 7. School (Scope)
        if (filters.school && !exam.scopes?.schools?.includes(filters.school) && !exam.scopes?.schools?.includes('Global')) return false;

        // 8. Search (Title)
        if (filters.search) {
            if (!exam.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        }

        // 9. Date Filter
        if (filters.date) {
            const examDate = new Date(exam.startTime || exam.createdAt).toDateString();
            const filterDate = new Date(filters.date).toDateString();
            if (examDate !== filterDate) return false;
        }

        return true;
    });

    // Sort: Scheduled Start Date (Newest First)
    // We favor `startTime` if available, else `createdAt`
    // Schema has `startTime` (Date).

    const sortedExams = filteredExams.sort((a, b) => {
        const dateA = new Date(a.startTime || a.createdAt);
        const dateB = new Date(b.startTime || b.createdAt);
        return dateB - dateA; // Newest first
    });
    const toggleExamSelection = (examId) => {
        setSelectedExams(prev => {
            const newSet = new Set(prev);
            if (newSet.has(examId)) newSet.delete(examId);
            else newSet.add(examId);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedExams.size === sortedExams.length && sortedExams.length > 0) {
            setSelectedExams(new Set());
        } else {
            setSelectedExams(new Set(sortedExams.map(e => e._id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedExams.size === 0) return;
        if (!window.confirm(`Are you sure you want to permanently delete ${selectedExams.size} selected exam(s)? This action cannot be undone.`)) return;

        setIsDeleting(true);
        try {
            await examService.bulkDeleteExams(Array.from(selectedExams));
            setSelectedExams(new Set());
            fetchExams();
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert("Failed to delete exams: " + (err.response?.data?.message || err.message));
        } finally {
            setIsDeleting(false);
        }
    };

    // Modal State
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [selectedExamForPublish, setSelectedExamForPublish] = useState(null);

    const handleAction = async (action, exam) => {
        if (action === 'view') {
            navigate(`/exams/${exam._id}`);
        } else if (action === 'edit') {
            navigate(`/exams/create?edit=${exam._id}`);
        } else if (action === 'archive') {
            if (window.confirm('Are you sure you want to archive this exam?')) {
                await examService.archiveExam(exam._id);
                fetchExams();
            }
        } else if (action === 'duplicate') {
            navigate(`/exams/create?source=${exam._id}`);
        } else if (action === 'delete') {
            if (window.confirm('Are you sure you want to permanently delete this exam? This cannot be undone.')) {
                try {
                    await examService.deleteExam(exam._id);
                    setSelectedExams(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(exam._id);
                        return newSet;
                    });
                    fetchExams();
                } catch (err) {
                    console.error("Delete failed", err);
                    alert("Failed to delete exam: " + (err.response?.data?.message || err.message));
                }
            }
        } else if (action === 'toggleStatus') {
            // Logic: 
            // 1. If Unpublishing (Published -> Draft): Just do it (maybe confirm?) -> doing it direct is fast.
            // 2. If Publishing (Draft -> Published): Check for "Fresh Start" requirement.

            if (exam.isPublished) {
                // Currently Published -> Going to Draft
                // Direct update
                try {
                    await examService.updateStatus(exam._id, false);
                    fetchExams();
                } catch (err) {
                    console.error("Failed to unpublish", err);
                    alert("Failed to unpublish: " + err.message);
                }
            } else {
                // Currently Draft -> Going to Publish
                // Open Modal to ask about Reset
                setSelectedExamForPublish(exam);
                setShowPublishModal(true);
            }
        }
    };

    const confirmPublish = async (resetAttempts) => {
        if (!selectedExamForPublish) return;

        try {
            await examService.updateStatus(selectedExamForPublish._id, true, resetAttempts);
            fetchExams();
            setShowPublishModal(false);
            setSelectedExamForPublish(null);
        } catch (err) {
            console.error("Failed to publish", err);
            alert("Failed to publish: " + err.message);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Exams Administration</h1>
                <button
                    onClick={() => navigate('/exams/create')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Create New Exam
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-5 lg:col-span-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search exams..."
                            className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={filters.search}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                        />
                    </div>

                    {/* School Filter - Super Admin Only */}
                    {(user?.role === 'Super Admin' || user?.role === 'Owner') && (
                        <div className="md:col-span-1">
                            {/* <label className="block text-xs font-medium text-gray-500 mb-1">School</label> */}
                            <select
                                className="w-full border p-2 rounded text-gray-600 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.school}
                                onChange={(e) => handleFilterChange('school', e.target.value)}
                            >
                                <option value="">All Schools</option>
                                <option value="Global">Global</option>
                                {schools.map(s => (
                                    <option key={s._id || s} value={s.name || s}>
                                        {s.name || s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="md:col-span-1">
                        <input
                            type="date"
                            className="w-full border p-2 rounded text-gray-600 border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                            value={filters.date}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                            placeholder="Select Date"
                        />
                    </div>

                    {/* Filters */}
                    <select
                        className="border p-2 rounded"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                        <option value="">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>

                    <select
                        className="border p-2 rounded"
                        value={filters.subject}
                        onChange={(e) => handleFilterChange('subject', e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {distinctSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        className="border p-2 rounded"
                        value={filters.class}
                        onChange={(e) => handleFilterChange('class', e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {[6, 7, 8, 9, 10].map(c => <option key={c} value={c}>Class {c}</option>)}
                    </select>

                    <select
                        className="border p-2 rounded"
                        value={filters.medium}
                        onChange={(e) => handleFilterChange('medium', e.target.value)}
                    >
                        <option value="">All Mediums</option>
                        <option value="English">English</option>
                        <option value="Telugu">Telugu</option>
                        <option value="Hindi">Hindi</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedExams.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
                    <span className="text-blue-800 font-medium tracking-tight">
                        <strong>{selectedExams.size}</strong> exam(s) selected
                    </span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                        {isDeleting ? 'Deleting...' : 'Delete Selected'}
                    </button>
                </div>
            )}

            {/* Exam List Table */}
            <div className="mt-6">
                {/* Month-wise Grouped List */}
                {sortedExams.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <div className="text-4xl mb-4 opacity-30">📂</div>
                        <h3 className="text-lg font-medium text-slate-500">No exams found</h3>
                        <p className="text-slate-400 text-sm">Try adjusting your filters or create a new exam.</p>
                    </div>
                ) : (
                    <div className="pb-20">
                        <MonthGroupedExams
                            exams={sortedExams}
                            onAction={handleAction}
                            selectedExams={selectedExams}
                            onToggleSelection={toggleExamSelection}
                            onToggleSelectAll={toggleSelectAll}
                        />
                    </div>
                )}
            </div>
            {/* Publish Confirmation Modal */}
            {showPublishModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">🚀</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Publish Exam</h3>
                            <p className="text-slate-600 mb-6">
                                You are about to publish <strong>{selectedExamForPublish?.title}</strong>.
                                <br />
                                <span className="text-sm mt-2 block text-slate-500">
                                    If students have previously taken this exam, you can choose to reset their attempts for a "Fresh Start".
                                </span>
                            </p>

                            <div className="w-full space-y-3">
                                <button
                                    onClick={() => confirmPublish(true)}
                                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                >
                                    <span>🔄 Reset Attempts & Publish</span>
                                </button>
                                <button
                                    onClick={() => confirmPublish(false)}
                                    className="w-full py-3 px-4 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    <span>Keep History & Publish</span>
                                </button>
                                <button
                                    onClick={() => setShowPublishModal(false)}
                                    className="mt-2 text-slate-400 font-medium hover:text-slate-600 text-sm"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExamsList;
