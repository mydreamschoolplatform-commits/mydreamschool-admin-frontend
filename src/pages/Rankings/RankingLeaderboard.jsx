import React, { useState, useEffect } from 'react';
import client from '../../api/client'; // Admin Client
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, Search, Trophy, Medal } from 'lucide-react';
import DateSelector from '../../components/common/DateSelector';
import Avatar from '../../components/common/Avatar';

const RankingLeaderboard = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [rankings, setRankings] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    // Filters
    const [filterType, setFilterType] = useState('class'); // class | subject
    const [className, setClassName] = useState('10');
    const [medium, setMedium] = useState(''); // Default to All Mediums
    const [subjectId, setSubjectId] = useState('');
    const [subjectsList, setSubjectsList] = useState([]);

    // School Filter (Super Admin)
    const [schoolName, setSchoolName] = useState('');
    const [schoolsList, setSchoolsList] = useState([]);

    // Date Filter (Dynamic)
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        // Fetch Subjects
        const loadSubjects = async () => {
            try {
                const res = await client.get('/subjects');
                setSubjectsList(res.data || []);
            } catch (err) {
                console.error("Subject Load Error", err);
            }
        };
        loadSubjects();

        // Fetch Schools if Super Admin
        if (user?.role === 'Super Admin' || user?.role === 'Owner') {
            const loadSchools = async () => {
                try {
                    const res = await client.get('/admin/schools');
                    setSchoolsList(res.data || []);
                } catch (err) {
                    console.error("Schools Load Error", err);
                }
            };
            loadSchools();
        }
    }, [user?.role]);

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const params = {
                type: filterType,
                className: className,
                medium: medium,
                subjectId: filterType === 'subject' ? subjectId : undefined,
                school: schoolName || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined
            };

            let endpoint = '/admin/rankings/leaderboard';
            if (user?.role === 'Teacher') {
                endpoint = '/teacher/rankings';
            }

            const res = await client.get(endpoint, { params });
            setRankings(res.data);
        } catch (err) {
            console.error("Fetch Ranking Error", err);
            setRankings(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch on mount or changes? Maybe manual only to avoid spam?
    // Let's do manual trigger or useEffect on deps.
    useEffect(() => {
        if (filterType === 'subject' && !subjectId) return;
        fetchRankings();
    }, [filterType, className, medium, subjectId, schoolName, startDate, endDate]);

    const handleRefreshSnapshots = async () => {
        if (!window.confirm("Are you sure you want to regenerate all snapshots? This might take a moment based on data size.")) return;
        setRefreshing(true);
        try {
            // Increase timeout to 60s for heavy snapshot generation
            await client.post('/admin/rankings/generate', {}, { timeout: 60000 });
            alert("Snapshots generated successfully!");
            fetchRankings(); // Reload view
        } catch (err) {
            alert("Failed to generate snapshots");
            console.error(err);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ranking Leaderboard</h1>
                    <p className="text-sm text-gray-500 mt-1">View Class and Subject Performance Snapshots</p>
                </div>
                {user?.role !== 'Teacher' && (
                    <button
                        onClick={handleRefreshSnapshots}
                        disabled={refreshing}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Generating...' : 'Refresh Snapshots'}
                    </button>
                )}
            </div>

            {/* Filters Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* View Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">View Type</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="class">Aggregate Class Rank</option>
                            <option value="subject">Subject Rank</option>
                        </select>
                    </div>

                    {/* School Filter (Conditional) */}
                    {(user?.role === 'Super Admin' || user?.role === 'Owner') && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">School</label>
                            <select
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">All Schools</option>
                                {schoolsList.map(s => (
                                    <option key={s.name || s} value={s.name || s}>{s.name || s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date Range Filters */}
                    <div className="space-y-1.5 md:col-span-1">
                        <DateSelector
                            label="Start Date"
                            value={startDate}
                            onChange={setStartDate}
                            startYear={2023}
                            endYear={new Date().getFullYear()}
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <DateSelector
                            label="End Date"
                            value={endDate}
                            onChange={setEndDate}
                            startYear={2023}
                            endYear={new Date().getFullYear()}
                        />
                    </div>

                    {/* Class */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</label>
                        <select
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={String(i + 1)}>Class {i + 1}</option>
                            ))}
                        </select>
                    </div>

                    {/* Medium */}
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medium</label>
                        <select
                            value={medium}
                            onChange={(e) => setMedium(e.target.value)}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">All Mediums</option>
                            <option value="English">English</option>
                            <option value="Telugu">Telugu</option>
                            <option value="Hindi">Hindi</option>
                        </select>
                    </div>

                    {/* Subject (Conditional) */}
                    <div className="space-y-1.5">
                        <label className={`text-xs font-semibold text-gray-500 uppercase tracking-wide ${filterType !== 'subject' ? 'opacity-50' : ''}`}>Subject</label>
                        <select
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                            disabled={filterType !== 'subject'}
                            className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        >
                            <option value="">Select Subject</option>
                            {subjectsList.map(sub => (
                                <option key={sub._id} value={sub._id}>{sub.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading rankings...</div>
                ) : rankings ? (
                    rankings.students && rankings.students.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 text-center">
                                            {schoolName ? 'School Rank' : 'Rank'}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Exams</th>
                                        {filterType === 'subject' && (
                                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Mastery</th>
                                        )}
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{filterType === 'class' ? 'Aggregate Score' : 'Score'}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rankings.students.map((student, idx) => {
                                        // If school filter is active, use the index as rank (School Rank)
                                        // Otherwise use global rank
                                        const displayRank = schoolName ? idx + 1 : student.rank;

                                        return (
                                            <tr key={idx} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className={`
                                                    inline-flex justify-center items-center w-8 h-8 rounded-full font-bold text-sm
                                                    ${displayRank === 1 ? 'bg-yellow-100 text-yellow-700' :
                                                            displayRank === 2 ? 'bg-gray-200 text-gray-700' :
                                                                displayRank === 3 ? 'bg-orange-100 text-orange-800' : 'text-gray-500'}
                                                `}>
                                                        {displayRank <= 3 && <Medal className="w-4 h-4 mr-1" />}
                                                        {displayRank}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 mr-3">
                                                            <Avatar
                                                                src={student.profileImage}
                                                                name={student.name}
                                                                size="sm"
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{student.name || 'Unknown Student'}</div>
                                                            {/* Optional: Show Global Rank context if filtered? */}
                                                            {schoolName && student.globalRank && (
                                                                <div className="text-xs text-gray-400">Global Rank: #{student.globalRank}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    {(() => {
                                                        const dir = student.trendDirection;
                                                        const val = student.trendValue;
                                                        if (!dir || dir === 'NEW' || dir === 'SAME') return <span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded">SAME</span>;
                                                        const isUp = dir === 'UP';
                                                        return (
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${isUp ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                                                                {isUp ? '↑' : '↓'} {val}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                                                    {student.examsCompleted || 0} / {student.examsAssigned || 0}
                                                </td>
                                                {filterType === 'subject' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {(() => {
                                                            const lvl = student.masteryLevel;
                                                            if (!lvl || lvl === '-') return <span className="text-xs text-gray-400">-</span>;
                                                            let color = 'bg-gray-200 text-gray-600';
                                                            if (lvl === 'Strong') color = 'bg-green-100 text-green-700 border border-green-200';
                                                            else if (lvl === 'Average') color = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                                                            else if (lvl === 'Needs Improvement') color = 'bg-red-100 text-red-700 border border-red-200';

                                                            return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>{lvl}</span>;
                                                        })()}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-right font-mono text-sm text-gray-600">
                                                    {filterType === 'class' ? student.aggregateScore : student.score}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
                                {rankings.isDynamic ? (
                                    <span className="text-xs text-indigo-600 font-bold">
                                        Dynamic Ranking Period: {startDate} to {endDate}
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500">Snapshot Generated: {new Date(rankings.generatedAt).toLocaleString()}</span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Trophy className="mx-auto h-12 w-12 text-gray-300" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings found</h3>
                            <p className="mt-1 text-sm text-gray-500">No data available for this class/medium timeframe.</p>
                        </div>
                    )
                ) : (
                    <div className="p-12 text-center text-gray-500">
                        Select a subject or filter to view rankings.
                    </div>
                )}
            </div>
        </div>
    );
};

export default RankingLeaderboard;
