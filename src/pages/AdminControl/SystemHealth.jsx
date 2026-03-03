import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { Activity, AlertTriangle, CheckCircle, Database, Server, Shield, RefreshCw, PlayCircle } from 'lucide-react';

const SystemHealth = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHealth();
    }, []);

    const fetchHealth = async () => {
        try {
            setError('');
            setLoading(true);
            console.log("Fetching System Health...");
            const res = await client.get('/admin/system-health');
            console.log("System Health Data:", res.data);
            if (!res.data) throw new Error("No data received from server");
            setData(res.data);
            setLoading(false);
        } catch (err) {
            console.error("System Health Error:", err);
            setError(err.response?.data?.message || err.message || "Unknown Error");
            setLoading(false);
        }
    };

    const handleGenerateRankings = async () => {
        if (!window.confirm("This will recalculate rankings for ALL classes. It may take a few seconds. Continue?")) return;

        try {
            setGenerating(true);
            await client.post('/admin/rankings/generate');
            alert("Rankings generation started!");
            // Wait a moment then refresh
            setTimeout(fetchHealth, 2000);
        } catch (err) {
            alert("Failed to trigger generation: " + (err.response?.data?.message || err.message));
        } finally {
            setGenerating(false);
        }
    };

    if (loading && !data) return (
        <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-500 animate-pulse">Running System Diagnostics...</div>
        </div>
    );

    if (error && !data) return (
        <div className="p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center mb-4">
                <AlertTriangle className="mr-3 h-6 w-6" />
                <div>
                    <h3 className="font-bold">Diagnostics Failed</h3>
                    <p>{error}</p>
                </div>
            </div>
            <button onClick={fetchHealth} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Retry Connection
            </button>
        </div>
    );

    if (!data) return (
        <div className="p-6 text-center text-gray-500">
            No diagnostic data available.
        </div>
    );

    // Safety: Ensure arrays exist
    const studentDist = data.studentDistribution || [];
    const examAvail = data.examAvailability || [];
    const rankCov = data.rankingCoverage || [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="h-8 w-8 text-blue-600" />
                        System Health Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Real-time diagnostics for Students, Exams, and Rankings.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-400">
                        Last check: {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
                    </div>

                    <button
                        onClick={handleGenerateRankings}
                        disabled={generating}
                        className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors ${generating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <PlayCircle className="h-4 w-4" />
                        {generating ? 'Gener...' : 'Fix Rankings'}
                    </button>

                    <button
                        onClick={fetchHealth}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <HealthCard
                    title="Student Connectivity"
                    value={studentDist.length}
                    subValue="Active Groups"
                    icon={Server}
                    status="good"
                />
                <HealthCard
                    title="Exam Coverage"
                    value={examAvail.filter(g => g.examCount > 0).length}
                    subValue={`of ${examAvail.length} Groups`}
                    icon={Database}
                    status={examAvail.some(g => g.examCount === 0) ? 'warning' : 'good'}
                />
                <HealthCard
                    title="Rank Snapshots"
                    value={rankCov.filter(g => g.hasSnapshot).length}
                    subValue={`of ${rankCov.length} Groups`}
                    icon={Shield}
                    status={rankCov.some(g => !g.hasSnapshot) ? 'warning' : 'good'}
                />
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700">Detailed Group Analysis</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exams</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank Snapshot</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {examAvail.length > 0 ? (
                            examAvail.map((group, idx) => {
                                const studentGroup = studentDist.find(s => s.class === group.class && s.medium === group.medium);
                                const rankInfo = rankCov.find(r => r.class === group.class && r.medium === group.medium);

                                const hasExams = group.examCount > 0;
                                const hasRanks = rankInfo?.hasSnapshot;

                                return (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">Class {group.class}</div>
                                            <div className="text-sm text-gray-500">{group.medium}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {studentGroup ? studentGroup.count : 0}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {hasExams ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {group.examCount} Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    Missing
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {hasRanks ? (
                                                <div className="text-sm">
                                                    <div className="font-medium text-green-600">Generated</div>
                                                    <div className="text-xs text-gray-400">{rankInfo.lastGenerated ? new Date(rankInfo.lastGenerated).toLocaleDateString() : 'Unknown Date'}</div>
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    Not Found
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {hasExams && hasRanks ? (
                                                <CheckCircle className="h-5 w-5 text-green-500" />
                                            ) : (
                                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const HealthCard = ({ title, value, subValue, icon: Icon, status }) => {
    const colors = {
        good: 'bg-green-50 text-green-700 border-green-200',
        warning: 'bg-amber-50 text-amber-700 border-amber-200',
        error: 'bg-red-50 text-red-700 border-red-200'
    };

    return (
        <div className={`rounded-xl border p-6 flex items-start justify-between ${colors[status] || colors.good}`}>
            <div>
                <p className="text-sm font-medium opacity-80">{title}</p>
                <h3 className="text-3xl font-bold mt-2">{value}</h3>
                <p className="text-sm mt-1 opacity-80">{subValue}</p>
            </div>
            <div className="p-3 bg-white bg-opacity-30 rounded-full">
                <Icon className="h-6 w-6" />
            </div>
        </div>
    );
};

export default SystemHealth;
