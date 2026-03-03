import React, { useState } from 'react';
import { Calendar, Clock, Eye, Copy, Archive, MoreVertical, BookOpen, Layers, CheckCircle, CheckSquare, Square, Trash2 } from 'lucide-react';

const MonthGroupedExams = ({ exams, onAction, selectedExams = new Set(), onToggleSelection, onToggleSelectAll }) => {
    // 1. Sort by Date (Newest First)
    const sortedExams = [...exams].sort((a, b) => {
        const dateA = new Date(a.startTime || a.createdAt);
        const dateB = new Date(b.startTime || b.createdAt);
        return dateB - dateA;
    });

    // 2. Group by "Month Year"
    const grouped = sortedExams.reduce((acc, exam) => {
        const date = new Date(exam.startTime || exam.createdAt);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });

        if (!acc[monthYear]) acc[monthYear] = [];
        acc[monthYear].push(exam);
        return acc;
    }, {});

    // 3. Get Month Keys in Order (since we sorted exams desc, the keys creation order *should* be roughly desc, 
    // but object key iteration isn't guaranteed. Better to rely on the first exam of the group for sorting keys)
    const monthKeys = Object.keys(grouped).sort((a, b) => {
        // Parse "January 2026" to date object for comparison
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB - dateA;
    });

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            {exams.length > 0 && onToggleSelectAll && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={onToggleSelectAll}
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors shadow-sm active:scale-95"
                    >
                        {selectedExams.size === exams.length ? <CheckSquare size={16} /> : <Square size={16} />}
                        {selectedExams.size === exams.length ? 'Deselect All' : 'Select All Filtered'}
                    </button>
                </div>
            )}
            {monthKeys.map(month => (
                <div key={month} className="relative">
                    <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-3 mb-4 flex items-center gap-4 border-b border-transparent">
                        <h2 className="text-lg font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-500" />
                            {month}
                        </h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                    </div>

                    <div className="space-y-3">
                        {grouped[month].map(exam => (
                            <ExamCard
                                key={exam._id}
                                exam={exam}
                                onAction={onAction}
                                isSelected={selectedExams.has(exam._id)}
                                onToggle={() => onToggleSelection && onToggleSelection(exam._id)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const ExamCard = ({ exam, onAction, isSelected, onToggle }) => {
    const date = new Date(exam.startTime || exam.createdAt);
    const day = date.getDate();
    const dayName = date.toLocaleDateString('default', { weekday: 'short' });
    const time = date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });
    const isDraft = !exam.isPublished;

    // Subject Color Mapping (Vibrant & Distinct)
    const subjectColors = {
        'Telugu': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', accent: 'bg-amber-500' },
        'Hindi': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', accent: 'bg-orange-500' },
        'English': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', accent: 'bg-indigo-500' },
        'Mathematics': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', accent: 'bg-violet-500' },
        'Science': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', accent: 'bg-emerald-500' },
        'Social Studies': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', accent: 'bg-rose-500' },
        'Biology': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', accent: 'bg-lime-500' },
        'General': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', accent: 'bg-slate-400' }
    };

    const subjectName = exam.subject?.name || 'General';
    const theme = subjectColors[subjectName] || subjectColors['General'];

    return (
        <div className={`group bg-white rounded-xl border ${isSelected ? 'border-blue-300 shadow-blue-100 ring-2 ring-blue-500 ring-opacity-50' : 'border-slate-200 hover:border-indigo-300'} shadow-sm hover:shadow-md transition-all p-0 flex overflow-hidden`}>
            {/* Selection Column */}
            <div
                onClick={(e) => { e.stopPropagation(); onToggle && onToggle(); }}
                className={`w-14 flex items-center justify-center shrink-0 border-r border-slate-100 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'}`}
            >
                {isSelected ? (
                    <CheckSquare size={22} className="text-blue-600" />
                ) : (
                    <Square size={22} className="text-slate-300" />
                )}
            </div>

            {/* Date Column (Color Coded) */}
            <div className={`w-24 flex flex-col items-center justify-center shrink-0 border-r border-slate-100 ${isDraft ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
                <span className={`text-3xl font-black ${isDraft ? 'text-slate-400' : theme.text} leading-none`}>{day}</span>
                <span className="text-xs font-bold text-slate-400 uppercase mt-1">{dayName}</span>
                <span className="text-[10px] text-slate-500 font-bold mt-1">{time}</span>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 flex flex-col justify-center min-w-0">

                {/* Meta Header: Subject & Class */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    {/* Subject Badge */}
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${theme.bg} ${theme.text} ${theme.border}`}>
                        {subjectName}
                    </span>

                    {/* Class Scope Badges */}
                    {(exam.scopes?.classes || []).map(cls => (
                        <span key={cls} className="px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            🎓 {cls}
                        </span>
                    ))}

                    {/* Status Toggle Button (Unified Badge Style) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction('toggleStatus', exam);
                        }}
                        className={`ml-auto px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm hover:shadow-md ${isDraft
                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300'
                            }`}
                        title={isDraft ? "Status: Draft. Click to Publish." : "Status: Published. Click to Unpublish."}
                    >
                        {isDraft ? <Clock size={14} /> : <CheckCircle size={14} />}
                        {isDraft ? 'Draft' : 'Published'} v{exam.version || 1}
                    </button>
                </div>

                {/* Title */}
                <h3 className={`text-lg font-bold truncate mb-2 ${isDraft ? 'text-slate-500' : 'text-slate-800'}`} title={exam.title}>
                    {exam.title}
                </h3>

                {/* Footer Meta */}
                <div className="flex items-center gap-4 text-xs text-slate-600 font-semibold">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        <Clock size={14} className="text-slate-500" />
                        {exam.duration} mins
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        <Layers size={14} className="text-slate-500" />
                        Pattern: {exam.patternType || 'Custom'}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        <BookOpen size={14} className="text-slate-500" />
                        {exam.questions?.length || 0} Questions
                    </span>
                </div>
            </div>

            {/* Actions (Visible on Hover) */}
            <div className="w-14 border-l border-slate-100 flex flex-col items-center justify-center gap-1 bg-slate-50/50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onAction('view', exam)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="View Details"
                >
                    <Eye size={18} />
                </button>
                <button
                    onClick={() => onAction('duplicate', exam)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="Duplicate / Create V2"
                >
                    <Copy size={18} />
                </button>
                <button
                    onClick={() => onAction('edit', exam)}
                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="Edit"
                >
                    <div className="transform rotate-0">✏️</div>
                </button>
                {/* <button
                    onClick={() => onAction('archive', exam)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all shadow-sm"
                    title="Archive"
                >
                    <Archive size={18} />
                </button> */}
                <button
                    onClick={() => onAction('delete', exam)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm group relative"
                    title="Delete Exam"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
};

export default MonthGroupedExams;
