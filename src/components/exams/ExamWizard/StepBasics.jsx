import React from 'react';

const StepBasics = ({ data, updateData, subjects }) => {
    const handleChange = (e) => {
        updateData(e.target.name, e.target.value);
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 1: Exam Basics</h3>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Exam Title</label>
                    <input
                        type="text"
                        name="title"
                        value={data.title}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        placeholder="e.g. Mathematics Chapter 1 Test"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Instructions (Optional)</label>
                    <textarea
                        name="instructions"
                        value={data.instructions || ''}
                        onChange={handleChange}
                        rows={3}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        placeholder="e.g. No calculators allowed. Each question carries 1 mark."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Subject</label>
                        <select
                            name="subject"
                            value={data.subject}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s._id || s.id} value={s._id || s.id}>{s.name || s.subjectName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Section</label>
                        <select
                            name="section"
                            value={data.section}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        >
                            <option value="">Select Section</option>
                            <option value="Introduction">Introduction</option>
                            <option value="Chapters">Chapters</option>
                            <option value="Revision">Revision</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pattern Type</label>
                        <select
                            name="patternType"
                            value={data.patternType}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        >
                            <option value="">Select Pattern</option>
                            <option value="1">1: Video + MCQ</option>
                            <option value="2">2: Story + MCQ</option>
                            <option value="3">3: Image + MCQ</option>
                            <option value="4">4: Direct MCQ</option>
                            <option value="5">5: Fill Blanks</option>
                            <option value="6">6: Written</option>
                        </select>
                        {/* Note: pattern field vs patternType. Frontend maps ID to Enum string maybe? 
                 Backend Schema had `patternType` (Number) AND `pattern` (String Enum).
                 We probably need to set BOTH or backend derives one?
                 TeacherController Create expects both?
                 Let's check. Schema: pattern (required enum), patternType (number).
                 We should update both in orchestrator or here.
                 For now, saving both to state.
             */}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Instruction Language</label>
                        <select
                            name="language"
                            value={data.language}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        >
                            <option value="English">English</option>
                            <option value="Telugu">Telugu</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
                    <input
                        type="number"
                        name="duration"
                        value={data.duration}
                        onChange={handleChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                        min="5"
                    />
                </div>

                <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Reading Assistance Tools</h4>
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <input
                                id="enableHighlight"
                                name="enableHighlight"
                                type="checkbox"
                                checked={data.enableHighlight || false}
                                onChange={(e) => updateData('enableHighlight', e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="enableHighlight" className="ml-2 block text-sm text-gray-900">
                                Enable Highlight & Reading Tool
                            </label>
                        </div>

                        {data.enableHighlight && (
                            <div className="ml-6 space-y-2">
                                <div className="flex items-center">
                                    <input
                                        id="enableEnglishAudio"
                                        name="enableEnglishAudio"
                                        type="checkbox"
                                        checked={data.enableEnglishAudio || false}
                                        onChange={(e) => updateData('enableEnglishAudio', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="enableEnglishAudio" className="ml-2 block text-sm text-gray-700">
                                        Enable English Read-Aloud
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="enableTeluguTranslation"
                                        name="enableTeluguTranslation"
                                        type="checkbox"
                                        checked={data.enableTeluguTranslation || false}
                                        onChange={(e) => updateData('enableTeluguTranslation', e.target.checked)}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="enableTeluguTranslation" className="ml-2 block text-sm text-gray-700">
                                        Enable Telugu Translation
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default StepBasics;
