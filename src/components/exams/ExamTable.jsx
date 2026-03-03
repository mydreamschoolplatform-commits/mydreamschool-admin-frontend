import React from 'react';
import { Eye, Archive, Copy, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const ExamTable = ({ exams, onAction }) => {
    const getStatusBadge = (exam) => {
        if (!exam.isPublished) return <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full flex items-center gap-1"><AlertTriangle size={12} /> Draft</span>;
        // Assuming 'Archived' logic is client-side for now or purely based on isPublished=false + older version?
        // Requirement says: "Archived exams -> greyed row".
        // If we treat !isPublished as Draft, then maybe we need a separate field or convention for Archived.
        // For now, standard "Published" vs "Draft".
        return <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full flex items-center gap-1"><CheckCircle size={12} /> Published</span>;
    };

    const getPatternLabel = (patternType) => {
        // 1-6 mapping
        const patterns = {
            1: 'Video + MCQ',
            2: 'Story + MCQ',
            3: 'Image + MCQ',
            4: 'Direct MCQ',
            5: 'Fill Blanks',
            6: 'Written'
        };
        return patterns[patternType] || `Type ${patternType}`;
    };

    return (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">Exam Title</th>
                        <th scope="col" className="px-6 py-3">Subject</th>
                        <th scope="col" className="px-6 py-3">Section</th>
                        <th scope="col" className="px-6 py-3">Pattern</th>
                        <th scope="col" className="px-6 py-3">Class/Scope</th>
                        <th scope="col" className="px-6 py-3">Scheduled</th>
                        <th scope="col" className="px-6 py-3">Status</th>
                        <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {exams?.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                No exams found.
                            </td>
                        </tr>
                    ) : (
                        exams.map((exam) => (
                            <tr
                                key={exam._id}
                                className={`bg-white border-b hover:bg-gray-50 ${!exam.isPublished && exam.version > 1 ? 'opacity-60 bg-gray-100' : ''}`} // Logic for 'Archived' visual if implemented
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                    {exam.title}
                                    <span className="ml-2 text-xs text-gray-400 border border-gray-200 px-1 rounded">v{exam.version || 1}</span>
                                </td>
                                <td className="px-6 py-4">{exam.subject?.name || 'Unknown'}</td>
                                <td className="px-6 py-4">{exam.section}</td>
                                <td className="px-6 py-4">{getPatternLabel(exam.patternType)}</td>
                                <td className="px-6 py-4">
                                    {/* Scopes might be hidden in basic list, dependent on populate logic. Assuming standard string or array */}
                                    <div className="flex flex-col text-xs">
                                        <span>{exam.scopes?.classes?.join(', ') || 'All'}</span>
                                        <span className="text-gray-400">{exam.scopes?.medium?.join(', ')}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {new Date(exam.formattedStartTime || exam.createdAt).toLocaleDateString()} {/* Assuming start time field */}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(exam)}
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => onAction('view', exam)}
                                        className="text-blue-600 hover:text-blue-900"
                                        title="View"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => onAction('duplicate', exam)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                        title="Duplicate"
                                    >
                                        <Copy size={18} />
                                    </button>
                                    <button
                                        onClick={() => onAction('archive', exam)}
                                        className="text-red-600 hover:text-red-900"
                                        title="Archive"
                                    >
                                        <Archive size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default ExamTable;
