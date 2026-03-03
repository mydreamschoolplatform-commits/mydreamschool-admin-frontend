
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StudentJoiningGraph = ({ data }) => {
    // If no data, show a placeholder or empty state
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Student Growth</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    No data available for growth chart
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mt-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Student Growth (Last 12 Months)</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{
                            top: 10,
                            right: 30,
                            left: 0,
                            bottom: 0,
                        }}
                    >
                        <defs>
                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="students"
                            stroke="#4F46E5"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorStudents)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#4F46E5' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StudentJoiningGraph;
