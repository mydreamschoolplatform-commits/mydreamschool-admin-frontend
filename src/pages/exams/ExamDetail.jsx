import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Copy, Archive, Calendar, Users, BarChart2 } from 'lucide-react';
import { examService } from '../../api/examService';

const ExamDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Use allSettled so if analytics fails, we still show the exam
            const results = await Promise.allSettled([
                examService.getExamById(id),
                examService.getExamAnalytics(id)
            ]);

            const examResult = results[0];
            const analyticsResult = results[1];

            if (examResult.status === 'fulfilled') {
                setExam(examResult.value);
            } else {
                console.error("Failed to fetch exam:", examResult.reason);
                // If exam fails, we can't show much, so alert error?
                // But usually this means ID is wrong or server error.
            }

            if (analyticsResult.status === 'fulfilled') {
                setAnalytics(analyticsResult.value);
            } else {
                console.error("Failed to fetch analytics:", analyticsResult.reason);
                // Analytics optional, ignore error for UI
            }

        } catch (err) {
            console.error("Unexpected error in fetchData", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = () => {
        navigate(`/exams/create?source=${id}`);
    };

    const [selectedMetric, setSelectedMetric] = useState(null);
    const [detailsData, setDetailsData] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('All');

    const handleMetricClick = async (type) => {
        if (selectedMetric === type) {
            setSelectedMetric(null);
            return;
        }

        setSelectedMetric(type);
        setDetailsLoading(true);
        setDetailsData([]);
        setSelectedSchoolFilter('All');

        try {
            const data = await examService.getAnalyticsDetails(id, type);
            setDetailsData(data);
        } catch (err) {
            console.error("Failed to fetch details:", err);
            alert("Failed to load details");
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleArchive = async () => {
        if (window.confirm("Are you sure you want to archive this exam?")) {
            await examService.archiveExam(id);
            fetchData(); // Refresh status
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;
    if (!exam) return <div className="p-6">Exam not found</div>;

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/exams')}
                        className="mr-4 text-gray-500 hover:text-gray-700"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                            {exam.title}
                            <span className="ml-3 text-sm px-2 py-1 bg-gray-100 border rounded text-gray-500">v{exam.version || 1}</span>
                            {exam.isPublished ? (
                                <span className="ml-2 text-sm px-2 py-1 bg-green-100 text-green-800 rounded">Published</span>
                            ) : (
                                <span className="ml-2 text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded">Draft</span>
                            )}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Created by {exam.createdBy?.fullName || 'Unknown'} • {new Date(exam.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={handleDuplicate}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                        title="Duplicate to create new version"
                    >
                        <Copy size={16} className="mr-2" /> Duplicate
                    </button>
                    {exam.isPublished && (
                        <button
                            onClick={handleArchive}
                            className="flex items-center px-4 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                        >
                            <Archive size={16} className="mr-2" /> Archive
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content: Info & Analytics */}
                <div className="md:col-span-2 space-y-6">

                    {/* Analytics Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                            <BarChart2 size={20} className="mr-2 text-blue-600" /> Phase-1 Analytics (First Attempt Only)
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div
                                onClick={() => handleMetricClick('assigned')}
                                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedMetric === 'assigned' ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' : 'bg-blue-50 border-transparent hover:bg-blue-100'}`}
                            >
                                <p className="text-sm text-blue-600 font-medium">Assigned</p>
                                <p className="text-2xl font-bold text-blue-800">{analytics?.totalAssigned || 0}</p>
                            </div>
                            <div
                                onClick={() => handleMetricClick('attempted')}
                                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedMetric === 'attempted' ? 'bg-green-100 border-green-300 ring-2 ring-green-200' : 'bg-green-50 border-transparent hover:bg-green-100'}`}
                            >
                                <p className="text-sm text-green-600 font-medium">Attempted</p>
                                <p className="text-2xl font-bold text-green-800">{analytics?.attempted || 0}</p>
                            </div>
                            <div
                                onClick={() => handleMetricClick('skipped')}
                                className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${selectedMetric === 'skipped' ? 'bg-orange-100 border-orange-300 ring-2 ring-orange-200' : 'bg-orange-50 border-transparent hover:bg-orange-100'}`}
                            >
                                <p className="text-sm text-orange-600 font-medium">Skipped</p>
                                <p className="text-2xl font-bold text-orange-800">{analytics?.skipped || 0}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg border-2 border-transparent">
                                <p className="text-sm text-purple-600 font-medium">Avg Score</p>
                                <p className="text-2xl font-bold text-purple-800">{analytics?.averagePercentage}%</p>
                                <p className="text-xs text-purple-500">Max: {analytics?.maxScore}</p>
                            </div>
                        </div>

                        {/* Detailed View */}
                        {selectedMetric && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-2">
                                <h4 className="font-bold text-gray-700 mb-3 flex items-center justify-between">
                                    <span className="capitalize">{selectedMetric} Students</span>
                                    <button
                                        onClick={() => setSelectedMetric(null)}
                                        className="text-xs text-gray-400 hover:text-gray-600"
                                    >
                                        Close
                                    </button>
                                </h4>

                                {/* School Filter */}
                                {!detailsLoading && detailsData.length > 0 && (
                                    <div className="mb-4">
                                        <label className="text-xs font-medium text-gray-500 mr-2">Filter by School:</label>
                                        <select
                                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                            value={selectedSchoolFilter}
                                            onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                                        >
                                            <option value="All">All Schools</option>
                                            {[...new Set(detailsData.map(s => s.schoolName))].sort().map(school => (
                                                <option key={school} value={school}>{school}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {detailsLoading ? (
                                    <div className="text-center py-4 text-gray-500">Loading details...</div>
                                ) : detailsData.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">No students found in this category.</div>
                                ) : (
                                    <div className="overflow-x-auto border rounded-lg max-h-96">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Student</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Class Info</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-500">School</th>
                                                    <th className="px-4 py-2 text-left font-medium text-gray-500">Mobile</th>
                                                    {selectedMetric === 'attempted' && (
                                                        <th className="px-4 py-2 text-right font-medium text-gray-500">Score</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {detailsData
                                                    .filter(s => selectedSchoolFilter === 'All' || s.schoolName === selectedSchoolFilter)
                                                    .map((s) => (
                                                        <tr key={s._id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2">
                                                                <div className="font-medium text-gray-900">{s.fullName}</div>
                                                                <div className="text-xs text-gray-500">@{s.username}</div>
                                                            </td>
                                                            <td className="px-4 py-2">
                                                                {s.class} <span className="text-xs text-gray-400">({s.medium})</span>
                                                            </td>
                                                            <td className="px-4 py-2 text-gray-500 truncate max-w-xs" title={s.schoolName}>{s.schoolName}</td>
                                                            <td className="px-4 py-2 text-gray-600">{s.phoneNumber || '-'}</td>
                                                            {selectedMetric === 'attempted' && (
                                                                <td className="px-4 py-2 text-right font-bold text-indigo-600">
                                                                    {s.score} <span className="text-xs font-normal text-gray-400">/ {s.maxScore}</span>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Questions Preview */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Questions Preview</h3>
                        <div className="space-y-4">
                            {exam.questions?.map((q, i) => (
                                <div key={i} className="border-b pb-4 last:border-0">
                                    <p className="font-medium text-gray-800 mb-2">{i + 1}. {q.questionText}</p>
                                    <div className="grid grid-cols-1 gap-1">
                                        {q.options?.map((opt, oi) => (
                                            <div key={oi} className={`text-sm py-1 px-2 rounded ${opt === q.correctAnswer ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600'}`}>
                                                {opt} {opt === q.correctAnswer && <span className="ml-2 text-xs">(Correct)</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Meta Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Exam Details</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-500">Subject / Section</label>
                                <p className="text-gray-800 font-medium">{exam.subject?.name} • {exam.section}</p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Pattern</label>
                                <p className="text-gray-800">{exam.pattern} (Type {exam.patternType})</p>
                            </div>

                            <div>
                                <label className="text-xs text-gray-500">Duration</label>
                                <p className="text-gray-800">{exam.duration} Minutes</p>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                    <Calendar size={16} className="mr-2" /> Schedule
                                </h4>
                                {exam.startTime ? (
                                    <p className="text-gray-800 font-medium">{new Date(exam.startTime).toLocaleString()}</p>
                                ) : (
                                    <p className="text-gray-500 italic">No start time set</p>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                    <Users size={16} className="mr-2" /> Audience
                                </h4>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {exam.scopes?.classes?.map(c => (
                                        <span key={c} className="text-xs bg-gray-100 px-2 py-1 rounded">Class {c}</span>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {exam.scopes?.medium?.map(m => (
                                        <span key={m} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{m}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExamDetail;
