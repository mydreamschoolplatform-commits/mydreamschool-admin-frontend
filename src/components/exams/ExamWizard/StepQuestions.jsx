import React, { useState } from 'react';
import { Plus, Trash, Check, FileText } from 'lucide-react';
import BulkPasteModal from './BulkPasteModal';

const StepQuestions = ({ data, updateData }) => {
    const questions = data.questions || [];
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    const addQuestion = () => {
        const newQ = {
            questionText: '',
            options: ['', '', '', ''],
            correctAnswer: '',
            type: 'MCQ' // Default
        };
        updateData('questions', [...questions, newQ]);
    };

    const handleBulkAdd = (newQuestions) => {
        updateData('questions', [...questions, ...newQuestions]);
    };

    const removeQuestion = (index) => {
        const newQ = questions.filter((_, i) => i !== index);
        updateData('questions', newQ);
    };

    const updateQuestion = (index, field, value) => {
        const newQ = [...questions];
        newQ[index][field] = value;
        updateData('questions', newQ);
    };

    const updateOption = (qIndex, oIndex, value) => {
        const newQ = [...questions];
        newQ[qIndex].options[oIndex] = value;
        updateData('questions', newQ);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Step 5: Questions & Review</h3>
                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Total Questions: {questions.length}
                </span>
            </div>

            {/* Reference Content Preview */}
            {data.patternType && ['1', '2', '3'].includes(String(data.patternType)) && (
                <div className="bg-gray-50 p-4 rounded border mb-4">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Reference Content ({
                        data.patternType == '1' ? 'Video' : data.patternType == '2' ? 'Story' : 'Image'
                    })</h4>

                    {String(data.patternType) === '1' && (
                        <div className="text-blue-600 underline text-sm">
                            Video ID/URL: {data.patternSourceUrl}
                            {/* Ideally embed here if possible, but for now just showing it exists */}
                        </div>
                    )}

                    {String(data.patternType) === '2' && (
                        <div className="p-3 bg-white border rounded text-sm text-gray-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {data.patternSourceUrl || <span className="text-red-500 italic">No story text provided via Step 4.</span>}
                        </div>
                    )}

                    {String(data.patternType) === '3' && (
                        <div className="mt-2">
                            {data.patternSourceUrl ? (
                                <img src={data.patternSourceUrl} alt="Reference" loading="lazy" className="max-h-60 rounded" />
                            ) : (
                                <span className="text-red-500 italic text-sm">No image URL provided.</span>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-4">
                {questions.map((q, index) => (
                    <div key={index} className="border rounded-md p-4 bg-gray-50 relative">
                        <button
                            onClick={() => removeQuestion(index)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            title="Remove Question"
                        >
                            <Trash size={16} />
                        </button>

                        <h4 className="text-sm font-medium text-gray-700 mb-2">Question {index + 1}</h4>

                        {/* Text */}
                        <div className="mb-3">
                            <input
                                type="text"
                                value={q.questionText}
                                onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                placeholder="Enter question text..."
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        {/* Options (MCQ) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name={`q-${index}-correct`}
                                        checked={q.correctAnswer === opt && opt !== ''}
                                        onChange={() => updateQuestion(index, 'correctAnswer', opt)}
                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                                        disabled={!opt}
                                    />
                                    <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) => updateOption(index, oIndex, e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border ${q.correctAnswer === opt && opt !== '' ? 'border-green-500 bg-green-50' : ''}`}
                                    />
                                </div>
                            ))}
                        </div>

                        {q.correctAnswer ? (
                            <p className="text-xs text-green-600 flex items-center">
                                <Check size={12} className="mr-1" /> Correct Answer: {q.correctAnswer}
                            </p>
                        ) : (
                            <p className="text-xs text-red-500">
                                Please select the correct answer by clicking the radio button.
                            </p>
                        )}

                    </div>
                ))}

                <div className="flex space-x-4">
                    <button
                        onClick={addQuestion}
                        className="flex-1 py-3 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-500 hover:text-blue-500 flex justify-center items-center"
                    >
                        <Plus size={20} className="mr-2" /> Add Single Question
                    </button>
                    <button
                        onClick={() => setIsBulkModalOpen(true)}
                        className="flex-1 py-3 border-2 border-dashed border-blue-200 bg-blue-50 rounded-md text-blue-600 hover:border-blue-500 hover:bg-blue-100 flex justify-center items-center"
                    >
                        <FileText size={20} className="mr-2" /> Bulk Paste Questions
                    </button>
                </div>
            </div>

            {/* Final Review Warning */}
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
                <p className="text-sm text-red-800 font-medium">
                    Warning: Once published, this exam cannot be edited.
                </p>
            </div>

            <BulkPasteModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onAddQuestions={handleBulkAdd}
            />
        </div>
    );
};

export default StepQuestions;
