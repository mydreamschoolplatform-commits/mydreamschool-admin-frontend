import React, { useState, useEffect } from 'react';
import client from '../../../api/client';
import { X, Check } from 'lucide-react';

const StepAudience = ({ data, updateData }) => {
    const [schoolsList, setSchoolsList] = useState([]);
    const [loadingSchools, setLoadingSchools] = useState(false);

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                setLoadingSchools(true);
                const res = await client.get('/admin/schools?includeDynamic=true');
                console.log("Fetched Schools:", res.data); // DEBUG LOG
                setSchoolsList(res.data);
            } catch (err) {
                console.error("Failed to fetch schools", err);
            } finally {
                setLoadingSchools(false);
            }
        };
        fetchSchools();
    }, []);

    const handleCheckboxChange = (value, field) => {
        // Resolve current value handling nested keys like 'scopes.classes'
        let current = [];
        if (field.includes('.')) {
            const parts = field.split('.');
            current = data;
            for (const p of parts) current = current?.[p];
        } else {
            current = data[field];
        }
        current = current || [];

        const newData = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        updateData(field, newData);
    };

    const handleSelectAll = (field, allOptions) => {
        // Resolve current value
        let current = [];
        if (field.includes('.')) {
            const parts = field.split('.');
            current = data;
            for (const p of parts) current = current?.[p];
        } else {
            current = data[field];
        }
        current = current || [];

        // If all are selected, deselect all. Otherwise, select all.
        const isAllSelected = allOptions.every(opt => current.includes(opt));

        if (isAllSelected) {
            updateData(field, []);
        } else {
            updateData(field, allOptions);
        }
    };

    const handleSchoolSelect = (e) => {
        const selectedSchool = e.target.value;
        if (!selectedSchool) return;

        const currentSchools = data.scopes?.schools || [];
        // If Global was selected, clear it first? Or just append?
        // Usually if Specific is added, Global should be removed.
        let newSchools = [...currentSchools];

        if (newSchools.includes('Global')) {
            newSchools = newSchools.filter(s => s !== 'Global');
        }

        if (!newSchools.includes(selectedSchool)) {
            newSchools.push(selectedSchool);
            updateData('scopes.schools', newSchools);
        }
        // Reset select
        e.target.value = '';
    };

    const removeSchool = (schoolToRemove) => {
        const currentSchools = data.scopes?.schools || [];
        updateData('scopes.schools', currentSchools.filter(s => s !== schoolToRemove));
    };

    const CLASSES = ['6', '7', '8', '9', '10'];
    const MEDIUMS = ['English', 'Telugu', 'Hindi'];

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 2: Audience Scope</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <p className="text-sm text-blue-800">
                    This decides which students can see the exam.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">

                {/* Classes */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Target Class(es)</label>
                        {/* Select All Checkbox */}
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(data.scopes?.classes?.length === CLASSES.length && CLASSES.length > 0)}
                                onChange={() => handleSelectAll('scopes.classes', CLASSES)}
                                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-xs font-semibold text-indigo-600">Select All</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {CLASSES.map(cls => (
                            <label key={cls} className={`flex items-center space-x-2 border p-2 rounded cursor-pointer transition-colors ${data.scopes?.classes?.includes(cls) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={data.scopes?.classes?.includes(cls) || false}
                                    onChange={() => handleCheckboxChange(cls, 'scopes.classes')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className={`text-sm ${data.scopes?.classes?.includes(cls) ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>Class {cls}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Medium */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Medium</label>
                        {/* Select All Checkbox */}
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={(data.scopes?.medium?.length === MEDIUMS.length && MEDIUMS.length > 0)}
                                onChange={() => handleSelectAll('scopes.medium', MEDIUMS)}
                                className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-xs font-semibold text-indigo-600">Select All</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {MEDIUMS.map(med => (
                            <label key={med} className={`flex items-center space-x-2 border p-2 rounded cursor-pointer transition-colors ${data.scopes?.medium?.includes(med) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={data.scopes?.medium?.includes(med) || false}
                                    onChange={() => handleCheckboxChange(med, 'scopes.medium')}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className={`text-sm ${data.scopes?.medium?.includes(med) ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>{med}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* School Scope */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School Visibility</label>
                    <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                        {/* Global Option */}
                        <label className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${data.scopes?.schools?.includes('Global') ? 'bg-green-50 border-green-200 ring-1 ring-green-500' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <div className={`flex items-center justify-center h-5 w-5 rounded-full border ${data.scopes?.schools?.includes('Global') ? 'border-green-600 bg-green-600 text-white' : 'border-gray-400'}`}>
                                {data.scopes?.schools?.includes('Global') && <Check size={12} />}
                            </div>
                            <input
                                type="radio"
                                name="scopeType" // Dummy helper
                                checked={data.scopes?.schools?.includes('Global') || false}
                                onChange={() => updateData('scopes.schools', ['Global'])}
                                className="hidden"
                            />
                            <div>
                                <span className={`block font-bold ${data.scopes?.schools?.includes('Global') ? 'text-green-800' : 'text-gray-900'}`}>Global (All Schools)</span>
                                <span className="block text-xs text-gray-500">Visible to students in all schools</span>
                            </div>
                        </label>

                        {/* Specific Schools Option */}
                        <div className={`p-3 rounded-lg border transition-all ${(!data.scopes?.schools?.includes('Global')) ? 'bg-white border-indigo-200 ring-1 ring-indigo-500' : 'border-gray-200'}`}>
                            <label className="flex items-center space-x-3 cursor-pointer mb-3">
                                <div className={`flex items-center justify-center h-5 w-5 rounded-full border ${(!data.scopes?.schools?.includes('Global')) ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-400'}`}>
                                    {(!data.scopes?.schools?.includes('Global')) && <Check size={12} />}
                                </div>
                                <input
                                    type="radio"
                                    name="scopeType"
                                    checked={!data.scopes?.schools?.includes('Global')}
                                    onChange={() => updateData('scopes.schools', [])} // Switch to empty specific list
                                    className="hidden"
                                />
                                <div>
                                    <span className={`block font-bold ${(!data.scopes?.schools?.includes('Global')) ? 'text-indigo-800' : 'text-gray-900'}`}>Specific School(s)</span>
                                    <span className="block text-xs text-gray-500">Visible only to selected schools</span>
                                </div>
                            </label>

                            {/* Dropdown & Chips */}
                            {(!data.scopes?.schools?.includes('Global')) && (
                                <div className="pl-8">
                                    <select
                                        onChange={handleSchoolSelect}
                                        className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border mb-3"
                                    >
                                        <option value="">Select a School to Add...</option>
                                        {loadingSchools ? (
                                            <option disabled>Loading schools...</option>
                                        ) : (
                                            schoolsList
                                                .filter(s => !data.scopes?.schools?.includes(s.name || s))
                                                .map(s => (
                                                    <option key={s._id || s.name || s} value={s.name || s}>{s.name || s}</option>
                                                ))
                                        )}
                                    </select>

                                    {/* Chips Container */}
                                    <div className="flex flex-wrap gap-2">
                                        {data.scopes?.schools?.length === 0 && (
                                            <span className="text-xs text-red-500 italic">* Please select at least one school</span>
                                        )}
                                        {data.scopes?.schools?.map((schoolName, idx) => (
                                            <span key={idx} className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                {schoolName}
                                                <button
                                                    type="button"
                                                    onClick={() => removeSchool(schoolName)}
                                                    className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 focus:outline-none"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StepAudience;
