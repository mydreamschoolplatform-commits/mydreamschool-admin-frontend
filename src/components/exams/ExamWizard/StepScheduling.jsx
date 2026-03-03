import React from 'react';

const StepScheduling = ({ data, updateData }) => {
    const handleChange = (e) => {
        updateData(e.target.name, e.target.value);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 3: Scheduling</h3>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <p className="text-sm text-yellow-800">
                    Exam visible before start. Attempt enabled automatically after start. No expiry date.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date & Time</label>
                    <input
                        type="datetime-local"
                        name="startTime"
                        value={data.startTime || ''}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Students can practice this exam any time after this time.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default StepScheduling;
